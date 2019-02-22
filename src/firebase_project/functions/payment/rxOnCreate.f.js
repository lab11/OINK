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
const TWILIO_API_KEY = functions.config().twilio.api_key;
const INCENTIVE_FIRSTOPEN_AMOUNT = functions.config().incentives.firstopen.amount;
const INCENTIVE_FIRSTPOWERWATCH_AMOUNT = functions.config().incentives.firstpowerwatch.amount;
const INCENTIVE_COMPLIANCEAPP_AMOUNT = functions.config().incentives.complianceapp.amount;
const INCENTIVE_COMPLIANCEPOWERWATCH_AMOUNT = functions.config().incentives.compliancepowerwatch.amount;

//The primary use of the real RX trigger is to issue SMS text messages once payments
//have been completed - so we will need both an onCreate method and an onUpdate method
exports = module.exports = functions.firestore
    .document('OINK_payment_rx/{docId}').onCreate((snapshot, context) =>{
        const data = snapshot.data();
        const docId = context.params.docId;

        //First check and make sure the status of the RX was successful
        if(data.status == 'SUCCESS') {
            //Okay first we should get the user's phone number based on their userid
            return db.collection('OINK_user_list')
                     .doc(data.user_id).get().then(user_data =>{     
            
                //Okay now we want to record the user's phone number for the SMS
                var phone_number = user_data.phone_number;
                
                let message;
                if(data.incentive == 'firstOpen') {
                    message = "Thank you for installing DumsorWatch! We have paid you ${INCENTIVE_FIRSTOPEN_AMOUNT} Cedis."
                } else if (data.incentive == 'complianceApp') {
                    message = "Thank you for keeping DumsorWatch installed! We have paid you ${INCENTIVE_COMPLIANEAPP_AMOUNT} Cedis."
                } else if (data.incentive == 'firstPowerwatch') {
                    message = "Thank you for installing PowerWatch! We have paid you ${INCENTIVE_FIRSTPOWERWATCH_AMOUNT} Cedis."
                } else if (data.incentive == 'compliancePowerwatch') {
                    message = "Thank you for keeping PowerWatch installed! We have paid you ${INCENTIVE_COMPLIANEPOWERWATCH_AMOUNT} Cedis."
                } else {
                    console.log('We dount know how to send a message for this incentive');
                    return db.collection('OINK_alarms_db').add({
                        timestamp: FieldValue.serverTimestamp(),
                        user_id: data.user_id,
                        reason:"We do not know how to send a message for this incentive type.",
                        rx_core_doc_id: docId
                    });
                }

                //Form the api request and issue request
                return request({
                    uri: 'https://api.twilio.com/2010-04-01/Accounts/AC8a918563320ddfb97ec59ecb64675ca8/Messages.json',
                    method: 'POST',
                    form: {
                        To: '+233' + phone_number,
                        From: 'GridWatch',
                        Body: message,
                        MessagingServiceSid: 'MG903f019d540c51a281440dd279453229',
                        StatusCallback: INSTANCE_URI + '/paymentnotificationReceiver'
                    },
                    username: 'AC8a918563320ddfb97ec59ecb64675ca8',
                    password: TWILIO_API_KEY
                }).then((response) => {
                    //Write the result of that request to a final table about user notification
                    console.log(response.statusCode)
                    console.log(response.body)
                    return db.collection('OINK_payment_notification').add({
                        timestamp: FieldValue.serverTimestamp(),
                        user_id: data.user_id,
                        notification_method: 'Twilio',
                        status: response.body.status,
                        status_code: response.statusCode,
                        message_id: response.body.sid,
                        messaging_service_sid: response.body.messaging_service_sid
                    }); 
                });
            });
        }
});
