'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
  'ngRoute',
  'myApp.view1',
  'myApp.view2',
  'myApp.version'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/view1'});
}]);

var clientId = '106587098408-3eedm395hnoh8ge37dm7phvpspe3boso.apps.googleusercontent.com';

if (!/^([0-9])$/.test(clientId[0])) {
  alert('Invalid Client ID - did you forget to insert your application Client ID?');
}
// Create a new instance of the realtime utility with your client ID.
var realtimeUtils = new utils.RealtimeUtils({ clientId: clientId });

authorize();

function authorize() {
  // Attempt to authorize
  realtimeUtils.authorize(function(response){
    if(response.error){
      // Authorization failed because this is the first time the user has used your application,
      // show the authorize button to prompt them to authorize manually.
      var button = document.getElementById('auth_button');
      button.classList.add('visible');
      button.addEventListener('click', function () {
        realtimeUtils.authorize(function(response){
          start();
        }, true);
      });
    } else {
        start();
    }
  }, false);
}

function start() {
  // With auth taken care of, load a file, or create one if there
  // is not an id in the URL.
  var id = realtimeUtils.getParam('id');
  if (id) {
    // Load the document id from the URL
    realtimeUtils.load(id.replace('/', ''), onFileLoaded, onFileInitialize);
  } else {
    // Create a new document, add it to the URL
    realtimeUtils.createRealtimeFile('New Quickstart File', function(createResponse) {
      window.history.pushState(null, null, '?id=' + createResponse.id);
      realtimeUtils.load(createResponse.id, onFileLoaded, onFileInitialize);
    });
  }
}

// The first time a file is opened, it must be initialized with the
// document structure. This function will add a collaborative string
// to our model at the root.
function onFileInitialize(model) {
  var string = model.createString();
  string.setText('Welcome to the Quickstart App!');
  model.getRoot().set('demo_string', string);
  addPage();
}

function doValueChanged() {
  console.log("something changed!");
}

function addPage() {
  Page = function() {}
  gapi.drive.realtime.custom.registerType(Page, 'Page');
  Page.prototype.narration = gapi.drive.realtime.custom.collaborativeField('narration');

  var page = model.create('Page');
  page.narration = "testing123";
  console.log(page);
  model.getRoot().set('page', page);
  page.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, doValueChanged);
}

// After a file has been initialized and loaded, we can access the
// document. We will wire up the data model to the UI.
function onFileLoaded(doc) {
  var collaborativeString = doc.getModel().getRoot().get('demo_string');
  var page = doc.getModel().getRoot().get('page');
  wireTextBoxes(collaborativeString, page);
}

// Connects the text boxes to the collaborative string
function wireTextBoxes(collaborativeString, page) {
  var textArea1 = document.getElementById('text_area_1');
  var textArea2 = document.getElementById('text_area_2');
  gapi.drive.realtime.databinding.bindString(collaborativeString, textArea1);
  gapi.drive.realtime.databinding.bindString(collaborativeString, textArea2);

  var textArea3 = document.getElementById('text_area_3');
  gapi.drive.realtime.databinding.bindString(page.narration, textArea3);

}