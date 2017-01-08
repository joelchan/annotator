var logger = new Logger('Client:search');

Logger.setLevel('Client:search', 'trace');
// Logger.setLevel('Client:search', 'debug');
// Logger.setLevel('Client:search', 'info');
// Logger.setLevel('Client:search', 'warn');

var resultLength = 0;
var dummyQuery = "############################";
// var options = {
//     keepHistory: 1000 * 60 * 5,
//     localSearch: true
// };
// var fields = ['content'];
// DocSearch = new SearchSource('documents', fields, options);

Template.AnalogySearcher.onRendered(function() {
    var spacer = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
    var walkthrough = new Tour({
      template: "<div class='popover tour'>" +
          "<div class='arrow'></div>" +
          "<h3 class='popover-title'></h3>" +
          "<div class='popover-content'></div>" +
          "<div class='popover-navigation'>" +
              "<button class='btn btn-default' data-role='prev'>« Prev</button>" +
              "<button class='btn btn-default' data-role='next'>Next »</button>" +
          "</div>" +
        "</div>",
      steps: [
      {
        element: "#seed-doc",
        title: "Interface walkthrough (Step 1 of 7)",
        content: "Welcome! Before you begin, let's quickly familiarize you with the interface. This is the seed document, for which you want to find a good analogous matching product.",
        backdrop: true,
        placement: "right",
        // orphan: true,
        onNext: function() {
          EventLogger.logBeginTutorial();
        }
      },
      {
        element: ".search-bar",
        title: "Interface walkthrough (Step 2 of 6)",
        content: "Use this search bar to enter keywords/phrases and search for possible analogous matches in our database of 8,348 other product descriptions.",
        backdrop: true,
        placement: "bottom",
      },
      {
        element: ".results",
        title: "Interface walkthrough (Step 3 of 6)",
        content: "Search results will show up here.",
        backdrop: true,
        placement: "bottom",
      },
      {
        element: "#sample-doc-header",
        title: "Interface walkthrough (Step 4 of 6)",
        content: "You can mark a document as a match by clicking on the relevant button. By default, all documents are not matches unless you say so.",
        backdrop: true,
        placement: "bottom",
      },
      // {
      //   element: ".selections",
      //   title: "Interface walkthrough (Step 5 of 7)",
      //   content: "Possible matches show up here. You can promote them to best matches or remove them from your match list by clicking on either best match or not match.",
      //   backdrop: true,
      //   placement: "left",
      // },
      {
        element: ".best-matches",
        title: "Interface walkthrough (Step 5 of 6)",
        content: "Your currently selected matches will show up here. You can demote the document to not a match by clicking on the relevant button. To complete the HIT, <b>you must have at least one good match</b>. Once you're done, click submit, and you'll get your completion code on the next screen.",
        backdrop: true,
        placement: "left",
      },
      ],
      onEnd: function(tour) {
        $("input").prop("disabled", false);
        $(".search-apply-btn").removeClass("disabled");
        $(".search-remove-btn").removeClass("disabled");
        $(".search-apply-btn").removeClass("disabled");
        $('.submit-match').removeClass("disabled");
        $('.change-seed').removeClass("disabled");
        $(".sample-best").remove();
        $(".sample-possible").remove();
        $(".sample-search").remove();
        EventLogger.logFinishTutorial();
        EventLogger.logBeginDocument(Session.get("currentDoc")._id);
      },
    });

    walkthrough.addStep({
      element: ".change-seed",
      title: "Interface walkthrough (Step 6 of 6)" + spacer,
      content: "If you feel unable to find a good analogous match, you can get a new document by clicking on this button. You will return to the previous Step to begin the process for that document. That's it! Click \"begin\" when you're ready!",
        backdrop: true,
        placement: "bottom",
        template: "<div class='popover tour'>" +
          "<div class='arrow'></div>" +
          "<h3 class='popover-title'></h3>" +
          "<div class='popover-content'></div>" +
          "<div class='popover-navigation'>" +
              "<button class='btn btn-default' data-role='prev'>« Prev</button>" +
              "<button class='btn btn-default' data-role='end'>Begin!</button>" +
          "</div>" +
        "</div>",
    });

    walkthrough.init();
    walkthrough.start();
    if (walkthrough.ended()) {
        walkthrough.restart();
    }
    Session.set("matchingDocs", []);
    Session.set("lastQuery", "");
    Session.set("searchQuery", "");
});

