Template.home.events({
  /*
   * Creating teams
   */
  'click #new-team': function (e, tmpl) {
    Session.set("showAddTeam", true);
  },
  'click #cancel-add-team': function (e, tmpl) {
    Session.set("showAddTeam", null);
  },
  'click input.add': function (e,tmpl) {
    name = tmpl.find("#team").value;
    descr = tmpl.find("#description").value;

    if (!name) {
      alert('Need a name please');
      return;
    }

    Teams.insert({name: name,
		  owner: Meteor.userId(),
		  descr: descr
    });

    Session.set("showAddTeam", null);
  },

  /*
   * Creating games
   */
  'click #new-game': function (e, tmpl) {
    Session.set("showAddGame", true);
  },
  'click #cancel-add-game': function (e, tmpl) {
    Session.set("showAddGame", null);
  },
  'submit #create-game': function (e,tmpl) {
    name = tmpl.find("#game-name").value;

    if (!name) {
      alert('Need a name please');
      return;
    }

    Games.insert({name: name,
		  teams: [],
      turnNr: 1,
      playedThisTurn: [],
      createdAt: new Date(),
      name: name
    });

    Session.set("showAddGame", null);
  }
});
