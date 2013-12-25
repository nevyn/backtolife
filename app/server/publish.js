Meteor.publish('teams', function(gameId) {
  if (!this.userId) return;

  // Always publish our own teams
  if (!gameId)
    return Teams.find({owner: this.userId});

  /*
   * Allow people in a game to access
   * all teams in that game.
   */
  if (gameId) {
    var game = Games.find({
      teams: {
        $in: getMyTeamsId(this.userId)
      },
      _id: gameId
    });

    if (!game.count()) {
      throw new Meteor.Error(403, "Permission denied");
    }

    return Teams.find({_id: {$in: game.fetch()[0].teams}});
  }
});

Meteor.publish('games', function() {
  if (!this.userId) return;

  // Publish all games my teams are a part of
  return Games.find({
    teams: {
      $in: getMyTeamsId(this.userId)
    }
  });
});
