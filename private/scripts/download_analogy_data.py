import pandas as pd
import json
import os
import sys
import time
import datetime
from mongohq import *
from db_params import *

def process_events(data_path, outname, cutoff=None):
    events = pd.read_json(os.path.join(data_dir, "events.json"))

    # print events[events['description'] == scaffold_start].head()

    # print "%i times we began instructions" %(events[events['description'] == scaffold_start].count())

    f = open("%s_events.txt" %outname, 'w')
    toWrite = ""
    bigDiv = "*"*40
    smallDiv = "-"*20

    userStats = []

    for userName, eventData in events.groupby("userName"):

        # print eventData['description']
        if "User submitted match for doc" in eventData['description'].values and scaffold_start in eventData['description'].values:

            # print "Submitted match!"

            # if cutoff is not None:
                # eventData = eventData[eventData['time'] >= cutoff]

            # print "%i events for %s" %(len(eventData['time']), userName)

            eventData.sort_values(by=['time'], ascending=[1], inplace=True)
            start = datetime.datetime.fromtimestamp(eventData['time'].values[0]/1000)
            beginInstructions = datetime.datetime.fromtimestamp(eventData[eventData['description'] == scaffold_start]['time'].values[0]/1000)
            beginSearch = datetime.datetime.fromtimestamp(eventData[eventData['description'] == search_start]['time'].values[0]/1000)
            stop = datetime.datetime.fromtimestamp(eventData['time'].values[-1]/1000)
            duration_scaffold = beginInstructions-start
            duration_search = stop-beginSearch
            duration = stop-start
            userWrite = ""

            numTags = 0
            numQueries = 0

            for index, row in eventData.iterrows():

                    msg = "%s - %s" %(time.strftime("%T", time.gmtime(row['time']/1000)), row['description'])
                    if row['description'] == "User began working on a document":
                        userWrite += "%s: %s\n" %(msg, docs[docs['_id'] == row['docID']]['title'].values[0])
                    elif row['description'] in doc_tagging_events and pd.notnull(row['matchingDocID']):
                        msg = "%s - %s: %s" %(time.strftime("%T", time.gmtime(row['time']/1000)), row['description'], row['matchingDocTitle'])
                        userWrite += "%s\n" %msg
                        numTags += 1
                    elif row['description'] == "User entered a new search query":
                        userWrite += "%s: %s\n" %(msg, row['query'])
                        numQueries += 1
                    else:
                        userWrite += "%s\n" %msg
            userHeader = "%s\n" %smallDiv
            userHeader += "%s (time elapsed: %.2f minutes)\n" %(userName, duration.total_seconds()/60.0)
            userHeader += "%s\n" %smallDiv
            toWrite += "%s%s\n" %(userHeader, userWrite)
            userData = {'userName': userName,
                        'duration': duration.total_seconds()/60.0,
                        'duration scaffold (mins)': duration_scaffold.total_seconds()/60.0,
                        'duration search (mins)': duration_search.total_seconds()/60.0,
                        'numDocs': len(eventData[eventData['description'] == "User submitted match for doc"]),
                        'numTags': numTags,
                        'numQueries': numQueries}
            userStats.append(userData)

    toWrite = toWrite.encode('utf-8', "ignore")
    f.write(toWrite)
    f.close()

    userStats = pd.DataFrame(userStats)
    userStats.to_csv("%s_userStats.csv" %outname)

    return events

"""
Download latest data
"""

db_name = sys.argv[1]
runName = sys.argv[2]
cutoff = None
if len(sys.argv) > 3:
    cutoff = int(sys.argv[3])
data_dir = "data/%s" %runName
output_dir = "/Users/jchan/Dropbox/Research/PostDoc/CrowdSchemas/analogySearch/"

db_params = Data_Utility.get_db(db_name)
db = Data_Utility(data_dir, db_params)
db.dump_db()

"""
Process matches
"""

matches = pd.read_json(os.path.join(data_dir, "docMatches.json"))
docs = pd.read_json(os.path.join(data_dir, "documents.json"))
# docs['titlestring'] = [n.replace(".txt", "") for n in docs['fileName']]

docs_seeds = docs[['_id', 'extID', 'title', 'fileName']]
docs_seeds.rename(columns={'_id': 'seedDocID', 'extID': 'seedDocExtID', 'title': 'seedDescription', 'fileName': 'seedTitle'}, inplace=True)
docs_matches = docs[['_id', 'extID', 'title', 'fileName']]
docs_matches.rename(columns={'_id': "matchDocID", 'extID': 'matchDocExtID', 'title': 'matchDescription', 'fileName': 'matchTitle'}, inplace=True)
matches = matches.merge(docs_seeds, on="seedDocID", how="left")
matches = matches.merge(docs_matches, on="matchDocID", how="left")
matches.to_excel(os.path.join(output_dir, "%s_matches.xlsx" %runName))

"""
Pickings
"""

target_seeds = pd.read_csv(os.path.join(output_dir, "/Users/jchan/Dropbox/Research/PostDoc/CrowdSchemas/analogySearch/quirky-2-first-run-50.csv"))
target_seeds['target'] = 1
target_seeds['docExtID'] = [unicode(d) for d in target_seeds['DOCID']]
target_seeds = target_seeds[['docExtID','target']]
pickings = []
for docName, docData in matches.groupby("seedDocExtID"):
    pickings.append({'docExtID': docName, 'numMatches': len(docData[(docData['bestMatch']==True)
                    & (docData['completionCode'] != "")]['_id'])})
pickings = pd.DataFrame(pickings)

# pickings['target'] = [1 for t in pickings['docID'] if t in target_seeds['docID']]
pickings = pickings.merge(target_seeds, on="docExtID", how="left")
# print pickings[pickings['target'] == 1].sort_values(by=['numMatches'], ascending=[0])

pickings.to_csv(os.path.join(output_dir, "%s_pickings.csv" %runName))


"""
Process events
"""

doc_tagging_events = [
 u'User directly rejected a possible/best match',
 u'User implicitly rejected doc from search results',
 u'User submitted match for doc',
 u'User tagged doc as best match',
 u'User tagged doc as possible match']

scaffold_start = "User began instructions"
search_start = "User began working on a document"

events = process_events(data_dir, os.path.join(output_dir, runName), cutoff)