Template.SeedDocument.helpers({
    title: function() {
      // var allContent = Documents.findOne({_id: Session.get("currentDoc")._id}).content.replace("I want to make a ", "");
      // var title = allContent.split(".")[0];
      // title = title.charAt(0).toUpperCase() + title.slice(1);
      // return title;
      return Session.get("currentDoc").fileName;
    },
    content: function() {
        // var allContent = Documents.findOne({_id: Session.get("currentDoc")._id}).content;
        // trimmedContent = allContent.split(".").slice(1).join(". ");
        // return trimmedContent;
        return Session.get("currentDoc").content;
    },
    sentences: function() {
        // logger.debug("Getting sentences...");
        // return Sentences.find({docID: Session.get("currentDoc")._id},
        //                         {sort: {psn: 1}});
        return Session.get("currentDoc").sentences;
    },
    // descPurpose: function() {
    //
    // },
    // descMech: function() {
    //
    // },
    patternPurpose: function() {
      var pattern = Summaries.findOne({docID: Session.get("currentDoc")._id,
                                      userID: Session.get("currentUser")._id,
                                      sumType: "pattern"});
      return pattern.content.split(" [BY] ")[0];
    },
    patternMech: function() {
      var pattern = Summaries.findOne({docID: Session.get("currentDoc")._id,
                                      userID: Session.get("currentUser")._id,
                                      sumType: "pattern"});
      return pattern.content.split(" [BY] ")[1];
    },
    searches: function() {
        var allSearches = Searches.find(
          {
            userID: Session.get("currentUser")._id,
            seedDocID: Session.get("currentDoc")._id,
            searchType: Session.get("searchType")
          },
          {
            sort: {time: -1}
          }
        ).fetch();
        var uniqueSearches = [];
        var uniqueQueries = [];
        allSearches.forEach(function(s) {
            if (!isInList(s.query, uniqueQueries)) {
                uniqueSearches.push(s);
                uniqueQueries.push(s.query);
            }
        });
        return uniqueSearches;
    }
});

Template.SeedDocument.events({
    'click .seed-clickable': function(e){
         s = window.getSelection();
         var range = s.getRangeAt(0);
         console.log(range);
         var node = s.anchorNode;
         console.log(node);
        //  while(range.toString().indexOf(' ') != 0) {
        //     range.setStart(node,(range.startOffset -1));
        //  }
        //  range.setStart(node, range.startOffset +1);
        //  do{
        //    range.setEnd(node,range.endOffset + 1);

        // }while(range.toString().indexOf(' ') == -1 && range.toString().trim() != '');
        // var str = range.toString().trim();
        // alert(str);
    }

});

Template.SearchItem.helpers({
    numMatches: function() {
        // return Session.get("allMatches").length;
        return this.matches.length;
    }
});

Template.SearchItem.events({
    'click .search-query-item': function() {
        // console.log(this);
        EventLogger.logRedoSearch(this.query, this);
        $('#search-query').val(this.query);
        $('.search-apply-btn').click();
    },
});

Template.SeedDocument.events({
    'click .change-seed': function() {
        var confirmMsg = "Are you sure? You will clear all you work so far and move to a new document."
        // var selections = getSelections().fetch();
        var currentDoc = Session.get("currentDoc");
        if (confirm(confirmMsg)) {
            // TODO: log snapshot of current working space
            // Clear best match
            // getBest().forEach(function(bMatch) {
            Session.get("bestMatches").forEach(function(bMatch) {
                MatchManager.notMatch(currentDoc, bMatch)
            })
            // Clear possible matches
            // getPossible().forEach(function(pMatch) {
            Session.get("possibleMatches").forEach(function(pMatch) {
                MatchManager.notMatch(currentDoc, pMatch)
            })
            // Clear query
            $('.search-remove-btn').click();
            // Get a new doc
            // var newDoc = DocumentManager.sampleDocument()
            var user = Session.get("currentUser");
            Meteor.call("getNewDoc", user, currentDoc, function(err, newDoc) {
              logger.trace("Sampled new document: " + JSON.stringify(newDoc));
              EventLogger.logNewSeed(currentDoc, newDoc);
              Session.set("currentDoc", newDoc);
              // logger.debug("Refreshing page with new doc");
              Router.go("SearchScaffold", {userID: user._id,
                                   docID: newDoc._id,
                                   searchType: Session.get("searchType")
                                  });
            });
            // POSSIBLE TODO: Log that this user has already seen this doc???
        }
        // var currentDoc = Session.get("currentDoc");
        // if (selections.length > 0) {
            // alert("Please remove all selected matches first if you want to choose another document to work on");
        // } else {
            //
        // }
    },
});

