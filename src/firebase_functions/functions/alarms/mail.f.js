//Function to send email to admins when there is an alarm

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
try {admin.initializeApp();} catch(e) {}
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
    .document('alarms_db/{docId}').onCreate((snap, context) =>{
        //Getting the data that was modified and initializing all the parameters for payment.
        const data = snap.data();
        const docId = context.params.docId;
        const emails = ["scorreacardo@umass.edu","ppannuto@berkeley.edu", "nklugman@berkeley.edu"]
        console.log("sending emails to " + emails.join())
        const mailOptions = {
            from: `"OINK" <${alarmEmail}>`,
            bcc: emails.join(),
            subject: "OINK Alarm Notification",
            html: '<img src="cid:oinklogo"/>' +
                    '<h2>Thank you for using OINK!</h2>' +
                    '<p>An event has triggered one of your alarms. These are the details:</p>' +
                    `<p><b>Reason: </b> ${data.reason}<br>`+
                    `<b>Timestamp: </b> ${data.timestamp}<br>`+
                    `<b>User id: </b> ${data.user_id}<br>`+
                    `<b>Alarm docId: </b> ${docId}<br>`+
                    `<b>Document that triggered the alarm: </b> ${data.tx_core_doc_id}</p>`+
                    '<p>Best,<br> OINK Team.</p>',
            attachments: [{
                    filename: 'oink.png',
                    path: 'https://firebasestorage.googleapis.com/v0/b/paymenttoy.appspot.com/o/Screen%20Shot%202018-02-19%20at%204.52.01%20PM.png?alt=media&token=85aeafe0-c985-4a5e-bd52-c9779cfcfcc2',
                    cid: 'oinklogo' //same cid value as in the html img src
                }]
        }
        return mailTransport.sendMail(mailOptions).then(()=>{
            console.log(`Email to ${emails.join()} sent.`)
            return snap.ref.set({status: "notified"}, {merge: true});
        }).catch(error => {
            console.log(`Error sending email to ${emails.join()}.`)
            return snap.ref.set({status: "failed"}, {merge: true});
        })
    });
