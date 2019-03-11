const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('util');
const request = require('request-promise');
try {admin.initializeApp();} catch(e) {}
const twilio = require('twilio');

const TWILIO_API_KEY = functions.config().twilio.api_key;
var accountSid = "AC6b6498d3c4f277a9ddbc16860d801a8d";
var authToken = TWILIO_API_KEY;
var client = new twilio(accountSid, authToken);
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

const REGION = functions.config().general.region;
const PROJECT = functions.config().general.project;
const INCENTIVE_FIRSTOPEN_AMOUNT = functions.config().incentives.firstopen.amount;
const INCENTIVE_FIRSTPOWERWATCH_AMOUNT = functions.config().incentives.firstpowerwatch.amount;
const INCENTIVE_COMPLIANCEAPP_AMOUNT = functions.config().incentives.complianceapp.amount;
const INCENTIVE_COMPLIANCEPOWERWATCH_AMOUNT = functions.config().incentives.compliancepowerwatch.amount;
const TWILIO_CALLBACK = functions.config().twilio.callback;

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
                var phone_number = user_data.data().phone_number;

                let message;
                if(data.stimulus_incentive == 'firstOpen') {
                    amount = INCENTIVE_FIRSTOPEN_AMOUNT.toString();
                    message = "Thank you for installing DumsorWatch! We have paid you " + amount + "GHS."
                } else if (data.stimulus_incentive == 'complianceApp') {
                    amount = INCENTIVE_COMPLIANCEAPP_AMOUNT.toString();
                    message = "Thank you for keeping DumsorWatch installed! We have paid you " + amount + "GHS."
                } else if (data.stimulus_incentive == 'firstPowerwatch') {
                    amount = INCENTIVE_FIRSTPOWERWATCH_AMOUNT.toString();
                    message = "Thank you for installing PowerWatch! We have paid you " + amount + "GHS."
                } else if (data.stimulus_incentive == 'compliancePowerwatch') {
                    amount = INCENTIVE_COMPLIANCEPOWERWATCH_AMOUNT.toString();
                    message = "Thank you for keeping PowerWatch installed! We have paid you " + amount + "GHS."
                } else {
                    console.log("We don't know how to send a message for this incentive");
                    return db.collection('OINK_alarms_db').add({
                        timestamp: FieldValue.serverTimestamp(),
                        user_id: data.user_id,
                        reason:"We do not know how to send a message for this incentive type.",
                        rx_core_doc_id: docId
                    });
                }


                console.log("Sending message to", phone_number, "with message", message);

                client.messages.create({
                        to: '+233' + phone_number,
                        from: 'GridWatch',
                        body: message,
                        statusCallback: TWILIO_CALLBACK,
                 }).then(message => {
                    //Write the result of that request to a final table about user notification
                    console.log(message.status)
                    console.log(message.error_code)
                    return db.collection('OINK_payment_notification').doc(message.sid).set({
                        timestamp: FieldValue.serverTimestamp(),
                        user_id: data.user_id,
                        notification_method: 'Twilio',
                        message_id: message.sid,
                        message_uri: message.uri,
                        rx_doc_id: docId,
                        stimulus_doc_id: data.stimulus_doc_id
                    }, {merge: true});
                 });
            });
        }
});