Template.SearchBar.events({
    'click .search-apply-btn' : function(){
        var query = $('#search-query').val(); // grab query from text form
        Session.set("searchQuery", query);
        var lastQuery = Session.get("lastQuery");
        // if (!Session.equals("lastQuery", query)) {
        //     implicitRejections();
        // }
        // DocSearch.search(query);
        $('.search-apply-btn').addClass('btn-success');
        Session.set("isLoading", true);
        // var queryMatchData = getMatches();
        $('.doc-match').unhighlight();
        if (query != lastQuery) {
          if (lastQuery) {
            implicitRejections();
          }
          d = new Date().getTime();
          logger.debug("Starting search...");
          Meteor.call('lemmaSearch', query,
              function(error, allMatches) {
                  if (allMatches.length < 50) {
                    Session.set("lastDocMarker", allMatches.length);
                  } else {
                    Session.set("lastDocMarker", 50);
                  }
                  var previous = d;
                  var d = new Date().getTime();
                  var duration = d-previous;
                  logger.debug("Completed in " + duration/1000 + " seconds");
                  logger.debug("Pruning the results...");
                  var nonIdentityMatches = [];
                  allMatches.forEach(function(m) {
                      if ((m._id != Session.get("currentDoc")._id) && !(isPossibleMatch(m) || isBestMatch(m))) {
                          nonIdentityMatches.push(m);
                      }
                  });
                  // shuffle and note the rank in the search list
                  var previous = d;
                  var d = new Date().getTime();
                  var duration = d-previous;
                  logger.debug("Completed in " + duration/1000 + " seconds");
                  // logger.debug("Shuffling the results...");
                  // nonIdentityMatches = shuffle(nonIdentityMatches);
                  // var previous = d;
                  // var d = new Date().getTime();
                  // var duration = d-previous;
                  // logger.debug("Completed in " + duration/1000 + " seconds");
                  // var previous = d;
                  // var d = new Date().getTime();
                  // var duration = d-previous;
                  // logger.debug("Completed in " + duration/1000 + " seconds");
                  // logger.debug("Setting session data...");
                  $('.doc-match').highlight(query.split(" "));
                  // sample 50 to initially render
                  var currentSample = nonIdentityMatches.slice(0,50);
                  logger.debug("Noting the ranks of the results...");
                  var ranks = {}
                  var rank = 1;
                  var logData = []
                  nonIdentityMatches.forEach(function(match) {
                    ranks[match._id] = rank;
                    rank += 1;
                    logData.push(
                      {
                        'matchDocID': match._id,
                        'matchDocTitle': match.fileName,
                        'score': match.score
                      }
                    );
                    // })
                  });
                  var matchingDocs = {'matches': currentSample, 'ranks': ranks}
                  Session.set("isLoading", false);
                  // Session.set("lastMatchSet", lastMatchSet);
                  Session.set("matchingDocs", currentSample);
                  var pastSearch = Searches.findOne(
                    {
                      userID: Session.get("currentUser")._id,
                      seedDocID: Session.get("currentDoc")._id,
                      query: query,
                      searchType: Session.get("searchType")
                    });
                  if (!Session.equals("lastQuery", query) &&
                      query != dummyQuery &&
                      !pastSearch
                    )
                  {
                    var search = SearchManager.newSearch(query, logData, Session.get("searchType"));
                    Session.set("lastSearch", {'matches': nonIdentityMatches, 'searchID': search._id});
                    EventLogger.logNewSearch(search)
                  } else {
                    // if we returned to a previous search
                    Session.set("lastSearch", {'matches': nonIdentityMatches, 'searchID': pastSearch._id});
                  }
                  var previous = d;
                  var d = new Date().getTime();
                  var duration = d-previous;
                  logger.debug("Completed in " + duration/1000 + " seconds");
            });
          } //else {
            // var originalSearch = Searches.findOne({query: currentQuery, seedDocID: Session.get("currentDoc")._id, userID: Session.get("currentUser")._id});
            // logger.trace("original search: " + JSON.stringify(originalSearch));
            // var lastMatchSet = originalSearch.matches.matches;
            // var newMatchSet = [];
            // var ranks = {};
            // var rank = 1;
            // lastMatchSet.forEach(function(m) {
                // if (!(isPossibleMatch(m) || isBestMatch(m))) {
                    // newMatchSet.push(m);
                    // ranks[m._id] = rank;
                    // rank += 1;
                // }
            // });
            // $('.doc-match').highlight(currentQuery.split(" "));
            // Session.set("isLoading", false);
            // Session.set("lastMatchSet", newMatchSet);
          // }
        // logger.trace(JSON.stringify(queryMatches));
        // Session.set("lastMatchSet", queryMatchData);
        // EventLogger.logNewSearch(query)
        // logger.trace("Created new query: " + Session.get("searchQuery"));
    },

    'keyup input' : function(e, target){
        // logger.debug(e);
        // logger.debug(target);
        if(e.keyCode===13) {
          var btn = $('.search-apply-btn')
          btn.click();
        }
    },

    // clear full-text search of idea content
    'click .search-remove-btn' : function(){
        if (Session.get("lastSearch").searchID != "") {
           implicitRejections();
        }
        Session.set("searchQuery", dummyQuery);
        // DocSearch.search("############################");
        $('.search-apply-btn').removeClass('btn-success');
        $('#search-query').val("");
        $('.doc-match').unhighlight();
        Session.set("isLoading", false);
        Session.set("matchingDocs", []);
        Session.set("lastSearch", {'matches': [], 'searchID': ""});
        MatchManager.updateMatches(Session.get("currentUser"),
          Session.get("currentDoc"),
          Session.get("searchType")
        );
    },

    '.click .search-help' : function() {
        EventLogger.logHintUse();
    },
});

