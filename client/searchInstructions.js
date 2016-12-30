var logger = new Logger('Client:searchInstructions');

Logger.setLevel('Client:searchInstructions', 'trace');
// Logger.setLevel('Client:searchInstructions', 'debug');
// Logger.setLevel('Client:searchInstructions', 'info');
// Logger.setLevel('Client:searchInstructions', 'warn');

Template.SearchInstructions.helpers({
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

Template.SearchInstructions.events({
    'click .search-instructions-next-1' : function() {
        $('.inst-superficial').show();
    },

    'click .search-instructions-next-2' : function() {
        $('.inst-practice').show();
    },

    'click .test' : function(e) {
        if(e.target.classList.contains("correct")) {
            alert("Correct! They both separate objects (chopped food, food) from a host object (knife, skewer) by causing the host object to pass through another object (clip, slider)");
            $('.search-instructions-next-finish').show();
            EventLogger.logAnalogyTest(1);
        } else {
            alert("Incorrect! While both are about food/drink, they do not solve analogous problems. The cup holder solves the problem of stability, while the Glide and Sliders products both separate objects (chopped food, food) from a host object (knife, skewer) by causing the host object to pass through another object (clip, slider)");
            $('.search-instructions-next-finish').show();
            EventLogger.logAnalogyTest(0);
        }
    },

    'click .search-instructions-next-finish' : function() {
        userID = Session.get("currentUser")._id;
        // var docTitle = Session.get("currentDocTitle") + ".txt";
        var extID = Session.get("currentDocExtID");
        var doc = Documents.findOne({extID: extID});
        if (isInList(userID, doc.annotatedBy)) {
            // var newDoc = DocumentManager.sampleDocument();
            logger.debug("User has already done this doc, sampling a new one...");
            Meteor.call("getNewDoc", Session.get("currentUser"), doc, function(err, result) {
              logger.trace("Sending user to search task with document " + JSON.stringify(doc));
              Router.go("Search", {userID: userID,
                                    docID: doc._id,
                                    searchType: Session.get("searchType")});
            });
        } else {
            logger.trace("Sending user to search task with document " + JSON.stringify(doc));
            Router.go("Search", {userID: userID,
                                    docID: doc._id,
                                    searchType: Session.get("searchType")});
        }
        // EventLogger.logBeginDocument(doc._id);
    },
    'keyup input#userName': function (evt) {
      if(evt.keyCode==13) {
        //console.log("enter released, clicking continue");
        $('#nextPage').click();
      }
    },
});
