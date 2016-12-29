// Meteor.publish('posts', function() {
//   return Posts.find();
// });

Meteor.publish('documents', function() {
  return Documents.find();
});

Meteor.publish('specificDocs', function(docIDs) {
  return Documents.find({_id: {$in: docIDs}});
});

Meteor.publish('singleDoc', function(docID) {
  return Documents.find({_id: docID});
});

Meteor.publish('singleDocByExtID', function(extID) {
  return Documents.find({extID: extID});
});

// Meteor.publish('sentences', function() {
//   return Sentences.find();
// });

// Meteor.publish('words', function() {
//   return Words.find();
// });

Meteor.publish('myUsers', function() {
    return MyUsers.find();
});

Meteor.publish('docMatches', function(userID, seedDocID) {
    return DocMatches.find({userID: userID, seedDocID: seedDocID});
});

Meteor.publish('singleDocMatch', function(matchID) {
    return DocMatches.find({_id: matchID});
});

Meteor.publish('events', function(userID) {
    return Events.find({userID: userID});
});

Meteor.publish("searches", function(userID, seedDocID) {
    return Searches.find({userID: userID, seedDocID: seedDocID});
});
