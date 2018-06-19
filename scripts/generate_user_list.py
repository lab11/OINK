#!/usr/bin/env python3

import argparse
import os
import sys
import time
import uuid

import google
import firebase_admin
from firebase_admin import credentials
from firebase_admin import db

# FIRESTORE APPROACH
#from google.cloud import firestore
#os.environ['GCLOUD_PROJECT'] = args.project
#db = firestore.Client()
#user_list_ref = db.collection('DWAPP_user_list')

parser = argparse.ArgumentParser(description='Create firebase realtime db records.')
parser.add_argument('--project', type=str, required=True,
                    help='the canonical firestore project name')

args = parser.parse_args()

# Hacky sanity check
if args.project not in ('paymenttoy', 'crafty-shade-837'):
	print("Unknown project? That's probably not right.")
	print()
	sys.exit(1)


# Authenticate to the firebase realtime db
# https://firebase.google.com/docs/database/admin/start
cred = credentials.Certificate('keys/{}.json'.format(args.project))
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://{}.firebaseio.com'.format(args.project),
})



# Copied from tockloader
def menu (options, *, return_type, default_index=0, prompt='Which option? '):
	'''
	Present a menu of choices to a user

	`options` should be a like-list object whose iterated objects can be coerced
	into strings.

	`return_type` must be set to one of
	  - "index" - for the index into the options array
	  - "value" - for the option value chosen

	`default_index` is the index to present as the default value (what happens
	if the user simply presses enter). Passing `None` disables default
	selection.
	'''
	print()
	for i,opt in enumerate(options):
		print('[{}]\t{}'.format(i, opt))
	if default_index is not None:
		prompt += '[{}] '.format(default_index)
	print()

	resp = input(prompt)
	if resp == '':
		resp = default_index
	else:
		try:
			resp = int(resp)
			if resp < 0 or resp > len(options):
				raise ValueError
		except:
			return menu(options, return_type=return_type,
					default_index=default_index, prompt=prompt)

	if return_type == 'index':
		return resp
	elif return_type == 'value':
		return options[resp]
	else:
		raise NotImplementedError('Menu caller asked for bad return_type')

def prompt(prompt, default=None):
	local_prompt = str(prompt)
	if local_prompt[-1] != ' ':
		local_prompt += ' '
	if default:
		local_prompt += '[{}] '.format(default)

	response = input(local_prompt)
	if len(response) == 0:
		if default:
			return default
		return prompt(prompt, default)
	return response


# What're we doing here
doing = menu(('Create', 'Update'), return_type='value')


to_write = {}
if doing == 'Create':
	to_write['user_id'] = prompt('user_id', '111122223')
	to_write['timestamp'] = prompt('timestamp', int(time.time()))
	to_write['payment_service'] = prompt('payment_service', 'korba')
	to_write['phone_number'] = prompt('phone_number', '111122223')
	to_write['phone_imei'] = prompt('phone_imei', '24ffaabbccddee8')
	to_write['phone_carrier'] = prompt('phone_carrier', 'MTN')
	new_ref = db.reference('/dwapp/user_list_create').push(to_write)
elif doing == 'Update':
	to_write['user_id'] = prompt('user_id', '111122223')
	to_write['fcm_token'] = prompt('fcm_token', str(uuid.uuid4()))
	new_ref = db.reference('/dwapp/user_list_update').push(to_write)
else:
	raise NotImplementedError

