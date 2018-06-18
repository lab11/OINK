Payment
=======

Payment processing in Oink. These records correspond directly to actual
payments. They are responsible for monitoring the creation and eventual success
of payments via third party services and propogating back success or failure of
payments.

The architecture assumes asynchronous payment APIs. The `tx` component
initiates payments, and the `rx` records replies from payment APIs.


tx
--

This record holds the state of the current transaction. Other services create
payment documents to kick off transactions.  Oink expects payment APIs to be
asynchronous, and will mark a payment as successful in the tx layer once it has
been handed off to the payment procesor.

### Configuration

  - `general.region` - The region assigned to the firebase project (e.g 'us-central1')
  - `general.project` - The canonical project name inside firebase (the
                        weird-ish string beneath the project name (though you
                        can rename it in firebase to something recognizable))

### `onCreate(OINK_payment_tx)`

This method validates inputs and add additional information to the record for
internal state tracking. Creation is the public-facing API of payments.

Expects

    user_id             // Opaque user_id handle.
    amount              // The amount to pay as incentive.
    stimulus_collection // The collection name of the stimulus that initiated this transaction.
    stimulus_doc_id     // The `id` of the document that triggered this transaction.

Optional

    status              // Callers may set this field to `'starting'` to immediately trigger payment.


### `onUpdate(OINK_payment_tx)`

This method handles the work of payments as a state machine. Its operation is
opaque. External services should generally not update payment records, except
to possibly retry a `status == 'failed'` transaction.

Internal

    status              // The current status of this payment initialization record.
    num_attempts        // The number of attempts for this payment.
    messages            // A collection of diagnostic messages over the life of this record.


rx
--

TODO: This part of the infrastructure is perhaps too Korba-specific right now.
There should probably be a generic listener frontend that's payment-specific
that writes a `rx_core_payment` record that then triggers core2 to run.

### `https listener`

TODO: Old text:

 - Triggers on a callback from Korba API which sends a get request to the URL of Core2.
 - The get request contains the transaction ID, status ("SUCCESS/FAILED") an a message about the transaction.
 - Using the transaction ID, we are able to trace the transaction. This function logs on `rx_core_payment`
   the result of the transaction, if successful sends notification to user, otherwise sends an alarm to the
   system admin. This function also updates the `stimulus_transaction` and `tx_core_payment` status.
