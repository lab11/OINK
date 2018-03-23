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
        db.collection('rx_core_payment').add({
            timestamp: FieldValue.serverTimestamp(),
            //type: docData.type,
            //amount: docData.amount,
            user_id: req.query.transaction_id.slice(0,-9),
            transaction_id: req.query.transaction_id,
            status: req.query.status,
            message: req.query.message
        
        });
        res.status(200).send("OK");

    });
    //     .then(doc => {
    //         if (!doc.exists){
    //             // db.collection('alarms_db').add({timestamp: FieldValue.serverTimestamp(),user_id:data.user_id, reason:"User ID does not exist.",tx_core_doc_id:docId });
    //             //             //throw new Error('Invalid or unexisting User ID.');
    //             //             console.log("Invalid or unexisting User ID.");
    //             return null;
    //         } else {
    //             var docData = doc.data()
    //             console.log(util.inspect(doc))
    //             db.collection('rx_core_payment').add({
    //                     timestamp: FieldValue.serverTimestamp(),
    //                     type: docData.type,
    //                     amount: docData.amount,
    //                     user_id: req.query.transaction_id.slice(0,-9),
    //                     transaction_id: req.query.transaction_id,
    //                     status: req.query.status,
    //                     message: req.query.message

    //             }).then(() =>{
    //                 res.status(200).send(req.query);
    //             })
    //         }

    //     })
    // });
        