GetGameAndCheckPermission = function(gameId, userId) {
  var game = Games.findOne({_id: gameId});

  if (!game) {
    throw new Meteor.Error(404, "No such game");
  }

  var team = Teams.findOne({
    owner: userId,
    _id: {$in: game.teams}
  });

  if (!team) {
    throw new Meteor.Error(403, "Permission denied, you're not part of this game.");
  }

  return game;
}

GetTeamAndCheckPermission = function(gameId, userId) {
  var game = Games.findOne({_id: gameId});

  if (!game) {
    throw new Meteor.Error(404, "No such game");
  }

  var team = Teams.findOne({
    owner: userId,
    _id: {$in: game.teams}
  });

  if (!team) {
    throw new Meteor.Error(403, "Permission denied, you're not part of this game.");
  }

  return team;
}
