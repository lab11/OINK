const functions = require('firebase-functions');
const admin = require('firebase-admin');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

exports = module.exports = functions.database.ref('/dwapp/user_list_create/{pushId}')
    .onCreate((snapshot, context) => {
        // Grab the current value of what was written to the Realtime Database.
        const data = snapshot.val();

        console.log(data);

        // Check if this user already exists
        return db.collection('DWAPP_user_list').doc(data.user_id).get().then(doc => {
            if (doc.exists) {
                // User already exists
                console.warn(`Create record for user_id ${data.user_id}, which already exists`);

                // Update all the fields DWAPP_user_list, the update handler
                // will validate that nothing meaningful changed
                return db.collection('DWAPP_user_list').doc(data.user_id).update(data);
            } else {
                // New user
                return db.collection('DWAPP_user_list').doc(data.user_id).set({
                    user_id: data.user_id,
                    timestamp: data.timestamp,
                    payment_service: data.payment_service,
                    phone_number: data.phone_number,
                    phone_imei: data.phone_imei,
                    phone_carrier: data.phone_carrier,
                });
            }
        });
    });
