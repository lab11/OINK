const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('util');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

// Creating a firebase object to navigate it:
var db = admin.firestore();

// Configuration
INCENTIVE_FIRSTOPEN_AMOUNT = functions.config().incentives.firstopen.amount;
INCENTIVE_FIRSTPOWERWATCH_AMOUNT = functions.config().incentives.firstpowerwatch.amount;
INCENTIVE_COMPLIANCEAPP_AMOUNT = functions.config().incentives.complianceapp.amount;
INCENTIVE_COMPLIANCEAPP_INTERVAL = functions.config().incentives.complianceapp.interval;
INCENTIVE_COMPLIANCEPOWERWATCH_AMOUNT = functions.config().incentives.compliancepowerwatch.amount;
INCENTIVE_COMPLIANCEPOWERWATCH_INTERVAL = functions.config().incentives.compliancepowerwatch.interval;


// Handle the logic of creating a specific incentive, including de-dup checking
//
// Returns a promise chain to run
function incentivize_once(user_id, timestamp, incentive, amount) {
    console.log(`'user_id ${user_id} just marked as eligible for ${incentive}'`);

    const stimulus_collection = 'OINK_stimulus_' + incentive;

    // Check if this user has been incentivized for this before
    return db.collection(stimulus_collection).doc(user_id).get().then(doc => {
        if (!doc.exists) {
            console.log(`'No ${stimulus_collection} for ${user_id}. Incentivizing.'`);

            return db.collection(stimulus_collection).doc(user_id).set({
                user_id: user_id,
                amount: amount,
                timestamp: timestamp,
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

        // n.b. Cannot use server timestamp due to API limitation:
        // Error: FieldValue transformations are not supported inside of array values.
        const timestamp = new Date().getTime();

        // Collection of things to do
        var todo = []

        // Check if this is a newly incentivized user
        if ((newValue.incentivized != previousValue.incentivized) && (newValue.incentivized == true)) {
            todo.push(incentivize_once(user_id, timestamp, 'firstOpen', INCENTIVE_FIRSTOPEN_AMOUNT));
        }

        // Check if this is a newly powerwatch'd user
        if ((newValue.powerwatch != previousValue.powerwatch) && (newValue.powerwatch == true)) {
            todo.push(incentivize_once(user_id, timestamp, 'firstPowerwatch', INCENTIVE_FIRSTPOWERWATCH_AMOUNT));
        }

        // Check if this incentived user is due for a compliance incentive
        if (newValue.incentivized_days != previousValue.incentivized_days) {
            if (newValue.incentivized_days >= INCENTIVE_COMPLIANCEAPP_INTERVAL) {
                // Look up any prior compliance stimuli
                todo.push(db.collection('OINK_stimulus_complianceApp').doc(user_id).get().then(doc => {
                    if (doc.exists) {
                        // We've been over 30 days before, see if we're 30 days
                        // past the last time
                        if ((newValue.incentivized_days - doc.data().last_day) >= INCENTIVE_COMPLIANCEAPP_INTERVAL) {
                            return doc.ref.update({
                                restimulate: true,
                                amount: INCENTIVE_COMPLIANCEAPP_AMOUNT,
                                last_day: newValue.incentivized_days,
                                day_list: doc.data().day_list.push(last_day),
                                timestamp_list: doc.data().timestamp_list.push(timestamp),
                            });
                        }
                    } else {
                        // First time over 30 days, so create the initial stimulus doc
                        return db.collection('OINK_stimulus_complianceApp').doc(user_id).set({
                            user_id: user_id,
                            amount: INCENTIVE_COMPLIANCEAPP_AMOUNT,
                            timestamp: timestamp,
                            last_day: newValue.incentivized_days,
                            day_list: [newValue.incentivized_days],
                            timestamp_list: [timestamp],
                        });
                    }
                }));
            }
        }

        return Promise.all(todo);
    });
