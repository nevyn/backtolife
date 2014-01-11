Meteor.publish('teams-and-characters', function(gameId) {
  if (!this.userId) return;

  if (!gameId) {
    return [Teams.find({owner: this.userId}),
	    Characters.find({
	      team: {
		$in: Teams.find({owner: this.userId}).map(function(t) {
		  return t._id
		})
	      }
	    })];
  }

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

  /*
   * TODO: Publish all games my teams are a part of
  return Games.find({
    teams: {
      $in: Teams.find({owner: this.userId}).map(function(t) {
        return t._id;
      })
    }
  });
  */

  return Games.find();
});

Meteor.publish('events', function(gameId) {
  if (!gameId) return;

  var game = GetGameAndCheckPermission(gameId, this.userId);
  return Events.find({game: gameId});
});

Meteor.publish('abilities', function() {
  return Abilities.find();
});
