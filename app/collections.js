Teams = new Meteor.Collection("teams");
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
      return attrs.mana ? attrs.mana * 100 : 0;
    }

    character.getStamina = function() {
      return parseInt(10 * ((attrs.strength * 0.75) + (attrs.agility * 0.45) + (attrs.psyche * 0.12)), "10");
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
Events = new Meteor.Collection("events");
