const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('util');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

// Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

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

        const timestamp = FieldValue.serverTimestamp();

        // Collection of things to do
        var todo = []

        // Check if this is a newly incentivized user
        if ((newValue.incentivized != previousValue.incentivized) && (newValue.incentivized == true)) {
            if (newValue.dwapp_install_time != undefined) {
                todo.push(incentive.incentivize_once(user_id, timestamp, 'firstOpen', INCENTIVE_FIRSTOPEN_AMOUNT));
            }
        }
        // Or if this is a user previously marked to incentivize who just installed the app
        else if ((newValue.dwapp_install_time != previousValue.dwapp_install_time) && (newValue.incentived == true)) {
            todo.push(incentive.incentivize_once(user_id, timestamp, 'firstOpen', INCENTIVE_FIRSTOPEN_AMOUNT));
        }

        // Check if this is a newly powerwatch'd user
        if ((newValue.powerwatch != previousValue.powerwatch) && (newValue.powerwatch == true)) {
            if (newValue.dwapp_install_time != undefined) {
                todo.push(incentive.incentivize_once(user_id, timestamp, 'firstPowerwatch', INCENTIVE_FIRSTPOWERWATCH_AMOUNT));
            }
        }
        // Or if this is a user previously marked with a powerwatch who just installed the app
        else if ((newValue.dwapp_install_time != previousValue.dwapp_install_time) && (newValue.powerwatch == true)) {
            todo.push(incentive.incentivize_once(user_id, timestamp, 'firstPowerwatch', INCENTIVE_FIRSTPOWERWATCH_AMOUNT));
        }

        // Check if this is a newly surveyed user
        if ((newValue.firstSurvey != previousValue.firstSurvey) && (newValue.firstSurvey == true)) {
            todo.push(incentive.incentivize_once(user_id, timestamp, 'firstSurvey', INCENTIVE_FIRSTSURVEY_AMOUNT));
        }

        // Check if this incentived user is due for a compliance incentive
        
        // For the app...
        if(typeof newValue.incentivized_days != 'undefined') {
            var number_of_incentives = Math.floor(newValue.incentivized_days/INCENTIVE_COMPLIANCEAPP_INTERVAL);
            for(var i = 1; i <= number_of_incentives; i++) {
                let day_number = INCENTIVE_COMPLIANCEAPP_INTERVAL * i;
                const doc_name = user_id + '-' + day_number;
                todo.push(db.collection('OINK_stimulus_complianceApp').doc(doc_name).set({
                            user_id: user_id,
                            amount: INCENTIVE_COMPLIANCEAPP_AMOUNT,
                            timestamp: timestamp,
                            day_count: day_number,
                        }));
            }
        }

        //For powerwatch
        if(typeof newValue.powerwatch_days != 'undefined') {
            var number_of_incentives = Math.floor(newValue.powerwatch_days/INCENTIVE_COMPLIANCEPOWERWATCH_INTERVAL);
            for(var i = 1; i <= number_of_incentives; i++) {
                let day_number = INCENTIVE_COMPLIANCEPOWERWATCH_INTERVAL * i;
                const doc_name = user_id + '-' + day_number;
                todo.push(db.collection('OINK_stimulus_compliancePowerwatch').doc(doc_name).set({
                            user_id: user_id,
                            amount: INCENTIVE_COMPLIANCEPOWERWATCH_AMOUNT,
                            timestamp: timestamp,
                            day_count: day_number,
                        }));
            }
        }

        return Promise.all(todo);
    });
