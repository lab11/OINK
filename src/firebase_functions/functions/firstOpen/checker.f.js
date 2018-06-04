//import { currentId } from 'async_hooks';

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
firstOpenChecker function:
    - Function triggered on update of user_list document when the flag "incentivized" to true.
    - Writes on firstOpen_transaction collection to start processing the incentive.
    - Amount to be sent can be configured here.


*/
exports = module.exports = functions.firestore
    .document('user_list/{docId}')
    .onUpdate((change, context) => {
        // Get an object representing the document updated
        // e.g. {'name': 'Marie', 'age': 66}
        const docId = context.params.docId
        const newValue = change.after.data();
        // ...or the previous value before this update
        const previousValue = change.before.data();

        const costFirstOpen = 2 //TODO: Value in cedis, change to required value.
        const currentTimestamp = new Date().getTime()
  
        // perform desired operations ...
        //if the update wasn't in the incentivized flag or it is set to false do nothing and return.
        if (newValue.incentivized == previousValue.incentivized || newValue.incentivized == false) return null;

        //Otherwise, check if there is a previous transaction for this user using firstOpen:
        return db.collection('firstOpen_transaction').doc(docId).get()
        .then(doc => {
            //if document doesn't exist, go ahead and write on firstOpen transaction to trigger the firstOpenStimulus function
            if (!doc.exists) {
                console.log('There is not first Open incentive log in firstOpen_transaction!');
              
                return db.collection('firstOpen_transaction').add({
                    amount: costFirstOpen,
                    timestamp: currentTimestamp,
                    imei: newValue.imei,
                    user_id: docId,
                    token: newValue.token
                })
                .catch(err => {
                    console.log('Error adding document to firstOpen_transaction', err);
                });
                
            //If the document exists, the user was already paid and return nothing.
            } else {
                console.log('Document data:', doc.data());
                return null;
            }
          })
          .catch(err => {
                console.log('Error getting document', err);
          });
      
      });
