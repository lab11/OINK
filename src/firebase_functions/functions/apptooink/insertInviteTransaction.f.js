const functions = require('firebase-functions');
const admin = require('firebase-admin');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

exports = module.exports = functions.firestore
    .document('user_list/{docId}')
    .onUpdate((change, context) => {
        const docId = context.params.docId
        const newValue = change.after.data();
        const previousValue = change.before.data();

        // Records coming from the app
        const invite_ids = newValue.invite_ids;
        const time = newValue.time;
        const phone_num = newValue.phone_num;
        const carrier = newValue.carrier;
        const imei = newValue.imei;
        const user_id = newValue.user_id;

        // invite_ids are comma separated list of invites, convert multiple
        // invites into a single record per invite. Do not re-create new
        // records for repeat invites.
        const ids_array = invite_ids.split(',');
        for (var i=0; i < ids_array.length; i++) {
            // Strip whitespace
            ids_array[i] = ids_array[i].replace(/^\s*/, "").replace(/\s*$/, "");

            const id = ids_array[i];
            if (id.length > 0) {
                db.collection('OINK_invite_transaction').doc(id).get().then(doc => {
                    if (doc.exists) {
                        console.log('Repeat invite for ' + id);
                    } else {
                        console.log('New invite: ' + id);

                        db.collection('OINK_invite_transaction').add({
                            id: id,
                            timestamp: time,
                            phone_num: phone_num,
                            carrier: carrier,
                            imei: imei,
                            user_id: user_id,
                        });
                    }
                });
            }
        }
    });
