//This function will check every change in user_activity collection and update
//the user_timers collection.
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
    .document('user_activity/{docId}').onCreate((event) => {
        //Getting the data that was modified and initializing all the parameters.
        const data = event.data.data();
        const docId = event.params.docId;
        var docRef = db.collection('user_timers').doc(data.user_id);

        if (!data.active) {

            return docRef.get()
            .then(doc => {
                if (doc.exists) {
                    var tempLastTimeActive = doc.data().lastTimeActive;
                    var tempElapsedTime = doc.data().elapsedTime;
                    var newElapsedTime = tempElapsedTime + (data.timestamp - tempLastTimeActive); 
                }
                else {
                    console.log('No such document!');
                }
            })
            .then(() => {
                return docRef.update({
                    active: false,
                    elapsedTime: newElapsedTime,
                    lastTimeActive: data.timestamp

                })
            })
            .catch( err => {
                console.log(err);
            });
        }
        else { 
            return docRef.update({
                active: true,
                lastTimeActive: data.timestamp 
            })
        }

    });
        
    


