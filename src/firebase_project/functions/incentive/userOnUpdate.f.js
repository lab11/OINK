const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('util');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

// Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

// Configuration
const INCENTIVE_FIRSTOPEN_AMOUNT = functions.config().incentives.firstopen.amount;
const INCENTIVE_FIRSTPOWERWATCH_AMOUNT = functions.config().incentives.firstpowerwatch.amount;
const INCENTIVE_COMPLIANCEAPP_AMOUNT = functions.config().incentives.complianceapp.amount;
const INCENTIVE_COMPLIANCEAPP_INTERVAL = functions.config().incentives.complianceapp.interval;
const INCENTIVE_COMPLIANCEPOWERWATCH_AMOUNT = functions.config().incentives.compliancepowerwatch.amount;
const INCENTIVE_COMPLIANCEPOWERWATCH_INTERVAL = functions.config().incentives.compliancepowerwatch.interval;

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
        const phone_number = newValue.phone_number;
        const network = newValue.phone_carrier;

        const timestamp = FieldValue.serverTimestamp();

        // Collection of things to do
        var todo = []

        //Okay if a user is updated, we should just try to pay them again
        //This is a theme
        //The idea is that if something like your phone number changes
        //We need to catch up on all the payments you missed
        //If some other inconsequential field changes - well payments
        //are idempotent because they are IDd by phone number and people
        //won't be double paid for the same incentive

        //created with just an app install -> Pay them for first install
        if (newValue.incentivized && newValue.app_installed) {
            //todo.push(incentive.incentivize_once(user_id, phone_number, network, timestamp, 'firstOpen', INCENTIVE_FIRSTOPEN_AMOUNT));
        }

        //created with an app install and powerwatch -> incentivize them for both
        if (newValue.incentivized &&  newValue.powerwatch_installed){
            //todo.push(incentive.incentivize_once(user_id, phone_number, network, timestamp, 'firstPowerwatch', INCENTIVE_FIRSTPOWERWATCH_AMOUNT));
        }

        //created but not active -> This user should not be incentivized
        // -> DO NOTHING

        //Okay we should also check to see if the update passes a compliance
        //threshold
        //Again we strictly DO NOT need to worry about double paying
        //because records cannot be created twice and we don't update
        //records that exist

        //Find the number of incentives that should be issued and issue them
        //based on the number of days

        if(typeof newValue.app_incentivized_days != 'undefined') {
            var number_of_incentives = Math.floor(newValue.app_incentivized_days/INCENTIVE_COMPLIANCEAPP_INTERVAL);
            for(var i = 1; i <= number_of_incentives; i++) {
                let day_number = INCENTIVE_COMPLIANCEAPP_INTERVAL * i;
                todo.push(incentive.incentivize_once(user_id, phone_number, network, timestamp, 'complianceApp-' + day_number.toString(), INCENTIVE_COMPLIANCEAPP_AMOUNT));
            }
        }

        if(typeof newValue.powerwatch_incentivized_days != 'undefined') {
            var number_of_incentives = Math.floor(newValue.powerwatch_incentivized_days/INCENTIVE_COMPLIANCEPOWERWATCH_INTERVAL);
            for(var i = 1; i <= number_of_incentives; i++) {
                let day_number = INCENTIVE_COMPLIANCEPOWERWATCH_INTERVAL * i;
                todo.push(incentive.incentivize_once(user_id, phone_number, network, timestamp, 'compliancePowerwatch-' + day_number.toString(), INCENTIVE_COMPLIANCEPOWERWATCH_AMOUNT));
            }
        }

        return Promise.all(todo);
});
