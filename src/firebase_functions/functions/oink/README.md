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
payment documents (in the pending state) to kick off transactions. Oink expects
payment APIs to be asynchronous, and will mark a payment as successful in the
tx layer once it has been handed off the payment procesor.

Expects

    user_id             // Opaque user_id handle.
    stimulus_doc_id     // The `id` of the document that triggered this transaction.
    type                // What initiated this payment. A `OINK_${type}_transaction`
                        // collection must exist. The `status` record of the document
                        // with the `stimulus_doc_id` in that collection will be updated.
    amount              // The amount to pay as incentive.
    status              // Should be set to 'pending' <- TODO: Shouldn't require creators to handle this
    num_attempts        // Should be initialized to 0 <- TODO: Shouldn't require creators to handle this
    reattempt           // Should be set up as false  <- TODO: Shouldn't require creators to handle this
    msgs                // Should be set up as []     <- TODO: Shouldn't require creators to handle thisyyy
