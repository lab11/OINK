const functions = require('firebase-functions');
const admin = require('firebase-admin');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

exports = module.exports = functions.database.ref('/dwapp/invite_transaction_create/{pushId}')
    .onCreate((snapshot, context) => {
        // Grab the current value of what was written to the Realtime Database.
        const data = snapshot.val();

        console.log(data);

        // Blindly pass through the record. All documents have a unique,
        // auto-gen'd ID so no risk of updating accidentally. Invite de-duping
        // handled at the next layer.
        return db.collection('DWAPP_invite_transaction').add(data);
    });
