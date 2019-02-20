const functions = require('firebase-functions');

const stimulus = require('./stimulus');

exports = module.exports = functions.firestore
    .document('OINK_stimulus/{docId}').onUpdate((change, context) => {
        return stimulus.onUpdate(change, context);
    })
