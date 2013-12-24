Meteor.publish('teams', function() {
  if (!this.userId) return;

  return Teams.find({owner: this.userId});
});

Meteor.publish('games', function() {
  if (!this.userId) return;

  var team_ids = [];
  Teams.find({owner: this.userId}).forEach(function (team) {
    team_ids.push(team._id);
  });

  return Games.find({
    teams: {
      $in: team_ids
    }
  });
});
