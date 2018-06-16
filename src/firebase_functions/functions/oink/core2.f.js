const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('util');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

exports = module.exports = functions.https
    .onRequest((req, res) => {
        // Declaring variables of the document in tx_core_payment that triggered the payment.
        var user_id;
        var amount;
        var stimulus_collection;
        var stimulus_doc_id;
        var tx_core_doc_id;

        console.log(util.inspect(req.query));
        console.log(req.query.transaction_id)

        // Getting the document in tx_core that matches the transaction id and updating the variables.
        return db.collection('OINK_tx_core_payment').where('transaction_id','==', req.query.transaction_id).get()
        .then(snapshot =>{
            snapshot.forEach(doc => {
                user_id = doc.data().user_id;
                amount = doc.data().amount;
                stimulus_collection = doc.data().stimulus_collection;
                stimulus_doc_id = doc.data().stimulus_doc_id;
                tx_core_doc_id = doc.id;
                console.log(doc.id, " => ", doc.data());
            });
        })
        // Logging on rx_core the result of the transaction
        .then(() => {
            return db.collection('OINK_rx_core_payment').add({
                user_id: user_id,
                amount: amount,
                stimulus_collection: stimulus_collection,
                stimulus_doc_id: stimulus_doc_id,
                tx_core_doc_id: tx_core_doc_id,
                transaction_id: req.query.transaction_id,
                status: req.query.status,
                message: req.query.message,
                timestamp: FieldValue.serverTimestamp(),
            });
        })
        .then(() => {
            // If confirmation from Korba successful, write on notification_db
            // that triggers function of user notification.
            if (req.query.status == 'SUCCESS') {
                var todo = [];

                // Update the status of the original stimulus record
                // TODO: I actually think the notification to user should come from the stimulus record update anyway.
                todo.push(db.collection(stimulus_collection).doc(stimulus_doc_id).update({
                    status: 'complete',
                    time_completed: FieldValue.serverTimestamp(),
                }));

                // Update the status of the tx core side from submitted to complete
                todo.push(db.collection('OINK_tx_core_payment').doc(tx_core_doc_id).update({
                    status: 'complete',
                    time_completed: FieldValue.serverTimestamp(),
                }));

                return Promise.all(todo);
            }
            // If confirmation from Korba has fail status, write on alarms_db
            // that triggers function to send alarm to system admin.
            else {
                var todo = [];

                todo.push(db.collection('OINK_alarms_db').add({
                    timestamp: FieldValue.serverTimestamp(),
                    user_id: user_id,
                    reason:`Transaction No. ${req.query.transaction_id} for ${type_doc} failed. ${req.query.message}`,
                    tx_core_doc_id:tx_core_doc_id,
                }));
                todo.push(db.collection(stimulus_collection).doc(stimulus_doc_id).update({
                    status: 'failed',
                    time_completed: FieldValue.serverTimestamp(),
                }));
                todo.push(db.collection('OINK_tx_core_payment').doc(tx_core_doc_id).update({
                    status: 'failed',
                    time_completed: FieldValue.serverTimestamp(),
                }));

                return Promise.all(todo);
            }
        })
        .then(() => {
            res.status(200).send("OK");
        })
        .catch(err => {
            // will log all errors in one place
            console.error(err);
        });
    });
