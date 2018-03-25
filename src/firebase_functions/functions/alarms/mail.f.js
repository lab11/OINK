//Function to send email to admins when there is an alarm

const functions = require('firebase-functions');
const admin = require('firebase-admin');
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
    .document('alarms_db/{docId}').onCreate((event) =>{
        //Getting the data that was modified and initializing all the parameters for payment.
        const data = event.data.data();
        const docId = event.params.docId;
        const emails = ["scorreacardo@umass.edu"]
        console.log("sending emails to " + emails.join())
        const mailOptions = {
            from: `"OINK" <${alarmEmail}>`,
            bcc: emails.join(),
            subject: "OINK alarm notification",
            text:`Thanks for using OINK!
                Something didn't work out.
                Details: ${data.reason}
                Timestamp: ${data.timestamp}.
                User ID: ${data.user_id}.
                Alarm ID: ${docId}.`,
            html: 'Embedded image: <img src="cid:oinklogo"/>',
            attachments: [{
                    filename: 'oink.png',
                    path: 'https://firebasestorage.googleapis.com/v0/b/paymenttoy.appspot.com/o/Screen%20Shot%202018-02-19%20at%204.52.01%20PM.png?alt=media&token=85aeafe0-c985-4a5e-bd52-c9779cfcfcc2',
                    cid: 'oinklogo' //same cid value as in the html img src
                }]
        }
        return mailTransport.sendMail(mailOptions).then(()=>{
            console.log(`Email to ${emails.join()} sent.`)
            return event.data.ref.set({status: "notified"}, {merge: true});
        }).catch(error => {
            console.log(`Error sending email to ${emails.join()}.`)
            return event.data.ref.set({status: "failed"}, {merge: true});
        })
    });
