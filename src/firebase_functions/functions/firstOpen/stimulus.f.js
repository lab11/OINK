import { currentId } from 'async_hooks';

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
    .document('firstOpen_Queue/{docId}').onCreate((event)=>{
        const docId = event.params.docId
        const data = event.data.data()
        const costFirstOpen = 5
        const user_id = data.user_id
        const imei = data.imei
        const token = data.token
        const currentTimestamp = Firebase.ServerValue.TIMESTAMP
        console.log(`The docId of the creation was: ${util.inspect(docId)}`)
        // Case 1.0: User is already present in user_list meaning they just reinstalled the app.
        var user = db.collection('user_list').doc(user_id)

        return user.get().then((doc) => {
            if(doc.exists) {
                // Case 1.1 (edge coverage): Just in case of packet loss or double packet being sent and user was already set to active
                if(doc.data().active){
                    console.log('The user was already active...')
                    return
                } 
                // Case 1.2: Update user to active & log user_activity
                else {
                    return db.collection('user_list').doc(user_id).update({
                        active: true
                    })
                    .then(() => {
                        return db.collection('user_activity').add({
                            user_id: user_id,
                            active: true,
                            timestamp: currentTimestamp
                        })
                    })
                }
            }
            // Case 2.0 User was not present in user_list meaning this is the first time they are ever opening the app
            else {
                return db.collection('user_list').doc(user_id).set({
                    active: true,
                    imei: imei,
                    instance_id: "?",
                    phone_num: "unknown",
                    timestamp: currentTimestamp,
                    token: token
                })
                .then(() => {
                    return db.collection('user_activity').add({
                        user_id: user_id,
                        active: true,
                        timestamp: currentTimestamp
                    })
                })
                .then(() => {
                    return db.collection('user_timers').doc(user_id).set({
                        cycle: 1,
                        elapsedTime: 0,
                        firstOpenTime: 0,
                        lastTimeActive: 0,
                        active: true,
                        timePaidArr: []
                    })
                })
            }
        })
    })

//https://us-central1-paymenttoy.cloudfunctions.net/generatorsFirstOpen

