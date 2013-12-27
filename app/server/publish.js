Meteor.publish('teams-and-characters', function(gameId) {
  if (!this.userId) return;

  // Always publish our own teams
  if (!gameId)
    return Teams.find({owner: this.userId});

  /*
   * Allow people in a game to access
   * all teams in that game.
   */
  if (gameId) {
    var game = GetGameAndCheckPermission(gameId, this.userId);

    return [Characters.find({team: {$in: game.teams}}),
            Teams.find({_id: {$in: game.teams}})];
  }
});

Meteor.publish('games', function() {
  if (!this.userId) return;

  // Publish all games my teams are a part of
  return Games.find({
    teams: {
      $in: Teams.find({owner: this.userId}).map(function(t) {
        return t._id
      })
    }
  });
});

Meteor.publish('abilities', function() {
  return Abilities.find();
});
