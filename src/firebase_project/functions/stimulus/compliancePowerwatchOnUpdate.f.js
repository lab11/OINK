const functions = require('firebase-functions');

const stimulus = require('./stimulus');

const incentive = 'compliancePowerwatch';

exports = module.exports = functions.firestore
    .document('OINK_stimulus_compliancePowerwatch/{docId}').onUpdate((change, context) => {
        return stimulus.onUpdate(incentive, change, context);
    })


