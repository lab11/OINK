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


//stimulus_firstOpen funtion:

// Triggers upon app first open via first timestamp of account sign in. 
// Validates first log in by checking that account is never been opened before. 
// Calculates the amount to be paid to the user and enqueues transaction to tx_core_payment collection. 
// Otherwise, sets status of the firstOpen_transcation doc to "restricted".
// If fails, throws error and upadtes the status to "failed".

// - Parameters:

// * Validation bit: bit set to high if account has ever been longed in on device
// * costFirstOpen: The value paid 
// * event: Event that triggered the function. In this case this is the new document created by the App.
/*
exports = module.exports = functions.https.onRequest((request, response) => {
    response.send("Hello from Joe");
})

*/

exports = module.exports = functions.firestore
    .document('firstOpen_transaction/{docId}').onCreate((event)=>{
        const data = event.data.data()
        const docId = event.params.docId
        const costFirstOpen = 5
        let previouslyOpened =false;
        if(data.processed) {
            return
        }
        console.log(`The docId of the creation was: ${util.inspect(docId)}`)
        return db.collection('firstOpen_transaction').add({
            user_id: data.user_id,
            processed: true,
            amount: costFirstOpen,
            previouslyOpened: previouslyOpened,
            msgs: [],
            time_stimulus_added: data.time,
            time_processed: FieldValue.serverTimestamp(),
            type: "firstOpen",
            stimulus_doc_id: docId
        })
    })


/*
exports = module.exports = functions.firestore
    .document('firstOpen_transaction/{docId}').onCreate((event) =>{
        //Getting the data that was modified and initializing all the parameters for payment.
        const data = event.data.data();
        const docId = event.params.docId;
        const costFirstOpen = 5;
        var previouslyOpened = false;
        
        //console.log(`The onCreate event document is: ${util.inspect(data)}`);
        console.log(`The docId of the creation was: ${util.inspect(docId)}`);

        return db.collection('firstOpen_transaction').where('user_id','==', data.user_id).get()              
})
.then(() => {
return db.collection('tx_core_payment').add({
    user_id: data.user_id,
    amount: toPay,
    msgs: [],
    num_attempts: 0,
    time: FieldValue.serverTimestamp(),
    type: 'invite',
    stimulus_doc_id: docId,
    status: 'pending',
    reattempt: false
    
})
})
*/




//https://us-central1-paymenttoy.cloudfunctions.net/generatorsFirstOpen

//validation and build snapshot and amount copy and paste from invite function
//write to core 1 by checking fields core one uses and filling them in copy and paste invite function
// console.logs goes to function within console drop down
