var helpers = {
  /*
   * Double check that the character can perform magic before
   * outputting magic abilities.
   *
   * This can be refactored once abilities are better
   * selected on a per-character basis.
   */
  hasAbility: function(characterId) {
    var character = Characters.findOne(characterId);
    var ability = this;

    if (ability.currency === "mana" && character.getMana() === 0) {
      return false;
    }

    return true;
  },
  /*
   * Characters can only perform abilities if:
   * - it's their team's turn,
   * - they don't have any active events,
   * - they can afford the price of the ability.
   */
  canPerformAbility: function(characterId) {
    var data = Router.getData();
    var hasActiveEvents = GetActiveEventsForCharacter(data.game._id, characterId).count();
    var ability = this;
    var character = Characters.findOne(characterId);

    if (!ability) return false;

    /*
     * Determine if we can afford the ability.
     *
     * -1 means variable price, which we can always
     *  allow unless we have 0 in the given currency.
     */
    if (ability.price === -1) {
      if (character.getState()[ability.currency] === 0) {
        var canAfford = false;
      } else {
        var canAfford = true;
      }
    // If it's not variable, check regularly if we can afford it
    } else {
      var canAfford = character.getState()[ability.currency] >= ability.price;
    }

    return !hasActiveEvents && data.isItMyTurn && canAfford;
  }
};

var events = {
  'click #end-turn': function(e, tmpl) {
    Meteor.call('endMyTurn', Router.getData().game._id, function(err, res) {
      console.log(err, res);
    });
  },
  // Perform new ability
  'click .ability': function(e, tmpl) {
    Meteor.call('newAbilityEvent',
                Router.getData().game._id,
                this.name,
                $(e.target).data('character'),
                function(err, res) {
                  console.log(err, res);
                }
    );
  },
  'input input[type="range"]': function(e, tmpl) {
    $('#price-input-value').html(e.target.value);
  },
  /*
   * Submit the form with all inputs to finalize
   * an ability event.
   */
  'submit .abilityEventInput': function(e, tmpl) {
    var self = this;
    e.preventDefault();

    /*
     * Fetch form data
     */
    var inputs = [];
    $(tmpl.find('input[type=text], input[type=radio]:checked, input[type=range], textarea')).each(function (index, el) {
      if (el.value) {
        inputs.push(el.value);
      }
    });

    /*
     * Make sure we have the right amount of data
     */
    if (inputs.length !== self.currentPhaseDefinition.inputs.length) {
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
  },
  'click .cancelAbilityEventInput': function() {
    Meteor.call('cancelAbilityEventInput',
                Router.getData().game._id,
                this._id,
                function(err, res) {
                  console.log(err, res);
                }
    );
  }
};

Template.game.helpers(helpers);
Template.game.events(events);
