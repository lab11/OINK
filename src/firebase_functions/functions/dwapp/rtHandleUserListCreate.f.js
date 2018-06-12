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

        console.log(pushId);
        console.log(data);

        // Check if this user already exists
        return db.collection('DWAPP_user_list').doc(user_id).get().then(doc => {
            if (doc.exists) {
                // User already exists
                console.error('Duplicate user creation!');

                // This is pretty unexpected, let's kick out an email
                return db.collection('OINK_alarms_db').add({
                    type: "error",
                    user_id: user_id,
                    reason: "Attempt to create a user that already exists (user reinstall?)",
                }).then(() => {
                    // Best guess is to mark them as active I suppose.
                    // This should be a no-op of a write, but will trigger the
                    // firestore function to update and ultimately mark the
                    // user as active.
                    return db.collection('DWAPP_user_list').doc(user_id).update({
                        user_id: user_id,
                    });
                });
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
