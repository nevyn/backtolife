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
  }
});
