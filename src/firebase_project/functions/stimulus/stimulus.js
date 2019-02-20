// This indirection is a workaround for requiring root collections for anything
// interesting in firestore.

const admin = require('firebase-admin');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

function doStimulus(incentive, ref, user_id, amount) {
    // TODO: This should be more robust, but is sufficient for DumsorWatch
    if ((amount == undefined) || (amount < 1) || (amount > 50)) {
        console.error(`'Impossible/unreasonable incentive amount: ${amount}'`);
        return db.collection('OINK_alarms_db').add({
            timestamp: FieldValue.serverTimestamp(),
            type: "error",
            reason: `'Impossible/unreasonable incentive amount: ${amount}'`,
        });
    }

    // Start by sanity checking that the user exists
    return db.collection('OINK_user_list').doc(user_id).get().then(doc => {
        if (doc.exists) {
            var todo = [];

            todo.push(ref.update({
                status: 'pending',
            }));


            todo.push(db.collection('OINK_payment_tx').add({
                user_id: user_id,
                stimulus_doc_id: ref.id,
                stimulus_incentive: incentive;
                stimulus_collection: 'OINK_stimulus',
                amount: amount,
            }));

            todo.push(db.collection('OINK_alarms_db').add({
                timestamp: FieldValue.serverTimestamp(),
                type: "notification",
                user_id: user_id,
                reason: `'User is being incentivized for ${incentive}.'`,
            }));

            return Promise.all(todo);
        }
        else {
            console.error(`Stimulus for ${incentive} for user_id not in OINK_user_list`, user_id);
            return db.collection('OINK_alarms_db').add({
                timestamp: FieldValue.serverTimestamp(),
                type: "error",
                user_id: user_id,
                reason: `Stimulus for ${incentive} for user_id not in OINK_user_list`,
            })
        }
    });
}

function onCreate(snapshot, context) {
    const data = snapshot.data()
    const user_id = data.user_id;
    const amount = data.amount;
    const incntive = data.incentive;

    return doStimulus(incentive, snapshot.ref, user_id, amount);
}

function onUpdate(change, context) {
    var todo = [];

    const before = change.before.data();
    const after = change.after.data();

    var incentive = after.incentive;

    if ((after.status == 'complete') && (before.status != 'complete')) {
        if (after.notify == true) {

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
                user_id: after.user_id,
                title: 'Thank You!',
                message: message,
                timestamp: FieldValue.serverTimestamp(),
            }));
        }
    }

    if ((after.status == 'failed') && (before.status != 'failed')) {
        todo.push(db.collection('OINK_alarms_db').add({
            timestamp: FieldValue.serverTimestamp(),
            type: "error",
            user_id: after.user_id,
            reason: `Failed to incentive user for ${incentive}`,
        }));
    }

    return Promise.all(todo);
}

module.exports.onCreate = onCreate;
module.exports.onUpdate = onUpdate;
