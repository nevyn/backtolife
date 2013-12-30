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

    /*
     * Reset stamina after my turn
     *
     * TODO: Reset it slowly, not to full
     */
    Characters.update({
      team: team._id
    }, {
      $set: {"state.stamina": -1}
    }, {
      multi: true
    });

    return "Great success";
  },
  /*
   * Handle the click of an ability button.
   *
   * This step starts the ability event. It's possible that other steps conclude it.
   */
  'newAbilityEvent': function(gameId, abilityName, characterId) {
    var game = GetGameAndCheckPermission(gameId, Meteor.userId());
    var character = GetCharacterAndCheckPermission(gameId, characterId, Meteor.userId());
    var ability = Abilities.findOne({name: abilityName});
    var team = GetTeamAndCheckPermission(gameId, Meteor.userId());

    if (game.currentTurn !== team._id) {
      throw new Meteor.Error(500, "Can't make a move - not your turn :)");
    }

    if (!ability) {
      throw new Meteor.Error(500, "No such ability");
    }

    /*
     * Prevent multiple active events
     */
    if (GetActiveEventsForCharacter(gameId, character._id).count()) {
      throw new Meteor.Error(500, "Can't perform another event with this character. Finalize the other event first.");
    }

    var gameEvent = {
      ability: ability.name,
      state: "started",
      character: character._id,
      game: game._id,
      createdAt: new Date()
    };

    Events.insert(gameEvent);

    return "Great success";
  },
  'cancelAbilityEventInput': function(gameId, eventId, inputs) {
    var game = GetGameAndCheckPermission(gameId, Meteor.userId());
    var gameEvent = GetEventAndCheckPermission(gameId, eventId, Meteor.userId());
    var character = GetCharacterAndCheckPermission(gameId, gameEvent.character, Meteor.userId());

    Events.remove(gameEvent._id);
  },
  'abilityEventInput': function(gameId, eventId, inputs) {
    var game = GetGameAndCheckPermission(gameId, Meteor.userId());
    var gameEvent = GetEventAndCheckPermission(gameId, eventId, Meteor.userId());
    var character = GetCharacterAndCheckPermission(gameId, gameEvent.character, Meteor.userId());
    var ability = Abilities.findOne({name: gameEvent.ability});

    // How do you pay to perform this ability?
    if (ability.currency === "stamina") {
      // Is the price variable?
      if (ability.price === -1) {
        // Find the first input demanding an amount, in stamina.
        _.each(ability.input, function(input, i) {
          if (input.type === "amount" && input.max === "stamina") {
            paidPrice = inputs[i];
          }
        });
      } else {
        paidPrice = ability.price;
      }
    }

    // Draw the price from the character
    if (character.getState()[ability.currency] < paidPrice) {
      throw new Meteor.Error(500, "You can't afford this ability.");
    } else {
      var newStateValue = character.getState()[ability.currency] - paidPrice,
          set = {};

      set["state." + ability.currency] = newStateValue;

      Characters.update(character._id, {
        $set: set
      });
    }

    // What's the outcome of the ability?
    _.each(ability.output, function (output) {
      if (output.type === "damage") {
        // Find the first input demanding an opponent
        _.each(ability.input, function(input, i) {
          if (input.type === "opponent") {
            // TODO: validate the character being part of the game
            // TODO: handle death :D
            var targetOpponent = Characters.findOne(inputs[i]),
                newHitPoints = targetOpponent.getState().hitPoints -
                                character.getDamage();

            Characters.update(targetOpponent._id, {
              $set: {
                "state.hitPoints": newHitPoints
              }
            });

            return false;
          }
        });
      }
    });

    // TODO: Validate the input
    Events.update(gameEvent._id, {
      $set: {
        input: inputs,
        paidPrice: paidPrice,
        state: "completed"
      }
    });

    return "Great success";
  }
});
