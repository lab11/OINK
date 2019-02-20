const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('util');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

exports = module.exports = functions.analytics.event('app_remove').onLog(event => {
    console.log(util.inspect(event));

    //This could probably update a user with uninstall time, unless
    //instead we use the app remove table to do that

    const s = util.inspect(event, {depth: null});
    const user_id = event.user.userId;

    return db.collection('OINK_app_remove').add({
        user_id: user_id,
        full_json: s,
    });
});
