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
        var elapsedPaid = 0;
        var newElapsedTime = 0;

        //TODO: set a minimum of payment per cycle.

        return db.collection('user_timers').get()
            .then(snapshot => {
                snapshot.forEach(doc =>{

                    if (((doc.data().cycle * paymentThr) - (currentTime - doc.data().firstOpenTime) <= 0) || (doc.data().elapsedTime >= paymentThr)) {

                        if (doc.data().elapsedTime >= paymentThr){
                            elapsedPaid = paymentThr
                            newElapsedTime = doc.data().elapsedTime - paymentThr
                        }
                        else {
                            elapsedPaid = doc.data().elapsedTime
                        }

                        return db.collection('cron_transaction').add({
                            event:'cron', 
                            imei: doc.data().imei,
                            time_elapsed: elapsedPaid, //TODO: set this in hours
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
                                cycle: doc.data().cycle + 1
                            });


                        })
                        .catch( err => {
                            console.log(err);
                        });
                    }

                    else if (doc.active == true) {
                        newElapsedTime = doc.data().elapsedTime + (currentTime - doc.data().lastTimeActive)
                        return db.collection('user_timers').doc(doc.id).update({
                            elapsedTime: newElapsedTime,
                            cycle: doc.data().cycle + 1
                        })
                        .then(() => {
                            res.status(200).send("OK");
                        })
                        .catch( err => {
                            console.log(err);
                        });
                    }
                });
            });

    });
