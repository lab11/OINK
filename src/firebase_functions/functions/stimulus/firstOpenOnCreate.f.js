const functions = require('firebase-functions');

const stimulus = require('./stimulus');

const incentive = 'firstOpen';

exports = module.exports = functions.firestore
    .document('OINK_stimulus_firstOpen/{docId}').onCreate((snapshot, context) => {
        return stimulus.onCreate(incentive, snapshot, context);
    })
