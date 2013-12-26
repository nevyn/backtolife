var helpers = {
  /*
   * Check if the team in the current data context
   * has it's turn.
   */
  isItOurTurn: function() {
    var self = Router.getData();

    if (!self.game) return;

    return this._id === self.game.currentTurn;
  }
};

var events = {
  'click #end-turn': function(e, tmpl) {
    Meteor.call('endMyTurn', Router.getData().game._id, function(err, res) {
      console.log(err, res);
    });
  }
};

Template.game.helpers(helpers);
Template.game.events(events);
