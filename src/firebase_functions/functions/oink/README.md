Oink
====

The heart of Oink, these are responsible for accepting incentivication
requests, disbursing them to appropriate payment services, monitoring that they
eventually success (or alerting failure), and propogating success back.


core1
-----

### Configuration

  - `general.region` - The region assigned to the firebase project (e.g 'us-central1')
  - `general.project` - The canonical project name inside firebase (the
                        weird-ish string beneath the project name (though you
                        can rename it in firebase to something recognizable))

### `onWrite(OINK_tx_core_payment)`

This record holds the state of the current transaction. Other services create
payment documents to kick off transactions.  Oink expects payment APIs to be
asynchronous, and will mark a payment as successful in the tx layer once it has
been handed off to the payment procesor.

Expects

    user_id             // Opaque user_id handle.
    amount              // The amount to pay as incentive.
    stimulus_collection // The collection name of the stimulus that initiated this transaction.
    stimulus_doc_id     // The `id` of the document that triggered this transaction.

Optional

    status              // Callers may set this field to `'starting'` to immediately trigger payment.

Internal

    status              // The current status of this payment initialization record.
    num_attempts        // The number of attempts for this payment.
    messages            // A collection of diagnostic messages over the life of this record.


core2
-----

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
