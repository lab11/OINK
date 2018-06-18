const functions = require('firebase-functions');

const stimulus = require('./stimulus');

const incentive = 'complianceApp';

exports = module.exports = functions.firestore
    .document('OINK_stimulus_complianceApp/{docId}').onCreate((snapshot, context) => {
        return stimulus.onCreate(incentive, snapshot, context);
    })