Template.SearchResults.onCreated(function() {
  Session.set("matchingDocs", []);
  Session.set("lastSearch", {'matches': [], 'searchID': ""});
  Session.set("lastDocMarker", 50);
  var self = this;
  self.autorun(function() {
    var docIDs = [Session.get("currentDoc")._id];
    Session.get("matchingDocs").forEach(function(doc) {
        docIDs.push(doc._id);
    });
    self.subscribe('specificDocs', docIDs);
  });
});

Template.SearchResults.rendered = function () {
    // DocSearch.search("############################");
    Session.set("searchQuery", dummyQuery);
    Session.set("lastSearch", {'matches': [], 'searchID': ""});
    Session.set("matchingDocs", []);
    Session.set("isLoading", false);
    Session.set("lastDocMarker", 50);
};

Template.SearchResults.helpers({
    matchingDocs: function() {
        // var query = Session.get("searchQuery");
        // var queryMatchData = getMatches();
        // Session.set("lastMatchSet", queryMatchData);
        // // var lastMatchSet = Session.get("lastMatchSet");
        // // logger.trace(JSON.stringify(queryMatches));
        // // if (!sameMatches(queryMatchData.matches, lastMatchSet.matches)) {
        // if (!Session.equals("lastQuery", query) && query != dummyQuery) {
        //     EventLogger.logNewSearch(query)
        //     SearchManager.newSearch(query, queryMatchData);
        //     // EventLogger.logUpdateSearch(query);
        // // } else {
        //
        // }
        // // }
        // Session.set("lastQuery", query);
        //
        // return queryMatchData.matches;
        // return Session.get("lastMatchSet").matches;
        // return Session.get("matchingDocs");
        var screenOuts = [Session.get("currentDoc")._id];
        Session.get("possibleMatches").forEach(function(m) {
          screenOuts.push(m._id);
        });
        Session.get("bestMatches").forEach(function(m) {
          screenOuts.push(m._id);
        });
        return Documents.find({_id: {$nin: screenOuts}});
        // return [];
    },
    hasMatches: function() {
        // var resultLength = getMatches().matches.length;
        var resultLength = Session.get("matchingDocs").length;
        // var resultLength = Session.get("lastMatchSet").matches.length;
        // resultLength = DocSearch.getData({
        //       transform: function(matchText, regExp) {
        //         return matchText.replace(regExp, "<b>$&</b>")
        //       },
        //       sort: {isoScore: -1}
        //     }).length;
        if (resultLength < 1) {
            return false;
        } else {
            return true;
        }
    },
    numMatches: function() {
        // return getMatches().matches.length;
        // return Session.get("matchingDocs").length;
        return Session.get("lastSearch").matches.length - Session.get("possibleMatches").length - Session.get("bestMatches").length;
        // return Session.get("lastMatchSet").matches.length;
        // return DocSearch.getData({
        //       transform: function(matchText, regExp) {
        //         return matchText.replace(regExp, "<b>$&</b>")
        //       },
        //       sort: {isoScore: -1}
        //     }).length;
    },
    isLoading: function() {
      return Session.get("isLoading");
      // return true;
    },
    hasMoreMatches: function() {
      if (Session.get("lastSearch").matches.length - Session.get("matchingDocs").length) {
        return true;
      } else {
        return false;
      }
    },
    remaining: function() {
      var lastDocMarker = Session.get("lastDocMarker");
      var newLastDocMarker = lastDocMarker + 50;
      var totalNumDocs = Session.get("lastSearch").matches.length;
      if (newLastDocMarker > totalNumDocs) {
        newLastDocMarker = totalNumDocs;
      }
      return newLastDocMarker-lastDocMarker;
    }
});

