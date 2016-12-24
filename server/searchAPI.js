var logger = new Logger('Server:SearchAPI');
// Comment out to use global logging level
Logger.setLevel('Server:SearchAPI', 'trace');
// Logger.setLevel('Server:SearchAPI', 'debug');
// Logger.setLevel('Server:SearchAPI', 'info');
// Logger.setLevel('Server:SearchAPI', 'warn');

Meteor.methods({
  lemmaSearch: function(query) {
    /*****************************
    return Documents that have words matching one or more words
    in the given query
    ******************************/
    // get the individual terms in the query
    var terms = query.split(" ");
    var clean_terms = [];
    // screen out stopwords
    terms.forEach(function(term) {
      if (stopwords.indexOf(term) < 0) {
        clean_terms.push(term);
      }
    })
    // add lemma variants of the terms to the search set
    var expanded = clean_terms;
    clean_terms.forEach(function(term) {
      if (words_to_lemmas.hasOwnProperty(term)) {
        var lemma = words_to_lemmas[term];
        if (expanded.indexOf(lemma) < 0) {
          expanded.push(lemma);
        }
      }
    });
    logger.trace("query terms: " + JSON.stringify(expanded));
    // perform the search
    return Documents.find({allwords: {$in: expanded}}).fetch();
  },
  getPossible: function(user, currentDoc) {
      // var user = Session.get("currentUser");
      var docMatches = DocMatches.find({userID: user._id, seedDocID: currentDoc._id}).fetch();
      var matchingDocs = []
      docMatches.forEach(function(m) {
          if (!m.bestMatch) {
              matchingDocs.push(m.matchDocID);
          }
      });
      return Documents.find({_id: {$in: matchingDocs}}).fetch();
  },
  getBest: function(user, currentDoc) {
      // var user = Session.get("currentUser");
      var docMatches = DocMatches.find({userID: user._id, seedDocID: currentDoc._id}).fetch();
      var matchingDocs = []
      docMatches.forEach(function(m) {
          if (m.bestMatch) {
              matchingDocs.push(m.matchDocID);
          }
      });
      return Documents.find({_id: {$in: matchingDocs}}).fetch();
  }
})
