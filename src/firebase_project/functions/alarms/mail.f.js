const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

// Configuration
//
// Third-party:
//   Configure the email transport using the default SMTP transport and a GMail account.
//   For Gmail, enable these:
//   1. https://www.google.com/settings/security/lesssecureapps
//   2. https://accounts.google.com/DisplayUnlockCaptcha
//   For other types of transports such as Sendgrid see https://nodemailer.com/transports/
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
const APP_NAME = functions.config().general.name;

exports = module.exports = functions.firestore
    .document('OINK_alarms_db/{docId}').onCreate((snap, context) =>{
        //Getting the data that was modified and initializing all the parameters for payment.
        const data = snap.data();
        const docId = context.params.docId;

        // TODO: Make configurable
        const emails = ["scorreacardo@umass.edu","ppannuto@berkeley.edu", "adkins@berkeley.edu", "nklugman@berkeley.edu", "podolsky@berkeley.edu"]
        console.log("sending emails to " + emails.join())

        var subject = `"${APP_NAME}: OINK Alarm"`;
        if (data.type == 'error') {
            subject += ": Error!";
        } else if (data.type == 'notification') {
            subject += ": Notification.";
        }

        if (data.title != undefined) {
            subject += ' ' + data.title;
        }

        var body = '<h2>Thank you for using OINK!</h2>' +
            '<p>An event has triggered one of your alarms. These are the details:</p>' +
            `<b>Alarm docId: </b> ${docId}<br>`;
        // n.b. firestore.Timestamp doesn't pretty-print, so convert to a JS Date
        if (data.timestamp) {
            let timestamp = data.timestamp;
            if (timestamp instanceof admin.firestore.Timestamp) {
                timestamp = timestamp.toDate();
            }
            body += `<b>Timestamp: </b> ${timestamp}<br>`;
        } else {
            const now = admin.firestore.Timestamp.now().toDate();
            body += `<b>Timestamp: </b> ${now} -- Warn: Timestamp added by alarm layer, not reporting event. May be slightly delayed.<br>`;
        }
        if (data.reason) {
            body += `<p><b>Reason: </b> ${data.reason}<br>`;
        }
        //TODO: Think about this more.
        //if (data.user_id) {
        //    body += `<b>User id: </b> ${data.user_id}<br>`;
        //}
        if (data.tx_core_doc_id) {
            body += `<b>Document that triggered the alarm: </b> ${data.tx_core_doc_id}</p>`;
        }
        body += '<p>Best,<br> OINK Team.</p>';
	body += '<img src="cid:oinklogo"/>';

        const mailOptions = {
            from: `"OINK" <${alarmEmail}>`,
            bcc: emails.join(),
            subject: subject,
            html: body,
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
            console.error(`Error sending email to ${emails.join()}.`);
            console.error(error);
            console.error(mailOptions);
            return snap.ref.set({status: "failed"}, {merge: true});
        })
    });
