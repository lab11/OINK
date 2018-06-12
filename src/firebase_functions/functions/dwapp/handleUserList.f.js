const functions = require('firebase-functions');
const admin = require('firebase-admin');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

const normalizeGhanaNumbers = require('./normalizeGhanaNumbers');

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

        //console.log({
        //    user_id: newValue.user_id,
        //    timestamp: newValue.timestamp,
        //    payment_service: newValue.payment_service,
        //    phone_number: newValue.phone_number,
        //    phone_imei: newValue.phone_imei,
        //    phone_carrier: newValue.phone_carrier,
        //    fcm_token: newValue.fcm_token
        //});

        const user_id = newValue.user_id;
        const phone_number = normalizeGhanaNumbers.normalize(newValue.phone_number);

        // Check if this user already exists
        return db.collection('OINK_user_list').doc(user_id).get().then(doc => {
            if (doc.exists) {
                // User already exists

                var to_set = {
                    active: true,
                };
                if (newValue.fcm_token != undefined) {
                    to_set.fcm_token = newValue.fcm_token;
                }
                console.log("User '" + user_id + "' already exists. Setting: %j", to_set);
                return db.collection('OINK_user_list').doc(user_id).update(to_set);
            } else {
                // This is a new user, create a record

                // Create the new record
                console.log('Creating new record in OINK_user_list');
                return db.collection('OINK_user_list').doc(user_id).set({
                    active: true,
                    incentivized: false,
                    user_id: user_id,
                    timestamp: newValue.timestamp,
                    payment_service: newValue.payment_service,
                    phone_number: phone_number,
                    phone_imei: newValue.phone_imei,
                    phone_carrier: newValue.phone_carrier,
                });
            }
        });
    });
