var logger = new Logger('Client:tutorial');

Logger.setLevel('Client:tutorial', 'trace');
// Logger.setLevel('Client:tutorial', 'debug');
// Logger.setLevel('Client:tutorial', 'info');
// Logger.setLevel('Client:tutorial', 'warn');

LocalWords = new Mongo.Collection(null);
var currentStart = 0;
var currentEnd = 0;

Template.tutorial.rendered = function() {
  Session.set("highlightState", "none");


}

Template.tutorial.helpers({
  testWords1: function() {
    return LocalWords.find({docID: "ex1"}).fetch();;
  },
  testWords2: function() {
    return LocalWords.find({docID: "ex2"}).fetch();;
  },
  goldWords1: function() {
    return goldTutorialWords['ex1'];
  },
  goldWords2: function() {
    return goldTutorialWords['ex2'];
  },
  highlightDescription: function() {
    if (!Session.equals("highlightState", "none")) {
      return highlightDescriptions[Session.get("highlightState")]
    } else {
      return "are just words";
    }
  },
  statusBackground: function() {
    if (Session.equals("highlightState", "background")) {
      return "ing";
    } else {
      return "";
    }
  },
  statusPurpose: function() {
    if (Session.equals("highlightState", "purpose")) {
      return "ing";
    } else {
      return "";
    }
  },
  statusMechanism: function() {
    if (Session.equals("highlightState", "mechanism")) {
      return "ing";
    } else {
      return "";
    }
  },
  statusFinding: function() {
    if (Session.equals("highlightState", "finding")) {
      return "ing";
    } else {
      return "";
    }
  },
  statusUnmark: function() {
    if (Session.equals("highlightState", "unmark")) {
      return "ing";
    } else {
      return "";
    }
  },
  score1: function() {
    // return scoreTutorial("ex1");
    return Session.get("score1");
  },
  score2: function() {
    return Session.get("score2");
    // return scoreTutorial("ex2")
  }
})

