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

exports = module.exports = functions.firestore
    .document('app_remove/{docId}').onCreate((snap, context)=>{
        const docId = context.params.docId
        const data = snap.data()
        const user_id = data.user_id
        const amount = data.amount
        const imei = data.imei
        const token = data.token
        const currentTimestamp = new Date().getTime()
        console.log(`The docId of the creation was: ${util.inspect(docId)}`)

        var user = db.collection('user_list').doc(user_id)

        return user.get().then((doc) => {
            console.log(`The doc of user_list is: ${util.inspect(doc)}`)
            if(doc.data().exists){
                return db.collection('user_list').doc(user_id).update({
                    active: false
                })
                .then(() => {
                    return db.collection('user_activity').add({
                        user_id: user_id,
                        active: false,
                        timestamp: currentTimestamp
                    })
                })
                
            } else {
                console.log('user does not exist...')
                return null;
            }
        })
    })