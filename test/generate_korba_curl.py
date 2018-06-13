#!/usr/bin/env python3

import hashlib
import hmac
import json
import os

try:
	ck = os.environ['CK']
except KeyError:
	ck = input('Enter client key: ')

try:
	sk = os.environ['SK']
except KeyError:
	sk = input('Enter secret key: ')

try:
	endpoint = os.environ['ENDPOINT']
except KeyError:
	endpoint = input('Korba API endpoint: ')

print('Start entering keys/values. Ctrl-C when done')
stuff = {}

print('  Key: client_id')
try:
	client_id = os.environ['CLIENT_ID']
	print('Value: {}'.format(client_id))
except KeyError:
	client_id = input('Value: ')
stuff['client_id'] = client_id

try:
	while True:
		k = input('  Key: ')
		v = input('Value: ')
		#try:
		#	stuff[k] = int(v)
		#except ValueError:
		#	try:
		#		stuff[k] = float(v)
		#	except ValueError:
		#		stuff[k] = v
		if k == 'amount':
			stuff[k] = float(v)
		else:
			stuff[k] = v
except KeyboardInterrupt:
	print()

params = []
for k in sorted(stuff):
	params.append('{}={}'.format(k, stuff[k]))
s = '&'.join(params)

print('query string to HMAC: {}'.format(s))
print()

auth = hmac.new(bytes(sk, 'utf-8'), s.encode('ascii'), hashlib.sha256).hexdigest()

print('curl -X POST -H "Content-Type: application/json" -H "Authorization: HMAC {}:{}" -d \'{}\' \'https://korbaxchange.herokuapp.com/api/v1.0/{}/\''.format(\
		ck, auth, json.dumps(stuff), endpoint
		))
