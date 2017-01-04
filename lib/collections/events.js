// Configure logger for event logging
var logger = new Logger('Managers:Logging');
// Comment out to use global logging level
Logger.setLevel('Managers:Logging', 'trace');
//Logger.setLevel('Managers:Logging', 'debug');
// Logger.setLevel('Managers:Logging', 'info');
//Logger.setLevel('Managers:Logging', 'warn');

Events = new Meteor.Collection("events");

Event = function (msg, user) {
  //time stamp for the event
  this.time = new Date().getTime();
  //type of the event
  //this.type = type;
  /*********** Leaving description in for legacy reasons *******/
  //description of the event
  this.description = msg
  //_id of user generating the event
  this.userID = user._id;
  //Name of user generating the event
  this.userName = user.userName;
  //There are additional fields that can be added
  //See logger for details
}

EventLogger = (function () {
  return {
    /*****************************************************************
    * Global object for logging high level system events to database
    ******************************************************************/
    log: function(msg, data) {
      /*
      *  log any event. If insufficient data is given, warning is
      *  logged, but does not throw error
      *   Input:
      *   type - the EventType associated with this event
      *   data - (Optional) the data to be associated with the event
      *       Specified as an object where only fieldNames specified
      *       in type are stored
      */
      //The current user is assumed to have generated the event
      var user = Session.get("currentUser");
      var event = new Event(msg, user);

      //Set each field provided in data
      if (typeof data != undefined) {
        for (var field in data) {
          event[field] = data[field];
        }
      }
      //Insert into db
      event._id = Events.insert(event);
      return event;
    },

    remove: function(events) {
      /**************************************************************
       * Remove a set of logged events
       *    This is primarily to support tests and needs to eventually
       *    be secured.
       * @params
       *    events: an array or cursor of events to be removed
       * @return
       *    n/a
       *************************************************************/
      if (hasForEach(events)) {
        ids = getIDs(events);
        if (Meteor.isServer) {
          Events.remove({_id: {$in: ids}});
        } else {
          events.forEach(function(event) {
            Events.remove({_id: event._id});
          });
        }
      } else {
        Events.remove({_id: events._id});
      }

    },
    logBegin: function() {
      var msg = "User logged in";
      this.log(msg)
    },
    logBeginInstructions: function() {
      var msg = "User began instructions";
      this.log(msg);
    },
    logEndInstructions: function() {
      var msg = "User finished instructions";
      this.log(msg);
    },
    logBeginTutorial: function() {
      var msg = "User began tutorial";
      this.log(msg);
    },
    logMarkTutorialWord: function(word, type) {
      var msg = "User marked word in tutorial";
      var data = {'word': word, 'type': type}
      this.log(msg, data);
    },
    logFinishTutorial: function() {
      var msg = "User finished tutorial";
      this.log(msg);
    },

    logAnalogyTest: function(score) {
      var msg = "User took initial analogy test";
      var data = {'correct': score}
      this.log(msg, data);
    },

    logMarkPurpose: function (wordID, previousState) {
      var word = Words.findOne({_id: wordID});
      var msg = "User marked word as purpose keyword";
      var data = {'word': word.content,
                  'wordID': word._id,
                  'wordSeq': word.sequence,
                  'sentenceID': word.sentenceID,
                  'docID': word.docID,
                  'previousState': previousState}
      this.log(msg, data);
    },
    logMarkMechanism: function (wordID, previousState) {
      var word = Words.findOne({_id: wordID});
      var msg = "User marked word as mechanism keyword";
      var data = {'word': word.content,
                  'wordID': word._id,
                  'wordSeq': word.sequence,
                  'sentenceID': word.sentenceID,
                  'docID': word.docID,
                  'previousState': previousState}
      this.log(msg, data);
    },
    logUnmarkWord: function (wordID, previousState) {
      var word = Words.findOne({_id: wordID});
      var msg = "User unmarked word";
      var data = {'word': word.content,
                  'wordID': word._id,
                  'wordSeq': word.sequence,
                  'sentenceID': word.sentenceID,
                  'docID': word.docID,
                  'previousState': previousState}
      this.log(msg, data);
    },
    logBeginDocument: function(docID) {
      var msg = "User began working on a document";
      var data = {"docID": docID}
      this.log(msg, data);
    },
    logFinishDocument: function(docID) {
      var msg = "User finished working on a document";
      var data = {"docID": docID}
      this.log(msg, data);
    },
    logHintUse: function() {
      var msg = "User looked at search hints";
      this.log(msg, data);
    },
    logNewSearch: function (search) {
      var msg = "User entered a new search query";
      var doc = Session.get("currentDoc");
      var data = {'seedDocID': doc._id,
                  'seedDocTitle': doc.fileName,
                  'query': search.query,
                  'searchID': search._id}
                  // 'displayedMatches': Session.get("lastMatchSet").ranks}
      this.log(msg, data);
    },
    // logUpdateSearch: function(query, logData) {
    //   var msg = "Search results updated after user action";
    //   var data = {'seedDoc': Session.get("currentDoc"),
    //               'query': query,
    //               'matches': Session.get("lastMatchSet").ranks}
    //   this.log(msg, data);
    // },
    logRedoSearch: function(query, search) {
      var msg = "User re-ran a search query";
      var data = {'searchID': search._id, 'query': query}
      this.log(msg, data);
    },
    logPossibleMatch: function (matchingDoc, previousState, match) {
      var msg = "User tagged doc as possible match";
      var matchContext = []
      var thisRank;
      Session.get("matchingDocs").forEach(function(m, rank) {
        if (!(isPossibleMatch(m) || isBestMatch(m))) {
          matchContext.push({'id': m._id, 'title': m.fileName, 'rank': rank});
          if (m._id === matchingDoc._id) {
            thisRank = rank;
          }
        }
      });
      // logger.trace("last match set: " + JSON.stringify(matchData));
      // var ranks = matchContext.ranks;
      // var thisRank = ranks[matchingDoc._id];
      // logger.trace("Matching doc: " + JSON.stringify(matchingDoc));
      var search = Searches.findOne({_id: match.searchID});
        // {
        //   userID: Session.get("currentUser")._id,
        //   seedDocID: Session.get("currentDoc")._id,
        //   query: Session.get("searchQuery"),
        //   searchType: Session.get("searchType")
        // })
      var currentDoc = Session.get("currentDoc")
      var data = {'seedDocID': currentDoc._id,
                  'seedDocTitle': currentDoc.fileName,
                  'query': search.query,
                  'searchID': search._id,
                  'matchingDocID': matchingDoc._id,
                  'matchingDocTitle': matchingDoc.fileName,
                  'previousState': previousState,
                  'rank': thisRank,
                  'matchContext': matchContext};
      this.log(msg, data);
    },
    logBestMatch: function (matchingDoc, previousState, match) {
      var msg = "User tagged doc as best match";
      var matchContext = []
      var thisRank;
      Session.get("matchingDocs").forEach(function(m, rank) {
        if (!(isPossibleMatch(m) || isBestMatch(m))) {
          matchContext.push({'id': m._id, 'title': m.fileName, 'rank': rank});
          if (m._id === matchingDoc._id) {
            thisRank = rank;
          }
        }
      });
      // logger.trace("last match set: " + JSON.stringify(matchData));
      // var ranks = matchContext.ranks;
      // var thisRank = ranks[matchingDoc._id];
      // logger.trace("Matching doc: " + JSON.stringify(matchingDoc));
      var search = Searches.findOne({_id: match.searchID});
        // {
        //   userID: Session.get("currentUser")._id,
        //   seedDocID: Session.get("currentDoc")._id,
        //   query: Session.get("searchQuery"),
        //   searchType: Session.get("searchType")
        // })
      var currentDoc = Session.get("currentDoc")
      var data = {'seedDocID': currentDoc._id,
                  'seedDocTitle': currentDoc.fileName,
                  'query': search.query,
                  'searchID': search._id,
                  'matchingDocID': matchingDoc._id,
                  'matchingDocTitle': matchingDoc.fileName,
                  'previousState': previousState,
                  'rank': thisRank,
                  'matchContext': matchContext};
      this.log(msg, data);
    },

    logRejectMatch: function(matchingDoc, previousState, match) {
      var msg = "User directly rejected a possible/best match";
      var matchContext = []
      var thisRank;
      Session.get("matchingDocs").forEach(function(m, rank) {
        if (!(isPossibleMatch(m) || isBestMatch(m))) {
          matchContext.push({'id': m._id, 'title': m.fileName, 'rank': rank});
          if (m._id === matchingDoc._id) {
            thisRank = rank;
          }
        }
      });
      // logger.trace("last match set: " + JSON.stringify(matchData));
      // var ranks = matchContext.ranks;
      // var thisRank = ranks[matchingDoc._id];
      var search = Searches.findOne({_id: match.searchID});
        // {
        //   userID: Session.get("currentUser")._id,
        //   seedDocID: Session.get("currentDoc")._id,
        //   query: Session.get("searchQuery"),
        //   searchType: Session.get("searchType")
        // })
      var currentDoc = Session.get("currentDoc")
      var data = {'seedDocID': currentDoc._id,
                  'seedDocTitle': currentDoc.fileName,
                  'query': search.query,
                  'searchID': search._id,
                  'matchingDocID': matchingDoc._id,
                  'matchingDocTitle': matchingDoc.fileName,
                  'previousState': previousState,
                  'rank': thisRank,
                  'matchContext': matchContext};
      this.log(msg, data);
    },

    logImplicitRejects: function(query, matches) {
      // this is for when the user clears the query after grabbing possible/best matches
      var msg = "User implicitly rejected docs from search results";
      var search = Searches.findOne({_id: Session.get("lastSearch").searchID});
        // {
        //   userID: Session.get("currentUser")._id,
        //   seedDocID: Session.get("currentDoc")._id,
        //   query: query,
        //   searchType: Session.get("searchType")
        // })
      var currentDoc = Session.get("currentDoc");
      var data = {'seedDocID': currentDoc._id,
                  'seedDocTitle': currentDoc.fileName,
                  'query': search.query,
                  'searchID': search._id,
                  'matchContext': matches}
      this.log(msg, data);
    },

    // logRejectPreviousSelection: function(matchingDoc) {
    //   var msg = "User rejected a previously selected matching doc";
    //   var data = {'seedDoc': Session.get("currentDoc"),
    //               'matchingDoc': matchingDoc}
    //   this.log(msg, data);
    // },

    logNewSeed: function(oldDoc, newDoc) {
      var msg = "User sampled a new doc";
      var data = {'oldDocID': oldDoc._id,
                  'oldDocTitle': oldDoc.fileName,
                  'newDocID': newDoc._id,
                  'newDocTitle': newDoc.fileName
                }
      this.log(msg, data);
    },

    // logMatchSubmission: function(docMatch, summary, keyWords) {
    logMatchSubmission: function(docMatch, summary) {
      var msg = "User submitted match for doc";
      var currentDoc = Session.get("currentDoc")
      var data = {'seedDocID': currentDoc._id,
                  'seedDocTitle': currentDoc.fileName,
                  'finalMatchID': docMatch._id,
                  'finalMatchTitle': docMatch.fileName,
                  'summary': summary}
                  // 'summary': summary,
                  // 'keyWords': keyWords}
      this.log(msg, data);
    },
 };
}());
