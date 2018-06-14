#!/usr/bin/env python3

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

source_group = parser.add_mutually_exclusive_group(required=True)
source_group.add_argument('--file', type=str,
                          help='the file to read numbers from')
source_group.add_argument('--number', type=str,
                          help='one specific number to run for')

group = parser.add_mutually_exclusive_group(required=True)
group.add_argument('--incentivize', action='store_true')
group.add_argument('--powerwatch', action='store_true')
group.add_argument('--wit', action='store_true')

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
	numbers.append(args.number)

user_list_ref = db.collection('OINK_user_list')


if args.incentivize:
	key = 'incentivized'
elif args.powerwatch:
	key = 'powerwatch'
elif args.wit:
	key = 'wit'
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

	print("{} '{}'".format(key.upper(), phone_number))
	to_update = {key: True}
	if not args.dry_run:
		doc.reference.update(to_update)

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
	except google.cloud.exceptions.NotFound:
		print("ERROR: Failed to run query?")

