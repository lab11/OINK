const admin = require('firebase-admin');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

// Handle the logic of creating a specific incentive, including de-dup checking
//
// Returns a promise chain to run
function incentivize_once(user_id, timestamp, incentive, amount) {
    console.log(`'user_id ${user_id} just marked as eligible for ${incentive}'`);

    const stimulus_collection = 'OINK_stimulus_' + incentive;

    // Check if this user has been incentivized for this before
    return db.collection(stimulus_collection).doc(user_id).get().then(doc => {
        if (!doc.exists) {
            console.log(`'No ${stimulus_collection} for ${user_id}. Incentivizing.'`);

            return db.collection(stimulus_collection).doc(user_id).set({
                user_id: user_id,
                amount: amount,
                timestamp: timestamp,
            })
                .catch(err => {
                    console.error(`'Error adding document to ${stimulus_collection}'`, err);
                });

        } else {
            // If the document exists, the user was already paid so return nothing.
            console.log(`'user_id ${user_id} already in ${stimulus_collection}:'`, doc.data());
            return null;
        }
    })
        .catch(err => {
            console.error(`'Error looking up previous ${incentive} for user.'`, err);
        })
}

module.exports.incentivize_once = incentivize_once;
