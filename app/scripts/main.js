'use strict'

angular.module('folktale', [])
  .controller('MainCtrl', function($scope) {


    /* Cliend Id Stuff */

    var clientId = '106587098408-5m1kfgk8qchcrb4fr6ure33maqr3pg5f.apps.googleusercontent.com';

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
                $scope.showAuth = true;
                button.addEventListener('click', function () {
                    realtimeUtils.authorize(function(response) {
                        start();
                    }, true);
                    });
            } else {
                start();
            }
        }, false);
    }

    /* Initialization */

    var book;
    $scope.page1 = true;

    function Book() {
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
        gapi.drive.realtime.custom.registerType(Book, 'Book');

        book = model.create('Book');
        book.pages = {};

        book.pages.page1 = model.createString();
        book.pages.page2 = model.createString();
        book.pages.page1.setText("I'm page 1!");
        book.pages.page2.setText("I'm page 2!");


        model.getRoot().set('Book', book);
        model.getRoot().set('page1', book.pages.page1);
        model.getRoot().set('page2', book.pages.page2);
    }

    // After a file has been initialized and loaded, we can access the
    // document. We will wire up the data model to the UI.
    function onFileLoaded(doc) {
        var collaborativePage1 = doc.getModel().getRoot().get('page1');
        var collaborativePage2 = doc.getModel().getRoot().get('page2');
        wireTextBoxes(collaborativePage1, collaborativePage2);
    }

    // Connects the text boxes to the collaborative string
    function wireTextBoxes(collaborativePage1, collaborativePage2) {
        var textArea1 = document.getElementById('text_area_1');
        var textArea2 = document.getElementById('text_area_2');

        gapi.drive.realtime.databinding.bindString(collaborativePage1, textArea1);
        gapi.drive.realtime.databinding.bindString(collaborativePage2, textArea2);

    }

    /* Scope functions */
    $scope.nextPage = function() {
        $scope.page1 = false;
        $scope.page2 = true;
    }

    $scope.backPage = function() {
        $scope.page1 = true;
        $scope.page2 = false;
    }

  });