Template.SearchResults.events({
  'click .load-more': function() {
    logger.debug("loading more documents...");
    var lastDocMarker = Session.get("lastDocMarker");
    var newLastDocMarker = lastDocMarker + 50;
    var totalNumDocs = Session.get("lastSearch").matches.length;
    if (newLastDocMarker > totalNumDocs) {
      newLastDocMarker = totalNumDocs;
    }
    Session.set("lastDocMarker", newLastDocMarker);
    MatchManager.updateMatches(Session.get("currentUser"),
      Session.get("currentDoc"),
      Session.get("searchType")
    );
  }
});

Template.Selections.onCreated(function() {
  Session.set("matchingDocs", []);
  Session.set("lastSearch", {'matches': [], 'searchID': ""});
  Session.set("lastDocMarker", 50);
  Session.set("possibleMatches", []);
  Session.set("bestMatches", []);
  MatchManager.updateMatches(Session.get("currentUser"),
    Session.get("currentDoc"),
    Session.get("searchType")
  );
  var self = this;
  self.autorun(function() {
    var docIDs = [];
    Session.get("bestMatches").forEach(function(doc) {
        docIDs.push(doc._id);
    });
    Session.get("possibleMatches").forEach(function(doc) {
        docIDs.push(doc._id);
    });
    self.subscribe('specificDocs', docIDs);
  });
});

Template.Selections.rendered = function() {
  Session.set("matchingDocs", []);
  Session.set("lastSearch", {'matches': [], 'searchID': ""});
  Session.set("lastDocMarker", 50);
  Session.set("possibleMatches", []);
  Session.set("bestMatches", []);
  MatchManager.updateMatches(Session.get("currentUser"),
    Session.get("currentDoc"),
    Session.get("searchType")
  );
}

Template.Selections.helpers({
    bestMatches: function() {
        // return getBest();
        var bestMatches = [];
        Session.get("bestMatches").forEach(function(m) {
          bestMatches.push(m._id);
        });
        return Documents.find({_id: {$in: bestMatches}});
        // return Session.get("bestMatches");

    },
    numMatches: function() {
      return Session.get("bestMatches").length;
    },
    // possibleMatches: function() {
    //     // return getPossible();
    //     // return Session.get("possibleMatches");
    //     var possibleMatches = [];
    //     Session.get("possibleMatches").forEach(function(m) {
    //       possibleMatches.push(m._id);
    //     });
    //     return Documents.find({_id: {$in: possibleMatches}});
    //     // var user = Session.get("currentUser");
    //     // var docMatches = DocMatches.find({userID: user._id, seedDocID: Session.get("currentDoc")._id}).fetch();
    //     // var matchingDocs = []
    //     // docMatches.forEach(function(m) {
    //     //     matchingDocs.push(m.matchDocID);
    //     // });
    //     // return Documents.find({_id: {$in: matchingDocs}});
    // },
    // numPossible: function() {
    //     return Session.get("possibleMatches").length;
    //     // return getPossible().count();
    // },
    purposeSearch: function() {
      if (Session.equals("searchType", "p")) {
        return true;
      } else {
        return false;
      }
    }
});

Template.Selections.events({
    'click .submit-match': function() {
        // grab and check summary data
        var bestMatches = Session.get("bestMatches");
        // console.log(bestMatches);
        // logger.trace("Best matches: " + JSON.stringify(bestMatches));
        if (bestMatches.length < 1) {
            alert("You must select at least one good match; if you don't think there are any good matches, click \"change document\" to get another target document");
        // } else if (selections.length > 1) {
        //     alert("You must select only one best match");
        } else {
            // if ($("#matchDescription").val() == "") {
                // alert("Please describe how the match and seed document are analogous.");
            // } else {
                var goodMatches = DocMatches.find({userID: Session.get("currentUser")._id,
                                                  seedDocID: Session.get("currentDoc")._id,
                                                  // matchDocID:  bestMatches[0]._id,
                                                  bestMatch: true
                                                }).fetch();
                logger.trace("Good matches: " + JSON.stringify(goodMatches));
                var user = Session.get("currentUser");
                var doc = Session.get("currentDoc");
                // var summary = $("#matchDescription").val();
                var pattern = Summaries.findOne({docID: Session.get("currentDoc")._id,
                                                userID: Session.get("currentUser")._id,
                                                sumType: "pattern"});

                // generate completion code
                var completionCode = Random.hexString(20).toLowerCase();

                // add metadata (completion code and summary) to best match
                goodMatches.forEach(function(match) {
                  DocMatches.update({_id: match._id},{$set: {completionCode: completionCode, summary: pattern.content}})
                });

                // log the final submission
                finalMatch = DocMatches.findOne({_id: goodMatches[0]._id});
                logger.trace("Best match" + JSON.stringify(finalMatch));
                EventLogger.logMatchSubmission(finalMatch, pattern.content);

                // remember that this user has already seen this doc
                DocumentManager.markAnnotatedBy(doc, user);

                // clear search query (and also log implicit rejects)
                $('.search-remove-btn').click();

                EventLogger.logFinishDocument(doc._id);
                Router.go("Finish", {matchID: finalMatch._id});

                // $('.highlightDocButton').click();
            // }
        }
    }
});

