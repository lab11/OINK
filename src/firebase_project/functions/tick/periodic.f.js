const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('util');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

function timeoutStalledPayments(now, docs, state) {
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
                timeout_at: timestamp,
                timeout_state: state,
            }));
        } else {
            console.log(`Payment doc ${doc.id} still waiting`);
        }
    });

    return Promise.all(writes);
}

// Promises to run reasonably often. No guarentees on when.
exports = module.exports = functions.pubsub.topic('tick-periodic').onPublish((message, event) => {
    // This timestamp is of course not a `Timestamp`, so convert first
    const millis = Date.parse(event.timestamp);
    const timestamp = admin.firestore.Timestamp.fromMillis(millis);
    const now = timestamp.toMillis();

    var todo = [];

    // Job that watches for payments to time out (no reply for payment request)
    todo.push(db.collection('OINK_payment_tx').where('status', '==', 'pending').get()
        .then(docs => {
            return timeoutStalledPayments(now, docs, 'pending');
        })
    );

    // Job that watches for payments to time out.
    // Payment request was accepted, but never got a reply.
    //
    // TODO: Eventually this should query the Korba API for the status of the
    // assigned `transaction_id`, but for the short-term, accept possible
    // double-payment.
    todo.push(db.collection('OINK_payment_tx').where('status', '==', 'submitted').get()
        .then(docs => {
            return timeoutStalledPayments(now, docs, 'submitted');
        })
    );

    return Promise.all(todo);
});
