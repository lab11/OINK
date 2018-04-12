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

//stimulus_cron funtion:
// - Triggers on creation of cron_transaction events. Checks if totalPaidDuration is below the threshold. If so, calculate the amount to be paid and enqueue the transaction
//   to tx_core_payment collection. Otherwise, sets status of the cron_transaction doc to "restricted". If this function fails to perform any of these tasks, throw an error and
//   update the cron_transaction status to "failed".

// - Parameters:
//    * threshold: Max time_elapsed that an user can get paid for. 
//    * costHourElapsed: The value per hour elapsed to  to be paid.
//    * event: Event that triggered the function. In this case this is the new document created by the App. It has many parameter including the doc_id and the fields of each document.

exports = module.exports = functions.firestore
    .document('cron_transaction/{docId}').onCreate((snap, context) =>{
        //Getting the data that was modified and initializing all the parameters for payment.
        const data = snap.data();
        const docId = context.params.docId;
        const threshold = 1440000;// 24 hours, milisecs //TODO:For how much time in total do we want to run this incentive? 3,6 months, a year?
        var totalPaidDuration = 0; //Total elapsed time paid in the collection.
        var totalFailedDuration = 0; //total elapsed time to be paid that failed during the transaction.
        const costHourElapsed = 1;

        console.log(`The onCreate event document is: ${util.inspect(data)}`);
        console.log(`The docId of the creation was: ${util.inspect(docId)}`);

        return db.collection('cron_transaction').where('user_id','==', data.user_id).get() //We need to sum over non-failed transaction.
                .then(snapshot => {
                        //Calculating the total elapsed time that the specific user has been using the app.
                        return snapshot.forEach(doc => {
                                    totalPaidDuration += doc.data().time_elapsed;
                                });
                    
                }).then(() => {
                    //Calculating the total elapsed time in status "failed"
                    return db.collection('cron_transaction').where('user_id','==', data.user_id).where('status','==','failed').get() // Calculating the num. of failed transactions.
                            .then(snapshot => {
                                return snapshot.forEach(doc => {
                                totalFailedDuration += doc.data().time_elapsed;
                                });
                            });

                }).then(() => {
                    //Calculating the number of invites available to redeem:
                    console.log(`Total elapsed time before failed state: ${totalPaidDuration}`);
                    console.log(`Total elapsed time in fail state: ${totalFailedDuration}`);
                    totalPaidDuration = totalPaidDuration - totalFailedDuration;
                    console.log(`Total elapsed time paid: ${totalPaidDuration}`)

                    //Verifying if the number of invites is less than threshold:
                    if (totalPaidDuration <= threshold) {
                        return db.collection('cron_transaction')
                            .doc(docId).update({valid_time_elapsed: data.time_elapsed, status:'enqueued'})
                            .then(() => {
                                //Calculating the amount to pay and write on tx_core_payment collection
                                var toPay = data.time_elapsed * costHourElapsed;
                                toPay = Math.round(toPay * 100) / 100
                                return db.collection('tx_core_payment').add({
                                    user_id: data.user_id,
                                    amount: toPay,
                                    msgs: [],
                                    num_attempts: 0,
                                    time: FieldValue.serverTimestamp(),
                                    type: 'cron',
                                    stimulus_doc_id: docId,
                                    status: 'pending',
                                    reattempt: false
                                    
                                });

                            }).then(ref => {
                                return console.log('Added document with ID: ', ref.id);
                            }).catch(err => {
                                console.log('Error getting docs in cron under threshold', err);
                                return db.collection('cron_transaction').doc(docId).update({status:'failed'});
                            });
                                
                    //if total elapsed time is bigger than threshold, calculate how many of them can be redeemed:
                    } else{
                        var validElapsedTime = threshold - (totalPaidDuration - data.time_elapsed)
                        console.log(`valid time elapsed: ${validElapsedTime}`);
                        if (validElapsedTime <= 0){
                            return db.collection('cron_transaction').doc(docId).update({valid_time_elapsed: 0, status:'restricted'})
                            .then(() => {
                                return console.log(`User ${data.user_id} exceeded the quota of elapsed time.`);
                                //TODO: we can also think of triggering an alarm here.

                            }).catch(err => {
                                console.log('Error getting docs in cron for exceeded quota', err);
                                return db.collection('cron_transaction').doc(docId).update({status:'failed'});
                            });

                        } else {
                            return db.collection('cron_transaction')
                            .doc(docId).update({valid_time_elapsed: validElapsedTime, status: 'enqueued'})
                            .then(() => {
                                var toPay = validElapsedTime * costHourElapsed;
                                toPay = Math.round(toPay * 100) / 100
                                return db.collection('tx_core_payment').add({
                                    user_id: data.user_id,
                                    amount: toPay,
                                    msgs: [],
                                    num_attempts: 0,
                                    time: FieldValue.serverTimestamp(),
                                    type: 'cron',
                                    stimulus_doc_id: docId,
                                    status: 'pending',
                                    reattempt: false
                                    
                                });

                            }).then(ref => {
                                return console.log('Added document with ID: ', ref.id);
                            }).catch(err => {
                                console.log('Error getting docs in cron for exceeded quota > 0', err);
                                return db.collection('cron_transaction').doc(docId).update({status:'failed'});

                            });

                        }
                    }
                }).catch(err => {
                    console.log('Error getting documents', err);
                    return db.collection('cron_transaction').doc(docId).update({status:'failed'});
                    
                });
                  
});

