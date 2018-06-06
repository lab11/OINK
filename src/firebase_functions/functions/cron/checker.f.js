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


exports = module.exports = functions.https
    .onRequest((req, res) => {
        const currentTime = new Date().getTime()
        const paymentThr = 5 * 60 * 1000; //5 min of elapsed or registered time threshold
        var elapsedPaid = 0;
        var newElapsedTime = 0;
        var minPayment = 1 * 60 * 1000;
        var elapsedPaid = 0;

        //Getting all the timers for each user in the user_timers collection:
        db.collection('user_timers').get()
            .then(snapshot => {
                console.log(util.inspect(snapshot))
                if (snapshot === null){
                    console.log(snapshot);
                }

                //checking each one of the documents in the collection to see which user needs to be paid:
                snapshot.forEach(doc =>{

                    console.log(doc.data())
                    console.log(doc.id)

                    if (doc===null){
                        console.log(util.inspect(doc));
                        return null;
                    }

                    if (doc.data().cycle===null){
                        
                        console.log('null doc');
                        return null;
                    }
                    console.log((doc.data().cycle * paymentThr) - (currentTime - doc.data().firstOpenTime))
                    console.log((doc.data().elapsedTime + (currentTime - doc.data().lastCheckpoint)))

                    //check if the user has been register more than the cycle of payment or if the elapsed time is greater than the payment threshold
                    if (((doc.data().cycle * paymentThr) - (currentTime - doc.data().firstOpenTime) <= 0) || (doc.data().elapsedTime + (currentTime - doc.data().lastCheckpoint) >= paymentThr)) {

                        //if the elapsed time is greater than the paymentThr we incentivize the paymentThr and the remaining time is updated to the elapsedTime
                        if (doc.data().elapsedTime + (currentTime - doc.data().lastCheckpoint) >= paymentThr){
                            elapsedPaid = paymentThr;
                            newElapsedTime = doc.data().elapsedTime + (currentTime - doc.data().lastCheckpoint) - paymentThr;
                        }
                        //if the the user has been register more than the cycle of payment, check if inactive and pay whatever time was in the user_timer
                        else {
                            if ( ! doc.data().active){
                                elapsedPaid = doc.data().elapsedTime;   
                            }
                            //If user is active, check if the last cron was before the last time active and pay the time between the last time active to the current
                            // time + the elapsedTime
                            else{
                                if (doc.data().lastCheckpoint <= doc.data().lastTimeActive){
                                    elapsedPaid = doc.data().elapsedTime + (currentTime - doc.data().lastTimeActive)
                                }
                                //Otherwise pay the elapsed time + the time between the current cron and the last cron (checkpoint)
                                else {
                                    elapsedPaid = doc.data().elapsedTime + (currentTime - doc.data().lastCheckpoint)
                                }  
                            }
                            //initialize the new elapsed time to zero for the next cycle.
                            newElapsedTime = 0;
                            
                        }
                        //Adding an if for elapsedPaid < = minimum payment per cycle,
                         if  (elapsedPaid <  minPayment){
                             db.collection('user_timers').doc(doc.id).update({
                                    elapsedTime: elapsedPaid,
                                    lastCheckpoint: currentTime

                            });
                            //res.status(200).send("OK")
                        }
                        //If the elapsed time is larger add a new document in cron_transaction to submit the payment:
                        else {
                            db.collection('cron_transaction').add({

                                event:'cron', 
                                //imei: doc.data().imei,
                                time_elapsed: Math.round((elapsedPaid/60000) * 100) / 100  , //Sending the value to the cron_transaction in minutes
                                status: 'pending',
                                time: FieldValue.serverTimestamp(),
                                user_id: doc.id,
                                tx_core_doc_id: 0
                            })
                            //Then update the timers of this user:
                            .then(() => {
                                var array = doc.data().timePaidArr;
                                console.log(`this is the array: ${array}`)

                                db.collection('user_timers').doc(doc.id).update({

                                    elapsedTime: newElapsedTime, 
                                    timePaidArr: array.push(elapsedPaid), 
                                    cycle: doc.data().cycle + 1,
                                    lastCheckpoint: currentTime
                                });
                                //res.status(200).send("OK")


                            })
                            .catch( err => {
                                console.log(err);
                                res.send('error')
                            });
                        }
                    }
                    //If the user has been elapsed or registered (firstTimeOpen) for a period of time less than the threshold,
                    //do not generate the payment and just update the timers:
                    else {
                        if (doc.active){

                            if (doc.data().lastCheckpoint <= doc.data().lastTimeActive){
                                newElapsedTime = doc.data().elapsedTime + (currentTime - doc.data().lastTimeActive)

                            }
                            else {
                                newElapsedTime = doc.data().elapsedTime + (currentTime - doc.data().lastCheckpoint)
                            }
                            
                            db.collection('user_timers').doc(doc.id).update({
                                elapsedTime: newElapsedTime,
                                lastCheckpoint: currentTime
                                
                            })

                        }
                    }
                });
            })
            .then(() =>{
                res.status(200).send("OK");
            })
            .catch(err => {
                console.log('Error getting documents', err);
                res.send(err)
            });

    });
