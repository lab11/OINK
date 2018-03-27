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
// - Triggers on creation of firstOpen_transaction events. Checks if user_id already exists (via user_activity collection). If it does, checks if active
//   or inactive and sets to active if not already. If not present in user_activity collection, calculate the amount to be paid and enqueue the transaction
//   to tx_core_payment collection and sets status of the firstOpen_transaction doc to "previouslyOpened". If this function fails to perform the task, 
//   throw an error
//   update the firstOpen_transaction status to "failed".
// - Sends email to user confirming app installation by adding document to alarm_db


//write to tx
//send a message to user
//alarm: alarms_db.add(time, reason, userID) "thank you for installing the app"
//try catch
//check user_activity collection to make sure they are not already present if they are check activity and update it 
//fraud detection by checking if locality and time is centered around the same time. 

exports = module.exports = functions.firestore
    .document('firstOpen_transaction/{docId}').onCreate((event)=>{
        // declare original constants so we do not need to query later on in function
        const docId = event.params.docId
        const data = event.data.data()
        const costFirstOpen = 5
        //const eventType = data.event
        const user_id = data.user_id
        const status = data.status
        const imei = data.imei
        const tx_core_doc_id = data.tx_core_doc_id
        const token = data.token
        // safety check #1: incase some kind of async error where doc was already updated
        if(data.user_activity == "active") {
            return
        }
        // safety check #2: check user_activity collection if user has deleted and reopened app
        // if data.user_activity appears in user_activity collection{
        // update data to be active and do not pay. (place pay in if block)

        // log function
        console.log(`The docId of the creation was: ${util.inspect(docId)}`)
        // update firstOpen doc
        return db.collection('firstOpen_transaction').doc(docId).update({
            // format may change in future
            user_activity: "active",
            amount: costFirstOpen,
            time_processed: FieldValue.serverTimestamp(),
            stimulus_doc_id: docId
        })
        // add to payment collection
        .then(() => {
            return db.collection('tx_core_payment').add({
                // format may change in future
                user_id: user_id,
                amount: costFirstOpen,
                msgs: [],
                num_attempts: 0,
                time: FieldValue.serverTimestamp(),
                type: 'firstOpen',
                stimulus_doc_id: docId,
                status: 'pending',
                reattempt: false
            })
        })
        .then(() => {
            return db.collection('alarms_db').add({
                timestamp: FieldValue.serverTimestamp(),
                user_id:data.user_id,
                reason:"User has opened application for the first time.",
                tx_core_doc_id:docId 
            })
        })
    })

//https://us-central1-paymenttoy.cloudfunctions.net/generatorsFirstOpen

