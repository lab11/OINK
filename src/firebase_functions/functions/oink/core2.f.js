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
        
        //Creating variables of the document in tx_core_payment that triggered the payment.
        var tx_core_doc_id;
        var amount_doc;
        var type_doc;
        var userId_doc;
        var stimulus_doc;
        console.log(util.inspect(req.query));
        return db.collection('rx_core_payment').add({
            timestamp: FieldValue.serverTimestamp(),
            //type: docData.type,
            //amount: docData.amount,
            user_id: req.query.transaction_id.slice(0,-9),
            transaction_id: req.query.transaction_id,
            status: req.query.status,
            message: req.query.message
        
        })
        // .then(() =>{
        //     request({
        //         uri: 'http://graphs.grid.watch:3245',
        //  
        //         method: 'POST',
        //         headers:{
        //             'Content-Type':'application/json',
        //         },
        //         json: true,
        //         body: {transaction_id: req.query.transaction_id},
        //         resolveWithFullResponse: true,
        //     }).then( response =>{
        //         if (response.statusCode >= 400) {
        //             console.log(`HTTP Error: ${response.statusCode}`);
        //         }
        //         console.log('Response body: ', response.body);
        //         console.log('Status code: ', response.statusCode);
        //     });
        // })
        .then(() => {
            return db.collection('tx_core_payment').where('transaction_id','==', req.query.transaction_id).get()
            .then(snapshot =>{
                
                    //Calculating the total num of invites that the specific user has sent.
                    snapshot.forEach(doc => {
                        tx_core_doc_id = doc.id;
                        amount_doc = doc.data().amount;
                        type_doc = doc.data().type;
                        userId_doc = doc.data().user_id;
                        stimulus_doc = doc.data().stimulus_doc_id;
                        console.log(doc.id, " => ", doc.data());
                            
                    });
                  
            })

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
                });

            }
            else {
                return db.collection('alarms_db').add({
                    timestamp: FieldValue.serverTimestamp(),
                    user_id:userId_doc, 
                    reason:`Transaction No. ${req.query.transaction_id} for ${type_doc} failed. ${req.query.message}`,
                    tx_core_doc_id:tx_core_doc_id });

            }
            
        })
        .then(() => {
            res.status(200).send("OK");
        });
        

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
        