Template.Document.rendered = function() {
    $('.doc-match').unhighlight();
    var query = Session.get("searchQuery");
    $('.doc-match').highlight(query.split(" "));
};

Template.Document.helpers({
    // sentences: function() {
    //     return Sentences.find({docID: this._id}, {sort: {psn: 1}});
    // },
    theTitle: function() {
      // var title = this.content.split(".")[0].replace("I want to make a ", "");
      // title = title.charAt(0).toUpperCase() + title.slice(1)
      // return title;
      return this.fileName;
    },
    theContent: function() {
      // trimmedContent = this.content.split(".").slice(1).join(". ");
      // return trimmedContent;
      return this.content;
    },
    isPossibleMatch: function() {
        return isPossibleMatch(this);
    },
    isBestMatch: function() {
        return isBestMatch(this);
    }
});

Template.Document.events({
    'click .match-add': function() {
        logger.debug("Clicked match button");
        var thisDoc = this;
        MatchManager.possibleMatch(Session.get("currentDoc"), thisDoc);
        MatchManager.updateMatches(Session.get("currentUser"),
          Session.get("currentDoc"),
          Session.get("searchType")
        );
        // var matchData = Session.get("lastMatchSet");
        // logger.trace("Last match set: " + JSON.stringify(matchData));
        // var allMatches = matchData.matches;
        // var ranks = matchData.ranks;
        // var thisRank = ranks[thisDoc._id];
        // var query = Session.get("searchQuery");
        // EventLogger.logSelectMatch(query, thisDoc, thisRank);
        // allMatches.forEach(function(m) {
        //     if (!m._id != thisDoc._id) {
        //         thisRank = ranks[m._id];
        //         EventLogger.logImplicitReject(m);
        //     }
        // });
    },
    'click .match-remove': function() {
        logger.debug("Clicked match remove button");
        logger.trace(this);
        MatchManager.notMatch(Session.get("currentDoc"), this);
        MatchManager.updateMatches(Session.get("currentUser"),
          Session.get("currentDoc"),
          Session.get("searchType")
        );
        // EventLogger.logRejectPreviousSelection(this);
    },
    'click .match-best': function() {
        logger.debug("Clicked best match button");
        logger.trace(this);
        // selectedDoc = this;
        var bestMatches = Session.get("bestMatches");
        // if (bestMatches.length > 0) {
        //     var confirmMsg = "You can only have one best match at any given moment. If you continue, you will replace the current best match and relegate it to a possible match.";
        //     if (confirm(confirmMsg)) {
        //         // relegate current best match
        //         MatchManager.possibleMatch(Session.get("currentDoc"), bestMatches[0]);
        //         // create new best
        //         MatchManager.bestMatch(Session.get("currentDoc"), this);
        //     }
        // } else {
            MatchManager.bestMatch(Session.get("currentDoc"), this);
        // }
        MatchManager.updateMatches(Session.get("currentUser"),
          Session.get("currentDoc"),
          Session.get("searchType")
        );
    }
});

Template.SearchHelp.helpers({
  searchType: function() {
    if (Session.equals("searchType", "p")) {
      return "achieve a very similar PURPOSE (i.e., are useful for similar reasons)";
    } else {
      return "have very similar mechanisms (i.e., achieve their purpose with similar mechanisms/components)";
    }
  },
  exampleReason: function() {
    if (Session.equals("searchType", "p")) {
      return "SEPARATE objects (chopped food, dust bunnies) from a host object (knife, broom bristles)";
    } else {
      return "CAUSE an object (knife, broom bristles) to PASS THROUGH another object (clip, rubber teeth)";
    }
  },
});

