Stimulus
========

Stimulus records record disburment of stimuli. The creation of a stimulus
triggers an underlying payment to occur.

Every stimulus record corresponds to exactly one underlying payment
transaction. Recurring stimuli (e.g. compliance events) must create a new
record for each individual stimulus event.


onCreate
--------

### Expects

    user_id     // Opaque user id
    amount      // The amount to pay

### Effects

  - Validates inputs, then
     - Updates the current record to `status: 'pending'`
     - Creates a `OINK_payment_tx` record for this transaction
     - Triggers an alarm to indicate that a stimulus is occuring


onUpdate
--------

TODO: Think about where `notify` check should occur: Part of the stimulus
record as now, a user property? Both?

  - if status is newly `'complete'`
     - Notify user if requested
  - if status is newly `'failed'` generate an alarm
