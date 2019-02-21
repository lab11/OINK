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

const incentive = require('./incentive');

exports = module.exports = functions.firestore
    .document('OINK_user_list/{user_id}')
    .onCreate((snapshot, context) => {
        // Collection of things to do
        var todo = []

        const user_id = context.params.user_id
        const data = snapshot.data();
        const timestamp = FieldValue.serverTimestamp();
        const phone_number = data.phone_number;
        const network = data.phone_carrier;

        //Okay the possible creation states are:

        //created with just an app install -> Pay them for first install
        if (data.incentivized && data.app_installed) {
            todo.push(incentive.incentivize_once(user_id, phone_number, network, timestamp, 'firstOpen', INCENTIVE_FIRSTOPEN_AMOUNT));
        }

        //created with an app install and powerwatch -> incentivize them for both
        if (data.incentivized &&  data.powerwatch_installed){
            todo.push(incentive.incentivize_once(user_id, phone_number, network, timestamp, 'firstPowerwatch', INCENTIVE_FIRSTPOWERWATCH_AMOUNT));
        }

        //created but not active -> This user should not be incentivized
        // -> DO NOTHING

        return Promise.all(todo);
});
