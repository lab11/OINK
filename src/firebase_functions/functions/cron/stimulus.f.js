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
        const lastHalfDay = currentTime - 43200000
    
        return db.collection('user_activity').orderBy('timestamp').startAt(lastHalfDay).get() //TODO: Need to add the startAt() part
                .then(snapshot => {
                    snapshot.forEach(doc => {
                        console.log(doc.id, '=>', doc.data());
                    });
                })
                .then(() => {
                    res.status(200).send("OK");
                })
                .catch(err =>{
                    console.log('Error getting the documents', err);
                });

    });
