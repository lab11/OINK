# About OINK

This is a young project, just getting started. Please bear with us as
many areas are likely incomplete!

## Getting Started

This is a conceptual overview of OINK:

![OINK Overview Diagram](/img/overview.png)

There are a few key pieces of terminology to understand for OINK:

- **`user_id`** Every incentivized user must have a unique ID. This ID must
  never change and must correspond to exactly one study participant. The ID may
  be anything (number, name, etc), but it _must_ be unique.

- **Databases.** Your OINK project may create any number of databases with any
  information in them. Getting information into OINK databases is currently
  custom for each project.

   - **`OINK_user_list`** This special database must exist for every OINK
     project. Each record is the `user_id` of a study particpant, and holds
     information such as how to pay the user. Projects may store additional
     information in this database as well.

- **Trigger.** A trigger is a rule that monitors the OINK databases for changes
  and runs when their conditions are true. Generally, a trigger will create a
  stimulus, however there may be other uses for triggers, such as monitoring for
  unexpected errors (e.g. a user drops out) and sending e-mail notificaitons.

- **Stimulus.** A stimulus record corresponds to an experimental stimulus.
  These serve as the authoritative record that a user has been incentivized for
  something. _Every stimulus record must be unique_. For recurring stimuli
  (e.g. incentivize every 30 days a user adheres to protocol), a new stimulus
  record for each stimulus event must be created (e.g. user1-day30, user1-day60).
  Generally, a stimulus will create a payment record.

- **Payment.** A payment record corresponds to an attempt to disburse a payment.
  Payment records include a reference to a payment engine (i.e. how to actually
  send this payment to a user: Korba, Venmo, etc). Payments can take some time,
  may sometimes undergo transient failures (e.g. the payment processor is down
  for maintenance), or otherwise require multiple steps. The payment core is
  responsible for hiding these details, eventually reporting back to the
  stimulus whether the disbursement succeeded or failed.
