const functions = require('firebase-functions');

const stimulus = require('./stimulus');

const incentive = 'firstOpen';

exports = module.exports = functions.firestore
    .document('OINK_stimulus_firstOpen/{docId}').onUpdate((change, context) => {
        const docId = context.params.docId;

        return stimulus.onUpdate(incentive, docId, change);
    })

