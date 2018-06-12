First Open
==========

This module is responsible for handling any special behavior related to users
first opening the app.


checker
-------

### Configuration

  - `incentives.firstopen.amount` - The amount to give a user for first opening the app.

### `onWrite(OINK_user_list)`

We are only interested in incentivized users. Users may be incentivized on
creation or may later be updated to be incentivized. This method monitors
creations and updates to the user list to catch when a user becomes
incentivized.

For newly incentivized users, check that whether they have previously been
incentivized. If not, the create a `OINK_firstOpen_transaction` for them,
which will kick off the payment process.


stimulus
--------

### `onCreate(OINK_firstOpen_transaction)`

Expects:

    timestamp: numeric  // When this transaction was initiated
    amount: numeric     // Amount to incentivize
    user_id: string     // Who to incentivize

Given a new incentive, look up the user details and kick off a payment in the
core by filling out a new document in `OINK_tx_core_payment`.

Also sends an alarm indicating a `firstOpen` incentive payment has been
initialized.
