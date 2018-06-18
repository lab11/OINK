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
INCENTIVE_FIRSTSURVEY_AMOUNT = functions.config().incentives.firstsurvey.amount;
INCENTIVE_COMPLIANCEAPP_AMOUNT = functions.config().incentives.complianceapp.amount;
INCENTIVE_COMPLIANCEAPP_INTERVAL = functions.config().incentives.complianceapp.interval;
INCENTIVE_COMPLIANCEPOWERWATCH_AMOUNT = functions.config().incentives.compliancepowerwatch.amount;
INCENTIVE_COMPLIANCEPOWERWATCH_INTERVAL = functions.config().incentives.compliancepowerwatch.interval;

const incentive = require('./incentive');

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

        // Check if this is a newly surveyed user
        if ((newValue.firstSurvey != previousValue.firstSurvey) && (newValue.firstSurvey == true)) {
            todo.push(incentivize_once(user_id, timestamp, 'firstSurvey', INCENTIVE_FIRSTSURVEY_AMOUNT));
        }

        // Check if this incentived user is due for a compliance incentive
        if (newValue.incentivized_days != previousValue.incentivized_days) {
            if (newValue.incentivized_days >= INCENTIVE_COMPLIANCEAPP_INTERVAL) {
                // Look up any prior compliance stimuli
                todo.push(db.collection('OINK_stimulus_complianceApp').where('user_id', '==', user_id).get().then(docs => {
                    // n.b. cannot `orderBy` time or day because already filtering on 'user_id'
                    // so instead, we'll iterate all the records, there won't be that many.
                    var last_day_count = 0;

                    docs.forEach(doc => {
                        const data = doc.data();

                        if (data.day_count > last_day_count) {
                            last_day_count = data.day_count;
                        }
                    });

                    if ((newValue.incentivized_days - last_day_count) >= INCENTIVE_COMPLIANCEAPP_INTERVAL) {
                        const doc_name = user_id + '-' + newValue.incentivized_days;

                        // TODO: should call incentivize_once here
                        return db.collection('OINK_stimulus_complianceApp').doc(doc_name).set({
                            user_id: user_id,
                            amount: INCENTIVE_COMPLIANCEAPP_AMOUNT,
                            timestamp: timestamp,
                            day_count: newValue.incentivized_days,
                        });
                    }
                }));
            }
        }

        return Promise.all(todo);
    });
