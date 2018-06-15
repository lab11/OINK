const functions = require('firebase-functions');

const stimulus = require('./stimulus');

const incentive = 'firstOpen';

exports = module.exports = functions.firestore
    .document(`'OINK_stimulus_${incentive}/{docId}'`).onUpdate((snapshot, context) => {
        const docId = context.params.docId;
        const data = snapshot.data()

        return stimulus.onUpdate(incentive, docId, data);
    })

