const functions = require('firebase-functions');
const admin = require('firebase-admin');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

exports = module.exports = functions.firestore
    .document('user_list/{docId}')
    .onWrite((change, context) => {
        const docId = context.params.docId
        const newValue = change.after.data();
        const previousValue = change.before.data();

        // Records coming from the app
        const customer_number = newValue.customer_number;
        const id = newValue.id;
        const imei = newValue.imei;
        const network_code = newValue.network_code;
        const payment_service = newValue.payment_service;
        const timestamp = newValue.timestamp;
        const token = newValue.token;
        console.log({id: id, customer_number: customer_number, imei: imei, network_code: network_code, payment_service: payment_service, timestamp: timestamp, token: token});

        // Check if this user already exists
        return db.collection('OINK_user_list').doc(id).get().then(doc => {
            if (doc.exists) {
                // User already exists

                var to_set = {
                    active: true,
                };
                if (token != undefined) {
                    to_set.token = token;
                }
                return doc.set(to_set);
            } else {
                // This is a new user, create a record

                // Add some fields that OINK wants in the user_list
                const active = true;
                const incentivized = false;

                // Create the new record
                return db.collection('OINK_user_list').add({
                    active: active,                     // Active user?
                    customer_number: customer_number,   // Phone number
                    id: id,                             // Phone number or IMEI, whichever the app could use
                    imei: imei,                         // IMEI
                    incentivized: incentivized,         // Starts as false, may be flipped by survey service later
                    network_code: network_code,         // e.g. MTN
                    payment_service: payment_service,   // e.g. korba
                    timestamp: timestamp,               // When the phone wrote the record
                    token: token,                       // FCM token
                });
            }
        });
    });
