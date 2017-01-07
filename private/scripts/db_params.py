#!/usr/bin/env python

# Author: Steven Dang stevencdang.com

from mongo_credentials import *

########## MongoHQ databases ##############
# Need to modify this so that the user and password are stored separately
annotator = {'url': "ds037244.mlab.com",
               'port': 37244,
               'dbName': 'heroku_wxmfh3tx',
               'user': 'joel',
               'pswd': 'chan',
               }

nosummary = {'url': "ds155028.mlab.com",
               'port': 55028,
               'dbName': 'heroku_wnx2wkch',
               'user': 'joel',
               'pswd': 'chan',
               }

# Info for connecting to a local instance of meteor's mongo.
# Meteor must be running to connect
local_meteor = {'url': "localhost",
                'port': 3001,
                'dbName': 'meteor',
                'user': '',
                'pswd': '',
                }

ALL_DBs = {'local': local_meteor,
            'annotator': annotator,
            'nosummary': nosummary
          }
