#!/usr/bin/env python3

# Probably a one-off script, but also probably useful for future efforts that
# may need to do something similar.

import argparse
import csv
import os
import sys

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


# First up:
# Blind rename OINK_firstOpen_transaction -> OINK_stimulus_firstOpen

docs = db.collection('OINK_firstOpen_transaction').get()
for doc in docs:
	# id = doc.id; data = doc.to_dict()
	if args.dry_run:
		print('Would write {}/{} = {}'.format('OINK_stimulus_firstOpen', doc.id, doc.to_dict()))
	else:
		db.collection('OINK_stimulus_firstOpen').document(doc.id).set(doc.to_dict())

	if args.dry_run:
		print('Would delete {}/{}'.format('OINK_firstOpen_transaction', doc.id))
	else:
		doc.reference.delete()

# Next up:
# In each OINK_tx_core_payment record
#   - delete 'type'
#   - add 'stimulus_collection'
# In each OINK_rx_core_payment record
#   - the same

docs = db.collection('OINK_tx_core_payment').get()
for doc in docs:
	data = doc.to_dict()
	if data['type'] != 'firstOpen':
		raise NotImplementedError(data['type'])
	if args.dry_run:
		print('Would delete type and set stimulus_collection for {}'.format(doc.id))
	else:
		doc.reference.update({
			'type': firestore.DELETE_FIELD,
			'stimulus_collection': 'OINK_stimulus_firstOpen',
			})

docs = db.collection('OINK_rx_core_payment').get()
for doc in docs:
	data = doc.to_dict()
	if data['type'] != 'firstOpen':
		raise NotImplementedError(data['type'])
	if args.dry_run:
		print('Would delete type and set stimulus_collection for {}'.format(doc.id))
	else:
		doc.reference.update({
			'type': firestore.DELETE_FIELD,
			'stimulus_collection': 'OINK_stimulus_firstOpen',
			})
