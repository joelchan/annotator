Router.configure({
  layoutTemplate: 'layout',
  loadingTemplate: 'loading',
  waitOn: function() {
    return [
        // Meteor.subscribe('posts'),
        Meteor.subscribe('myUsers'),
        // Meteor.subscribe('documents'),
        // Meteor.subscribe('sentences'),
        // Meteor.subscribe('words')
    ];
  }
});

Router.map(function() {

    // this.route('/', {name: 'postsList'});

    this.route('/posts/:_id', {
        name: 'postPage',
        data: function() { return Posts.findOne(this.params._id); }
    });

    this.route('Land', {
        name: 'Land',
        path: '/',
        template: 'land',
        subscriptions: function()  {
          this.subscribe("documents");
            this.subscribe("myUsers");
        },
        onBeforeAction: function() {
            if (this.ready()) {
                // $('.navbar-brand').text("Annotator: Welcome");
                this.next();
            }
        }
    });

    this.route('Tutorial', {
        name: 'Tutorial',
        path: '/tutorial/:userID',
        template: 'tutorial',
        subscriptions: function() {
            this.subscribe("documents");
        },
        onBeforeAction: function() {
            if(this.ready()) {
                $('.navbar-brand').text("Annotator: Welcome >> Tutorial");
                setCurrentUser(this.params.userID);
                this.next();
            }
        },
    });

    this.route('Annotate', {
        name: 'Annotate',
        path: '/annotate/:userID/:docID',
        template: 'annotationPage',
        subscriptions: function() {
            this.subscribe("documents", {_id: this.params.docID});
            this.subscribe("summaries");
            this.subscribe("sentences", {docID: this.params.docID});
            this.subscribe("words", {docID: this.params.docID});
        },
        waitOn: function() {
            var doc = Documents.findOne({_id: this.params.docID});
            Session.set("currentDoc", doc);
        },
        onBeforeAction: function() {
            if(this.ready()) {
                // var doc = DocumentManager.sampleDocument();
                $('.navbar-brand').text("Annotator: Welcome >> Tutorial >> Main Task");
                setCurrentUser(this.params.userID);
                this.next();
            }
        },
    })

    this.route('Finish', {
        name: 'Finish',
        path: '/finish/:matchID',
        template: 'finishPage',
        subscriptions: function() {
            this.subscribe("singleDocMatch", this.params.matchID);
            // this.subscribe("myUsers");
            this.subscribe("events", {userID: this.params.userID});
        },
        onBeforeAction: function() {
            if(this.ready()) {
                // $('.navbar-brand').text("Annotator: Welcome >> Tutorial >> Main Task >> Finish");
                Session.set("finishedMatchID", this.params.matchID);
                this.next();
            }
        },
    });

    this.route('SearchInstructions', {
        name: 'SearchInstructions',
        path: '/instructions/:userID/:extID/:searchType',
        template: 'SearchInstructions',
        subscriptions: function() {
            this.subscribe("singleDocByExtID", this.params.extID);
            // this.subscribe("myUsers");
            this.subscribe("events", {userID: this.params.userID});
        },
        onBeforeAction: function() {
            if(this.ready()) {
                // $('.navbar-brand').text("Annotator: Welcome >> Tutorial");
                setCurrentUser(this.params.userID);
                Session.set("currentDocExtID", this.params.extID);
                if (this.params.searchType == "m") {
                  Session.set("searchType", "m");
                } else {
                  Session.set("searchType", "p");
                }
                this.next();
            }
        },
    });

    this.route('SearchScaffold', {
      name: 'SearchScaffold',
      path: '/begin/:userID/:docID/:searchType',
      template: 'Scaffold',
      subscriptions: function() {
        this.subscribe('singleDoc', this.params.docID);
        this.subscribe('events', {userID: this.params.userID});
      },
      waitOn: function() {
          setCurrentDoc(this.params.docID);
      },
      onBeforeAction: function() {
          if(this.ready()) {
              // var doc = DocumentManager.sampleDocument();
              $('.navbar-brand').text("Searcher");
              setCurrentUser(this.params.userID);
              if (this.params.searchType == "m") {
                Session.set("searchType", "m");
              } else {
                Session.set("searchType", "p");
              }
              this.next();
          }
      },
    });

    this.route('Search', {
        name: 'Search',
        path: '/search/:userID/:docID/:searchType',
        template: 'AnalogySearcher',
        subscriptions: function() {
            this.subscribe("singleDoc", this.params.docID);
            this.subscribe("specificSummary", this.params.docID);
            // this.subscribe("sentences", {docID: this.params.docID});
            // this.subscribe("words", {docID: this.params.docID});
            this.subscribe("docMatches", this.params.userID, this.params.docID);
            this.subscribe("events", this.params.userID);
            this.subscribe("searches", this.params.userID, this.params.docID);
        },
        waitOn: function() {
            setCurrentDoc(this.params.docID);
        },
        onBeforeAction: function() {
            if(this.ready()) {
                // var doc = DocumentManager.sampleDocument();
                $('.navbar-brand').text("Searcher");
                setCurrentUser(this.params.userID);
                if (this.params.searchType == "m") {
                  Session.set("searchType", "m");
                } else {
                  Session.set("searchType", "p");
                }
                this.next();
            }
        },
    })

})

var setCurrentUser = function(userID) {
    var user = MyUsers.findOne({_id: userID});
    Session.set("currentUser", user);
}

var setCurrentDoc = function(docID) {
    var doc = Documents.findOne({_id: docID});
    Session.set("currentDoc", doc);
}
