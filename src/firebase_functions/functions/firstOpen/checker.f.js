const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('util');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

// Configuration
INCENTIVE_FIRSTOPEN_AMOUNT = functions.config().incentives.firstopen.amount;

exports = module.exports = functions.firestore
    .document('OINK_user_list/{user_id}')
    .onUpdate((change, context) => {
        // Don't care about delete events
        const before = change.before.exists;
        const after = change.after.exists;
        if (before === true && after === false) {
            return null;
        }

        const user_id = context.params.user_id
        const newValue = change.after.data();
        const previousValue = change.before.data();

        const currentTimestamp = new Date().getTime()

        // If the record did not change to becomes incentivized, or it is not incentivized, return
        if (newValue.incentivized == previousValue.incentivized || newValue.incentivized == false) {
            return null;
        }

        // Otherwise, check if this user has been incentivized for firstOpen before
        return db.collection('OINK_firstOpen_transaction').doc(user_id).get().then(doc => {
            // User never incentivized, create a transaction to kick off payment
            if (!doc.exists) {
                console.log('There is not first Open incentive log in firstOpen_transaction!');

                return db.collection('OINK_firstOpen_transaction').doc(user_id).set({
                    amount: INCENTIVE_FIRSTOPEN_AMOUNT,
                    timestamp: currentTimestamp,
                    user_id: user_id,
                })
                .catch(err => {
                    console.log('Error adding document to firstOpen_transaction', err);
                });

            // If the document exists, the user was already paid so return nothing.
            } else {
                console.log('Document data already in firstOpen_transaction:', doc.data());
                return null;
            }
          })
          .catch(err => {
                console.error('Error looking up previous firstOpen for user.', err);
          });
      });
