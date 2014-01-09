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

      // Not sure why this is needed. Shouldn't waitOn handle this?
      if (!myTeam) return;

      var activeEvents = Events.find({
        state: {$ne: "completed"},
        character: {
          $in: Characters.find({team: myTeam._id}).map(function (c) {
            return c._id
          })
        }
      }).map(function (e) {
        /*
         * TODO: Decide if we are the one to give the input.
        if (!e.currentPhaseDefinition.character === "originator") {
        }
        */

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
                 */
                if (_.has(e.character.attributes, modifier.type)) {
                  var modifyBy = e.character.attributes[modifier.type];
                } else if (modifier.type === "magic-resistance") {
                  var modifyBy = e.character.getMagicResistance();
                } else if (modifier.type === "damage") {
                  var modifyBy = e.character.getDamage();
                }

                /*
                 * The modifier can either boost or decrease your
                 * chances of making the roll.
                 */
                if (modifier.character === "originator") {
                  chance = chance + modifyBy;
                } else {
                  chance = chance - modifyBy;
                }
              });

              /*
               * Since the dice are two d6, convert the chance (in percentage)
               * into a number from 1 to 12.
               */
              chance = 12 - Math.floor(chance * 1.2 / 10);

              input.diceRoll = chance;
            }
          }
        });

        // TODO: if (nextPhase.character === "")

        return e;
      });

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
        myCharacters: Characters.find({team: myTeam._id}),
        opponentsCharacters: Characters.find({team: {$ne: myTeam._id}}),
        isItMyTurn: myTeam._id === game.currentTurn
      };
    }
  });
});
