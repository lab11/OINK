#!/usr/bin/env python3

import argparse
import csv
import os
import pprint
import sys
import time

import openpyxl

import google
from google.cloud import firestore

parser = argparse.ArgumentParser(description='Update firestore records.')
parser.add_argument('--project', type=str, required=True,
                    help='the canonical firestore project name')
parser.add_argument('--dry-run', '-n', action='store_true',
                    help='do not actually write any records')
parser.add_argument('--ignore-active', action='store_true',
                    help='do not check whether user is active')

source_group = parser.add_mutually_exclusive_group(required=True)
source_group.add_argument('--file', type=str,
                          help='the file to read numbers from')
source_group.add_argument('--number', type=str, action='append',
                          help='one specific number to run for')

group = parser.add_mutually_exclusive_group(required=True)
group.add_argument('--incentivize', action='store_true')
group.add_argument('--powerwatch', action='store_true')
group.add_argument('--wit', action='store_true')
group.add_argument('--firstsurvey', action='store_true')

args = parser.parse_args()

# Hacky sanity check
if args.project not in ('paymenttoy', 'crafty-shade-837'):
	print("Unknown project? That's probably not right.")
	print()
	sys.exit(1)


# GCloud configuration
os.environ['GCLOUD_PROJECT'] = args.project
db = firestore.Client()

# Helper method that normalizes phone numbers to match
def normalize(number):
	ret = str(number)
	ret = ret.replace(' ', '')
	if ret[:4] == '+233':
		ret = ret[4:]
	if ret[:3] == '233':
		ret = ret[3:]
	if len(ret) != 9:
		print('WARNING: Number not 9 digits, it probably will not work: {}'.format(ret))
	return ret

# Read all phone numbers from file
numbers = []

if args.file:
	if '.xlsx' in args.file:
		wb = openpyxl.load_workbook(args.file)
		ws = wb.active
		idx = 1

		while True:
			cell = ws['A{}'.format(idx)].value
			if cell is None:
				break

			numbers.append(normalize(cell))
			idx += 1
	elif '.csv' in args.file:
		with open(args.file) as csvfile:
			reader = csv.reader(csvfile)
			for row in reader:
				numbers.append(normalize(row[0]))
	else:
		raise NotImplementedError('Unknown file type')
else:
	numbers = list(args.number)

user_list_ref = db.collection('OINK_user_list')


if args.incentivize:
	key = 'incentivized'
elif args.powerwatch:
	key = 'powerwatch'
elif args.wit:
	key = 'wit'
elif args.firstsurvey:
	key = 'firstSurvey'
else:
	raise NotImplementedError

def got_doc(doc):
	d = doc.to_dict()
	try:
		if d[key]:
			print("INFO: Skipping '{}', {} already set to True.".format(phone_number, key))
			return
	except KeyError:
		pass

	if not args.ignore_active:
		if 'active' not in d or d['active'] != True:
			input('WARNING: Inactive user. Press any key to continue or Ctrl-C to cancel')

	print("{} '{}'".format(key.upper(), phone_number))
	to_update = {key: True}
	if not args.dry_run:
		doc.reference.update(to_update)

def create_doc(phone_number):
	# Thinking we prefer leading 0 numbers given user evidence
	if len(phone_number) == 9:
		phone_number = '0' + phone_number
	to_create = {}
	to_create['user_id'] = phone_number
	to_create['phone_number'] = phone_number
	to_create['payment_service'] = 'korba'
	to_create['phone_carrier'] = input("Phone Carrier: [Airtel/MTN/Glo/Tigo/Vodafone]: ")
	print("  !!HACK If your local clock isn't in UTC, you need to do something else here")
	to_create['timestamp'] = int(time.time())*1000 + int(1000*(time.time() % 1))
	print("")
	print("Will create new record:")
	pprint.pprint(to_create)
	r = input("Create record? [Y/n] ")
	if len(r) and r.lower()[0] == 'n':
		return

	if args.dry_run:
		print("Would create that doc, then query for it and update it")
		return
	else:
		user_list_ref.document(phone_number).set(to_create)

	# Need to split the incentivization as triggers only monitor updates
	# (perhaps a TODO there..)
	doc = user_list_ref.document(phone_number).get()
	got_doc(doc)

for phone_number in numbers:
	query_ref = user_list_ref.where('phone_number', '==', phone_number)

	try:
		docs = query_ref.get()
		for doc in docs:
			got_doc(doc)
			break
		else:
			# Try again with leading 0
			q2_ref = user_list_ref.where('phone_number', '==', '0' + phone_number)
			docs = q2_ref.get()
			for doc in docs:
				got_doc(doc)
				break
			else:
				print("WARNING: No phone_number matching '{}'".format(phone_number))
				r = input("Create user for this number? [y/n] ")
				if len(r) and r.lower()[0] == 'y':
					create_doc(phone_number)
	except google.cloud.exceptions.NotFound:
		print("ERROR: Failed to run query?")

