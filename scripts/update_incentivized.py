#!/usr/bin/env python3

import csv
import os
import sys

import openpyxl

import google
from google.cloud import firestore

# "Argument parsing"
try:
	project = sys.argv[1]
except IndexError:
	print("Missing required argument: The project to incentivize")
	print()
	sys.exit(1)

# Hacky sanity check
if project not in ('paymenttoy', 'crafty-shade-837'):
	print("Unknown project? That's probably not right.")
	print()
	sys.exit(1)

try:
	numbers_file = sys.argv[2]
except IndexError:
	print("Missing required argument: The excel file to read numbers from.")
	print("The file should have one column of just phone numbers.")
	print()
	sys.exit(1)


# GCloud configuration
os.environ['GCLOUD_PROJECT'] = project
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

if '.xlsx' in numbers_file:
	wb = openpyxl.load_workbook(numbers_file)
	ws = wb.active
	idx = 1

	while True:
		cell = ws['A{}'.format(idx)].value
		if cell is None:
			break

		numbers.append(normalize(cell))
		idx += 1
elif '.csv' in numbers_file:
	with open(numbers_file) as csvfile:
		reader = csv.reader(csvfile)
		for row in reader:
			numbers.append(normalize(row[0]))
else:
	raise NotImplementedError('Unknown file type')

user_list_ref = db.collection('OINK_user_list')


def got_doc(doc):
	d = doc.to_dict()
	if d['incentivized']:
		print("INFO: Skipping '{}', 'incentivized' already set to True.".format(phone_number))
	else:
		print("INCENTIVIZED '{}'".format(phone_number))
		to_update = {'incentivized': True}
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

