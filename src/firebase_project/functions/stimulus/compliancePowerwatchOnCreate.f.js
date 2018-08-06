const functions = require('firebase-functions');

const stimulus = require('./stimulus');

const incentive = 'compliancePowerwatch';

exports = module.exports = functions.firestore
    .document('OINK_stimulus_compliancePowerwatch/{docId}').onCreate((snapshot, context) => {
        return stimulus.onCreate(incentive, snapshot, context);
    })

