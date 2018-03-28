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
add user_list conditionals
*/

exports = module.exports = functions.firestore
    .document('firstOpen_transaction/{docId}').onCreate((event)=>{
        const docId = event.params.docId
        const data = event.data.data()
        const costFirstOpen = 5
        const user_id = data.user_id
        const status = data.status
        const imei = data.imei
        const tx_core_doc_id = data.tx_core_doc_id
        const token = data.token

        if(data.user_activity == "active") {
            return
        }

        console.log(`The docId of the creation was: ${util.inspect(docId)}`)

        return db.collection('firstOpen_transaction').doc(docId).update({
            user_activity: "active",
            amount: costFirstOpen,
            time_processed: FieldValue.serverTimestamp(),
            stimulus_doc_id: docId
        })

        .then(() => {
            return db.collection('tx_core_payment').add({
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

