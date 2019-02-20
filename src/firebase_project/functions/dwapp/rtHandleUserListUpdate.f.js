const functions = require('firebase-functions');
const admin = require('firebase-admin');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

exports = module.exports = functions.database.ref('/dwapp/user_list_update/{pushId}')
    .onCreate((snapshot, context) => {
        // Grab the current value of what was written to the Realtime Database.
        
        //Again I really don't expect events in the real time database
        //to be impacting the user list at all
        
        //const data = snapshot.val();

        //console.log(data);

        //// Check if this user already exists
        //return db.collection('DWAPP_user_list').doc(data.user_id).get().then(doc => {
        //    if (doc.exists) {
        //        // Update all the fields DWAPP_user_list, the update handler
        //        // will validate that nothing meaningful changed
        //        return db.collection('DWAPP_user_list').doc(data.user_id).update(data);
        //    } else {
        //        console.error(`Attempt to update a user_id ${data.user_id}, but user does not exist!`);

        //        return db.collection('OINK_alarms_db').add({
        //            type: "error",
        //            user_id: data.user_id,
        //            reason: "Attempt to update a user that does not exist.",
        //        });
        //    }
        //});
    });

