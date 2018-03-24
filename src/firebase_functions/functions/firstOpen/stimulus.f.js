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

//stimulus_firstOpen funtion:
// - Triggers on creation of firstOpen_transaction events. Checks if user_id already exists. If not, calculate the amount to be paid and enqueue the transaction
//   to tx_core_payment collection and sets status of the firstOpen_transaction doc to "previouslyOpened". If this function fails to perform the task, throw an error and
//   update the firstOpen_transaction status to "failed".

exports = module.exports = functions.firestore
    .document('firstOpen_transaction/{docId}').onCreate((event)=>{
        const data = event.data.data()
        const docId = event.params.docId
        const costFirstOpen = 5
        let status = "previouslyOpened"
        if(data.processed) {
            return
        }
        console.log(`The docId of the creation was: ${util.inspect(docId)}`)
        return db.collection('firstOpen_transaction').add({
            user_id: data.user_id,
            processed: true,
            amount: costFirstOpen,
            status: status,
            msgs: [],
            time_stimulus_added: data.time,
            time_processed: FieldValue.serverTimestamp(),
            type: "firstOpen",
            stimulus_doc_id: docId
        })

        // Should I be looping over the documents to determine if any documents have user_id + status == unopened before delivering payment?
        // Or can I simply just set status to previouslyOpened, send payment and be done?
        /*
        return db.collection('firstOpen_transaction').where('user_id','==', data.user_id).get()
            .then(snapshot => {
                return snapshot.forEach(doc => {
                    counter++
        */
    })

//https://us-central1-paymenttoy.cloudfunctions.net/generatorsFirstOpen

