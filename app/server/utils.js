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

GetCharacterAndCheckPermission = function(gameId, characterId, userId) {
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

  var character = Characters.findOne({
    team: team._id,
    _id: characterId
  });

  if (!character) {
    throw new Meteor.Error(403, "Permission denied, can't access that character.");
  }

  return character;
}
