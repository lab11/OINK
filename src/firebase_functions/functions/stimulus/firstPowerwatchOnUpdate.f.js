const functions = require('firebase-functions');

const stimulus = require('./stimulus');

const incentive = 'firstPowerwatch';

exports = module.exports = functions.firestore
    .document('OINK_stimulus_firstPowerwatch/{docId}').onUpdate((change, context) => {
        return stimulus.onUpdate(incentive, change, context);
    })

