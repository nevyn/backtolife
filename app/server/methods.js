function checkLoggedIn() {
  if (!Meteor.userId()) throw new Meteor.Error(404, "Not logged in");
}

Meteor.methods({
  'endMyTurn': function(gameId) {
    checkLoggedIn();
    check(gameId, String);
    var game,
        team,
        turnsLeft = false;

    game = GetGameAndCheckPermission(gameId, Meteor.userId());
    team = GetTeamAndCheckPermission(gameId, Meteor.userId());

    /*
     * Add current team to 'playedThisTurn'
     * only if we haven't done that before.
     */
    Games.update({
      _id: gameId,
      playedThisTurn: {$nin: [team._id]}
    }, {
      $push: {
        playedThisTurn: team._id
      }
    });

    /*
     * Move on to the next turn if all teams have played.
     */
    Games.update({
      _id: gameId,
      playedThisTurn: {$all: game.teams}
    }, {
      $set: {
        playedThisTurn: []
      },
      $inc: {
        turnNr: 1
      }
    });

    return "Great success";
  },
  /*
   * Handle the click of an ability button.
   *
   * This step starts the ability event. It's possible that other steps conclude it.
   */
  'newAbilityEvent': function(gameId, abilityName, characterId) {
    var game = GetGameAndCheckPermission(gameId, Meteor.userId());
    var character = GetCharacterAndCheckPermission(gameId, characterId, Meteor.userId());
    var ability = Abilities.findOne({name: abilityName});

    if (!ability) {
      throw new Meteor.Error(500, "No such ability");
    }

    var gameEvent = {
      ability: ability.name,
      state: "started",
      character: character._id,
      game: game._id,
      createdAt: new Date()
    };

    //TODO: ability.target

    Events.insert(gameEvent);

    return "Great success";
  },

  'abilityEventInput': function(gameId, eventId) {
    // do some magic
  }
});
