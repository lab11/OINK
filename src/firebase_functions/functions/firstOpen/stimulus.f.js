//import { currentId } from 'async_hooks';

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
/* 
1.  user opens app -> creates firstOpen document in firebase
2.  firebase function checks user_list for user_id
3.1 if( user_id present in user_list and active ) {no nothing}
3.2 if( user_id present in user_list and inactive ) {set to active}
3.3 if( user_id not present in user_list ) {add to user_list and add to tx_core_payment}

add try catches
break out into two functions one for queueing and one for paying
should I be using .then calls for things that are independent 
*/

exports = module.exports = functions.firestore
    .document('firstOpen_transaction/{docId}').onCreate((event)=>{
        const docId = event.params.docId
        const data = event.data.data()
        const user_id = data.user_id
        const amount = data.amount
        const imei = data.imei
        const token = data.token
        const currentTimestamp = new Date().getTime()
        console.log(`The docId of the creation was: ${util.inspect(docId)}`)

        return db.collection('firstOpen_transaction').doc(docId).update({
            user_activity: "active",
            amount: amount,
            time_processed: currentTimestamp,
            processed: true
        })
        .then(() => {
            return db.collection('tx_core_payment').add({
                user_id: user_id,
                amount: amount,
                msgs: [],
                num_attempts: 0,
                time: currentTimestamp,
                type: 'firstOpen',
                stimulus_doc_id: docId,
                status: 'pending',
                reattempt: false
            })
        })
        .then(() => {
            return db.collection('alarms_db').add({
                timestamp: currentTimestamp,
                user_id: user_id,
                reason: "User has opened application for the first time.",
            })
        })
    })

//https://us-central1-paymenttoy.cloudfunctions.net/generatorsFirstOpen

