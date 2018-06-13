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
        console.log('Phone number too short: ' + phone_number);
        return db.collection('OINK_alarms_db').add({
            timestamp: new Date().getTime(),
            reason: `'Impossibly short phone number: ${phone_number}'`,
        });
    }
    if (phone_number.length == 9) {
        phone_number = '0' + phone_number;
    }
    console.log(`'Phone number after normalization: ${phone_number}'`);
    return phone_number;
}

module.exports.normalize = normalize;
