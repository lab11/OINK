#!/usr/bin/env python3

# Probably a one-off script, but also probably useful for future efforts that
# may need to do something similar.

import argparse
import csv
import os
import sys
import time

import openpyxl

import google
from google.cloud import firestore

parser = argparse.ArgumentParser(description='Update firestore records.')
parser.add_argument('--project', type=str, required=True,
                    help='the canonical firestore project name')
parser.add_argument('--dry-run', '-n', action='store_true')

args = parser.parse_args()

# Hacky sanity check
if args.project not in ('paymenttoy', 'crafty-shade-837'):
	print("Unknown project? That's probably not right.")
	print()
	sys.exit(1)


# GCloud configuration
os.environ['GCLOUD_PROJECT'] = args.project
db = firestore.Client()


# # First up:
# # Blind rename OINK_firstOpen_transaction -> OINK_stimulus_firstOpen
# 
# docs = db.collection('OINK_firstOpen_transaction').get()
# for doc in docs:
# 	# id = doc.id; data = doc.to_dict()
# 	if args.dry_run:
# 		print('Would write {}/{} = {}'.format('OINK_stimulus_firstOpen', doc.id, doc.to_dict()))
# 	else:
# 		db.collection('OINK_stimulus_firstOpen').document(doc.id).set(doc.to_dict())
# 
# 	if args.dry_run:
# 		print('Would delete {}/{}'.format('OINK_firstOpen_transaction', doc.id))
# 	else:
# 		doc.reference.delete()
# 
# # Next up:
# # In each OINK_tx_core_payment record
# #   - delete 'type'
# #   - add 'stimulus_collection'
# # In each OINK_rx_core_payment record
# #   - the same
# 
# docs = db.collection('OINK_tx_core_payment').get()
# for doc in docs:
# 	data = doc.to_dict()
# 	if data['type'] != 'firstOpen':
# 		raise NotImplementedError(data['type'])
# 	if args.dry_run:
# 		print('Would delete type and set stimulus_collection for {}'.format(doc.id))
# 	else:
# 		doc.reference.update({
# 			'type': firestore.DELETE_FIELD,
# 			'stimulus_collection': 'OINK_stimulus_firstOpen',
# 			})
# 
# docs = db.collection('OINK_rx_core_payment').get()
# for doc in docs:
# 	data = doc.to_dict()
# 	if data['type'] != 'firstOpen':
# 		raise NotImplementedError(data['type'])
# 	if args.dry_run:
# 		print('Would delete type and set stimulus_collection for {}'.format(doc.id))
# 	else:
# 		doc.reference.update({
# 			'type': firestore.DELETE_FIELD,
# 			'stimulus_collection': 'OINK_stimulus_firstOpen',
# 			})

# # Rename `OINK_tx_core_payment` to `OINK_payment_tx`
# docs = db.collection('OINK_tx_core_payment').get()
# for doc in docs:
# 	print('Processing OINK_payment_tx/{}'.format(doc.id))
# 	# id = doc.id; data = doc.to_dict()
# 	if args.dry_run:
# 		print('Would write {}/{} = {}'.format('OINK_payment_tx', doc.id, doc.to_dict()))
# 	else:
# 		db.collection('OINK_payment_tx').document(doc.id).set(doc.to_dict())
# 
# 	if args.dry_run:
# 		print('Would delete {}/{}'.format('OINK_tx_core_payment', doc.id))
# 	else:
# 		doc.reference.delete()
# 
# # Rename `OINK_rx_core_payment` to `OINK_payment_rx`
# docs = db.collection('OINK_rx_core_payment').get()
# for doc in docs:
# 	print('Processing OINK_payment_rx/{}'.format(doc.id))
# 	# id = doc.id; data = doc.to_dict()
# 	if args.dry_run:
# 		print('Would write {}/{} = {}'.format('OINK_payment_rx', doc.id, doc.to_dict()))
# 	else:
# 		db.collection('OINK_payment_rx').document(doc.id).set(doc.to_dict())
# 
# 	if args.dry_run:
# 		print('Would delete {}/{}'.format('OINK_rx_core_payment', doc.id))
# 	else:
# 		doc.reference.delete()

# Add a 'dwapp_install_time' to `OINK_user_list`
#
# At this point in history, the only thing that could have created a 'timestamp'
# entry was an app install. That will no longer be true after this migration.
docs = db.collection('OINK_user_list').get()
count = 0
skips = 0
for doc in docs:
	data = doc.to_dict()
	if 'dwapp_install_time' in data:
		print('Skipping {} which already has dwapp_install_time'.format(doc.id))
		skips += 1
		continue
	if args.dry_run:
		print('Would add OINK_user_list/{} dwapp_install_time: {}'.format(doc.id, data['timestamp']))
	else:
		print('Updating {}'.format(doc.id))
		doc.reference.update({'dwapp_install_time': data['timestamp']})
	count += 1
print('\nUpdated {}'.format(count))
print('Skipped {}'.format(skips))
print('Total   {}'.format(count+skips))
