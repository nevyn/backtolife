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
    Meteor.call('newAbilityEvent',
                Router.getData().game._id,
                $(e.target).data('ability'),
                $(e.target).data('character'),
                function(err, res) {
                  console.log(err, res);
                }
    );
  },

  'submit .abilityEventInput': function(e, tmpl) {
    var self = this;
    e.preventDefault();

    /*
     * Fetch form data
     */
    var inputs = [];
    $(tmpl.find('input, textarea')).each(function (index, elem) {
      if (elem.value) {
        inputs.push(elem.value);
      }
    });

    /*
     * Make sure we have the right amount of data
     */
    if (inputs.length !== self.ability.input.length) {
      alert('need all values plz');
    }

    Meteor.call('abilityEventInput',
                Router.getData().game._id,
                self._id,
                inputs,
                function(err, res) {
                  console.log(err, res);
                }
    );
  }
};

Template.game.helpers(helpers);
Template.game.events(events);
