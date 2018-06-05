//This function will check every change in user_activity collection and update
//the user_timers collection.
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
cronActivityTracker function:
- Triggers on creation of a new document in user_activity collection.
- user_activity collection logs every change in the status of the app: active(installed) and inactive (app removed)
- cronActivity Tracker  calculates the elapsed time of the user using the app when the app is removed and updates the user timers.

- Parameters:
    * There are not specific parameters for this function.
*/

exports = module.exports = functions.firestore
    .document('user_activity/{docId}').onCreate((snap, context) => {
        //Getting the data that was modified and initializing all the parameters.
        const data = snap.data();
        const docId = context.params.docId;
        var docRef = db.collection('user_timers').doc(data.user_id);
        
        //declaring temporary variables to update in user_timers
        var tempLastTimeActive;
        var tempElapsedTime;
        var newElapsedTime; 

        //If the user_activity event is the user becoming inactive (app removed),
        // calculates the time elapsed and update user_timers doc
        if (!data.active) {

            return docRef.get()
            .then(doc => {
                if (doc.exists) {
                    tempLastTimeActive = doc.data().lastTimeActive;
                    tempElapsedTime = doc.data().elapsedTime;
                    newElapsedTime = tempElapsedTime + (data.timestamp - tempLastTimeActive); 
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
        // If the user_activity event is user becoming active (installing for first time or reinstalling the app),
        // update the active flag in user_timer doc and log its timestamp.
        else { 
            return docRef.update({
                active: true,
                lastTimeActive: data.timestamp 
            })
            .catch( err => {
                console.log(err);
            });
        }

    });
        
    


