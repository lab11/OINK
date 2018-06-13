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

wb = openpyxl.load_workbook(wb_file)
ws = wb.active
idx = 1
while True:
	cell = ws['A{}'.format(idx)].value
	if cell is None:
		break

	phone_number = normalize(cell)
	query_ref = user_list_ref.where('phone_number', '==', phone_number)

	try:
		docs = query_ref.get()
		for doc in docs:
			d = doc.to_dict()
			if d['incentivized']:
				print("INFO: Skipping '{}', 'incentivized' already set to True.".format(phone_number))
			else:
				print("INCENTIVIZED '{}'".format(phone_number))
				to_update = {'incentivized': True}
				doc.reference.update(to_update)
			break
		else:
			print("No phone_number matching '{}'".format(phone_number))
	except google.cloud.exceptions.NotFound:
		print("WARNING: The number '{}' was not found in firestore".format(phone_number))

	idx += 1
