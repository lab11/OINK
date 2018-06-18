const functions = require('firebase-functions');

const stimulus = require('./stimulus');

const incentive = 'firstSurvey';

exports = module.exports = functions.firestore
    .document(`OINK_stimulus_${incentive}/{docId}`).onCreate((snapshot, context) => {
        return stimulus.onCreate(incentive, snapshot, context);
    })

