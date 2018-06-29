const functions = require('firebase-functions');
const admin = require('firebase-admin');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

exports = module.exports = functions.firestore
    .document('OINK_alarms_manual/{docId}').onCreate((snapshot, context) => {
        const docId = context.params.docId;

        return db.collection('OINK_alarms_db').add({
            timestamp: FieldValue.serverTimestamp(),
            type: 'error',
            title: `Manual Intervention Required: ${docId}`,
            reason: 'An error has occurred that requires manual intervention',
        })
        .then(() => {
            return snapshot.ref.update({
                record_timestamp: FieldValue.serverTimestamp(),
            });
        });
    });
