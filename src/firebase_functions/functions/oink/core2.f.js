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

        res.status(200).send(req.query);
        // return db.collection('rx_core_payment').add({
        //     amount:data.amount,
        //     type: data.type,
        //     user_id: data.user_id,
        //     transaction: userPaymentInfo.transaction_id,
        //     tx_core_doc_id: docId
        // });
    
});
