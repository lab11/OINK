const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('util');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

// Promises to run reasonably often. No guarentees on when.
exports = module.exports = functions.pubsub.topic('tick-periodic').onPublish((message, event) => {
    const now = event.timestamp.toMillis();

    var todo = [];

    // Job that watches for payments to time out (no reply for payment request)
    todo.push(db.collection('OINK_payment_tx').where('status', '==', 'pending').get()
        .then(docs => {
            var writes = [];

            docs.forEach(doc => {
                const data = doc.data();

                if (data.started_at == undefined) {
                    console.warn(`Payment doc ${doc.id} did not have a start time, treating now as started`);
                    writes.push(doc.ref.update({
                        tick_periodic_warn: 'Missing started_at time, added by tick',
                        started_at: FieldValue.serverTimestamp(),
                        timeout_ms: 1000 * 60 * 10, // 10 min, TODO: configuration parameter?
                    }));
                } else if ((now - data.started_at.toMillis()) > data.timeout_ms) {
                    console.log(`Payment doc ${doc.id} timed out`);
                    writes.push(doc.ref.update({
                        status: 'error',
                        timeout_at: event.timestamp,
                    }));
                } else {
                    console.log(`Payment doc ${doc.id} still waiting`);
                }
            });

            return Promise.all(writes);
        })
    );

    return Promise.all(todo);
});
