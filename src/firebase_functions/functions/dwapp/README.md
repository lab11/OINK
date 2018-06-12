DW App Inputs
=============

This family of functions act as validators and pass throughs.

The phone app can only write to collections handled here. This folder acts then
as a single entry point to OINK records from external sources.


handleUserList
--------------

### `onWrite(DWAPP_user_list)`
Expects

    const user_id = newValue.id;                        // Opaque, consistent id from all records from the phone
    const timestamp = newValue.timestamp;               // Timestamp of this record on the phone
    const fcm_token = newValue.token;                   // Firebase cloud messaging token
    const payment_service = newValue.payment_service;   // The payment service requested by the user
                                                        // In the future custom payments may change parameters
    const phone_number = newValue.customer_number;      // The network phone number
    const phone_imei = newValue.imei;                   // The IMEI of the phone if we can get it
    const phone_carrier = newValue.network_code;        // The carrier / network operator (e.g. MTN, Tigo)

First, check if the `user_id` exists. If so, update the `OINK_user_list` record
to mark the user as `active` and update the `fcm_token` if a new one is provided.
Phones cannot modify any other records. If the `user_id` does not exist, create
a document with id `user_id` in `OINK_user_list` for this user.


handleInviteTransaction
-----------------------

### `onCreate(DWAPP_invite_transaction)`
Expects

    const invite_ids = newValue.invite_ids;     // ','-separated array of invite tokens
    const time = newValue.time;                 // timestamp on phone of event
    const phone_num = newValue.phone_num;       // phone number to incentivize
    const carrier = newValue.carrier;           // carrier of the phone holder to incentivize
    const imei = newValue.imei;                 // IMEI of the phone if available
    const user_id = newValue.user_id;           // user id assigned during firstOpen

For each invite in the `invite_ids` array, check if the id already exists in
`OINK_invite_transaction`. If not, creates a document in `OINK_invite_transaction`
with id of the `invite_id` for each id.


handleWatchEvent
----------------

### `onCreate(DWAPP_watch_event)`

Expects

    TODO

Currently, we are simply recording these events. Every field listed above will
be copied over from the realtime table to a firebase collection verbatim. Only
creation of new records is permitted.
