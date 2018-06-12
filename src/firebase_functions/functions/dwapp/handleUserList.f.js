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

        const user_id = newValue.user_id;
        //console.log({
        //    user_id: newValue.user_id,
        //    timestamp: newValue.timestamp,
        //    payment_service: newValue.payment_service,
        //    phone_number: newValue.phone_number,
        //    phone_imei: newValue.phone_imei,
        //    phone_carrier: newValue.phone_carrier,
        //    fcm_token: newValue.fcm_token
        //});

        // Normalize phone numbers
        // TODO: This is very DumsorWatch-specific
        var phone_number = newValue.phone_number;
        console.log('Customer number before anything: ' + phone_number);
        phone_number = phone_number.replace(/ /g,'');
        console.log('Space stripped: ' + phone_number);
        if (phone_number.slice(0,4) == '+233') {
            phone_number = phone_number.slice(4);
        }
        if ((phone_number.length > 9) && (phone_number.slice(0,3) == '233')) {
            phone_number = phone_number.slice(3);
        }
        if (phone_number.length < 9) {
            console.log('Phone number too short: ' + phone_number);
            return db.collection('OINK_alarms_db').add({
                timestamp: new Date().getTime(),
                reason: `'Impossibly short phone number: ${phone_number}'`,
            });
        }
        if (phone_number.length == 9) {
            phone_number = '0' + phone_number;
        }
        console.log(`'Phone number after normalization: ${phone_number}'`);

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
