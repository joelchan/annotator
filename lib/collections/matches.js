var logger = new Logger('collections:MatchManager');

Logger.setLevel('collections:MatchManager', 'trace');
// Logger.setLevel('collections:MatchManager', 'debug');
// Logger.setLevel('collections:MatchManager', 'info');
// Logger.setLevel('collections:MatchManager', 'warn');

DocMatches = new Mongo.Collection('docMatches');

DocMatch = function(seedDoc, matchDoc, user, searchType) {

    this.seedDocID = seedDoc._id;

    this.matchDocID = matchDoc._id;

    this.userID = user._id;

    this.bestMatch = false;

    this.summary = "";

    this.searchType = searchType;

    this.completionCode = "";

}

MatchManager = (function() {
    return {
        possibleMatch: function(seedDoc, matchDoc, query, rank) {
            /******************************************************************
             * Add a match link between seedDoc and matchDoc
             * @params
             *    seedDoc - the seed document
             *    matchDoc - the document to be matched to the seed doc
             *****************************************************************/
            var user = Session.get("currentUser");
            var oldMatch = DocMatches.findOne({userID: user._id,
                                            seedDocID: seedDoc._id,
                                            matchDocID: matchDoc._id,
                                            searchType: Session.get("searchType")
                                          });
            if (oldMatch) {
                logger.debug("Already a match between " + seedDoc._id + " and " + matchDoc._id + ". Checking if best match.");
                // Unmark as a best match if it was a best match
                if (oldMatch.bestMatch) {
                    DocMatches.update({_id: oldMatch._id},{$set: {bestMatch: false}});
                }
                EventLogger.logPossibleMatch(matchDoc, "best");
            } else {
                logger.debug(user.userName + " is adding match between " + seedDoc._id + " and " + matchDoc._id);
                var match = new DocMatch(seedDoc, matchDoc, user, Session.get("searchType"));
                match._id = DocMatches.insert(match);
                // Documents.update({_id: seedDoc._id},{$addToSet: {matchIDs: match._id}});
                EventLogger.logPossibleMatch(matchDoc, "notMatch");
                return match;
            }
        },
        notMatch: function(seedDoc, matchDoc, query, rank) {
            var user = Session.get("currentUser");
            logger.debug(user.userName + " is removing match between " + seedDoc._id + " and " + matchDoc._id);
            var toRemove = DocMatches.findOne({userID: user._id,
                                            seedDocID: seedDoc._id,
                                            matchDocID: matchDoc._id,
                                            searchType: Session.get("searchType")
                                          });
            if (toRemove) {
                logger.trace("Existing match: " + JSON.stringify(toRemove));
                DocMatches.remove({_id: toRemove._id});
                // Documents.update({_id: seedDoc._id},{$pull: {$matchIDs: toRemove._id}});
                var previousState = "best";
                if (!toRemove.bestMatch) {
                    previousState = "possible"
                }
                EventLogger.logRejectMatch(matchDoc, previousState);
                // toRemove.forEach(function(t) {
                //     DocMatches.remove({_id: t._id});
                //     // Documents.update({_id: seedDoc._id},{$pull: {$matchIDs: t._id}});
                // });
                return true;
            } else {
                logger.debug("Already not a match");
                return false;
            }
        },
        bestMatch: function(seedDoc, matchDoc, query, rank) {
            var user = Session.get("currentUser");
            logger.debug(user.userName + " is marking " + matchDoc._id + " as best match for " + seedDoc._id);
            var oldMatch = DocMatches.findOne({userID: user._id,
                                            seedDocID: seedDoc._id,
                                            matchDocID: matchDoc._id,
                                            searchType: Session.get("searchType"),
                                          });
            if (oldMatch) {
                logger.trace("Marking existing match as best match");
                DocMatches.update({_id: oldMatch._id},{$set: {bestMatch: true}});
                EventLogger.logBestMatch(matchDoc, "possible");
                return oldMatch;
                // return true;
            } else {
                logger.trace("Making a new best match");
                var newMatch = new DocMatch(seedDoc, matchDoc, user, Session.get("searchType"));
                newMatch.bestMatch = true;
                newMatch._id = DocMatches.insert(newMatch);
                // Documents.update({_id: seedDoc._id},{$addToSet: {matchIDs: newMatch._id}});
                EventLogger.logBestMatch(matchDoc, "notMatch");
                return newMatch;
                // return false;
            }
        },
        updateMatches: function(user, currentDoc, searchType) {
          logger.debug("Updating matches...");
          Meteor.call("getPossible", user, currentDoc, searchType, function(err, possibleMatches) {
            if (possibleMatches) {
              logger.trace("Possible matches are: " + JSON.stringify(possibleMatches));
              Session.set("possibleMatches", possibleMatches);
            } else {
              Session.set("possibleMatches", []);
            }
          });
          Meteor.call("getBest", user, currentDoc, searchType, function(err, bestMatches) {
            if (bestMatches) {
              logger.trace("Best matches are: " + JSON.stringify(bestMatches));
              Session.set("bestMatches", bestMatches);
            } else {
              Session.set("bestMatches", []);
            }
          });
          // var originalSearch = Searches.findOne({query: Session.get("searchQuery"), seedDocID: currentDoc._id, userID: user._id});
          // logger.trace("original search: " + JSON.stringify(originalSearch));
          // var lastMatchSet = originalSearch.matches.matches;
          var marker = Session.get("lastDocMarker");
          var lastMatchSet = Session.get("allMatches").slice(0,marker);
          var newMatchSet = [];
          var ranks = {};
          var rank = 1;
          lastMatchSet.forEach(function(m) {
              if (!(isPossibleMatch(m) || isBestMatch(m))) {
                  newMatchSet.push(m);
                  ranks[m._id] = rank;
                  rank += 1;
              }
          });
          // $('.doc-match').highlight(currentQuery.split(" "));
          Session.set("isLoading", false);
          Session.set("lastMatchSet", {'matches': newMatchSet, 'ranks': ranks});
          logger.debug("Updating matching docs, now to show results up to " + marker);
          Session.set("matchingDocs", newMatchSet);
        }
    }
}());

var isPossibleMatch = function(doc) {
    var user = Session.get("currentUser");
    var docMatch = DocMatches.findOne({userID: user._id,
                                      seedDocID: Session.get("currentDoc")._id,
                                      matchDocID: doc._id,
                                      searchType: Session.get("searchType")
                                    });
    if (docMatch) {
        return true;
    } else {
        return false;
    }
    // var selected = false;
    // for (i = 0; i < doc.matchIDs.length; i++) {
    //     if (doc.matchingDocs[i].userID == user._id) {
    //         selected = true;
    //         return selected;
    //     }
    // }
    // return selected;
}

var isBestMatch = function(doc) {
    var user = Session.get("currentUser");
    var docMatch = DocMatches.findOne({userID: user._id,
                                      seedDocID: Session.get("currentDoc")._id,
                                      matchDocID: doc._id,
                                      searchType: Session.get('searchType')
                                    });
    if (docMatch) {
        return docMatch.bestMatch;
    } else {
        return false;
    }
}
