Teams = new Meteor.Collection("teams");
Characters = new Meteor.Collection("characters");

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
    };

    return game;
  }
});

Abilities = new Meteor.Collection("abilities");
Events = new Meteor.Collection("events");
