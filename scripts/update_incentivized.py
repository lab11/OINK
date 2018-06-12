#!/usr/bin/env python3

import sys

import openpyxl

import google
from google.cloud import firestore

# "Argument parsing"
try:
	wb_file = sys.argv[1]
except IndexError:
	print("Missing required argument: The excel file to read numbers from.")
	print("The file should have one column of just phone numbers.")
	print()
	sys.exit(1)


# GCloud configuration
db = firestore.Client()
user_list_ref = db.collection('OINK_user_list')


wb = openpyxl.load_workbook(wb_file)
ws = wb.active
idx = 1
while True:
	cell = ws['A{}'.format(idx)].value
	if cell is None:
		break

	#print(cell)
	doc_ref = user_list_ref.document(str(cell))

	try:
		doc = doc_ref.get()
		#print('{}'.format(doc.to_dict()))
		d = doc.to_dict()
		if d['incentivized']:
			print("INFO: Skipping '{}', 'incentivized' already set to True.".format(cell))
		else:
			print("INCENTIVIZED '{}'".format(cell))
			d['incentivized'] = True
			doc_ref.set(d)
	except google.cloud.exceptions.NotFound:
		print("WARNING: The number '{}' was not found in firestore".format(cell))

	idx += 1
