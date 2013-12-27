var helpers = {
  /*
   * Check if the team in the current data context
   * has it's turn.
   */
  isItOurTurn: function() {
    var self = Router.getData();

    if (!self.game) return;

    return this._id === self.game.currentTurn;
  },
  getCharacterName: function(characterId) {
    var c = Characters.findOne(characterId);
    return c && c.name;
  }
};

var events = {
  'click #end-turn': function(e, tmpl) {
    Meteor.call('endMyTurn', Router.getData().game._id, function(err, res) {
      console.log(err, res);
    });
  },
  'click .ability': function(e, tmpl) {
    Meteor.call('performAbility',
                Router.getData().game._id,
                $(e.target).data('ability'),
                $(e.target).data('character'),
                function(err, res) {
                  console.log(err, res);
                }
    );
  }
};

Template.game.helpers(helpers);
Template.game.events(events);
