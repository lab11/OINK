const functions = require('firebase-functions');
const curl = require('curlrequest');
const admin = require('firebase-admin');
const util = require('util');
const request = require('request-promise');
const crypto = require('crypto');
const sortObj = require('sort-object');
try {admin.initializeApp(functions.config().firebase);} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

exports = module.exports = functions.https
    .onRequest((req, res) => {
        console.log(util.inspect(req.query));
        var core1_transaction_doc = db.collection('tx_core_payment').where('transaction_id','==', req.query.transaction_id).get()
        console.log(util.inspect(core1_transaction_doc))

        db.collection('rx_core_payment').add({
            timestamp: FieldValue.serverTimestamp(),
            //type: data.type,
            user_id: req.query.transaction_id.slice(0,-9),
            transaction_id: req.query.transaction_id,
            status: req.query.status,
            message: req.query.message
        });
        res.status(200).send(req.query);
    
});
