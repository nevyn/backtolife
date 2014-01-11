Router.map(function () {
  this.route('home', {
    path: '/',

    waitOn: function() {
      return [
        Meteor.subscribe('games'),
        Meteor.subscribe('teams-and-characters')
      ];
    },

    data: function() {
      return {
        teams: Teams.find(),
        games: Games.find()
      }
    }
  });

  this.route('game', {
    path: 'games/:_id',

    waitOn: function() {
      return [
        Meteor.subscribe('games'),
        Meteor.subscribe('abilities'),
        Meteor.subscribe('events', this.params._id),
        Meteor.subscribe('teams-and-characters', this.params._id)
      ];
    },

    data: function() {
      var game = Games.findOne({_id: this.params._id}),
          myTeam = Teams.findOne({
            owner: Meteor.userId(),
            _id: {$in: game? game.teams : []}
          });

      if (myTeam) {

        var activeEvents = Events.find({
          state: {$ne: "completed"},
          $or: [
            {
              character: {
                $in: myTeam.getCharactersIds()
              }
            },
            {
              targets: {
                $in: myTeam.getCharactersIds()
              }
            }
          ]
        }).map(function (e) {

          var currentPlayerOriginated = myTeam.getCharactersIds().indexOf(e.character._id) !== -1;
          var phaseOwner = e.currentPhaseDefinition.character;

          if (phaseOwner === "originator") {
            e.ourTurn = currentPlayerOriginated ? true : false;
          } else if (phaseOwner === "target") {
            e.ourTurn = currentPlayerOriginated ? false : true;
          } else {
            throw new Meteor.Error(500, "Something went wrong. Unknown whose turn it is.");
          }
          e.opponents = currentPlayerOriginated ? e.targets : [e.character];

          if (e.ourTurn) {
            /*
             * If the current input phase has any dice rolls, determine the
             * probability of making it.
             */
            _.each(e.currentPhaseDefinition.inputs, function (input) {
              if (input.type === "probability") {
                if (!input.chance) return;

                // Base chance
                var chance = input.chance;

                /*
                 * Modifiers - the things that change the base chance
                 * of making the roll. These are normally attributes of the
                 * originating or target character.
                 *
                 * For example, if the "Attack" ability has a 50% base chance
                 * of hitting, and the modifier is "combat", the chance of hitting
                 * willing be 50 + the attacker's combat skill.
                 */
                if (input.modifiers) {
                  _.each(input.modifiers, function (modifier) {
                    /*
                     * Check if the modifier is a character attribute, such as
                     * "combat", "strength", etc
                     *
                     * TODO: Don't always get these values from the originator,
                     * sometimes the modifier wants the targets stats :)
                     */
                    if (_.has(e.character.attributes, modifier.type)) {
                      var modifyBy = e.character.attributes[modifier.type];
                    } else if (modifier.type === "magic-resistance") {
                      var modifyBy = e.character.getMagicResistance();
                    } else if (modifier.type === "damage") {
                      var modifyBy = e.character.getDamage();
                    }

                    /*
                     * The modifier can either increase or decrease your
                     * chances of making the roll.
                     */
                    if (modifier.result === "increase") {
                      chance = chance + modifyBy;
                    } else if (modifier.result === "decrease") {
                      chance = chance - modifyBy;
                    } else {
                      throw new Meteor.Error(500, "Ability implemented improperly - modifier needs a 'result' key.");
                    }
                  });

                  /*
                   * Since the dice are two d6, convert the chance (in percentage)
                   * into a number from 1 to 12.
                   */
                  chance = 12 - Math.floor(chance * 1.2 / 10);

                  /*
                   * The best die roll is always 2+, meaning you can
                   * always fuck up, no matter how good you are.
                   *
                   * The worst die roll is always 12+, meaning you can
                   * always m ake it, no matter how bad you are.
                   */
                  if (chance < 2) {
                    chance = 2;
                  } else if (chance > 12) {
                    chance = 12;
                  }

                  input.diceRoll = chance;
                }
              }
            });
          }

          return e;
        });
      } else {
        activeEvents = [];
      }

      return {
        teams: Teams.find(),
        myTeam: myTeam,
        game: game,
        abilities: Abilities.find(),
        history: Events.find({
            state: "completed"
        }, {
          sort: {
            createdAt: -1
          }
        }),
        activeEvents: activeEvents,
        characters: Characters.find(),
        myCharacters: myTeam ? Characters.find({team: myTeam._id}) : [],
        opponentsCharacters: myTeam ? Characters.find({team: {$ne: myTeam._id}}) : [],
        isItMyTurn: myTeam ? myTeam._id === game.currentTurn : false,
      };
    }
  });
});
