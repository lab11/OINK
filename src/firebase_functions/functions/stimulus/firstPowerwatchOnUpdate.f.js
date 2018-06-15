const functions = require('firebase-functions');

const stimulus = require('./stimulus');

const incentive = 'firstPowerwatch';

exports = module.exports = functions.firestore
    .document('OINK_stimulus_firstPowerwatch/{docId}').onUpdate((change, context) => {
        const docId = context.params.docId;

        return stimulus.onUpdate(incentive, docId, change);
    })

