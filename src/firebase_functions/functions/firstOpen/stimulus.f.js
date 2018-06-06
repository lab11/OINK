//import { currentId } from 'async_hooks';

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

/*
firstOpenStimulus function:
- Triggers on creation of a new document in ffirstOpen_transaction collection.
- The function updates the amount and timestamp of the document and then writes a new document in tx_core_payment
  to start the transaction using oinkCore1.
- In addition, it notifies oink admins using alarmsMail function.

*/

exports = module.exports = functions.firestore
    .document('firstOpen_transaction/{docId}').onCreate((snap, context)=>{
        const docId = context.params.docId
        const data = snap.data()
        const user_id = data.user_id
        const amount = data.amount
        const imei = data.imei
        const token = data.token
        const currentTimestamp = new Date().getTime()
        console.log(`The docId of the creation was: ${util.inspect(docId)}`)

        return db.collection('firstOpen_transaction').doc(docId).update({
            amount: amount,
            time_processed: currentTimestamp
            
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
                reason: "User is being incentivized for First Open event.",
            })
        })
    })

//https://us-central1-paymenttoy.cloudfunctions.net/generatorsFirstOpen

