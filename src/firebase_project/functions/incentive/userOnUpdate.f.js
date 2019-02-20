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

        //Okay if a user is updated, we should just try to pay them again
        //This is a theme
        //The idea is that if something like your phone number changes
        //We need to catch up on all the payments you missed
        //If some other inconsequential field changes - well payments
        //are idempotent because they are IDd by phone number and people
        //won't be double paid for the same incentive

        //created with just an app install -> Pay them for first install
        if (newValue.incentivized && newValue.app_installed) {
            todo.push(incentive.incentivize_once(user_id, timestamp, 'firstOpen', INCENTIVE_FIRSTOPEN_AMOUNT));
        }

        //created with an app install and powerwatch -> incentivize them for both
        if (newValue.incentivized &&  newValue.powerwatch_installed){
            todo.push(incentive.incentivize_once(user_id, timestamp, 'firstPowerwatch', INCENTIVE_FIRSTPOWERWATCH_AMOUNT));
        }

        //created but not active -> This user should not be incentivized
        // -> DO NOTHING

        return Promise.all(todo);
});
