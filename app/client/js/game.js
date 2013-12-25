var helpers = {
  /*
   * Check if the team in the current data context
   * has it's turn.
   *
   * TODO: Should we store the turn as an id in the game instead?
   */
  isItOurTurn: function() {
    var self = Router.getData(),
        nextTeam;

    if (!self.game) return;

    _.each(self.game.teams, function(team) {
      if (self.game.playedThisTurn.indexOf(team._id) === -1) {
        if (!nextTeam) {
          nextTeam = team;
        }
      }
    });

    return this._id === nextTeam;
  },
  /*
   * Return the id of the next turn.
   *
   * TODO: Should this return the team instance instead?
   */
  getTurnOwner: function() {
    var self = this,
        nextTeam;

    if (!self.game) return;

    _.each(self.game.teams, function(team) {
      if (self.game.playedThisTurn.indexOf(team._id) === -1) {
        if (!nextTeam)
          nextTeam = team;
      }
    });

    return nextTeam;
  }
};

Template.game.helpers(helpers);
