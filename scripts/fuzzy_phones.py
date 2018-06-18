#!/usr/bin/env python3

import argparse
import csv
import os
import sys

# n.b. can't do `import fuzzywuzzy.process` :(
from fuzzywuzzy import process
import openpyxl

import google
from google.cloud import firestore

parser = argparse.ArgumentParser(description='Fuzzy match for phones.')
parser.add_argument('--project', type=str, required=True,
                    help='the canonical firestore project name')
#parser.add_argument('--dry-run', '-n', action='store_true')

source_group = parser.add_mutually_exclusive_group(required=True)
source_group.add_argument('--file', type=str,
                          help='the file to read numbers from')
source_group.add_argument('--number', type=str, action='append',
                          help='one specific number to run for')

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

user_numbers = []

print("Downloading user phone number list...")
docs = db.collection('OINK_user_list').get()
for doc in docs:
	user_numbers.append(doc.to_dict()['phone_number'])

print("There are {} user numbers in the database".format(len(user_numbers)))

print("For each supplied phone number, printing top three closest matches")
print()

# Fuzzy match
for number in numbers:
	matches = process.extract(number, user_numbers, limit=3)
	print('For {}'.format(number))
	for match in matches:
		print('\t{} is a {}% match'.format(match[0], match[1]))
	print()
