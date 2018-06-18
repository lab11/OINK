const functions = require('firebase-functions');

const stimulus = require('./stimulus');

const incentive = 'firstPowerwatch';

exports = module.exports = functions.firestore
    .document('OINK_stimulus_firstPowerwatch/{docId}').onCreate((snapshot, context) => {
        return stimulus.onCreate(incentive, snapshot, context);
    })
