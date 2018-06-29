#!/usr/bin/env python3

import argparse
import csv
import os
import sys

import google
from google.cloud import firestore

parser = argparse.ArgumentParser(description='Fuzzy match for phones.')
parser.add_argument('--project', type=str, required=True,
                    help='the canonical firestore project name')
#parser.add_argument('--dry-run', '-n', action='store_true')

args = parser.parse_args()

# Hacky sanity check
if args.project not in ('paymenttoy', 'crafty-shade-837'):
	print("Unknown project? That's probably not right.")
	print()
	sys.exit(1)


# GCloud configuration
os.environ['GCLOUD_PROJECT'] = args.project
db = firestore.Client()

user_list_ref = db.collection('OINK_user_list')

user_numbers = []

surveyed_no_app = []
marked_dw_no_app = []
marked_pw_no_app = []
marked_dw_deleted_app = []

count = 0

docs = db.collection('OINK_user_list').get()
for doc in docs:
	data = doc.to_dict()
	count += 1
	sys.stdout.write('\rProcessing user {}'.format(count))

	# Never installed app
	if 'dwapp_install_time' not in data:
		if data.get('firstSurvey', False):
			surveyed_no_app.append(data)
		if data.get('incentivized', False):
			marked_dw_no_app.append(data)
		if data.get('powerwatch', False):
			marked_pw_no_app.append(data)

	# Deleted app and in study
	if 'dwapp_install_time' in data:
		if data.get('incentivized', False):
			if data['active'] == False:
				marked_dw_deleted_app.append(data)
sys.stdout.write('\r' + ' '*80 + '\r')

print('There are {} total users in OINK'.format(count))
print()

print('These users were surveyed but never installed the app (maybe not a problem):')
for data in sorted(surveyed_no_app, key=lambda data: data['phone_number']):
	print(data['phone_number'])
print()

print('These users were marked for DW in survey but never installed the app:')
for data in sorted(marked_dw_no_app, key=lambda data: data['phone_number']):
	print(data['phone_number'])
print()

print('These users were marked for PW in survey but never installed the app:')
for data in sorted(marked_pw_no_app, key=lambda data: data['phone_number']):
	print(data['phone_number'])
print()

print('These users were marked for DW in survey, but have deleted the app (and not reinstalled it):')
for data in sorted(marked_dw_deleted_app, key=lambda data: data['phone_number']):
	print(data['phone_number'])
print()
