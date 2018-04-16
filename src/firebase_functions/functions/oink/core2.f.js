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
        // return db.collection('rx_core_payment').add({
        //     timestamp: FieldValue.serverTimestamp(),
        //     //type: docData.type,
        //     //amount: docData.amount,
        //     user_id: req.query.transaction_id.slice(0,-9),
        //     transaction_id: req.query.transaction_id,
        //     status: req.query.status,
        //     message: req.query.message
        
        // })
        
        return db.collection('tx_core_payment').where('transaction_id','==', req.query.transaction_id).get()
        .then(snapshot =>{
            
                //Calculating the total num of invites that the specific user has sent.
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
        .then(() => {
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
            if (req.query.status == 'SUCCESS') {
                return db.collection('notifications_db').add({
                    amount: amount_doc,
                    type: type_doc,
                    status: 'success',
                    timestamp: new Date().getTime(),
                    body: `Your ${type_doc} transaction has been submitted for ${amount_doc} CHD. Thank you!`,
                    title:"Transaction submitted",
                    user_id: userId_doc
                })
                .then(() => {
                    return db.collection(`${type_doc}_transaction`).doc(stimulus_doc).update({status: 'complete'})
                })
                .then(() => {
                    return db.collection('tx_core_payment').doc(tx_core_doc_id).update({status: 'complete'})
                })
                

            }
            else {
                return db.collection('alarms_db').add({
                    timestamp: FieldValue.serverTimestamp(),
                    user_id:userId_doc, 
                    reason:`Transaction No. ${req.query.transaction_id} for ${type_doc} failed. ${req.query.message}`,
                    tx_core_doc_id:tx_core_doc_id })
                .then(() => {
                    return db.collection(`${type_doc}_transaction`).doc(stimulus_doc).update({status: 'failed'})
                })
                .then(() => {
                    return db.collection('tx_core_payment').doc(tx_core_doc_id).update({status: 'failed', msgs:msgs_doc.push('transaction error')})
                })

            }
            
        })
        .then(() => {
            res.status(200).send("OK");
        });
        
    });

        