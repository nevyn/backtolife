Router.map(function () {
  this.route('home', {
    path: '/',

    waitOn: function() {
      return [
        Meteor.subscribe('teams'),
        Meteor.subscribe('games')
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
        // TODO: Move to transform
        e.ability = Abilities.findOne({name: e.ability});
        e.character = Characters.findOne({_id: e.character});

        /*
         * Determine which phase we're in by checking
         * how much input has already been received
         * in this event.
         */
        var receivedInputs = e.inputs.length;
        var nextPhase = e.ability.phases[receivedInputs];

        /*
         * Decide if we are the one to give the input.
         */
        if (nextPhase.character === "originator") {
          e.currentPhase = nextPhase;
        }
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
