const functions = require('firebase-functions');

const stimulus = require('./stimulus');

const incentive = 'complianceApp';

exports = module.exports = functions.firestore
    .document('OINK_stimulus_complianceApp/{docId}').onUpdate((change, context) => {
        return stimulus.onUpdate(incentive, change, context);
    })


