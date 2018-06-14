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

function do_payment(change, docId, data) {
    var localMsgs = data.msgs;
    localMsgs.push('attempt '+ (data.num_attempts + 1))

    // Update the status of the document that generated the transaction.
    var doc_path_string = 'OINK_' + data.type + '_transaction'
    return db.collection(doc_path_string).doc(data.stimulus_doc_id).update({status: 'pending', tx_core_doc_id: docId})
        .then(() => {

            // Get the info from user_list needed to complete the API request
            return db.collection('OINK_user_list').doc(data.user_id).get()
                .then(doc => {

                    // Sanity check: Bail if the user somehow doesn't exist.
                    if (!doc.exists) {
                        console.log('The user does not exist in the user_list collection!')
                        return db.collection('OINK_alarms_db').add({
                            timestamp: FieldValue.serverTimestamp(),
                            user_id: data.user_id,
                            reason:"User ID does not exist for processing in tx_core_payment collection.",
                            tx_core_doc_id:docId
                        });
                    }

                    // The user exists at this point
                    var userPaymentData = doc.data()

                    // Send all the common data among all APIs and trigger an
                    // HTTP function based on the user payment service.
                    var userPaymentInfo = {}
                    userPaymentInfo['user_id'] = data.user_id;
                    userPaymentInfo['type'] = data.type;
                    userPaymentInfo['payment_service'] = userPaymentData.payment_service;
                    userPaymentInfo['phone_number'] = userPaymentData.phone_number;
                    userPaymentInfo['phone_carrier'] = userPaymentData.phone_carrier;
                    userPaymentInfo['amount'] = data.amount;
                    userPaymentInfo['transaction_id'] = data.user_id + Math.random().toString(36).substr(2, 9);
                    userPaymentInfo['description'] = 'payment of '+ userPaymentInfo.type +' to user : '+ userPaymentInfo.user_id;
                    console.log(`user payment info is: ${util.inspect(userPaymentInfo)}`);

                    var namePaymentService = userPaymentInfo.payment_service;
                    namePaymentService = namePaymentService.charAt(0).toUpperCase() + namePaymentService.slice(1)
                    return change.after.ref.update({
                        status: 'pending',
                        num_attempts: data.num_attempts + 1,
                    })
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
                            // Checking the API response:
                            if (response.statusCode >= 400) {
                                localMsgs.push("HTTP Error")
                                return change.after.ref.update({
                                    status:'error',
                                    msgs: localMsgs,
                                });
                            }

                            console.log('Posted with payment service response: ', response.body);
                            console.log('Payment service status: ', response.statusCode);

                            if (response.body.success === true && response.body.error_code == null) {
                                localMsgs.push('Payment submitted.')
                                return change.after.ref.update({
                                    status: 'submitted',
                                    msgs: localMsgs,
                                    transaction_id: userPaymentInfo.transaction_id
                                });
                            } else {
                                console.error('Error in transaction:', response.body);
                                localMsgs.push('Transaction Error')
                                return change.after.ref.update({
                                    status: 'error',
                                    msgs: localMsgs
                                });
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
        const docId = context.params.docId;

        // Check if the document was deleted, if so return null (for avoiding infinite loop)
        if (!change.after.exists) {
            return null;
        }

        // This is a create, handle some housekeeping on this pass
        if (!change.before.exists) {
            to_update = {}
            // The only valid status for an external caller to set is
            // 'starting', to immediately trigger a payment. In most cases,
            // this will likely be `undefined`.
            if (data.status != 'starting') {
                to_update.status = 'waiting';
            }
            to_update.num_attempts = 0;
            to_update.msgs = [];

            // On creation update internal record-keeping. An update call will
            // trigger right after this, which will trigger the actual payment
            // if we're starting immediately.
            return db.collection('OINK_tx_core_payment').doc(docId).update(to_update);
        }

        // Many payments trigger alerts on user phones, so we want to be
        // mindful of when we try to pay people. By default, payments start in
        // the waiting state, and a future 'tick-payment' will update this to
        // 'starting' and kick off payment.
        if (data.status == 'waiting') {
            return null;
        }

        // Kick off payment
        if (data.status == 'starting') {
            return do_payment(change, docId, data);
        }

        // We've started a request and we're waiting to hear back from the
        // payment processor that our request has been accepted. No-op.
        if (data.status == 'pending') {
            return null;
        }

        // If we're all done, great!
        if (data.status == 'submitted') {
            return null;
        }

        // Something went wrong :(
        if (data.status == 'error') {
            // TODO: Parameterize limit. Maybe think more about other options here.
            if (data.num_attempts >= 5) {
                var msgs = data.msgs;
                msgs.push('Payment attempt limit exceeded.');
                return db.collection('OINK_tx_core_payment').doc(docId).update({
                    status: 'failed',
                    msgs: msgs,
                });
            } else {
                // Try again next payment tick.
                return db.collection('OINK_tx_core_payment').doc(docId).update({
                    status: 'waiting',
                });
            }
        }

        // If everything's failed, time to quit.
        if (data.status == 'failed') {
            // Raise an alarm that things broke.
            return db.collection('OINK_alarms_db').add({
                timestamp: FieldValue.serverTimestamp(),
                user_id: data.user_id,
                type: 'error',
                reason: "Failed to pay user. Messages: " + localMsgs.join('|'),
                tx_core_doc_id: docId,
            })
            .then(() => {

                // Update the requester that things have failed.
                var doc_path_string = 'OINK_' + data.type + '_transaction'
                return db.collection(doc_path_string).doc(data.stimulus_doc_id).update({
                    status: 'failed',
                    tx_core_doc_id: docId
                });
            });
        }

        // Shouldn't ever get here.. :/
        console.error(`'Impossible status: ${data.status}'`);
        return db.collection('OINK_alarms_db').add({
            timestamp: FieldValue.serverTimestamp(),
            user_id: data.user_id,
            type: 'error',
            reason: `'Internal consistency error, impossible status: ${data.status}'`,
            tx_core_doc_id: docId,
        });
    });
