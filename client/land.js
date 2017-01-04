var logger = new Logger('Client:land');

Logger.setLevel('Client:land', 'trace');
// Logger.setLevel('Client:land', 'debug');
// Logger.setLevel('Client:land', 'info');
// Logger.setLevel('Client:land', 'warn');

Template.land.events({
    'click .continue' : function() {
        var userName = $('#userName').val();
        var docData = $('#docTitle').val();
        // if (docExtID == "") {
        //   var newDoc = getRandomElement(Documents.find().fetch());
        //   docTitle = newDoc.fileName.replace(".txt", "");
        // }
        // if (userName == "" || docTitle == "") {
        //     logger.warn("User is not logged in");
        //     alert("You need to have entered both your MTurkID and the docID from the HIT to continue");
        if (userName == "") {
          logger.warn("User is not logged in");
          alert("Please enter a userName - anything will do. Just be sure to remember it if you want to use it again.");
        } else {
            logger.trace("User " + userName + " clicked continue");
            userID = UserManager.loginUser(userName);
            var user = MyUsers.findOne({_id: userID});
            if (docData == "") {
              Meteor.call("getNewDoc", user, function(err, newDoc) {
                Router.go("SearchInstructions", {userID: userID, extID: newDoc.extID, searchType: "p"});
              });
            } else {
              var docDataArr = docData.trim().split("-");
              var docExtID = docDataArr[0];
              var searchType = docDataArr[1];
              Router.go("SearchInstructions", {userID: userID, extID: docExtID, searchType: searchType});
            }
        }
        // Router.go("Tutorial", {userID: userID});
        // if (Meteor.user()) {
        //     logger.trace("Sending user to tutorial");
        //     Router.go("Tutorial");
        // } else {
        //     alert("Please sign in or create an account (in the menu in the top right-hand corner of the page) before continuing");
        // }
    },
    'keyup input#userName': function (evt) {
      if(evt.keyCode==13) {
        //console.log("enter released, clicking continue");
        $('#nextPage').click();
      }
    },
});
