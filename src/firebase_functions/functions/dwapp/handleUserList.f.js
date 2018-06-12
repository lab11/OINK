const functions = require('firebase-functions');
const admin = require('firebase-admin');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

exports = module.exports = functions.firestore
    .document('DWAPP_user_list/{docId}')
    .onWrite((change, context) => {
        const docId = context.params.docId

        // Don't care about delete events
        const before = change.before.exists;
        const after = change.after.exists;
        if (before === true && after === false) {
            return null;
        }

        const newValue = change.after.data();

        // Records coming from the app
        const user_id = newValue.user_id;                   // Opaque, consistent id from all records from the phone
        const timestamp = newValue.timestamp;               // Timestamp of this record on the phone
        const payment_service = newValue.payment_service;   // The payment service requested by the user
                                                            // In the future custom payments may change parameters
        const phone_number = newValue.phone_number;         // The network phone number
        const phone_imei = newValue.phone_imei;             // The IMEI of the phone if we can get it
        const phone_carrier = newValue.phone_carrier;       // The carrier / network operator (e.g. MTN, Tigo)
        const fcm_token = newValue.fcm_token;               // Firebase cloud messaging token
        //console.log({
        //    user_id: user_id,
        //    timestamp: timestamp,
        //    payment_service: payment_service,
        //    phone_number: phone_number,
        //    phone_imei: phone_imei,
        //    phone_carrier: phone_carrier,
        //    fcm_token: fcm_token
        //});

        // Check if this user already exists
        return db.collection('OINK_user_list').doc(user_id).get().then(doc => {
            if (doc.exists) {
                // User already exists

                var to_set = {
                    active: true,
                };
                if (fcm_token != undefined) {
                    to_set.fcm_token = fcm_token;
                }
                console.log("User '" + user_id + "' already exists. Setting: %j", to_set);
                return db.collection('OINK_user_list').doc(user_id).update(to_set);
            } else {
                // This is a new user, create a record

                // Add some fields that OINK wants in the user_list
                const active = true;
                const incentivized = false;

                // Create the new record
                console.log('Creating new record in OINK_user_list');
                return db.collection('OINK_user_list').doc(user_id).set({
                    active: active,
                    incentivized: incentivized,
                    user_id: user_id,
                    timestamp: timestamp,
                    payment_service: payment_service,
                    phone_number: phone_number,
                    phone_imei: phone_imei,
                    phone_carrier: phone_carrier,
                });
            }
        });
    });
