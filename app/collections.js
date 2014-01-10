Teams = new Meteor.Collection("teams",{
  transform: function(team) {
    team.getCharacters = function() {
      return Characters.find({team: team._id}).fetch();
    };

    team.getCharactersIds = function() {
      return Characters.find({team: team._id}).map(function (character) {
        return character._id;
      });
    };

    return team;
  }
});

Characters = new Meteor.Collection("characters", {
  transform: function (character) {
    var attrs = character.attributes;
    /*
     * Methods for getting stats, derived from attributes
     */

    character.getHitPoints = function() {
      return attrs.strength * 100;
    }

    character.getMana = function() {
      return attrs.magic ? attrs.magic * 100 : 0;
    }

    character.getStamina = function() {
      var stamina =
        (attrs.strength * 0.75) +
        (attrs.agility * 0.55) +
        (attrs.psyche * 0.12);

      return parseInt(stamina * 10, "10");
    }

    /*
     * Return the amounts for this specific game.
     */
    character.getState = function() {
      var state = {};

      if (character.state.hitPoints === -1) {
        state.hitPoints = character.getHitPoints();
      } else {
        state.hitPoints = character.state.hitPoints;
      }

      if (character.state.mana === -1) {
        state.mana = character.getMana();
      } else {
        state.mana = character.state.mana;
      }

      if (character.state.stamina === -1) {
        state.stamina = character.getStamina();
      } else {
        state.stamina = character.state.stamina;
      }

      return state;
    }

    character.getDamage = function() {
      var damage =
        (attrs.combat * 0.75) +
        (attrs.strength * 1.25);

      return parseInt(damage * 10, "10");
    }

    character.getMagicResistance = function() {
      var resistance =
        (attrs.agility * 0.25) +
        (attrs.psyche * 0.45);

      return parseInt(resistance * 2, "10");
    }


    return character;
  }
});

Games = new Meteor.Collection("games", {

  transform: function (game) {
    /*
     * Calculate whose turn it is and save it on the game instance.
     * Don't store this on the document since it's derived data.
     */
    var i=0;
    while (!game.currentTurn) {
      if (game.playedThisTurn.indexOf(game.teams[i]) === -1) {
        game.currentTurn = game.teams[i];
      }
      i++;

      // In case something is wrong, don't freeze.
      if (game.playedThisTurn.length === game.teams.length) {
        break;
      }
    };

    return game;
  }
});

Abilities = new Meteor.Collection("abilities");
Events = new Meteor.Collection("events", {
  transform: function(e) {
    // TODO: Move to transform
    e.ability = Abilities.findOne({name: e.ability});
    e.character = Characters.findOne({_id: e.character});
    e.targets = Characters.find({_id: {$in: e.targets}}).fetch();

    /*
     * Check which phase we're in on this event
     */
    var prevReceivedInputs = e.inputs.length;
    e.currentPhaseDefinition = e.ability.phases[prevReceivedInputs];
    e.currentPhaseNr = prevReceivedInputs + 1;

    return e;
  }

});
