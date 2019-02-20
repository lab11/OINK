const functions = require('firebase-functions');
const stimulus = require('./stimulus');

exports = module.exports = functions.firestore
    .document('OINK_stimulus/{docId}').onCreate((snapshot, context) => {
        return stimulus.onCreate(snapshot, context);
    });

