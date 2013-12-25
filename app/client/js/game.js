var helpers = {
  /*
   * Check if the team in the current data context
   * has it's turn.
   */
  isItOurTurn: function() {
    var self = Router.getData();

    if (!self.game) return;

    return this._id === self.game.currentTurn;
  }
};

Template.game.helpers(helpers);
