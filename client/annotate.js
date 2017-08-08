var logger = new Logger('Client:annotate');

Logger.setLevel('Client:annotate', 'trace');
// Logger.setLevel('Client:annotate', 'debug');
// Logger.setLevel('Client:annotate', 'info');
// Logger.setLevel('Client:annotate', 'warn');

LocalWords = new Mongo.Collection(null);

// var currentStart = {'s': 0, 'w': 0};
var currentStart = 0;
// var currentEnd = {'s': 0, 'w': 0};
var currentEnd = 0;

Template.annotationPage.onCreated(function() {
  // Words.find({docID: Session.get("currentDoc")._id}).fetch().forEach(function(word) {
  //   logger.trace("Inserting word " + JSON.stringify(word) + " into local words collection");
  //   LocalWords.insert(word);
  // });
  // logger.trace("Local words: ");
  // logger.trace(LocalWords.find().fetch());
});

Template.annotationPage.rendered = function(){
    logger.debug("Rendered annotation page...");
    Session.set("highlightState", "none");

}

Template.annotationPage.helpers({
    isLoggedIn: function() {
        var user = Session.get("currentUser");
        if (user) {
            return true;
        } else {
            return false;
        }
    },
});

Template.annotateTask.onCreated(function() {
  // Words.find({docID: Session.get("currentDoc")._id}).fetch().forEach(function(word) {
  //   // logger.trace("Inserting word " + JSON.stringify(word) + " into local words collection");
  //   LocalWords.insert(word);
  // });
  // logger.trace("Local words: ");
  // logger.trace(JSON.stringify(LocalWords.find().fetch()));
});

Template.annotateTask.rendered = function(){
  var doc = Session.get("currentDoc");
  logger.trace("Current doc: " + JSON.stringify(doc));
  var dbWords = Words.find({docID: doc._id}).fetch();
  logger.trace("dbWords: " + JSON.stringify(dbWords));
  if (LocalWords.find().count() < 1) {
    dbWords.forEach(function(word) {
      // logger.trace("Inserting word " + JSON.stringify(word) + " into local words collection");
      LocalWords.insert(word);
    });
  }
  logger.trace("Local words: ");
  logger.trace(JSON.stringify(LocalWords.find().fetch()));
  logger.debug("Rendered annotation task...");
}


Template.annotateTask.helpers({
    sentences: function() {
        logger.debug("Getting sentences...");
        return Sentences.find({docID: Session.get("currentDoc")._id},
                                {sort: {psn: 1}});
    },
    numAnnotations: function() {
      var doc = Documents.findOne(Session.get("currentDoc")._id);
      return doc.annotatedBy.length;
    }
});

Template.annotateTask.events({
    'click .init-highlight': function(event) {
      var button = event.currentTarget;
      $('.init-highlight').removeClass("btn-success");
      button.classList.add("btn-success");
      if (isInList("purpose", button.classList)) {
        Session.set("highlightState", "purpose");
      } else if (isInList("mechanism", button.classList)) {
        Session.set("highlightState", "mechanism");
      } else if (isInList("finding", button.classList)) {
        Session.set("highlightState", "finding");
      } else if (isInList("background", button.classList)) {
        Session.set("highlightState", "background");
      } else if (isInList("unmark", button.classList)) {
        Session.set("highlightState", "unmark");
      } else {
        Session.set("highlightState", "none");
      }
    },

    'click .another': function() {
        do {
            var doc = DocumentManager.sampleDocument();
        }
        while (doc._id === Session.get("currentDoc")._id);
        Session.set("currentDoc", doc);
    },
    'click .finished': function() {

        var $this = $(this);
        $this.button('loading');
        // grab and check summary data
        var sumPurpose = $('#summ-purp').val();
        var sumMechanism = $('#summ-mech').val();
        logger.trace("Purpose summary: " + sumPurpose);
        logger.trace("Mechanism summary: " + sumMechanism);
        hasSummary = true;
        // if (sumPurpose === "" || sumMechanism === "") {
        //     var hasSummary = false;
        // } else {
        //     var hasSummary = true;
        // }

        // check if annotated
        if (isAnnotatedBy(Session.get("currentDoc"), Session.get("currentUser"))) {
            var hasAnnotations = true;
        } else {
            var hasAnnotations = false;
        }

        // only continue if we have all the data!
        if (!hasSummary && !hasAnnotations) {
            alert("Please summarize and annotate the document! Remember: we would like at least one keyword for each of the highlight types.");
        } else if (!hasSummary && hasAnnotations) {
            alert("Please summarize the document!");
        } else if (hasSummary && !hasAnnotations) {
            alert("Please annotate the document! Remember: we would like at least one keyword for each of the highlight types.");
        } else {
            // grab the summary data and push to finish
            var user = Session.get("currentUser");
            var doc = Session.get("currentDoc");
            DocumentManager.addSummary(doc,
                                        "Purpose",
                                        sumPurpose,
                                        user);
            DocumentManager.addSummary(doc,
                                        "Mechanism",
                                        sumMechanism,
                                        user);
            Meteor.call("writeSummary", doc, "Highlights", LocalWords.find({docID: doc._id}).fetch(), user, function(err, res) {
              if (res) {
                // $this.button('reset');
                // alert("Finished! Going to last page next")
                // DocumentManager.markAnnotatedBy(doc,
                //                             user);
                // EventLogger.logFinishDocument(doc._id);
                // Router.go("Finish");
              }
            })
            alert("Finished! Going to last page next")
            DocumentManager.markAnnotatedBy(doc,
                                        user);
            EventLogger.logFinishDocument(doc._id);
            Router.go("Finish");
            // DocumentManager.markAnnotatedBy(doc,
            //                               user);
            // EventLogger.logFinishDocument(doc._id);
            // Router.go("Finish");
            // DocumentManager.addSummary(
            //   doc,
            //   "Highlights",
            //   Words.find({docID: doc._id}).fetch(),
            //   user
            // );
        }
        // Router.go("Finish");
    },

    'mouseup': function() {
      if (Session.equals("isHighlighting", true)) {
        Session.set("isHighlighting", false);
      }
    }
})

