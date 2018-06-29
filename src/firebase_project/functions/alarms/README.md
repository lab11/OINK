Alarms
======

This module is responsible for generating alerts external to the OINK cloud
infrastructure.

Currently, there is simply one email method.


mail
----

### Configuration

_Note:_ Currently, this assumes sending from GMail and requires some extra
configuration. See the comments in the function source for more details.

  - `notifications.email` - The email account to send **from**
  - `notifications.pwd` - The password for the email account used to send from
  - `general.name` - The human name of this application (e.g. DumsorWatch)

### `onCreate(OINK_alarms_db)`

Generates an email any time a record here is written. If any of the following
fields are included they will be added to the email:

  - `type` - Expects one of 'error' or 'notification' presently
  - `timestamp` - When the event triggering the email was created
  - `reason` - General string appended to the email
  - `user_id` - If there's a specific user associated with this alert
  - `tx_core_doc_id` - If there's a record from the transaction core


manual
------

This collection is intended to act as a todo list. It's very free-form and
serves as a catch-all for problems that are not programmatically addressed.
Records added will automatically trigger an email. Users should clear records
from this table as they are resolved.
