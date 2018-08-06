const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('util');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore({timestampsInSnapshots: true});
var FieldValue = admin.firestore.FieldValue;

// Promises to run once a day. No guarentees on when.
exports = module.exports = functions.pubsub.topic('tick-daily').onPublish((message, event) => {
    var todo = [];

    // DW-specific: Job that monitors adherence incentives
    todo.push(db.collection('OINK_user_list').get()
        .then(docs => {
            var writes = [];

            docs.forEach(doc => {
                const data = doc.data();
                var to_update = {};

                /*

                Ideally eventually something of this ilk here that's monitoring actual
                compliance.

                if (data.incentivized && data.active) {
                    if (data.incentivized_days == undefined) {
                        data.incentivized_days = 0;
                    }
                    to_update.incentivized_days = data.incentivized_days + 1;
                }

                if (data.incentivized && data.powerwatch) {
                    if (data.powerwatch_days == undefined) {
                        data.powerwatch_days = 0;
                    }
                    to_update.powerwatch_days = data.powerwatch_days + 1;
                }
                */

                const now = admin.firestore.Timestamp.now().toMillis();

                // For now, just do math and update days:
                if (data.incentivized && data.active) {
                    const then = data.dwapp_install_time.toMillis();
                    const diff = now - data.dwapp_install_time;
                    const days = diff / (1000 * 60 * 60 * 24);
                    to_update.incentivized_days = days;
                }
                if (data.incentivized && data.powerwatch) {
                    const diff = now - data.dwapp_install_time.toMillis();
                    const days = diff / (1000 * 60 * 60 * 24);
                    to_update.powerwatch_days = days;
                }

                if (Object.keys(to_update).length > 0) {
                    writes.push(doc.ref.update(to_update));
                }
            });

            return Promise.all(writes);
        })
    );

    return Promise.all(todo);
});

