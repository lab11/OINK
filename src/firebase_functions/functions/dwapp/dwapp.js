const admin = require('firebase-admin');
const util = require('util');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

function normalize(number) {
    // Normalize phone numbers
    // TODO: This is very DumsorWatch-specific
    var phone_number = number;
    console.log('Customer number before anything: ' + phone_number);
    phone_number = phone_number.replace(/ /g,'');
    console.log('Space stripped: ' + phone_number);
    if (phone_number.slice(0,4) == '+233') {
        phone_number = phone_number.slice(4);
    }
    if ((phone_number.length > 9) && (phone_number.slice(0,3) == '233')) {
        phone_number = phone_number.slice(3);
    }
    if (phone_number.length < 9) {
        console.error('Phone number too short: ' + phone_number);
        return db.collection('OINK_alarms_db').add({
            timestamp: new Date().getTime(),
            reason: `Impossibly short phone number: "${phone_number}"`,
        });
    }
    if (phone_number.length == 9) {
        // Many people don't include the leading 0 when reporting their number,
        // but a complete number is 10 digits long.
        phone_number = '0' + phone_number;
    }
    console.log(`'Phone number after normalization: ${phone_number}'`);
    return phone_number;
}

function update_error(why, before, afterCopy, after) {
    const b = util.inspect(before);
    const a = util.inspect(afterCopy);
    console.error(`Attempt to update an illegal key. ${b} -> ${a}`);
    return db.collection('OINK_alarms_manual').doc().set({
        reason: `Attempt to update an illegal key. First differing key: ${why}`,
        timestamp: FieldValue.serverTimestamp(),
        before: before,
        afterCopy: afterCopy,
        after: after,
    });
}

function onUpdate(before, after) {
    // The goal here is to decide whether the updates to the DWAPP table should
    // be propogated to the OINK user table.
    //
    // The approach will be to consider each known key, and delete them from
    // the after record. If the record isn't empty at the end, then something
    // has gone awry.

    var for_oink = {};

    // Shallow copy fine for this task as we're only deleting basic types
    let afterCopy = Object.assign({}, after);

    if (after.fcm_token != undefined) {
        if (before.fcm_token != after.fcm_token) {
            for_oink.fcm_token = after.fcm_token;
        }
        delete after.fcm_token;
    }

    if (after.payment_service != undefined) {
        if (before.payment_service != after.payment_service) {
            for_oink.payment_service = after.payment_service;
        }
        delete after.payment_service;
    }

    if (after.phone_carrier != undefined) {
        if (before.phone_carrier != after.phone_carrier) {
            for_oink.phone_carrier = after.phone_carrier;
        }
        delete after.phone_carrier;
    }

    if (after.phone_imei != undefined) {
        if (before.phone_imei == undefined) {
            // Allowed to add imei if missing
            for_oink.phone_imei = after.phone_imei;
        } else if (before.phone_imei != after.phone_imei) {
            return update_error('phone_imei', before, afterCopy, after);
        }
        delete after.phone_imei;
    }

    if (after.phone_number != undefined) {
        if (before.phone_number != after.phone_number) {
            return update_error('phone_number', before, afterCopy, after);
        }
        delete after.phone_number;
    }

    if (after.timestamp != undefined) {
        for_oink.last_timestamp = after.timestamp;
        delete after.timestamp;
    }

    if (after.user_id != undefined) {
        if (before.user_id != after.user_id) {
            return update_error('user_id', before, afterCopy, after);
        }
        delete after.user_id;
    }

    // Now verify there's nothing left that's changed
    // https://stackoverflow.com/questions/679915/how-do-i-test-for-an-empty-javascript-object
    if (! (Object.keys(after).length === 0 && after.constructor === Object) ) {
        return update_error('Leftover Keys!', before, afterCopy, after);
    }

    // If we've never seen anything from the app before, mark this as the install time
    if (before.dwapp_install_time == undefined) {
        for_oink.dwapp_install_time = FieldValue.serverTimestamp();
    }

    // Good to go, let's update the real record.
    return db.collection('OINK_user_list').doc(before.user_id).update(for_oink);
}

module.exports.normalize = normalize;
module.exports.onUpdate = onUpdate;
