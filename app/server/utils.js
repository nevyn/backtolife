getMyTeamsId = function(userId) {
  var team_ids = [];
  Teams.find({owner: userId}).forEach(function (team) {
    team_ids.push(team._id);
  });

  return team_ids;
}
