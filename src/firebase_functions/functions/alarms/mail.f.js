//Function to send email to admins when there is an alarm

const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
try {admin.initializeApp(functions.config().firebase);} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;
// Configure the email transport using the default SMTP transport and a GMail account.
// For Gmail, enable these:
// 1. https://www.google.com/settings/security/lesssecureapps
// 2. https://accounts.google.com/DisplayUnlockCaptcha
// For other types of transports such as Sendgrid see https://nodemailer.com/transports/
// TODO: Configure the `notifications.email` and `notifications.pwd` Google Cloud environment variables.
const alarmEmail = functions.config().notifications.email;
const alarmPassword = functions.config().notifications.pwd;
const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: alarmEmail,
    pass: alarmPassword,
  },
});

// Your company name to include in the emails
const APP_NAME = 'OINK';

//Declaring and adding the function logic.
exports = module.exports = functions.firestore
    .document('invite_transaction/{docId}').onCreate((event) =>{
        //Getting the data that was modified and initializing all the parameters for payment.
        const data = event.data.data();
        const docId = event.params.docId;
        const emails = ["scorreacardo@umass.edu"]
        console.log("sending emails to " + emails.join())
        const mailOptions = {
            from: `"OINK" <${alarmEmail}>`,
            bcc: emails.join(),
            subject: "OINK alarm notification",
            text:`Thanks for using OINK!\n
                Something didn't work out.\n
                Details: ${data.reason}.\n
                Timestamp: ${data.timestamp}.\n
                User ID: ${data.user_id}.\n
                Alarm ID: ${docId}.`
        }
        return mailTransport.sendMail(mailOptions).then(()=>{
            console.log(`Email to ${emails.joint()} sent.`)
            return event.data.ref.set({status: "notified"}, {merge: true});
        }).catch(error => {
            console.log(`Error sending email to ${emails.joint()}.`)
            return event.data.ref.set({status: "failed"}, {merge: true});
        })
    });
