//Function to send notifcations to users when a transaction is submitted TODO: See what other cases apply for nitifications.

const functions = require('firebase-functions');
const admin = require('firebase-admin');
try {admin.initializeApp(functions.config().firebase);} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

//Declaring and adding the function logic.
exports = module.exports = functions.firestore
    .document('notifications_db/{docId}').onCreate((event) =>{
        //Getting the data that was modified and initializing all the parameters for payment.
        const data = event.data.data();
        const docId = event.params.docId;

    // This registration token comes from the client FCM SDKs.
    var registrationToken = 'fD_bk9Px43w:APA91bFOaVQp7fwTiXMGqwEbRQoA0uNIuv0tt-hjci0WonjdMEQv3HMK9FTljBQ4tNIYJH6rbljV9bnzUua63Rc27WDOCQo0-C7ZrxI-fh7J8Im0u4bCwSgkbEXR8LSPozSpPTNdmQZH';

    // See documentation on defining a message payload.
    var message = {
    data: {
        score: '850',
        time: '2:45'
    },
    token: registrationToken
    };

    // Send a message to the device corresponding to the provided
    // registration token.
    return admin.messaging().send(message)
    .then((response) => {
        // Response is a message ID string.
        console.log('Successfully sent message:', response);
    })
    .catch((error) => {
        console.log('Error sending message:', error);
    });

        // request({
        //     uri: 'https://fcm.googleapis.com/v1/projects/paymenttoy/messages:send HTTP/1.1',
        
        //     method: 'POST',
        //     headers:{
        //         'Content-Type':'application/json',
        //         'Authorization': '' //TODO: Add the token from the server.

        //     },
        //     json: true,
        //     body: {
        //         "message":{
        //           "token" : "bk3RNwTe3H0:CI2k_HHwgIpoDKCIZvvDMExUdFQ3P1...", //TODO: Ask for the token based on the user ID.
        //           "notification" : {
        //             "body" : data.body,
        //             "title" : data.title,
        //             }
        //          }
        //       },
        //     resolveWithFullResponse: true,
        // })
        // .then(response =>{
        //     console.log('Response body: ', response.body);
        //     console.log('Status code: ', response.statusCode);
            
        //     if (response.statusCode >= 400) {
        //         console.log(`HTTP Error: ${response.statusCode}`);
        //         return event.data.ref.set({status: "failed"}, {merge: true});
        //     }
        //     console.log('Response body: ', response.body);
        //     console.log('Status code: ', response.statusCode);
        //     return event.data.ref.set({status: "notified"}, {merge: true});
            
            
        // }).catch(error => {
        //     console.log(`Error sending email to ${emails.join()}.`)
        //     return event.data.ref.set({status: "failed"}, {merge: true});
        // })
    });
