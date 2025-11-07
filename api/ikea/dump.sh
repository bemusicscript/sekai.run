#!/bin/sh

# Dump Mysekai Assets
cd /usr/src/app/api && /usr/local/bin/python3 proseka.py assets_character
cd /usr/src/app/api && /usr/local/bin/python3 proseka.py assets_mysekai

# IKEA
cd /usr/src/ikea && /usr/local/bin/python3 ikea.py
