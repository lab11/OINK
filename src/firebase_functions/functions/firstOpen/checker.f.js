const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('util');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

// Configuration
INCENTIVE_FIRSTOPEN_AMOUNT = functions.config().incentives.firstopen.amount;
INCENTIVE_FIRSTPOWERWATCH_AMOUNT = functions.config().incentives.firstpowerwatch.amount;


// Handle the logic of creating a specific incentive, including de-dup checking
//
// Returns a promise chain to run
function incentivize(user_id, incentive, amount) {
    console.log(`'user_id ${user_id} just marked as eligible for ${incentive}'`);

    const stimulus_collection = 'OINK_stimulus_' + incentive;

    // Check if this user has been incentivized for this before
    return db.collection(stimulus_collection).doc(user_id).get().then(doc => {
        if (!doc.exists) {
            console.log(`'No ${stimulus_collection} for ${user_id}. Incentivizing.'`);

            return db.collection(stimulus_collection).doc(user_id).set({
                user_id: user_id,
                amount: amount,
                timestamp: new Date().getTime(),
            })
                .catch(err => {
                    console.error(`'Error adding document to ${stimulus_collection}'`, err);
                });

        } else {
            // If the document exists, the user was already paid so return nothing.
            console.log(`'user_id ${user_id} already in ${stimulus_collection}:'`, doc.data());
            return null;
        }
    })
        .catch(err => {
            console.error(`'Error looking up previous ${incentive} for user.'`, err);
        })
}


exports = module.exports = functions.firestore
    .document('OINK_user_list/{user_id}')
    .onUpdate((change, context) => {
        // Don't care about delete events
        const before = change.before.exists;
        const after = change.after.exists;
        if (before === true && after === false) {
            return null;
        }

        const user_id = context.params.user_id
        const newValue = change.after.data();
        const previousValue = change.before.data();

        // If the record did not change to becomes incentivized, or it is not incentivized, return
        if (newValue.incentivized == previousValue.incentivized || newValue.incentivized == false) {
            return null;
        }

        // Collection of things to do
        var todo = []

        // Check if this is a newly incentivized user
        if ((newValue.incentivized != previousValue.incentivized) && (newValue.incentivized == true)) {
            todo.push(incentivize(user_id, 'firstOpen', INCENTIVE_FIRSTOPEN_AMOUNT));
        }

        // Check if this is a newly powerwatch'd user
        if ((newValue.powerwatch != previousValue.powerwatch) && (newValue.powerwatch == true)) {
            todo.push(incentivize(user_id, 'firstPowerwatch', INCENTIVE_FIRSTPOWERWATCH_AMOUNT));
        }

        return Promise.all(todo);
    });
