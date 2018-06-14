Ticks
=====

Ticks are functions that are triggered periodically. Ticks work with the
[appengine cron job](../../../appengine/cron/) to fire at pre-set intervals.

Each cron entry publishes to a stream `tick-TYPE` where `TYPE` corresponds to a
file here that is triggered.


tick-payment
------------

This task is responsible for scanning the `OINK_tx_core_payment` table and
converting any entries with `status: 'waiting'` to `status: 'starting'`, which
will cause the core to attempt to initiate a payment.