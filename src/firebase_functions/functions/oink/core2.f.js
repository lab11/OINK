const functions = require('firebase-functions');
const curl = require('curlrequest');
const admin = require('firebase-admin');
const util = require('util');
const request = require('request-promise');
const crypto = require('crypto');
const sortObj = require('sort-object');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

//Core2 Function:
// - Triggers on a callback from Korba API which sends a get request to the URL of Core2. 
//   The get request contains the transaction ID, status ("SUCCESS/FAILED") an a message about the transaction.
// - Using the transaction ID, we are able to trace the transaction. This function logs on rx_core_payment
//   the result of the transaction, if successful sends notification to user, otherwise sends an alarm to the
//   system admin. This function also updates the stimulus_transaction and tx_core_payment status.

exports = module.exports = functions.https
    .onRequest((req, res) => {
        
        //Declaring variables of the document in tx_core_payment that triggered the payment.
        var tx_core_doc_id;
        var amount_doc;
        var type_doc;
        var userId_doc;
        var stimulus_doc;
        var msgs_doc;

        console.log(util.inspect(req.query));
        console.log(req.query.transaction_id)
        
        //Getting the document in tx_core that matches the transaction id and updating the variables.
        return db.collection('tx_core_payment').where('transaction_id','==', req.query.transaction_id).get()
        .then(snapshot =>{
            
            snapshot.forEach(doc => {
                tx_core_doc_id = doc.id;
                amount_doc = doc.data().amount;
                type_doc = doc.data().type;
                userId_doc = doc.data().user_id;
                stimulus_doc = doc.data().stimulus_doc_id;
                msgs_doc = doc.data().msgs;
                console.log(doc.id, " => ", doc.data());
                    
            });
                
        })
        //Logging on rx_core the result of the transaction
        .then(() => {
            console.log(type_doc)
            console.log(stimulus_doc)
            console.log(tx_core_doc_id)
            console.log(amount_doc)
            console.log(userId_doc)
            console.log(req.query.transaction_id)
            console.log(req.query.status)
            console.log(req.query.message)

            return db.collection('rx_core_payment').add({
                timestamp: FieldValue.serverTimestamp(),
                type: type_doc,
                stimulus_doc_id: stimulus_doc,
                tx_core_doc_id:tx_core_doc_id,
                amount: amount_doc,
                user_id: userId_doc,
                transaction_id: req.query.transaction_id,
                status: req.query.status,
                message: req.query.message

            
            });
        })
        
        .then(() => {
            //If confirmation from Korba successful, write on notification_db that triggers function of
            //user notification.
            if (req.query.status == 'SUCCESS') {
                return db.collection('notifications_db').add({
                    amount: amount_doc,
                    type: type_doc,
                    status: 'success',
                    timestamp: FieldValue.serverTimestamp(),
                    body: `Your ${type_doc} transaction has been submitted for ${amount_doc} CHD. Thank you!`,
                    title:"Transaction completed.",
                    user_id: userId_doc
                })
                //Updating stimulus_transaction status
                .then(() => {
                    return db.collection(`${type_doc}_transaction`).doc(stimulus_doc).update({status: 'complete', time_completed: new Date().getTime() })
                    //return db.collection('firstOpen_transaction').doc(stimulus_doc).update({status: 'complete'})
                })
                //Updating tx_core status
                .then(() => {
                    return db.collection('tx_core_payment').doc(tx_core_doc_id).update({status: 'complete', time_completed: new Date().getTime()})
                })
                

            }
            //If confirmation from Korba has fail status, write on alarms_db that triggers function to 
            //send alarm to system admin.
            else {
                return db.collection('alarms_db').add({
                    timestamp: FieldValue.serverTimestamp(),
                    user_id:userId_doc, 
                    reason:`Transaction No. ${req.query.transaction_id} for ${type_doc} failed. ${req.query.message}`,
                    tx_core_doc_id:tx_core_doc_id })
                .then(() => {
                    return db.collection(`${type_doc}_transaction`).doc(stimulus_doc).update({status: 'failed'})
                    //return db.collection('firstOpen_transaction').doc(stimulus_doc).update({status: 'failed'})
                })
                .then(() => {
                    return db.collection('tx_core_payment').doc(tx_core_doc_id).update({status: 'failed', msgs:msgs_doc.push('transaction error')})
                })

            }
            
        })
        .then(() => {
            res.status(200).send("OK");
        })
        .catch(err => {
            // will log all errors in one place
            console.log(err);
        });
        
    });

        