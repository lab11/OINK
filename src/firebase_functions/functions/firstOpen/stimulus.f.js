const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('util');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

exports = module.exports = functions.firestore
    .document('OINK_firstOpen_transaction/{docId}').onCreate((snap, context)=>{
        const docId = context.params.docId
        const data = snap.data()

        const user_id = data.user_id
        const amount = data.amount
        const currentTimestamp = new Date().getTime()

        if (user_id != docId) {
            console.error("Consistency error: firstOpen_transaction docId != user_id");
            console.error(docId);
            console.error(user_id);
            return db.collection('OINK_alarms_db').add({
                timestamp: currentTimestamp,
                type: "error",
                reason: "Consistency error: firstOpen_transaction docId != user_id",
            });
        }

        return db.collection('OINK_firstOpen_transaction').doc(docId).update({
            time_processed: currentTimestamp
        })
        .then(() => {
            // Validate user_id
            return db.collection('OINK_user_list').doc(user_id).get().then(doc => {
                if (doc.exists) {
                    return db.collection('OINK_tx_core_payment').add({
                        user_id: user_id,
                        stimulus_doc_id: docId,
                        type: 'firstOpen',
                        amount: amount,
                    })
                    .then(() => {
                        return db.collection('OINK_alarms_db').add({
                            timestamp: currentTimestamp,
                            type: "notification",
                            user_id: user_id,
                            reason: "User is being incentivized for First Open event.",
                        })
                    });
                }
                else {
                    console.error("firstOpen_transaction for user_id not in OINK_user_list", user_id);
                    return db.collection('OINK_alarms_db').add({
                        timestamp: currentTimestamp,
                        type: "error",
                        reason: "firstOpen_transaction for user_id not in OINK_user_list",
                    })
                }
            });
        });
    })
