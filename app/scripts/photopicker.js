// Need to select at least 5 photos to proceed
var MIN_PHOTOS_SELECTED = 5;

// The Browser API key obtained from the Google Developers Console.
var developerKey = 'AIzaSyAjOXZ5Ual4zaYrdJkxu06pp5ARRpPEqEg';

// The Client ID obtained from the Google Developers Console. Replace with your own Client ID.
var clientId = "324627207270-ojamt80hdehm8dkup55o8cih0ag4d5j8.apps.googleusercontent.com"

// Scope to use to access user's photos.
var scope = ['https://www.googleapis.com/auth/drive','https://www.googleapis.com/auth/drive.install','https://www.googleapis.com/auth/drive.file'];

var pickerApiLoaded = false;
var oauthToken;

// Use the API Loader script to load google.picker and gapi.auth.
function onApiLoad() {
  gapi.load('auth', {'callback': onAuthApiLoad});
  gapi.load('picker', {'callback': onPickerApiLoad});
  gapi.load('drive-share', init);
}

function onAuthApiLoad() {
  window.gapi.auth.authorize(
      {
        'client_id': clientId,
        'scope': scope,
        'immediate': false
      },
      handleAuthResult);
}

function onPickerApiLoad() {
  pickerApiLoaded = true;
  createPicker();
}

function handleAuthResult(authResult) {
  if (authResult && !authResult.error) {
    oauthToken = authResult.access_token;
    createPicker();
  }
}

// Create and render a Picker object for picking user Photos.
function createPicker() {
  if (pickerApiLoaded && oauthToken) {
    var picker = new google.picker.PickerBuilder().
        enableFeature(google.picker.Feature.MULTISELECT_ENABLED).
        addView(google.picker.ViewId.DOCS_IMAGES).
        setOAuthToken(oauthToken).
        setDeveloperKey(developerKey).
        setCallback(pickerCallback).
        setTitle("Pick background photos").
        build();
    picker.setVisible(true);
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function crop() {
  if ($("#stage-inner").width() > $("#stage-inner").height()) {
      $("#stage-inner").addClass("hamburger");
  } else {
      $("#stage-inner").addClass("hotdog");
  }
}

imageUrls = []
function pickRandomImage() {
  $("#stage-inner").removeClass();
  var randNum = getRandomInt(0, imageUrls.length - 1);
  console.log(imageUrls[randNum]);
  var stage = document.getElementById("stage-inner");
  stage.style.background = '#FBFBFB url("' + imageUrls[randNum] + '") no-repeat';
  stage.style.backgroundSize = "cover";
  // excise chosen one from array
  imageUrls.splice(randNum, 1);
  crop();
}

// A simple callback implementation.
function pickerCallback(data) {
  //console.log("Callback called")
  var url = 'nothing';
  var hackyImageUrl = "http://www.googledrive.com/host/"
  var startIndex = "https://drive.google.com/file/d/".length
  if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
    
    var numPhotosSelected = data[google.picker.Response.DOCUMENTS].length

    // Aggregate selected pictures and pass to Realtime API
    if (numPhotosSelected >= MIN_PHOTOS_SELECTED) {
      var doc = data[google.picker.Response.DOCUMENTS][0];
      console.log(doc);
      url = doc[google.picker.Document.URL];
      imageUrls = []
      for (i = 0; i < numPhotosSelected; i++) {
        // gDriveUrl will be in the form drive.google.com/file/d/0B8xdxa_mkilraGZkNmt1Ql9FT0U/edit?usp=drive_web
        var gDriveUrl = data[google.picker.Response.DOCUMENTS][i][google.picker.Document.URL]

        var imageIdEnd = gDriveUrl.lastIndexOf('/');
        var imageId = gDriveUrl.substring(startIndex, imageIdEnd);
        imageUrls[i] = hackyImageUrl + imageId;     
      }
      imageUrls.splice();

      // var message = 'You picked: ' + url;
      // document.getElementById('result').innerHTML = message;

      // Start function for Realtime API
      start(function() { return imageUrls; });
    
    }
    // Error - user didn't pick enough pictures 
    else {
      alert("You must pick at least " + MIN_PHOTOS_SELECTED + " pictures.");
      createPicker();
    }
  }
  if (data[google.picker.Response.ACTION] == google.picker.Action.CANCEL) {
    // Start function for Realtime API
    start(function() { return null; });
  }
}

init = function() {
    s = new gapi.drive.share.ShareClient('324627207270');
    var id = realtimeUtils.getParam('id');
    s.setItemIds([id]);
}