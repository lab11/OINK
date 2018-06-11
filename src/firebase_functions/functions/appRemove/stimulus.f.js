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
stimulusAppRemove function:
- Triggers on creation of a new document in app_remove collection.
- If the user uninstalls the app, a document in app_remove collection should be created
- This function simply updates the active flag in user_list to false and logs the event in the user_activity collection.

- Parameters:
    * There are not specific parameters for this function.
*/

exports = module.exports = functions.firestore
    .document('OINK_app_remove/{docId}').onCreate((snap, context)=>{
        const docId = context.params.docId
        const data = snap.data()
        const user_id = data.user_id
        const amount = data.amount
        const imei = data.imei
        const token = data.token
        const currentTimestamp = new Date().getTime()
        console.log(`The docId of the creation was: ${util.inspect(docId)}`)

        var user = db.collection('OINK_user_list').doc(user_id)

        return user.update({active:false})
        .then(() => {
            return db.collection('OINK_user_activity').add({
                user_id: user_id,
                active: false,
                timestamp: currentTimestamp
            })
        })
        .catch(err => {
            console.log('Error getting document', err);
      });

    });