Template.sentence.rendered = function(){
  logger.debug("Rendered sentence...");
}

Template.sentence.onCreated(function() {
  // Words.find({docID: Session.get("currentDoc")._id}).fetch().forEach(function(word) {
  //   // logger.trace("Inserting word " + JSON.stringify(word) + " into local words collection");
  //   LocalWords.insert(word);
  // });
  // logger.trace("Local words: ");
  // logger.trace(JSON.stringify(LocalWords.find().fetch()));
});

Template.sentence.helpers({
    words: function() {
        logger.debug("Getting words...");
        return LocalWords.find({sentenceID: this._id},
                            {sort: { sequence : 1 }});
    }
});

Template.word.rendered = function(){
  logger.debug("Rendered word...");
}

Template.word.helpers({
    keyType: function() {
      var userID = Session.get("currentUser")._id;
      if (isInList(userID, this.highlightsPurpose)) {
          // logger.debug("isPurpose is true");
          return "key-purpose";
      } else if (isInList(userID, this.highlightsMechanism)) {
          return "key-mechanism"
      } else if (isInList(userID, this.highlightsFindings)) {
          return "key-finding"
      } else if (isInList(userID, this.highlightsBackground)) {
          return "key-background"
      } else {
        return "key-neutral"
      }
    },
    isPurpose: function() {
        var userID = Session.get("currentUser")._id;
        // logger.debug("Current user is " + userID);
        // logger.trace("Users who have higlighted this as a purpose keyword: " +
            // JSON.stringify(this.highlightsPurpose));
        if (isInList(userID, this.highlightsPurpose)) {
            // logger.debug("isPurpose is true");
            return true;
        } else {
            return false;
        }
    },
    isMech: function() {
        var userID = Session.get("currentUser")._id;
        // logger.debug("Current user is " + userID);
        // logger.trace("Users who have higlighted this as a mechanism keyword: " +
            // JSON.stringify(this.highlightsMechanism));
        if (isInList(userID, this.highlightsMechanism)) {
            // logger.debug("isMech is true");
            return true;
        } else {
            return false;
        }
    },
    isFinding: function() {
        var userID = Session.get("currentUser")._id;
        // logger.debug("Current user is " + userID);
        // logger.trace("Users who have higlighted this as a mechanism keyword: " +
            // JSON.stringify(this.highlightsMechanism));
        if (isInList(userID, this.highlightsFindings)) {
            // logger.debug("isMech is true");
            return true;
        } else {
            return false;
        }
    },
    isBackground: function() {
        var userID = Session.get("currentUser")._id;
        // logger.debug("Current user is " + userID);
        // logger.trace("Users who have higlighted this as a mechanism keyword: " +
            // JSON.stringify(this.highlightsMechanism));
        if (isInList(userID, this.highlightsBackground)) {
            // logger.debug("isMech is true");
            return true;
        } else {
            return false;
        }
    },
    isNeutral: function() {
        var userID = Session.get("currentUser")._id;
        if (!isInList(userID, this.highlightsPurpose) &&
            !isInList(userID, this.highlightsMechanism)) {
            // logger.debug("isNeutral is true");
            return true;
        } else {
            return false;
        }
    }
});