Template.goldWord.helpers({
    keyType: function() {
      var userID = "gold";
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
});

Template.tutorial.events({
    'mouseup': function(event) {
      // catch mouseups that happen if ppl are too quick when switching highlights
      if (Session.equals("isHighlighting", true)) {
        logger.debug("Mouse up out of the doc, ending highlight...");
        Session.set("isHighlighting", false);
      }
    },
    'click .test1' : function() {
      var user = Session.get("currentUser");
      var score = scoreTutorial("ex1");
      var highlights = LocalWords.find({docID: "ex1"}).fetch();
      EventLogger.logCheckTutorialAccuracy(user, score, highlights)
      var dataStatus = checkData("ex1");
      if (dataStatus === "allGood") {
        $('.gold-example-1').show();
        // $('trial-result-filler').hide();
        $('#trial-result-1').show();
        $('.trial-names-1').show();
        $('.next-example').prop('disabled', false);
        UserManager.recordTutorialAccuracy(user, score, highlights, "ex1")
        Session.set("score1", score);
      } else {
        alert(checkWarnings[dataStatus])
      }
      // // var dataOk = true;
      // if (isAnnotatedBy(Session.get("currentUser")) && mostlyAnnotatedBy(Session.get("currentUser"))) {
      //   alert("")
      // } else if (!isAnnotatedBy(Session.get("currentUser"))) {
      //   alert("Please use all of the highlight types! " +
      //   "If you really think one of the highlight types is missing from the abstract, just mark a random punctuation with it.");
      // } else if (!mostlyAnnotatedBy(Session.get("currentUser"))) {
      //   alert("Please highlight all of the relevant parts of the abstract! " +
      //   "Most abstracts only have 1 sentence at most that doesn't fit into our highlight types.");
      // } else {
      //   $('.gold-example').toggle();
      //   $('.trial-result').toggle();
      // }
    },
    'click .test2' : function() {
      var user = Session.get("currentUser");
      var score = scoreTutorial("ex2");
      var highlights = LocalWords.find({docID: "ex2"}).fetch();
      EventLogger.logCheckTutorialAccuracy(user, score, highlights)
      var dataStatus = checkData("ex2");
      if (dataStatus === "allGood") {
        $('.gold-example-2').show();
        // $('trial-result-filler').hide();
        $('#trial-result-2').show();
        $('.trial-names-2').show();
        $('.continue').prop('disabled', false);
        UserManager.recordTutorialAccuracy(user, score, highlights, "ex2");
        Session.set("score2", score);
      } else {
        alert(checkWarnings[dataStatus])
      }
    },
    'click .to-first-example': function() {
      $('#example-1').show();
    },
    'click .next-example': function() {
      $('#example-2').show();
      $('html, body').animate({
        scrollTop: $("#example-2").offset().top
      }, 1250);
    },
    'click .continue' : function() {
        logger.debug("User clicked continue");
        EventLogger.logFinishTutorial();
        var user = Session.get("currentUser");
        if (user) {
            var doc = DocumentManager.sampleDocument(user._id);
            logger.trace("Sending user to annotation task with document " + JSON.stringify(doc));
            Router.go("Annotate", {userID: user._id,
                                    docID: doc._id});
        } else {
            logger.warn("User is not logged in");
            alert("You need to have entered your MTurkID to continue");
            Router.go("Land")
        }
    },
    'click #init-purpose': function(event) {
      var user = Session.get("currentUser");
      if (mostlyAnnotatedBy(user, "ex2", .66)) {
        $('#init-purpose-container').hide();
        $('#purpose-highlight-container').show();
        $('.test2').prop("disabled", false);
        $('.purpose').click();
      } else {
        alert("Please highlight most of the document first before highlighting the purpose elements!")
      }

    },
    'click .init-highlight': function(event) {
      var button = event.currentTarget;
      $('.init-highlight').removeClass("active-" + Session.get("highlightState"));
      $('.highlight-description').show();
      $('.highlight-description').removeClass("key-" + Session.get("highlightState"));
      if (!isInList("unmark", button.classList)) {
        if (isInList("purpose", button.classList)) {
          Session.set("highlightState", "purpose");
        } else if (isInList("mechanism", button.classList)) {
          Session.set("highlightState", "mechanism");
        } else if (isInList("finding", button.classList)) {
          Session.set("highlightState", "finding");
        } else if (isInList("background", button.classList)) {
          Session.set("highlightState", "background");
        } else {
        }
        // button.classList.add("active-" + Session.get("highlightState"));
        $('.highlight-description').addClass("key-" + Session.get("highlightState"));
      } else {
        Session.set("highlightState", "unmark");
        $('.highlight-description').hide();
      }
      button.classList.add("active-" + Session.get("highlightState"));
    },
});

Template.tutorialWord.rendered = function(){
  // var doc = Session.get("currentDoc");
  // logger.trace("Current doc: " + JSON.stringify(doc));
  // var dbWords = Words.find({docID: doc._id}).fetch();
  // logger.trace(dbWords.length + "dbWords");
  // if (LocalWords.find().count() < 1) { // newly created local
  //   // LocalWords = new Mongo.Collection(null);
  //   dbWords.forEach(function(word) {
  //     // logger.trace("Inserting word " + JSON.stringify(word) + " into local words collection");
  //     LocalWords.insert(word);
  //   });
  // } else { // refreshed, or going from next page
  //   var randomWord = LocalWords.findOne();
  //   if (!randomWord.hasOwnProperty("sentenceID")) {
  //     // reset if we're coming from the tutorial page
  //     LocalWords = new Mongo.Collection(null);
  //     dbWords.forEach(function(word) {
  //       // logger.trace("Inserting word " + JSON.stringify(word) + " into local words collection");
  //       LocalWords.insert(word);
  //     });
  //   }
  // }
  // logger.trace(LocalWords.find().count() + "local words");
  logger.debug("Rendered word...");
}

Template.tutorialWord.helpers({
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
});

Template.tutorialWord.events({
    'mousedown .token': function(event) {
      if (Session.get("highlightState") != "none") {
          logger.debug("Begin highlight");
          Session.set("isHighlighting", true);
          var word = event.currentTarget;
          logger.trace(word.innerHTML);
          var wordID = trimFromString(word.id, "word-");
          // currentStart.s = Sentences.findOne(Words.findOne(wordID).sentenceID).psn;
          currentStart = LocalWords.findOne(wordID).globalPsn;
          logger.trace("Current start: " + currentStart);
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
        // logger.trace(word.innerHTML);
        var wordID = trimFromString(word.id, "word-");
        // currentEnd.s = Sentences.findOne(Words.findOne(wordID).sentenceID).psn;
        // currentEnd.w = Words.findOne(wordID).sequence;
        currentEnd = LocalWords.findOne(wordID).globalPsn;
        logger.trace("Current start: " + currentStart);
        logger.trace("Current end: " + currentEnd);

        var wordDocID = LocalWords.findOne(wordID).docID;
        var selectedWords = LocalWords.find({docID: wordDocID,
                                        globalPsn: {$gte: currentStart,
                                                    $lte: currentEnd}
                                        }).fetch();
        logger.trace("Selected words: " + selectedWords);
        // mark all of these words
        selectedWords.forEach(function(w) {
          markWord(w._id);
        });
      }
    },
})

var scoreTutorial = function(docID) {
  var highlightedWords = LocalWords.find({docID: docID}, {sort: { globalPsn : 1 }}).fetch();
  // logger.trace("Highlighted words: " + JSON.stringify(highlightedWords));
  var goldWords = goldTutorialWords[docID]
  // logger.trace("Checking against goldwords: " + JSON.stringify(goldWords));
  goldWords.sort(function(a, b) {return a.globalPsn - b.globalPsn});
  var numCorrect = 0;
  for (i=0; i < highlightedWords.length; i++) {
    if (highlightType(highlightedWords[i]) === highlightType(goldWords[i])) {
      numCorrect += 1;
    }
  }
  var score = numCorrect/highlightedWords.length*100;
  var scoreStr = score.toString().substring(0,4) + "%"
  logger.trace("tutorial score for " + docID + ": " + scoreStr);
  return scoreStr;
}

var highlightType = function(word) {
  /*
  Might regret writing this. Dumb greedy function that just
  returns the last highlight field in the list of fields that has any user who marked it.
  */
  var fields = [
    "highlightsPurpose",
    "highlightsMechanism",
    "highlightsFindings",
    "highlightsBackground",
  ]
  var result = "none";
  fields.forEach(function(field) {
    if (word[field].length > 0) {
      result = field;
    }
  });
  return result;
}

highlightDescriptions = {
  "purpose": "What is the specific thing that the paper's authors want to do or know?",
  "mechanism": "How did the paper's authors do it or find out?",
  "finding": "Did it work? What did the paper's authors find out?",
  "background": "What is the intellectual context of this work? What other (higher-level) goals/questions can be furthered by this work? How might this help other research(ers)?",
  "unmark": "",
}

// Template.tutorialSentence.helpers({
//     sampleWords : function() {
//         var sentence = "Suntime has advantages over each of these because it records the intensity of sun exposure with the time of day of that exposure, provides a permanent paper record and operates with no batteries or electronics."
//         var words = sentence.split(" ");
//         var wordObjects = [];
//         for (i=0; i < words.length; i++) {
//             var w = {_id: i, content: words[i]}
//             wordObjects.push(w);
//         }
//         logger.trace("Tutorial words: " + JSON.stringify(wordObjects))
//         return wordObjects;
//     }
// });

// Template.tutorialSentence.events({
//     'click .key-option': function(event) {
//         var selection = event.currentTarget;
//         // var keyType = selection.innerText;
//         // console.log(selection);
//         var word = selection.parentNode.previousElementSibling;
//         // console.log(word);
//         var wordID = "#" + word.id;
//         var wordText = $(wordID).text().trim();
//         userID = Session.get("currentUser")._id;
//         logger.trace(userID + " clicked on " + wordText + " with id " + wordID);
//         if (selection.classList.contains("purp")) {
//             $(wordID).addClass('key-purpose');
//             $(wordID).removeClass('key-mechanism');
//             $(wordID).removeClass('key-neutral');
//             EventLogger.logMarkTutorialWord(wordText, "Purpose");
//         } else if (selection.classList.contains("mech")) {
//             $(wordID).removeClass('key-purpose');
//             $(wordID).addClass('key-mechanism');
//             $(wordID).removeClass('key-neutral');
//             EventLogger.logMarkTutorialWord(wordText, "Mechanism");
//         } else {
//             $(wordID).removeClass('key-purpose');
//             $(wordID).removeClass('key-mechanism');
//             $(wordID).addClass('key-neutral');
//             EventLogger.logMarkTutorialWord(wordText, "Unmark");
//         }
//     }
// });
