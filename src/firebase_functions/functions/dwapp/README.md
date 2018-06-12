DW App Inputs
=============

This family of functions act as validators and pass throughs.

The phone app can only write to collections handled here. This folder acts then
as a single entry point to OINK records from external sources.


Firestore Methods
=================

These are the originally planned touch points to the app. While it is still
valid for an app to use these directly, to lower the Google Play Services
version required, the app is currently configured to write to the realtime
database instead of using firestore directly. Hooks in the folder will grab
each realtime database record and push them into the originally planned
firestore records.


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


Realtime Database Methods
=========================

rtHandleUserListCreate
----------------------

### `onCreate(/dwapp/user_list_create)`
Expects

    user_id             // Opaque, consistent id from all records from the phone
    timestamp           // Timestamp of this record on the phone
    payment_service     // The payment service requested by the user
                        // In the future custom payments may change parameters
    phone_number        // The network phone number
    phone_imei          // The IMEI of the phone if we can get it
    phone_carrier       // The carrier / network operator (e.g. MTN, Tigo)

Effects

  - Creates an entry in `DWAPP_user_list` in firestore


rtHandleUserListUpdate
----------------------

### `onCreate(/dwapp/user_list_update)`
Expects

    user_id             // Opaque, consistent id from all records from the phone
    timestamp           // Timestamp of generating this record on the phone
    fcm_token           // A new FCM token value

Effects

  - Updates an entry in `DWAPP_user_list` in firestore

rtHandleInviteTransaction
-------------------------

### `onCreate(/dwapp/invite_transaction_create)`
Expects

    user_id             // user id assigned during firstOpen
    timestamp           // timestamp on phone of event
    invite_ids          // ','-separated array of invite tokens
    phone_number        // phone number to incentivize
    phone_carrier       // carrier of the phone holder to incentivize
    phone_imei          // IMEI of the phone if available

Effects

  - Creates an entry in `DWAPP_invite_transaction` in firestore


rtHandleWatchEvent
------------------

### `onCreate(/dwapp/watch_event_create)`
Expects

    TODO

Effects

  - Creates an entry in `DWAPP_watch_event` in firestore
