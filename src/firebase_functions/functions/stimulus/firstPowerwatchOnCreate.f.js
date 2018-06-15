const functions = require('firebase-functions');

const stimulus = require('./stimulus');

const incentive = 'firstPowerwatch';

exports = module.exports = functions.firestore
    .document('OINK_stimulus_firstPowerwatch/{docId}').onCreate((snapshot, context) => {
        const docId = context.params.docId;
        const data = snapshot.data()

        return stimulus.onCreate(incentive, docId, data);
    })