// Template.Highlighter.helpers({
//     seedWords: function() {
//         var seedWords = [];
//         var i = 1;
//         Session.get("currentDoc").content.split(" ").forEach(function(w) {
//             seedWords.push({'id': i, 'word': w});
//             i++;
//         });
//         return seedWords;
//     },
//     matchWords: function() {
//         var matchWords = [];
//         var i = 1;
//         var match = getBest().fetch()[0];
//         console.log(match);
//         if (match) {
//             match.content.split(" ").forEach(function(w) {
//                 matchWords.push({'id': i, 'word': w});
//                 i++;
//             });
//             return matchWords;
//         } else {
//             return [{'word': "No"}, {'word': "current"}, {'word': "match"}];
//         }
//     },
//     summary: function() {
//         var bestMatches = getBest().fetch();
//         var bestMatch = DocMatches.findOne({userID: Session.get("currentUser")._id,
//                                                   seedDocID: Session.get("currentDoc")._id,
//                                                   matchDocID: bestMatches[0]._id,
//                                                   bestMatch: true
//                                                   });
//         return bestMatch.summary;
//     }
// });

// Template.Highlighter.events({
//     'click .doc-word': function(event) {
//         // console.log(event.target);
//         logger.trace("Clicked on: " + event.target);
//         if (event.target.classList.contains("seed-word")) {
//             event.target.classList.toggle("highlight-seed");
//         } else {
//             event.target.classList.toggle("highlight-match");
//         }
//     },
    // 'hidden.bs.modal #highlightDocs' : function() {
    //     // logger.trace("Seed doc html: " + $('.highlight-seed-doc').html());
    //     // logger.trace("Match doc html: " + $('.highlight-match-doc').html());
    //     var bestMatches = getBest().fetch();
    //     var bestMatch = DocMatches.findOne({userID: Session.get("currentUser")._id,
    //                                               seedDocID: Session.get("currentDoc")._id,
    //                                               matchDocID: bestMatches[0]._id,
    //                                               bestMatch: true
    //                                               });
    //     docTexts = {'seed': $('.highlight-seed-doc').html(),
    //                 'match': $('.highlight-match-doc').html()}
    //     var s = $('.highlight-seed');
    //     var seedKeys = [];
    //     for (i=0; i<s.length; i++) {
    //         seedKeys.push(s[i].innerText);
    //     }
    //     var m = $('.highlight-match');
    //     var matchKeys = [];
    //     for (i=0; i < m.length; i++) {
    //         matchKeys.push(m[i].innerText);
    //     }
    //     if (seedKeys.length === 0 || matchKeys.length === 0) {
    //         alert("Please highlight key words in each document that explain how they are related.")
    //         $('.highlightDocButton').click();
    //     } else {
    //         keyWords = {'seed': seedKeys, 'match': matchKeys}
    //
    //         DocMatches.update({_id: bestMatch._id},
    //             {$set: {allText: docTexts,
    //                     keyWords: keyWords}});
    //         // log the final submission
    //         finalMatch = DocMatches.findOne({_id: bestMatch._id});
    //         logger.trace("Best match" + JSON.stringify(finalMatch));
    //         EventLogger.logMatchSubmission(finalMatch, finalMatch.summary, keyWords);
    //
    //         // remember that this user has already seen this doc
    //         var user = Session.get("currentUser");
    //         var doc = Session.get("currentDoc");
    //         DocumentManager.markAnnotatedBy(doc, user);
    //
    //         // clear search query (and also log implicit rejects)
    //         $('.search-remove-btn').click();
    //
    //         EventLogger.logFinishDocument(doc._id);
    //         Router.go("Finish", {matchID: finalMatch._id});
    //     }
    // }
// });

// var lemmaSearch = function(query) {
//   var terms = query.split(" ");
//   var clean_terms = [];
//   terms.forEach(function(term) {
//     if (stopwords.indexOf(term) < 0) {
//       clean_terms.push(term);
//     }
//   })
//   var expanded = clean_terms;
//   clean_terms.forEach(function(term) {
//     if (words_to_lemmas.hasOwnProperty(term)) {
//       var lemma = words_to_lemmas[term];
//       if (expanded.indexOf(lemma) < 0) {
//         expanded.push(lemma);
//       }
//     }
//   });
//   logger.trace("query terms: " + JSON.stringify(expanded));
//   return Documents.find({allwords: {$in: expanded}}).fetch();
// }

