//Function to send notifcations to users when a transaction is submitted TODO: See what other cases apply for nitifications.

const functions = require('firebase-functions');
const admin = require('firebase-admin');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

//Function notificationsUser:
//Sends a notification to the user when a payment is completed.
// Requires unique token from user app.

exports = module.exports = functions.firestore
    .document('notifications_db/{docId}').onCreate((snap, context) =>{
        //Getting the data that was modified and initializing all the parameters for payment.
        const data = snap.data();
        const docId = context.params.docId;

    // This registration token comes from the client FCM SDKs.
    var registrationToken;
    return db.collection('user_list').doc(data.user_id).get()
    .then(doc =>{
        registrationToken = doc.data().token
        console.log(registrationToken)
        var message = {
                data: {
                    title: data.title,
                    body: data.body
                },
                token: registrationToken
            };
        // Send a message to the device corresponding to the provided
        // registration token.
        return admin.messaging().send(message)
                
    })
    .then((response) => {
        // Response is a message ID string.
        console.log('Successfully sent message:', response);
    })
    .catch((error) => {
        console.log('Error sending message:', error);
    });

});
