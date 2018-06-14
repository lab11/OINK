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
    stimulus_doc_id     // The `id` of the document that triggered this transaction.
    type                // What initiated this payment. A `OINK_${type}_transaction`
                        // collection must exist. The `status` record of the document
                        // with the `stimulus_doc_id` in that collection will be updated.
    amount              // The amount to pay as incentive.

Optional

    status              // Callers may set this field to `'starting'` to immediately trigger payment.

Internal

    status              // The current status of this payment initialization record.
    num_attempts        // The number of attempts for this payment.
    messages            // A collection of diagnostic messages over the life of this record.
