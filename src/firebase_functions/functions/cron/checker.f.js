//This is the function for participation length incentives
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


exports = module.exports = functions.https
    .onRequest((req, res) => {
        const currentTime = new Date().getTime()
        const paymentThr = 30 * 24 * 60 * 60 * 1000; //30 days 
        const cronRunFreq = 5 * 60 * 1000; //TODO: Currently set each Every 5 min> set tthis up to the real value.
        var elapsedPaid = 0;
        var newElapsedTime = 0;

        //TODO: set a minimum of payment per cycle.

        return db.collection('user_timers').get()
            .then(snapshot => {
                snapshot.forEach(doc =>{
                    
                    if (((doc.data().cycle * paymentThr) - (currentTime - doc.data().firstOpenTime) <= 0) || (doc.data().elapsedTime + (currentTime - doc.data().lastCheckpoint) >= paymentThr)) {
                        var elapsedPaid = 0;

                        if (doc.data().elapsedTime + (currentTime - doc.data().lastCheckpoint) >= paymentThr){
                            elapsedPaid = paymentThr;
                            newElapsedTime = doc.data().elapsedTime + (currentTime - doc.data().lastCheckpoint) - paymentThr;
                        }
                        else {
                            if ( ! doc.data().active){
                                elapsedPaid = doc.data().elapsedTime;
                                
                            }
                            else{
                                if (doc.data().lastCheckpoint <= doc.data().lastTimeActive){
                                    elapsedPaid = doc.data().elapsedTime + (currentTime - doc.data().lastTimeActive)
                                }
                                else {
                                    elapsedPaid = doc.data().elapsedTime + (currentTime - doc.data().lastCheckpoint)
                                }  
                            }
                        newElapsedTime = 0;
                            
                        }

                        return db.collection('cron_transaction').add({
                            event:'cron', 
                            imei: doc.data().imei,
                            time_elapsed: Math.round((elapsedPaid/3600000) * 100) / 100  , //Sending the value to the cron_transaction in hours
                            status: 'pending',
                            time: FieldValue.serverTimestamp(),
                            user_id: doc.id,
                            tx_core_doc_id: 0
                        })
                        .then(() => {
                            return db.collection('user_timers')
                            .doc(doc.id).update({
                                elapsedTime: newElapsedTime, 
                                timePaidArr: doc.data().timePaidArr.push(elapsedPaid), 
                                cycle: doc.data().cycle + 1,
                                lastCheckpoint: currentTime
                            });


                        })
                        .catch( err => {
                            console.log(err);
                        });
                    }

                    else {
                        if (doc.active){

                            if (doc.data().lastCheckpoint <= doc.data().lastTimeActive){
                                newElapsedTime = doc.data().elapsedTime + (currentTime - doc.data().lastTimeActive)

                            }
                            else {
                                newElapsedTime = doc.data().elapsedTime + (currentTime - doc.data().lastCheckpoint)
                            }
                            
                            return db.collection('user_timers').doc(doc.id).update({
                                elapsedTime: newElapsedTime,
                                lastCheckpoint: currentTime
                                
                            })
                            .then(() => {
                                res.status(200).send("OK");
                            })
                            .catch( err => {
                                console.log(err);
                                //TODO:CHeck how to handle this error (fail state?)
                            });
                        }
                        else {return null;}
                    }
                });
            });

    });