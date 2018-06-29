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
var FieldValue = admin.firestore.Field

//Function logsRx:
//Triggers when a rx_core_payment doc changes. 
exports = module.exports = functions.firestore
    .document('CORE_rx_core_payment/{docId}').onUpdate((change, context) =>{
        //Getting the data that was modified and initializing all the parameters for payment.
        const data = change.after.data();
        const previousData = change.before.data();
        const docId = context.params.docId;
        
        //send the request to server to log the change
        return request({
            uri: 'http://graphs.grid.watch:3245',
     
            method: 'POST',
            headers:{
                'Content-Type':'application/json',
            },
            json: true,
            body: { 
                    collection: 'rx_core_payment',
                    transaction_id: data.transaction_id, 
                    type: data.type,
                    timestamp: new Date().getTime()
                },
            resolveWithFullResponse: true,
        }).then( response =>{
            if (response.statusCode >= 400) {
                console.log(`HTTP Error: ${response.statusCode}`);
            }
            console.log('Response body: ', response.body);
            console.log('Status code: ', response.statusCode);
        })
        .catch(err =>{
            console.log(err);
        })
        
});
