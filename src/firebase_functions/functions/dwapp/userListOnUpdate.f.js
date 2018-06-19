const functions = require('firebase-functions');
const admin = require('firebase-admin');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

const dwapp = require('./dwapp');

exports = module.exports = functions.firestore
    .document('DWAPP_user_list/{docId}')
    .onUpdate((change, context) => {
        const before = change.before.data();
        const after = change.after.data();

        return dwapp.onUpdate(before, after);
    });
