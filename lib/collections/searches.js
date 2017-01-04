var logger = new Logger('collections:Searches');

Logger.setLevel('collections:Searches', 'trace');
// Logger.setLevel('collections:Searches', 'debug');
// Logger.setLevel('collections:Searches', 'info');
// Logger.setLevel('collections:Searches', 'warn');

Searches = new Mongo.Collection('searches');

Search = function(query, matchData, seed, user, searchType) {

    this.time = new Date().getTime();

    this.query = query;

    this.matches = matchData

    this.seedDocID = seed._id;

    this.userID = user._id;

    this.searchType = searchType;

}

SearchManager = (function() {
    return {
        newSearch: function(query, matchData, searchType) {
            /******************************************************************
             *****************************************************************/
            var user = Session.get("currentUser");
            var currentDoc = Session.get("currentDoc");
            var search = new Search(query, matchData, currentDoc, user, searchType);
            search._id = Searches.insert(search);
            return search;
            // return getRandomElement(documents);
        },
    }
}());
