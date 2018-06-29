const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('util');
try {admin.initializeApp();} catch(e) {}
// You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.Field

exports = module.exports = functions.firestore
    .document('OINK_user_list/{docId}').onUpdate((change, context) =>{
        const before = change.before.data();
        const after = change.after.data();

        const docId = context.params.docId;

        var todo = [];

        if (before.user_id != after.user_id) {
            console.error(`User ID changed from ${before.user_id} to ${after.user_id}`);
            todo.push(db.collection('OINK_alarms_db').add({
                timestamp: FieldValue.serverTimestamp(),
                reason: 'Something just changed a user_id! This will break a lot of stuff!',
            }));
        }

        todo.push(db.collection('OINK_log_user_list').add({
            docId: docId,
            user_id: after.user_id,
            before: before,
            after: after,
        }));

        return Promise.all(todo);
    });
