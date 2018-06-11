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
firstOpenQueue function:
- Triggers on creation of a new document in firstOpen_Queue collection.
- If the user_id of the document that triggered this function is not present in the user_list collection, 
  add the user in the user_list, set the active flag to true and add the event in the user_activity collection.
  Otherwise, do nothing.

- Parameters:
    * There are not specific parameters for this function.
*/

exports = module.exports = functions.firestore
    .document('OINK_firstOpen_Queue/{docId}').onCreate((snap, context)=>{
        const docId = context.params.docId;
        const data = snap.data();
        const user_id = data.user_id
        const imei = data.imei
        const token = data.token
        const paymentService = data.paymentService 
        const networkCode = data.networkCode
        const customerNumber = data.customerNumber
        const currentTimestamp = new Date().getTime()
        console.log(`The docId of the creation was: ${util.inspect(docId)}`)
        // Case 1.0: User is already present in user_list meaning they just reinstalled the app.
        var user = db.collection('OINK_user_list').doc(user_id)

        return user.get()
        .then((doc) => {
            if(doc.exists) {
                // Case 1.1 (edge coverage): Just in case of packet loss or double packet being sent and user was already set to active
                if(doc.data().active){
                    console.log('The user was already active...')
                    return null;
                } 
                // Case 1.2: Update user to active & log user_activity
                else {
                    return db.collection('OINK_user_list').doc(user_id).update({
                        active: true
                    })
                    .then(() => {
                        return db.collection('OINK_user_activity').add({
                            user_id: user_id,
                            active: true,
                            timestamp: currentTimestamp
                        })
                    })
                }
            }
            // Case 2.0 User was not present in user_list meaning this is the first time they are ever opening the app
            else {
                return db.collection('OINK_user_list').doc(user_id).set({
                    active: true,
                    imei: imei,
                    timestamp: currentTimestamp,
                    token: token,
                    payment_service: paymentService,
                    customer_number: customerNumber,
                    network_code: networkCode,
                    incentivized: false

                })
                .then(() => {
                    return db.collection('OINK_user_activity').add({
                        user_id: user_id,
                        active: true,
                        timestamp: currentTimestamp
                    })
                })
                .then(() => {
                    return db.collection('OINK_user_timers').doc(user_id).set({
                        elapsedTime: 0,
                        firstOpenTime: currentTimestamp,
                        lastTimeActive: currentTimestamp,
                        active: true,
                        lastCheckpoint: 0

                    });
                });
                
            }
        })
        
    })


