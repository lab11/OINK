// This indirection is a workaround for requiring root collections for anything
// interesting in firestore.

const admin = require('firebase-admin');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

function onCreate(incentive, docId, data) {
    const user_id = data.user_id;
    const amount = data.amount;
    const currentTimestamp = FieldValue.serverTimestamp();

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

    // TODO: This should be more robust, but is sufficient for DumsorWatch
    if ((amount == undefined) || (amount < 1) || (amount > 50)) {
        console.error(`'Impossible/unreasonable incentive amount: ${amount}'`);
        return db.collection('OINK_alarms_db').add({
            timestamp: currentTimestamp,
            type: "error",
            reason: `'Impossible/unreasonable incentive amount: ${amount}'`,
        });
    }

    // Start by sanity checking that the user exists
    return db.collection('OINK_user_list').doc(user_id).get().then(doc => {
        if (doc.exists) {
            return db.collection('OINK_tx_core_payment').add({
                user_id: user_id,
                stimulus_doc_id: docId,
                stimulus_collection: 'OINK_stimulus_' + incentive,
                amount: amount,
            })
            .then(() => {
                return db.collection('OINK_alarms_db').add({
                    timestamp: currentTimestamp,
                    type: "notification",
                    user_id: user_id,
                    reason: `'User is being incentivized for ${incentive}.'`,
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
}

function onUpdate(incentive, docId, change) {
    return null;
}

module.exports.onCreate = onCreate;
module.exports.onUpdate = onUpdate;
