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
        const paymentThr = 5 * 60 * 1000; //5 min days 
        const cronRunFreq = 1 * 60 * 1000; //TODO: Currently set each Every 5 min> set tthis up to the real value.
        var elapsedPaid = 0;
        var newElapsedTime = 0;
        var minPayment = 1 * 60 * 1000;
        var elapsedPaid = 0;

        //TODO: set a minimum of payment per cycle.

        db.collection('user_timers').get()
            .then(snapshot => {
                console.log(util.inspect(snapshot))
                if (snapshot === null){
                    console.log(snapshot);
                }
                snapshot.forEach(doc =>{

                    console.log(doc.data())

                    if (doc===null){
                        console.log(util.inspect(doc));
                    }

                    if (doc.data().cycle===null){
                        
                        console.log('null doc');
                    }
                    
                    if (((doc.data().cycle * paymentThr) - (currentTime - doc.data().firstOpenTime) <= 0) || (doc.data().elapsedTime + (currentTime - doc.data().lastCheckpoint) >= paymentThr)) {

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
                        //Adding an if for elapsedPaid < = minimum payment per cycle,
                         if  (elapsedPaid <  minPayment){
                             db.collection('user_timers').doc(doc.id).update({
                                    elapsedTime: elapsedPaid,
                                    lastCheckpoint: currentTime

                            });
                            //res.status(200).send("OK")
                        }
                        //
                        
                        db.collection('cron_transaction').add({
                            event:'cron', 
                            imei: doc.data().imei,
                            time_elapsed: Math.round((elapsedPaid/60000) * 100) / 100  , //Sending the value to the cron_transaction in hours
                            status: 'pending',
                            time: FieldValue.serverTimestamp(),
                            user_id: doc.id,
                            tx_core_doc_id: 0
                        })
                        .then(() => {
                            db.collection('user_timers')
                            .doc(doc.id).update({
                                elapsedTime: newElapsedTime, 
                                timePaidArr: doc.data().timePaidArr.push(elapsedPaid), 
                                cycle: doc.data().cycle + 1,
                                lastCheckpoint: currentTime
                            });
                            //res.status(200).send("OK")


                        })
                        .catch( err => {
                            console.log(err);
                            res.send("error 103")
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
                            
                            db.collection('user_timers').doc(doc.id).update({
                                elapsedTime: newElapsedTime,
                                lastCheckpoint: currentTime
                                
                            });
                            //res.status(200).send("OK")

                            // .then(() => {
                            //     res.status(200).send("OK");
                            // })
                            //.catch( err => {
                                //console.log(err);
                                //res.send('error 130')
                                //TODO:CHeck how to handle this error (fail state?)
                            //});
                        }
                        //else {res.status(200).send("OK")}
                    }
                });
            })
            .then(() =>{
                res.status(200).send("OK");
            })
            .catch(err => {
                console.log('Error getting documents', err);
                res.send("error 143")
            });

    });
