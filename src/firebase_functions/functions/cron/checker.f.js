//This is the function for participation length incentives
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
cronChecker function:
    - HTTP Function that is called when we want to pay for the elapsed time of users using the app.
    - Requires a third party mechanism to triger the function at specific hours of day or frequency e.g. https://cron-job.org
    - Reads all the timers for each user in the user_timers collection and calculates the elapsed time to pay.
    - Writes a new document in cron_transaction to submit the payment of the calculated time.
*/

exports = module.exports = functions.https
    .onRequest((req, res) => {
        const currentTime = new Date().getTime()
        var newElapsedTime = 0;
        var elapsedPaid = 0;

        //Getting all the timers for each user in the user_timers collection:
        db.collection('OINK_user_timers').get()
            .then(snapshot => {

                //checking each one of the documents in the collection to see which user needs to be paid:
                snapshot.forEach(doc => {

                    if (doc===null){
                        console.log(util.inspect(doc));
                        return null;
                    }

                    if (doc.data().active){
                        //If user is active, check if the last cron was before the last time active and pay the time between the last time active to the current
                        // time + the elapsedTime
                        if (doc.data().lastCheckpoint <= doc.data().lastTimeActive){
                            elapsedPaid = doc.data().elapsedTime + (currentTime - doc.data().lastTimeActive)
                        }
                        //Otherwise pay the elapsed time + the time between the current cron and the last cron (checkpoint)
                        else {
                            elapsedPaid = doc.data().elapsedTime + (currentTime - doc.data().lastCheckpoint)
                        } 

                        //Write a new document in cron_transaction to submit the payment of the calculated elapsed time
                        db.collection('OINK_cron_transaction').add({

                            event:'cron', 
                            time_elapsed: Math.round((elapsedPaid/60000) * 100) / 100  , //Sending the value to the cron_transaction in minutes
                            status: 'pending',
                            time: FieldValue.serverTimestamp(),
                            user_id: doc.id,
                            tx_core_doc_id: 0
                        })
                    }

                    //if the user is inactive (uninstalled the app), the elapsedPaid is the elapsed time in the user_timer doc.
                    //then write the document in cron_transaction to start the transaction.
                    else {
                        elapsedPaid = doc.data().elapsedTime
                        db.collection('OINK_cron_transaction').add({

                            event:'cron', 
                            time_elapsed: Math.round((elapsedPaid/60000) * 100) / 100  , //Sending the value to the cron_transaction in minutes
                            status: 'pending',
                            time: FieldValue.serverTimestamp(),
                            user_id: doc.id,
                            tx_core_doc_id: 0
                        })
                    }

                });
                
            })
            .then(()=>{
                res.send("OK")
            });

        });
