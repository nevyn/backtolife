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
        Meteor.subscribe('teams'),
        Meteor.subscribe('games')
      ];
    },

    data: function() {
      var myTeam = Teams.findOne({owner: Meteor.userId()});

      return {
        teams: Teams.find(),
        game: Games.findOne({_id: this.params._id}),
        characters: Characters.find(),
        myCharacters: myTeam ? Characters.find({team: myTeam._id}) : null
      };
    }
  });
});
