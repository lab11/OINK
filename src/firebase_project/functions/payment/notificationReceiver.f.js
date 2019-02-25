const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('util');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

exports = module.exports = functions.https
    .onRequest((req, res) => {
        //Log the payments new status I suppose?? I don't really know how the
        //callback will work
        console.log(req)
        console.log(res)
});