Template.word.events({
    'mousedown .token': function(event) {
      if (Session.get("highlightState") != "none") {
          logger.debug("Begin highlight");
          Session.set("isHighlighting", true);
          var word = event.currentTarget;
          logger.trace(word.innerHTML);
          var wordID = trimFromString(word.id, "word-");
          // currentStart.s = Sentences.findOne(Words.findOne(wordID).sentenceID).psn;
          currentStart = LocalWords.findOne(wordID).globalPsn;
          markWord(wordID);
      }
    },

    'mouseup .token': function(event) {
      logger.debug("End highlight");
      Session.set("isHighlighting", false);
    },

    'mouseover .token': function(event) {
      logger.debug("Hovering over token");
      if (Session.get("isHighlighting")) {
        var word = event.currentTarget;
        logger.trace(word.innerHTML);
        var wordID = trimFromString(word.id, "word-");
        // currentEnd.s = Sentences.findOne(Words.findOne(wordID).sentenceID).psn;
        // currentEnd.w = Words.findOne(wordID).sequence;
        currentEnd = LocalWords.findOne(wordID).globalPsn;
        logger.trace("Current start: " + currentStart);
        logger.trace("Current end: " + currentEnd);

        var selectedWords = LocalWords.find({docID: Session.get("currentDoc")._id,
                                        globalPsn: {$gte: currentStart,
                                                    $lte: currentEnd}
                                        }).fetch();
        logger.trace("Selected words: " + selectedWords);
        // mark all of these words
        selectedWords.forEach(function(w) {
          markWord(w._id);
        });

        // // get all sentences included in the highlight
        // var selectedSentences = Sentences.find({psn: {$gte: currentStart.s, $lte: currentEnd.s}}).fetch();
        // logger.trace("Selected sentences: " + JSON.stringify(selectedSentences));
        // for (i=0; i<selectedSentences.length; i++) {
        //   var thisSentence = selectedSentences[i];
        //   logger.trace("This sentence: " + JSON.stringify(thisSentence));
        //   var theseWords = Words.find({sentenceID: thisSentence._id}).fetch();
        //   logger.trace("These words: " + JSON.stringify(theseWords));
        //   // first sentence in range
        //   if (i==0) {
        //     theseWords.forEach(function(w) {
        //       if (w.sequence >= currentStart.w) {
        //         markWord(w._id);
        //       }
        //     });
        //     // last sentence in range
        //   } else if (i+1 == selectedSentences.length) {
        //     theseWords.forEach(function(w) {
        //       if (w.sequence <= currentEnd.w) {
        //         markWord(w._id);
        //       }
        //     });
        //     // everything else we just dump in as a highlight
        //   } else {
        //     theseWords.forEach(function(w) {
        //       markWord(w._id);
        //     });
        //   }
        // }

        // markWord(wordID);
      }
    },

//     'click .key-option': function(event) {
//         var selection = event.currentTarget;
//         // var keyType = selection.innerText;
//         // console.log(selection);
//         var word = selection.parentNode.previousElementSibling;
//         // console.log(word);
//         var wordID = trimFromString(word.id, "word-");
//         var userID = Session.get("currentUser")._id;
//         logger.trace(userID + " clicked on " + wordID);
//         if (selection.classList.contains("purp")) {
//             WordManager.markWord(wordID, userID, "Purpose");
//         } else if (selection.classList.contains("mech")) {
//             WordManager.markWord(wordID, userID, "Mechanism");
//         } else {
//             WordManager.markWord(wordID, userID, "Neither");
//         }
//     }
})

// markWord = function(wordID) {
//   var userID = Session.get("currentUser")._id;
//   logger.trace(userID + " clicked on " + wordID);
//   var highlightType = Session.get("highlightState");
//   logger.trace("highlightState: " + highlightType);
//   if (highlightType === "purpose") {
//       WordManager.markWord(wordID, userID, "Purpose");
//   } else if (highlightType === "mechanism") {
//       WordManager.markWord(wordID, userID, "Mechanism");
//   } else if (highlightType === "finding") {
//       WordManager.markWord(wordID, userID, "Finding");
//   } else if (highlightType === "background") {
//       WordManager.markWord(wordID, userID, "Background");
//   } else {
//       WordManager.markWord(wordID, userID, "Neither");
//   }
// }

