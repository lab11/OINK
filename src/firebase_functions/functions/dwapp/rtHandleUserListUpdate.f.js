const functions = require('firebase-functions');
const admin = require('firebase-admin');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

exports = module.exports = functions.database.ref('/dwapp/user_list_update/{pushId}')
    .onCreate((snapshot, context) => {
        // Grab the current value of what was written to the Realtime Database.
        const data = snapshot.val();

        console.log(pushId);
        console.log(data);

        // Check if this user already exists
        return db.collection('DWAPP_user_list').doc(data.user_id).get().then(doc => {
            if (doc.exists) {
                // User already exists

                return db.collection('DWAPP_user_list').doc(data.user_id).update({
                    fcm_token: data.fcm_token,
                });
            } else {
                // User doesn't exist??
                console.error('Attempt to update a user that does not exist!', data.user_id);

                return db.collection('OINK_alarms_db').add({
                    type: "error",
                    user_id: data.user_id,
                    reason: "Attempt to update a user that does not exist.",
                });
            }
        });
    });

