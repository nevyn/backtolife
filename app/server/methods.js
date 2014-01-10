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
      $set: {
        "state.stamina": -1,
        "state.mana": -1
      }
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

    var paidPrice;

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

        paidPrice = ability.price;
      }
    } else {
      paidPrice: null;
    }

    var e = {
      ability: ability.name,
      state: "started",
      character: character._id,
      game: game._id,
      paidPrice: paidPrice,
      inputs: [],
      targets: [],
      createdAt: new Date()
    };

    Events.insert(e);

    return "Great success";
  },
  'cancelAbilityEventInput': function(gameId, eventId, inputs) {
    var game = GetGameAndCheckPermission(gameId, Meteor.userId());
    var e = GetEventAndCheckPermission(gameId, eventId, Meteor.userId());
    var character = GetCharacterAndCheckPermission(gameId, e.character._id, Meteor.userId());

    // TODO: Give back price if cancelling

    Events.remove(e._id);
  },
  'abilityEventInput': function(gameId, eventId, providedInput) {
    var game = GetGameAndCheckPermission(gameId, Meteor.userId());
    var e = GetEventAndCheckPermission(gameId, eventId, Meteor.userId());

    // TODO: Check permissions for e.character

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
        var cancelThisEvent,
            rollWasSuccessful = providedInput[index] === "success" ? true : false;

        /*
         * Rolls can either be good for the event, or bad for the event.
         *
         * In the case of an Attack, rolling to hit and rolling to defend
         * has inversed effects on the event in the case of a successful
         * dice roll.
         */
        if (input.ifSuccessful === "continue") {
          cancelThisEvent = rollWasSuccessful ? false : true;
        } else if (input.ifSuccessful === "cancel") {
          cancelThisEvent = rollWasSuccessful ? true : false;
        } else {
          throw new Meteor.Error(500, "This dice roll has no success statement.");
        }

        if (cancelThisEvent) {
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
        } else {
          // Great, carry on.
          return;
        }
      } else if (input.type === "target-opponent") {
        var targetId = providedInput[index];

        /*
         * Check that target is part of the game
         */
        var target = Characters.findOne({
          _id: targetId,
            team: {
              $in: game.teams
            }
        });

        if (!target) {
          throw new Meteor.Error(500, "Can't finish ability: Invalid target.")
        } else {
          Events.update(e._id, {
            $addToSet: {
              targets: target._id
            }
          });
        }
      /*
       * Some abilities have variable pricing and need a price input,
       * in stamina or mana.
       */
      } else if (input.type === "price") {
        var price = parseInt(providedInput[index]);

        if (e.paidPrice) {
          throw new Meteor.Error(500, "A price was provided but the event has already been paid for.");
        } else if (e.ability.price !== -1) {
          throw new Meteor.Error(500, "A price was provided but the event does not have variable pricing.");
        }

        // Draw the price from the character
        if (e.character.getState()[e.ability.currency] < price) {
          throw new Meteor.Error(500, "You can't afford this ability.");
        } else {
          var newStateValue = e.character.getState()[e.ability.currency] - price,
              set = {};

          set["state." + e.ability.currency] = newStateValue;

          Characters.update(e.character._id, {
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

    if (e.result === "failure") {
      return "Event failed";
    }

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
      _.each(e.ability.output, function (output) {
        if (output.type === "damage") {
          _.each(e.targets, function(target) {
            var targetChar = Characters.findOne(target._id);
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
      return "Great success, event is done.";
    } else {
    }

    return "Input provided successfully";
  }
});
