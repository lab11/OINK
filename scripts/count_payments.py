#!/usr/bin/env python3

import argparse
import csv
import os
import sys
import math

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

number_app_compliance = 0
number_app_compliance_now = 0
number_app_compliance_total = 0
number_powerwatch_compliance = 0
number_powerwatch_compliance_now = 0
number_powerwatch_compliance_total = 0


docs = db.collection('OINK_user_list').get()
for doc in docs:
	data = doc.to_dict()

	if('incentivized' in data and data.get('incentivized', True)):
		incentives = 0
		if('incentivized_days' in data):
			number_app_compliance_now += math.floor(data['incentivized_days']/30)
			number_app_compliance_total += 7
			incentives = math.floor((210 - data['incentivized_days'])/30)
			if(incentives > 7):
				print(incentives)
		else:
			incentives = 7
		
		number_app_compliance += incentives

	if('incentivized' in data and data.get('incentivized', True) and 'powerwatch' in data and data['powerwatch'] is True):
		incentives = 0
		if('powerwatch_days' in data and not math.isnan(data['powerwatch_days'])):
			number_powerwatch_compliance_now += math.floor(data['incentivized_days']/30)
			number_powerwatch_compliance_total += 7
			incentives = math.floor((210 - data['powerwatch_days'])/30)
		else:
			incentives = 7
		
		if(incentives > 0):
			number_powerwatch_compliance += incentives


sys.stdout.write('\r' + ' '*80 + '\r')

print('There are {} app compliances to eventually pay in the user list'.format(number_app_compliance))
print()

print('There are {} powerwatch compliances to eventually pay in the user list'.format(number_powerwatch_compliance))
print()

print('There are {} app compliances to currently pay in the user list'.format(number_app_compliance_now))
print()

print('There are {} powerwatch compliances to currently pay in the user list'.format(number_powerwatch_compliance_now))
print()

number_app_stimulus = 0
docs = db.collection('OINK_stimulus_complianceApp').get()
for doc in docs:
	number_app_stimulus += 1

number_powerwatch_stimulus = 0
docs = db.collection('OINK_stimulus_compliancePowerwatch').get()
for doc in docs:
	number_powerwatch_stimulus += 1


print('There are {} app compliances in the stimulus list'.format(number_app_stimulus))
print()

print('There are {} powerwatch compliances in the stimulus list'.format(number_powerwatch_stimulus))
print()

number_app_transactions = 0
number_complete_app_transactions = 0
number_powerwatch_transactions = 0
number_complete_powerwatch_transactions = 0
docs = db.collection('OINK_payment_tx').get()
stimulus_app_list = [];
stimulus_powerwatch_list = [];
for doc in docs:
	data = doc.to_dict()

	if('stimulus_collection' in data and data['stimulus_collection'] == 'OINK_stimulus_complianceApp'):
		if(data['stimulus_doc_id'] not in stimulus_app_list):
			stimulus_app_list.append(data['stimulus_doc_id'])
			number_app_transactions += 1

		if('status' in data and data['status'] == 'complete'):
			number_complete_app_transactions += 1


	if('stimulus_collection' in data and data['stimulus_collection'] == 'OINK_stimulus_compliancePowerwatch'):
		if(data['stimulus_doc_id'] not in stimulus_powerwatch_list):
			stimulus_powerwatch_list.append(data['stimulus_doc_id'])
			number_powerwatch_transactions += 1

		if('status' in data and data['status'] == 'complete'):
			number_complete_powerwatch_transactions += 1


print('There are {} app compliances in the transaction list'.format(number_app_transactions))
print()

print('There are {} powerwatch compliances in the transaction list'.format(number_powerwatch_transactions))
print()

print('There are {} complete app compliances in the transaction list'.format(number_complete_app_transactions))
print()

print('There are {} complete powerwatch compliances in the transaction list'.format(number_complete_powerwatch_transactions))
print()

print("Compliances for App")
print('Total\tShould be issued\tTo issue in future\tIn stimulus collection\tIn transaction collection\tComplete')
print('{}\t{}\t\t\t{}\t\t\t{}\t\t\t{}\t\t\t\t{}'.format(number_app_compliance_total,number_app_compliance_now,number_app_compliance,number_app_stimulus,number_app_transactions,number_complete_app_transactions))

print()
print("Compliances for Powerwatch")
print('Total\tShould be issued\tTo issue in future\tIn stimulus collection\tIn transaction collection\tComplete')
print('{}\t{}\t\t\t{}\t\t\t{}\t\t\t{}\t\t\t\t{}'.format(number_powerwatch_compliance_total,number_powerwatch_compliance_now,number_powerwatch_compliance,number_powerwatch_stimulus,number_powerwatch_transactions,number_complete_powerwatch_transactions))
