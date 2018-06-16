// This indirection is a workaround for requiring root collections for anything
// interesting in firestore.

const admin = require('firebase-admin');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

function doStimulus(incentive, user_id, amount) {
    const currentTimestamp = FieldValue.serverTimestamp();

    if (user_id != docId) {
        console.error("Consistency error: stimulus docId != user_id");
        console.error(docId);
        console.error(user_id);
        return db.collection('OINK_alarms_db').add({
            timestamp: currentTimestamp,
            type: "error",
            reason: "Consistency error: stimulus docId != user_id",
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
            var todo = [];

            todo.push(db.collection('OINK_tx_core_payment').add({
                user_id: user_id,
                stimulus_doc_id: docId,
                stimulus_collection: 'OINK_stimulus_' + incentive,
                amount: amount,
            }));

            todo.push(db.collection('OINK_alarms_db').add({
                timestamp: currentTimestamp,
                type: "notification",
                user_id: user_id,
                reason: `'User is being incentivized for ${incentive}.'`,
            }));

            return Promise.all(todo);
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

function onCreate(incentive, docId, data) {
    const user_id = data.user_id;
    const amount = data.amount;

    return doStimulus(incentive, user_id, amount);
}

function onUpdate(incentive, docId, change) {
    var todo = [];

    const before = change.before.data();
    const after = change.after.data();

    if ((after.restimulate == true) && (before.restimulate != true)) {
        todo.push(change.after.ref.set({
            restimulate: false,
        }));

        todo.push(doStimulus(incentive, after.user_id, after.amount));
    }

    if (after.notify == true) {
        if ((after.status == 'complete') && (before.status != 'complete')) {

            // TODO: This is a bit brittle and breaks abstractions
            var message;
            const amount = after.amount;
            var verb;
            if (amount == 1) {
                verb = 'has';
            } else {
                verb = 'have';
            }
            if (incentive == 'firstOpen') {
                message = `Thanks for installing the app. ¢${amount} ${verb} been deposited to your account.`;
            } else if (incentive == 'firstPowerwatch') {
                message = `Thanks for installing a PowerWatch device. ¢${amount} ${verb} been deposited to your account.`;
            } else {
                console.error(`Unknown incentive type: ${incentive}`);
                return null;
            }

            todo.push(db.collection('OINK_notifications_fcm').add({
                user_id: user_id,
                title: 'Thank You!',
                message: message,
                timestamp: FieldValue.serverTimestamp(),
            }));
        }
    }

    return Promise.all(todo);
}

module.exports.onCreate = onCreate;
module.exports.onUpdate = onUpdate;
