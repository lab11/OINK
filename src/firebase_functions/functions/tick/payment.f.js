const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('util');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

exports = module.exports = functions.pubsub.topic('tick-payment').onPublish((event) => {
    // Query the OINK_tx_core_payment table for any records of `status: 'waiting'`
    return db.collection('OINK_tx_core_payment').where('status', '==', 'waiting').get()
    .then(snapshot => {
        // Have to collect an array of asynchronous writes to wait for
        var writes = [];

        snapshot.forEach(doc => {
            var promise = doc.ref.update({status: 'starting'});
            writes.push(promise);
        })

        // This is where all of the writes actually "happen"
        return Promise.all(writes);
    });
});

