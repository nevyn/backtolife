Template.home.events({
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
		  descr: descr});

    Session.set("showAddTeam", null);
  }
});
