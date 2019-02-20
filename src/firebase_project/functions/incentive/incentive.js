const admin = require('firebase-admin');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

// Handle the logic of creating a specific incentive, including de-dup checking
//
// Returns a promise chain to run
function incentivize_once(user_id, phone_number, network, timestamp, incentive, amount) {
    console.log(`'user_id ${user_id} just marked as eligible for ${incentive}'`);

    const stimulus_collection = 'OINK_stimulus';

    var doc_name = user_id + '-' + phone_number + '-' + network + '-' + incentive;

    // Check if this user has been incentivized for this before
    return db.collection(stimulus_collection).doc(doc_name).get().then(doc => {
        if (!doc.exists) {
            console.log(`'No ${stimulus_collection} for ${user_id}. Incentivizing.'`);


            return db.collection(stimulus_collection).doc(doc_name).set({
                user_id: user_id,
                amount: amount,
                timestamp: timestamp,
                incentive: incentive
            })
                .catch(err => {
                    console.error(`'Error adding document to ${stimulus_collection}'`, err);
                });

        } else {
            // If the document exists, the user was already paid so return nothing.
            console.log(`'user_id ${user_id} already in ${stimulus_collection}:'`, doc.data());
            return null;
        }
    }).catch(err => {
        console.error(`'Error looking up previous ${incentive} for user.'`, err);
    })
}

module.exports.incentivize_once = incentivize_once;
