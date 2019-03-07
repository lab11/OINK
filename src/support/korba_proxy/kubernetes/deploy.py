#!/usr/bin/env python3.6
import sys
import os
import secrets
import string
alphabet = string.ascii_letters + string.digits
import argparse
import requests
import getpass
import json
import shutil
import base64
import glob
import subprocess

region = "us-west1"


#CREATE a new globally routable ip address
korba_ip_address = ''
try:
    subprocess.check_call(['gcloud', 'compute','addresses','create',
                        'korba-proxy','--global'])
except Exception as e:
    print(e)

try:
    korba_ip_address = subprocess.check_output(['gcloud', 'compute','addresses','describe',
                        'korba-proxy','--global'])
    korba_ip_address = korba_ip_address.decode('utf-8').replace('\n',' ').split(' ')[1]
    subprocess.check_call(['gcloud', 'dns','record-sets','transaction','start',
                        '--zone','powerwatch'])
    subprocess.check_call(['gcloud', 'dns','record-sets','transaction','add',
                        '--zone','powerwatch',
                        '--name','korba-proxy.powerwatch.io',
                        '--type','A',
                        '--ttl','300',korba_ip_address])
    subprocess.check_call(['gcloud', 'dns','record-sets','transaction','execute',
                        '--zone','powerwatch'])
except Exception as e:
    os.remove('transaction.yaml')
    print(e)


#Grafana deployment
subprocess.check_call(['kubectl','apply','-f', './korba-deployment.yaml'])

#issue the grafana certificate
subprocess.check_call(['kubectl','apply','-f', './korba-certificate.yaml'])

print()
print('Korba globally accessible IP address: ' + str(korba_ip_address))
