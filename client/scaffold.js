var logger = new Logger('Client:Scaffold');

Logger.setLevel('Client:Scaffold', 'trace');
// Logger.setLevel('Client:Scaffold', 'debug');
// Logger.setLevel('Client:Scaffold', 'info');
// Logger.setLevel('Client:Scaffold', 'warn');

Template.Scaffold.helpers({
  title: function() {
    return Session.get("currentDoc").fileName;
  },
  content: function() {
      return Session.get("currentDoc").content;
  },
  sentences: function() {
      return Session.get("currentDoc").sentences;
  },
});

Template.Scaffold.events({
  'click .scaffold-next-finish': function() {
    var descPurpose = $('#docDescription-purpose').val();
    var descMech = $('#docDescription-mech').val();
    var patternPurpose = $('#docPattern-purpose').val();
    var patternMech = $('#docPattern-mech').val();
    if (descPurpose === "" || descMech === "" || patternPurpose === "" || patternMech === "") {
      alert("Please complete both a description and pattern for the product");
    } else {
      var doc = Session.get("currentDoc");
      var user = Session.get("currentUser");
      var description = descPurpose + " [BY] " + descMech;
      DocumentManager.addSummary(doc, "description", description, user);
      var pattern = patternPurpose + " [BY] " + patternMech;
      DocumentManager.addSummary(doc, "pattern", pattern, user);
      Router.go("Search", {userID: Session.get("currentUser")._id,
                           docID: doc._id,
                           searchType: Session.get("searchType")});
    }
  }
});
