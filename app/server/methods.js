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

    if (ability.price && ability.price !== -1) {
      // Draw the price from the character
      if (character.getState()[ability.currency] < ability.price) {
        throw new Meteor.Error(500, "You can't afford this ability.");
      } else {
        var newStateValue = character.getState()[ability.currency] - ability.price,
            set = {};

        set["state." + ability.currency] = newStateValue;

        Characters.update(character._id, {
          $set: set
        });
      }
    }

    var e = {
      ability: ability.name,
      state: "started",
      character: character._id,
      game: game._id,
      paidPrice: ability.price,
      inputs: [],
      createdAt: new Date()
    };

    Events.insert(e);

    return "Great success";
  },
  'cancelAbilityEventInput': function(gameId, eventId, inputs) {
    var game = GetGameAndCheckPermission(gameId, Meteor.userId());
    var e = GetEventAndCheckPermission(gameId, eventId, Meteor.userId());
    var character = GetCharacterAndCheckPermission(gameId, e.character._id, Meteor.userId());

    Events.remove(e._id);
  },
  'abilityEventInput': function(gameId, eventId, providedInput) {
    var game = GetGameAndCheckPermission(gameId, Meteor.userId());
    var e = GetEventAndCheckPermission(gameId, eventId, Meteor.userId());

    // TODO: These are available on the e instance. Get rid of them but solve
    // permission checking in some other way.
    console.log(e.character._id);
    var character = GetCharacterAndCheckPermission(gameId, e.character._id, Meteor.userId());
    var ability = Abilities.findOne({name: e.ability.name});

    /*
     * Make sure we've got the amount of input we need
     */
    if (e.currentPhaseDefinition.inputs.length && !providedInput.length) {
      throw new Meteor.Error(500, "No input provided.");
    }

    /*
     * Okay, we've got the input, let's loop it through and handle it
     */
    _.each(e.currentPhaseDefinition.inputs, function (input, index) {
      if (input.type === "probability") {
        var rollOutcome = providedInput[index];
        if (rollOutcome === "success") {
          // Great, carry on
          return;
        } else {
          return false;

          /*
           * Event failed, stop processing inputs
           * and flag it as "completed"
           */
          Events.update(e._id, {
            $set: {
              result: "failure",
              state: "completed"
            }
          });
        }
      } else if (input.type === "target-opponent") {
        // TODO: Check that the opponent is part of the game
        // TODO: Add the opponent into 'targets' on the event

      /*
       * Some abilities have variable pricing and need a price input,
       * in stamina or mana.
       */
      } else if (input.type === "price") {
        var price = providedInput[i];
        check(price, Number);

        if (e.paidPrice) {
          throw new Meteor.Error(500, "A price was provided but the event has already been paid for.");
        } else if (ability.price !== -1) {
          throw new Meteor.Error(500, "A price was provided but the event does not have variable pricing.");
        }

        // Draw the price from the character
        if (character.getState()[ability.currency] < price) {
          throw new Meteor.Error(500, "You can't afford this ability.");
        } else {
          var newStateValue = character.getState()[ability.currency] - price,
              set = {};

          set["state." + ability.currency] = newStateValue;

          Characters.update(character._id, {
            $set: set
          });

          Events.update(e._id, {
            $set: {
              paidPrice: price,
            }
          });
        }
      }
    });

    // Re-fetch game instance after updates
    var e = GetEventAndCheckPermission(gameId, eventId, Meteor.userId());
    var isLastPhase = e.ability.phases.length === e.inputs.length + 1;

    if (!isLastPhase) {
      /*
       * It's not the last phase, just add the input and let the
       * event remain active (without a "completed" flag).
       */
      Events.update(e._id, {
        $addToSet: {
          inputs: providedInput
        }
      });
    } else if (isLastPhase) {
      if (!e.paidPrice) {
        throw new Meteor.Error(500, "An ability wanted to finish but no price has been paid.");
      }

      /*
       * What's the outcome of the ability?
       */
      _.each(ability.output, function (output) {
        if (output.type === "damage") {
          _.each(e.targets, function(target) {
            var targetChar = Characters.findOne(target);
            newHitPoints = targetChar.getState().hitPoints -
                            e.character.getDamage();

            Characters.update(targetChar._id, {
              $set: {
                "state.hitPoints": newHitPoints
              }
            });
          });
        }
      });

      /*
       * Okay, we're done!
       */
      Events.update(e._id, {
        $addToSet: {
          inputs: providedInput
        },
        $set: {
          result: "success",
          state: "completed"
        }
      });
    } else {
    }

    return "Great success";
  }
});