markWord = function(wordID) {
    /******************************************************************
     * Mark the word with appropriate annotation for that user
     * @params
     *    wordID - the id of the word being annotated
     *    userID - the user making the annotation
     *    type (str) - problem, mechanism, or neither
     *****************************************************************/
    // var previousState = this.getCurrentState(wordID, userID);
    var userID = Session.get("currentUser")._id;
    logger.trace(userID + " clicked on " + wordID);
    var highlightType = Session.get("highlightState");
    logger.trace("highlightState: " + highlightType);
    if (highlightType === "purpose") {
        logger.debug("Adding " + userID + " to highlightsPurpose for " + wordID);
        LocalWords.update({_id: wordID},{$addToSet: {highlightsPurpose: userID}});
        LocalWords.update({_id: wordID},{$pull: {highlightsMechanism: userID}});
        LocalWords.update({_id: wordID},{$pull: {highlightsFindings: userID}});
        LocalWords.update({_id: wordID},{$pull: {highlightsBackground: userID}});
        // EventLogger.logMarkPurpose(wordID, previousState);
    } else if (highlightType === "mechanism") {
        logger.debug("Adding " + userID + " to highlightsMechanism for " + wordID);
        LocalWords.update({_id: wordID},{$pull: {highlightsPurpose: userID}});
        LocalWords.update({_id: wordID},{$addToSet: {highlightsMechanism: userID}});
        LocalWords.update({_id: wordID},{$pull: {highlightsFindings: userID}});
        LocalWords.update({_id: wordID},{$pull: {highlightsBackground: userID}});
        // EventLogger.logMarkMechanism(wordID, previousState);
    } else if (highlightType === "finding"){
        logger.debug("Adding " + userID + " to highlightsFinding for " + wordID);
        LocalWords.update({_id: wordID},{$pull: {highlightsPurpose: userID}});
        LocalWords.update({_id: wordID},{$pull: {highlightsMechanism: userID}});
        LocalWords.update({_id: wordID},{$addToSet: {highlightsFindings: userID}});
        LocalWords.update({_id: wordID},{$pull: {highlightsBackground: userID}});
        // EventLogger.logMarkFinding(wordID, previousState);
    } else if (highlightType === "background"){
        logger.debug("Adding " + userID + " to highlightsBackground for " + wordID);
        LocalWords.update({_id: wordID},{$pull: {highlightsPurpose: userID}});
        LocalWords.update({_id: wordID},{$pull: {highlightsMechanism: userID}});
        LocalWords.update({_id: wordID},{$pull: {highlightsFindings: userID}});
        LocalWords.update({_id: wordID},{$addToSet: {highlightsBackground: userID}});
        // EventLogger.logMarkBackground(wordID, previousState);
    } else {
        logger.debug("Neither: un-annotating");
        LocalWords.update({_id: wordID},{$pull: {highlightsPurpose: userID}});
        LocalWords.update({_id: wordID},{$pull: {highlightsMechanism: userID}});
        LocalWords.update({_id: wordID},{$pull: {highlightsFindings: userID}});
        LocalWords.update({_id: wordID},{$pull: {highlightsBackground: userID}});
        // EventLogger.logUnmarkWord(wordID, previousState);
    }
    return true;
}

isAnnotatedBy = function(doc, user) {
    var docWords = LocalWords.find({docID: doc._id}).fetch();

    var hasPurpose = false;
    var hasMechanism = false;
    var hasFinding = false;
    var hasBackground = false;
    docWords.forEach(function(docWord) {
        if (isInList(user._id, docWord.highlightsPurpose)) {
            hasPurpose = true;
        }
        if (isInList(user._id, docWord.highlightsMechanism)) {
            hasMechanism = true;
        }
        if (isInList(user._id, docWord.highlightsFindings)) {
            hasFinding = true;
        }
        if (isInList(user._id, docWord.highlightsBackground)) {
            hasBackground = true;
        }
    });

    if (hasPurpose === true && hasMechanism === true && hasFinding === true && hasBackground === true) {
        return true;
    } else {
        return false;
    }
}
