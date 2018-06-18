const functions = require('firebase-functions');

const stimulus = require('./stimulus');

const incentive = 'firstSurvey';

exports = module.exports = functions.firestore
    .document(`OINK_stimulus_${incentive}/{docId}`).onUpdate((change, context) => {
        return stimulus.onUpdate(incentive, change, context);
    })
