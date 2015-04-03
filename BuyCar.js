Cars = new Mongo.Collection("cars");

if (Meteor.isClient) {
  // This code only runs on the client
  Meteor.subscribe("cars");

  function incompleteCount(){
      return Cars.find({checked: {$ne: true}}).count();
  }
  function cars(){
    if (Session.get("hideSold")) {
      // If hide sold is checked, filter cars
      return Cars.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
    } 
    else {
      // Otherwise, return all of the cars
      return Cars.find({}, {sort: {createdAt: -1}});
    }
  }
  function hideSold(){
    return Session.get("hideSold");
  }


  Template.buycar.helpers({
    cars: cars,
    hideSold: hideSold, 
    incompleteCount: incompleteCount
  });

  Template.header.helpers({
    cars: cars,
    hideSold: hideSold,
    incompleteCount: incompleteCount
  })

  Template.buycar.events({
    "change .hide-sold input": function (event) {
      Session.set("hideSold", event.target.checked);
    },
    "submit .find-car": function (event) {
      var quickSearch = event.target.quickSearch.value;
      var make = event.target.make.value;
      var model = event.target.model.value;
      var price = event.target.price.value;

      Meteor.call("findCar", quickSearch,make,model,price);

      // Clear form
      event.target.quickSearch.value = "";

      // Prevent default form submit
      return false;
    }
  });

  Template.insertCar.events({
    "submit .new-car": function (event) {       // This function is called when the new cars form is submitted
      console.log(event.target.make.value);
      var make = event.target.make.value;
      var model = event.target.model.value;
      var type = "break";                               //event.target.type.value;
      var firstRegistration = event.target.firstRegistration.value;
      var mileage = event.target.mileage.value;
      var power = event.target.power.value;
      var price = event.target.price.value;
      var fuelType = event.target.fuelType.value;
      var gearbox = event.target.gearbox.value;
      var vendorType = event.target.vendorType.value;
      var vendorName = event.target.vendorName.value;
      var vendorAddress = event.target.vendorAddress.value;
      var phoneNumber = event.target.phoneNumber.value;
      var email = event.target.email.value;
      var description = "belle voiture"                        //event.target.description.value;

      console.log("fin var");

      Meteor.call("addCar", make, model, type, firstRegistration, mileage, power, price, fuelType, gearbox, vendorType, vendorName, vendorAddress, phoneNumber, email, description);
      // Clear form
      //event.target.description.value = "";

      // Prevent default form submit
      return false;
    }
  });

  Template.car.events({
    "click .toggle-checked": function () {
      // Set the checked property to the opposite of its current value
      Meteor.call("setChecked", this._id, ! this.checked);
    },
    "click .delete": function () {
      Meteor.call("deleteCar", this._id);
    },
    "click .toggle-private": function () {
      Meteor.call("setPrivate", this._id, ! this.private);
    },
    "click .carDetailsButton": function(){
      var carId = this._id; 
      Session.set('selectedCar', carId);
      var selectedCar = Session.get('selectedCar');
      console.log(selectedCar);
    }
  });

  Template.car.helpers({
    isOwner: function () {
      return this.owner === Meteor.userId();
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
}

Meteor.methods({
  addCar: function (make, model, type, firstRegistration, mileage, power, price, fuelType, gearbox, vendorType, vendorName, vendorAdress, phoneNumber, email, description) {
    
    // Make sure the user is logged in before inserting a car
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    Cars.insert({
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username,
      make: make,
      model: model,
      type: type,
      firstRegistration: firstRegistration,
      mileage: mileage,
      power: power,
      price: price,
      fuelType: fuelType,
      gearbox: gearbox,
      vendorType: vendorType,
      vendorName: vendorName,
      vendorAdress: vendorAdress,
      phoneNumber: phoneNumber,
      email: email,
      description: description
    });
  },

  deleteCar: function (carId) {
    var car = Cars.findOne(carId);
    if (car.private && car.owner !== Meteor.userId()) {
      // If the car is private, make sure only the owner can delete it
      throw new Meteor.Error("not-authorized");
  }

    Cars.remove(carId);
  },

  findCar: function (quickSearch,make,model,price) {
    var carsFound = Cars.find({make:make,model:model,price:price}).fetch(); // expression regulière REGEX (?=.*cuir)(?=.*essence)
    console.log(carsFound);
  },
  setChecked: function (carId, setChecked) {
    var car = Cars.findOne(carId);
    if (car.private && car.owner !== Meteor.userId()) {
      // If the car is private, make sure only the owner can check it off
      throw new Meteor.Error("not-authorized");
    }

    Cars.update(carId, { $set: { checked: setChecked} });
  },

  setPrivate: function (carId, setToPrivate) {
    var car = Cars.findOne(carId);

    // Make sure only the car owner can make a car private
    if (car.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Cars.update(carId, { $set: { private: setToPrivate } });
  },
  goHome: function(){

  }
});

if (Meteor.isServer) {
  // Only publish cars that are public or belong to the current user
  Meteor.publish("cars", function () {
    return Cars.find({
      $or: [
        { private: {$ne: true} },
        { owner: this.userId }
      ]
    });
  }),
  Cars.allow({   //Allows to insert cars into the collection directly from Chrome -> Console
      'insert': function (userId,doc) {
        /* user and doc checks ,
        return true to allow insert */
        return true; 
      }
  });
}