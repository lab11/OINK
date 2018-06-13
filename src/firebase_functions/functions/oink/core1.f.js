const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('util');
const request = require('request-promise');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

const REGION = functions.config().general.region;
const PROJECT = functions.config().general.project;
const INSTANCE_URI = 'https://'+REGION+'-'+PROJECT+'.cloudfunctions.net';

//oinkCore1 function:
// - Triggers on creation of tx_core_payment events. Checks the user information for payment in the user_list collection. 
//   If so, start to structuring the body for the payment request and update invite_transaction,tx_core_payment status and 
//   set the payment service of the user based on user_list information.
// - Send payment request to the specific payment service module. In this case core1 triggers a https function (korba).

// - Parameters:
//    * There are not specific parameters for this function.

function do_payment(change, context, data) {
    const docId = context.params.docId;
    console.log(`The docId of the creation was: ${util.inspect(docId)}`);

    var localMsgs = []
    localMsgs.push('attempt '+ (data.num_attempts + 1))

    return change.after.ref.set({status:'pending'},{merge:true})
        .then(() => {
            // Update the status of the document that generated the transaction.
            var doc_path_string = 'OINK_' + data.type + '_transaction'
            return db.collection(doc_path_string).doc(data.stimulus_doc_id).update({status: "pending", tx_core_doc_id: docId});

        }).then(() => {
            // Get the info from user_list needed to complete the API request
            return db.collection('OINK_user_list').doc(data.user_id).get()
                .then(doc => {
                    if (!doc.exists) {
                        console.log('The user does not exist in the user_list collection!')
                        db.collection('OINK_alarms_db').add({
                            timestamp: FieldValue.serverTimestamp(),
                            user_id: data.user_id,
                            reason:"User ID does not exist for processing in tx_core_payment collection.",
                            tx_core_doc_id:docId
                        });
                        return null;
                    }

                    // The user exists at this point
                    var userPaymentData = doc.data()

                    // Send all the common data among all APIs and trigger an
                    // HTTP function based on the user payment service.
                    var userPaymentInfo = {}
                    userPaymentInfo['payment_service'] = userPaymentData.payment_service;
                    userPaymentInfo['phone_number'] = userPaymentData.phone_number;
                    userPaymentInfo['phone_carrier'] = userPaymentData.phone_carrier;
                    userPaymentInfo['amount'] = data.amount;
                    userPaymentInfo['type'] = data.type;
                    userPaymentInfo['user_id'] = data.user_id;
                    userPaymentInfo['transaction_id'] = data.user_id + Math.random().toString(36).substr(2, 9);
                    userPaymentInfo['description'] = 'payment of '+ userPaymentInfo.type +' to user : '+ userPaymentInfo.user_id;
                    console.log(`user payment info is: ${util.inspect(userPaymentInfo)}`);

                    var namePaymentService = userPaymentInfo.payment_service;
                    namePaymentService = namePaymentService.charAt(0).toUpperCase() + namePaymentService.slice(1)
                    return change.after.ref.set({
                        payment_service: userPaymentInfo.payment_service,
                        num_attempts: data.num_attempts + 1
                    },
                        {merge:true}
                    )
                    .then(() => {
                        // TODO: This should probably mux at some point based
                        // on the payment_service, not every service will be
                        // triggered by a POST to Oink.
                        return request({
                            uri: INSTANCE_URI + '/payment' + namePaymentService,
                            method: 'POST',
                            headers: {
                                'Content-Type':'application/json',
                            },
                            json: true,
                            body: userPaymentInfo,
                            resolveWithFullResponse: true,
                        }).then((response) => {
                            //Checking the API response:
                            if (response.statusCode >= 400) {
                                localMsgs.push("HTTP Error")
                                return change.after.ref.set({reattempt: false, status:'failed', msgs: localMsgs},{merge:true});
                            }

                            console.log('Posted with payment service response: ', response.body);
                            console.log('Payment service status: ', response.statusCode);
                            var checkErrorFromBody = response.body;

                            if (checkErrorFromBody.success === 'true' && checkErrorFromBody.error_code == null) {
                                localMsgs.push('Payment submitted.')
                                return change.after.ref.set({
                                    reattempt: false,
                                    status: 'submitted',
                                    msgs: localMsgs,
                                    transaction_id:userPaymentInfo.transaction_id
                                },
                                    {merge:true}
                                );
                            } else {
                                console.log('Error in transaction:', checkErrorFromBody);
                                localMsgs.push('Transaction Error')
                                return change.after.ref.set({
                                    reattempt: false,
                                    status: 'failed',
                                    msgs: localMsgs
                                },
                                    {merge:true}
                                );
                            }
                        });

                    });
                });
        });
}

exports = module.exports = functions.firestore
    .document('OINK_tx_core_payment/{docId}').onWrite((change, context) =>{
        // Getting the data that was modified and initializing all the parameters for payment.
        const data = change.after.data();

        // Check if the document was deleted, if so return null (for avoiding infinite loop)
        if (!change.after.exists){
            return null;
        }

        // Check if the document is not new, if so check the status,
        // num_attempts and reattempt flag (for avoiding infinite loops)
        if (change.before.exists){
            if (data.status != 'failed' || data.num_attempts >= 5 || data.reattempt){
                return null;
            } else {
                //Starting a new reattempt
                return do_payment(change, context, data);
            }

        }

        console.log(`The onCreate event document is: ${util.inspect(data)}`);
        return do_payment(change, context, data);
    });
