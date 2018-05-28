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

//stimulus_firstOpen funtion:

exports = module.exports = functions.firestore
    .document('firstOpen_Queue/{docId}').onCreate((snap, context)=>{
        const docId = context.params.docId;
        const data = snap.data();
        const costFirstOpen = 1
        const user_id = data.user_id
        const imei = data.imei
        const token = data.token
        const paymentService = data.paymentService 
        const networkCode = data.networkCode
        const customerNumber = data.customerNumber
        const currentTimestamp = new Date().getTime()
        console.log(`The docId of the creation was: ${util.inspect(docId)}`)
        // Case 1.0: User is already present in user_list meaning they just reinstalled the app.
        var user = db.collection('user_list').doc(user_id)

        return user.get()
        .then((doc) => {
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
                    timestamp: currentTimestamp,
                    token: token,
                    payment_service: paymentService,
                    customer_number: customerNumber,
                    network_code: networkCode

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
                        firstOpenTime: currentTimestamp,
                        lastTimeActive: 0,
                        active: true,
                        timePaidArr: [],
                        lastCheckpoint:0

                    })
                })
                .then(() => {
                    return db.collection('firstOpen_transaction').add({
                        amount: costFirstOpen,
                        timestamp: currentTimestamp,
                        imei: imei,
                        user_id: user_id,
                        token: token
                    })
                })
            }
        })
        
    })

//https://us-central1-paymenttoy.cloudfunctions.net/generatorsFirstOpen

