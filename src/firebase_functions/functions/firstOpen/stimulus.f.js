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

exports = module.exports = functions.firestore
    .document('firstOpen_transaction/{docId}').onCreate((event)=>{
        const data = event.data.data()
        const docId = event.params.docId
        const costFirstOpen = 5
        let previouslyOpened =false;
        if(data.processed) {
            return
        }
        console.log(`The docId of the creation was: ${util.inspect(docId)}`)
        return db.collection('firstOpen_transaction').add({
            user_id: data.user_id,
            processed: true,
            amount: costFirstOpen,
            previouslyOpened: previouslyOpened,
            msgs: [],
            time_stimulus_added: data.time,
            time_processed: FieldValue.serverTimestamp(),
            type: "firstOpen",
            stimulus_doc_id: docId
        })
    })

//https://us-central1-paymenttoy.cloudfunctions.net/generatorsFirstOpen

