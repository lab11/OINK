Incentives
==========

This module is responsible for monitoring for incentivized behaviors and
creating stimulus records as appropriate.


userOnUpdate
------------

### Configuration

  - `incentives.firstopen.amount` - The amount to give a user for first opening the app.
  - `incentives.firstpowerwatch.amount` - The amount to give a user for first installing a powerwatch device.

### `onUpdate(OINK_user_list)`

We are only interested in incentivized users. Users are created only by the app
creating a record of a user and are thus never created as incentivized. Other
jobs may mark a user as incentivized and possibly as possessing a PowerWatch
device. This method monitors updates to the user list to catch when a user
becomes incentivized.

#### Stimuli

  - `firstopen` - For installing and running the app once.
     - Trigger: When the `incentivized` field becomes true
  - `firstplugwatch` - For installing a PlugWatch device.
     - Trigger: When the `plugwatch` field becomes true
  - `complianceapp` - For leaving the app installed for 30 days.
     - Trigger: When the `incentivized_days` field is 30 days past the last
       stimulus.
  - `complianceplugwatch` - For leaving a PlugWatch device installed for 30 days.
     - Trigger: When the `plugwatch_days` field is 30 days past the last
       stimulus.
