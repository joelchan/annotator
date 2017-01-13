var dummyQuery = "############################";

Template.Explorer.rendered = function() {
    Session.set("searchQuery", dummyQuery);
}

Template.Explorer.helpers({
    matchingDocs: function() {
        return Documents.find({fileName: Session.get("searchQuery")});
    },
});

Template.Explorer.events({
  'click .search-apply-btn' : function(){
      var query = $('#search-query').val(); // grab query from text form
      Session.set("searchQuery", query);
      $('.search-apply-btn').addClass('btn-success');
  },

  'keyup input' : function(e, target){
      // logger.debug(e);
      // logger.debug(target);
      if(e.keyCode===13) {
        var btn = $('.search-apply-btn')
        btn.click();
      }
  },

  // clear full-text search of idea content
  'click .search-remove-btn' : function(){
      Session.set("searchQuery", dummyQuery);
      $('.search-apply-btn').removeClass('btn-success');
      $('#search-query').val("");
  },
});
