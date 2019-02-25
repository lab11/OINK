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
        //Log the payments new status I suppose?? I don't really know how the
        //callback will work
        console.log(req.body.MessageStatus)
        console.log(req.body.MessageSid)
        
        //look through the payment notifications and change the status
        var update = {status: req.body.MessageStatus};
        if(req.body.MessageStatus == 'delivered' || req.body.MessageStatus == 'failed' || req.body.MessageStatus == 'undelivered') {
            //Delivered is the final message so update
            db.collection("OINK_payment_notification").doc(req.body.MessageSid).set(update, {merge: true}).then(() =>{
                console.log('Updated OINK notification with', update);
                return res.status(200).send("OK");
            }).catch(err => {
                console.log(err);
                return res.status(200).send("OK");
            });
        } 
    });
