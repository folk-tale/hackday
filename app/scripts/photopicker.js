// Need to select at least 5 photos to proceed
var MIN_PHOTOS_SELECTED = 3;

// The Browser API key obtained from the Google Developers Console.
var developerKey = 'AIzaSyAjOXZ5Ual4zaYrdJkxu06pp5ARRpPEqEg';

var pickerApiLoaded = false;

// Use the API Loader script to load google.picker and gapi.auth.
function onApiLoad(oauthToken) {
  gapi.load('picker', {'callback': onPickerApiLoad(oauthToken)});
  gapi.client.load('drive', 'v2', insertPermission);
  /* // for sharing specifically with one person - more secure for later
  gapi.load('drive-share', shareInit); */
}

function onPickerApiLoad(oauthToken) {
  pickerApiLoaded = true;
  createPicker(oauthToken);
}

// Create and render a Picker object for picking user Photos.
function createPicker(oauthToken) {
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

// A simple callback implementation.
function pickerCallback(data) {
  if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
    // Add selected images to current story
    var numPhotosSelected = data[google.picker.Response.DOCUMENTS].length;
    if (numPhotosSelected >= MIN_PHOTOS_SELECTED) {

      // Image URLs will be in the form: baseImageUrl + imageId
      var baseImageUrl = "http://www.googledrive.com/host/";

      // Extract URLs of selected images
      var imageUrls = [];
      var startIndex = "https://drive.google.com/file/d/".length;
      for (i = 0; i < numPhotosSelected; i++) {
        var doc = data[google.picker.Response.DOCUMENTS][i];

        // gDriveUrl will be in the form: 
        // http://drive.google.com/file/d/0B8xdxa_mkilraGZkNmt1Ql9FT0U/edit?usp=drive_web
        // We just want to extract the image ID from the end:
        var gDriveUrl = doc[google.picker.Document.URL];
        var imageId = gDriveUrl.substring(startIndex, gDriveUrl.lastIndexOf('/'));

        imageUrls[i] = baseImageUrl + imageId;     
      }

      // Add a new scene for each selected image
      addScenes(imageUrls);
    }
    // Error - user didn't pick enough pictures 
    else {
      alert("You must pick at least " + MIN_PHOTOS_SELECTED + " pictures.");
      createPicker();
    }
  }
  else if (data[google.picker.Response.ACTION] == google.picker.Action.CANCEL) {
    // Do nothing
  }
}

shareInit = function() {
  s = new gapi.drive.share.ShareClient('324627207270');
  var id = realtimeUtils.getParam('id');
  s.setItemIds([id]);
}

/**
 * Allow anyone signed in to edit file.
 */
function insertPermission() {
  var id = realtimeUtils.getParam('id');
  var body = {
    'type': 'anyone',
    'role': 'writer'
  };
  var request = gapi.client.drive.permissions.insert({
    'fileId': id,
    'resource': body
  });
  request.execute(function(resp) { });
}