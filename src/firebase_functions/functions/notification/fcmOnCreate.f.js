const functions = require('firebase-functions');
const admin = require('firebase-admin');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

exports = module.exports = functions.firestore
    .document('OINK_notifications_fcm/{docId}').onCreate((snapshot, context) => {
        const data = snapshot.data();

        // This registration token comes from the client FCM SDKs.
        return db.collection('OINK_user_list').doc(data.user_id).get()
        .then(doc =>{
            const fcm_token = doc.data().fcm_token;

            if (fcm_token == undefined) {
                console.error("Cannot notify user who has not sync'd FCM token");
                return doc.ref.update({
                    status: 'failed',
                    messages: ['No FCM token for user'],
                });
            }

            var message = {
                data: {
                    // Data format controlled by the DW app
                    type: 'alert',
                    title: data.title,
                    msg: data.message,
                },
                token: fcm_token,
            };
            // Send a message to the device corresponding to the provided
            // registration token.
            return admin.messaging().send(message)
                .then((response) => {
                    // Response is a message ID string.
                    console.log('Successfully sent message:', response);
                    return doc.ref.update({
                        status: 'complete',
                    });
                })
                .catch((error) => {
                    console.error('Error sending message:', error);
                    return doc.ref.update({
                        status: 'failed',
                        messages: [error],
                    });
                });
        });
    });
