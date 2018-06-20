Ticks
=====

Ticks are functions that are triggered periodically. Ticks work with the
[appengine cron job](../../../appengine/cron/) to fire at pre-set intervals.

Each cron entry publishes to a stream `tick-TYPE` where `TYPE` corresponds to a
file here that is triggered.


tick-payment
------------

This task is responsible for scanning the `OINK_payment_tx` table and
converting any entries with `status: 'waiting'` to `status: 'starting'`, which
will cause the core to attempt to initiate a payment.


tick-daily
----------

This task runs daily and performs any daily maintenance tasks. Currently:

  - User long-term incentives:
    - Increment `incentivized_days` if user still `incentived` and `active`
    - Increment `powerwatch_days` if user still `incentives` and `powerwatch`


tick-periodic
-------------

This task runs periodically, for some reasonable definition of periodic
(currently every 5 minutes in practice). Currently:

  - Scan `pending` payments and possibly time them out
