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
        console.log(util.inspect(req.query));
        console.log(req.query.transaction_id)

        // Getting the document in tx_core that matches the transaction id and updating the variables.
        return db.collection('OINK_payment_tx').where('transaction_id','==', req.query.transaction_id).get()
        .then(snapshot =>{
            if (snapshot.empty) {
                console.error('Korba completion called for missing transaction:', req.query.transaction_id);
                console.error(req.query);
                return db.collection('OINK_alarms_manual').doc().set({
                    reason: `Korba completion for missing transaction_id: ${req.query.transaction_id}`,
                    timestamp: FieldValue.serverTimestamp(),
                    req: `${util.inspect(req)}`,
                });
            }
            if (snapshot.size != 1) {
                console.error('Korba completion for duplicated transaction_id:', req.query.transaction_id);
                console.error(req.query);
                return db.collection('OINK_alarms_manual').doc().set({
                    reason: `Korba completion for duplicated transaction_id: ${req.query.transaction_id}`,
                    timestamp: FieldValue.serverTimestamp(),
                    req: `${util.inspect(req)}`,
                    snapshot: snapshot,
                });
            }

            let user_id;
            let amount;
            let stimulus_collection;
            let stimulus_doc_id;
            let stimulus_incentive;
            let tx_core_doc_id;

            snapshot.forEach(doc => {
                user_id = doc.data().user_id;
                amount = doc.data().amount;
                stimulus_collection = doc.data().stimulus_collection;
                stimulus_doc_id = doc.data().stimulus_doc_id;
                stimulus_incentive = doc.data().stimulus_incentive;
                tx_core_doc_id = doc.id;
                console.log(doc.id, " => ", doc.data());
            });


            let todo = [];

            // Logging on rx_core the result of the transaction
            const rx_to_add = {
                user_id: user_id,
                amount: amount,
                stimulus_collection: stimulus_collection,
                stimulus_doc_id: stimulus_doc_id,
                stimulus_incentive: stimulus_incentive,
                tx_core_doc_id: tx_core_doc_id,
                transaction_id: req.query.transaction_id,
                status: req.query.status,
                message: req.query.message,
                timestamp: FieldValue.serverTimestamp(),
            };
            console.log(`Adding ${util.inspect(rx_to_add)}`);
            todo.push(db.collection('OINK_payment_rx').add(rx_to_add));


            // If confirmation from Korba successful, write on notification_db
            // that triggers function of user notification.
            if (req.query.status == 'SUCCESS') {
                // Update the status of the original stimulus record
                todo.push(db.collection(stimulus_collection).doc(stimulus_doc_id).update({
                    status: 'complete',
                    time_completed: FieldValue.serverTimestamp(),
                }));

                // Update the status of the tx core side from submitted to complete
                todo.push(db.collection('OINK_payment_tx').doc(tx_core_doc_id).update({
                    status: 'complete',
                    time_completed: FieldValue.serverTimestamp(),
                }));
            }
            // If confirmation from Korba has fail status, write on alarms_db
            // that triggers function to send alarm to system admin.
            else {
                todo.push(db.collection('OINK_alarms_db').add({
                    timestamp: FieldValue.serverTimestamp(),
                    user_id: user_id,
                    reason:`Transaction ${req.query.transaction_id} failed. ${req.query.message}`,
                    tx_core_doc_id: tx_core_doc_id,
                }));
                todo.push(db.collection(stimulus_collection).doc(stimulus_doc_id).update({
                    status: 'failed',
                    time_completed: FieldValue.serverTimestamp(),
                }));
                todo.push(db.collection('OINK_payment_tx').doc(tx_core_doc_id).update({
                    status: 'failed',
                    time_completed: FieldValue.serverTimestamp(),
                }));
            }

            return Promise.all(todo);
        })
        .then(() => {
            res.status(200).send("OK");
        })
        .catch(err => {
            // will log all errors in one place
            console.error(err);
        });
    });
