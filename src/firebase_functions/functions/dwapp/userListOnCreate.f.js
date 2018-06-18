const functions = require('firebase-functions');
const admin = require('firebase-admin');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

const dwapp = require('./dwapp');

exports = module.exports = functions.firestore
    .document('DWAPP_user_list/{docId}')
    .onCreate((snapshot, context) => {
        const data = snapshot.data();
        const user_id = data.user_id;
        const phone_number = dwapp.normalize(data.phone_number);

        // Check if this user_id already exists
        return db.collection('OINK_user_list').doc(user_id).get().then(doc => {
            if (doc.exists) {
                console.warn(`Create for ${user_id}, which already exists. Converting to an update.`);

                const before = doc.data();
                const after = data;

                return dwapp.onUpdate(before, after);
            } else {
                // Check whether a user with this phone number exists
                return db.collection('OINK_user_list').where('phone_number', '==', data.phone_number).get().then(docs => {
                    if (docs.length == 0) {
                        // The normal case, create a new record
                        console.log(`Creating new record in OINK_user_list for ${user_id}`);
                        return db.collection('OINK_user_list').doc(user_id).set({
                            active: true,
                            incentivized: false,
                            user_id: user_id,
                            timestamp: data.timestamp,
                            payment_service: data.payment_service,
                            phone_number: phone_number,
                            phone_imei: data.phone_imei,
                            phone_carrier: data.phone_carrier,
                        });
                    } else {
                        return db.collection('OINK_alarms_manual').doc().set({
                            reason: 'App install for existing phone number but mismatched user_id',
                            user_id_created: user_id,
                            phone_number: phone_number,
                            found_docs: docs,
                        });
                    }
                });
            }
        });