// var getMatches = function() {
//     currentQuery = Session.get("searchQuery");
//     lastQuery = Session.get("lastQuery");
//     $('.doc-match').unhighlight();
//     if (currentQuery != lastQuery) {
//         // var allMatches = DocSearch.getData({
//         //       transform: function(matchText, regExp) {
//         //         // return matchText.replace(regExp, "<b>$&</b>")
//         //         return matchText;
//         //       },
//         //       sort: {isoScore: -1}
//         //     });
//         var allMatches = lemmaSearch(currentQuery);
//         var nonIdentityMatches = [];
//         allMatches.forEach(function(m) {
//             if ((m._id != Session.get("currentDoc")._id) && !(isPossibleMatch(m) || isBestMatch(m))) {
//                 nonIdentityMatches.push(m);
//
//             }
//         });
//         // shuffle and note the rank in the search list
//         nonIdentityMatches = shuffle(nonIdentityMatches);
//         var ranks = {}
//         var rank = 1;
//         nonIdentityMatches.forEach(function(match) {
//             ranks[match._id] = rank;
//             rank += 1;
//         })
//         $('.doc-match').highlight(currentQuery.split(" "));
//         var data = {'matches': nonIdentityMatches, 'ranks': ranks}
//         Session.set("isLoading", false);
//         return data;
//     } else {
//         var originalSearch = Searches.findOne({query: currentQuery, seedDocID: Session.get("currentDoc")._id, userID: Session.get("currentUser")._id});
//         // logger.trace("original search: " + JSON.stringify(originalSearch));
//         var lastMatchSet = originalSearch.matches.matches;
//         var newMatchSet = [];
//         var ranks = {};
//         var rank = 1;
//         lastMatchSet.forEach(function(m) {
//             if (!(isPossibleMatch(m) || isBestMatch(m))) {
//                 newMatchSet.push(m);
//                 ranks[m._id] = rank;
//                 rank += 1;
//             }
//         });
//         $('.doc-match').highlight(currentQuery.split(" "));
//         Session.set("isLoading", false);
//         return {'matches': newMatchSet, 'ranks': ranks};
//     }
//
// }
//
// var getPossible = function() {
//     var user = Session.get("currentUser");
//     var docMatches = DocMatches.find({userID: user._id, seedDocID: Session.get("currentDoc")._id}).fetch();
//     var matchingDocs = []
//     docMatches.forEach(function(m) {
//         if (!m.bestMatch) {
//             matchingDocs.push(m.matchDocID);
//         }
//     });
//     return Documents.find({_id: {$in: matchingDocs}});
// }
//
// var getBest = function() {
//     var user = Session.get("currentUser");
//     var docMatches = DocMatches.find({userID: user._id, seedDocID: Session.get("currentDoc")._id}).fetch();
//     var matchingDocs = []
//     docMatches.forEach(function(m) {
//         if (m.bestMatch) {
//             matchingDocs.push(m.matchDocID);
//         }
//     });
//     return Documents.find({_id: {$in: matchingDocs}});
// }

isPossibleMatch = function(doc) {
    var user = Session.get("currentUser");
    var docMatch = DocMatches.findOne({userID: user._id, seedDocID: Session.get("currentDoc")._id, matchDocID: doc._id});
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

isBestMatch = function(doc) {
    var user = Session.get("currentUser");
    var docMatch = DocMatches.findOne({userID: user._id, seedDocID: Session.get("currentDoc")._id, matchDocID: doc._id});
    if (docMatch) {
        return docMatch.bestMatch;
    } else {
        return false;
    }
}

// var sameMatches = function(set1, set2) {
//     var firstIDs = [];
//     set1.forEach(function(s) {
//         firstIDs.push(s._id);
//     });
//     var secondIDs = [];
//     set2.forEach(function(s) {
//         secondIDs.push(s._id);
//     });
//     return firstIDs.sort().join(',') === secondIDs.sort().join(',');
// }

var implicitRejections = function() {
    var lastQuery = Session.get("searchQuery");
    var matchContext = []
    Session.get("matchingDocs").forEach(function(m, rank) {
      if (!(isPossibleMatch(m) || isBestMatch(m))) {
        matchContext.push({'id': m._id, 'title': m.fileName, 'rank': rank});
      }
    });
    EventLogger.logImplicitRejects(lastQuery, matchContext);

    // logger.trace("Last match set: " + JSON.stringify(matchData));
    // var allMatches = matchData.matches;
    // var ranks = matchData.ranks;
    // matchContext.forEach(function(m) {
    //     // EventLogger.logImplicitReject(lastQuery, m, thisRank);
    //     if (!(isPossibleMatch(m) || isBestMatch(m))) {
    //         // var thisRank = ranks[m._id];
    //         EventLogger.logImplicitReject(lastQuery, m.id, m.title, m.rank, matchContext);
    //     }
    // });
}
