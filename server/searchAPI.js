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
    // return Documents.find({allwords: {$in: expanded}}).fetch();
    var results = Documents.find({$text: {$search: expanded.join(" ")}},
      {fields: {
        score: { $meta: "textScore" }},
        sort: {score: { $meta: "textScore" }}
      }).fetch();
    return results;
    // var result_ids = [];
    // results.forEach(function(r) {
    //   result_ids.push(r._id);
    // });
    // return result_ids;

  },
  getPossible: function(user, currentDoc, searchType) {
      // var user = Session.get("currentUser");
      var docMatches = DocMatches.find({userID: user._id,
        seedDocID: currentDoc._id,
        searchType: searchType
      }).fetch();
      // logger.trace("All matches are: " + JSON.stringify(docMatches));
      var matchingDocs = []
      docMatches.forEach(function(m) {
          if (!m.bestMatch) {
              matchingDocs.push(m.matchDocID);
          }
      });
      logger.trace("Possible match IDs are: " + JSON.stringify(matchingDocs));
      // logger.trace("Possible matches are: " + JSON.stringify(Documents.find({_id: {$in: matchingDocs}}).fetch()));
      return Documents.find({_id: {$in: matchingDocs}}).fetch();
      // return matchingDocs;
  },
  getBest: function(user, currentDoc, searchType) {
      // var user = Session.get("currentUser");
      var docMatches = DocMatches.find({userID: user._id,
        seedDocID: currentDoc._id,
        searchType: searchType
      }).fetch();
      // logger.trace("All matches are: " + JSON.stringify(docMatches));
      var matchingDocs = []
      docMatches.forEach(function(m) {
          if (m.bestMatch) {
              matchingDocs.push(m.matchDocID);
          }
      });
      logger.trace("Best match IDs are: " + JSON.stringify(matchingDocs));
      // logger.trace("Best matches are: " + JSON.stringify(Documents.find({_id: {$in: matchingDocs}}).fetch()));
      return Documents.find({_id: {$in: matchingDocs}}).fetch();
      // return matchingDocs;
  },
  getNewDoc: function(user, currentDoc) {
    var documents;
    if (currentDoc) {
        documents = Documents.find({annotatedBy: {$ne: user._id},
                                    // fileName: {$in: toSample},
                                    _id: {$ne: currentDoc._id}}).fetch();
        if (documents.length < 1) {
            documents = Documents.find({annotatedBy: {$ne: user._id},
                                        _id: {$ne: currentDoc._id}}).fetch();
        }
    } else {
        documents = Documents.find({annotatedBy: {$ne: user._id}}).fetch();
                                    // fileName: {$in: toSample}}).fetch();
        if (documents.length < 1) {
            documents = Documents.find({annotatedBy: {$ne: user._id}}).fetch();
        }
    }
    logger.debug(documents.length + " remaining possible documents to sample from");
    return getRandomElement(documents);
  }
})
