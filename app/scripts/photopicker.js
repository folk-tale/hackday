// Need to select exactly 6 photos to proceed
var NUM_PHOTOS_REQUIREMENT = 6;

// The Browser API key obtained from the Google Developers Console.
var developerKey = 'AIzaSyAjOXZ5Ual4zaYrdJkxu06pp5ARRpPEqEg';

var pickerApiLoaded = false;

// Use the API Loader script to load google.picker and gapi.auth.
function onApiLoad(oauthToken) {
  gapi.load('picker', {'callback': onPickerApiLoad(oauthToken)});
  gapi.client.load('drive', 'v2', function(){insertPermission(realtimeUtils.getParam('id'))});
  /* // for sharing pop up
  gapi.load('drive-share', shareInit); */
}

function onPickerApiLoad(oauthToken) {
  pickerApiLoaded = true;
  // if photos haven't been added already, create picker
  if (model && (model.getRoot().get('stage').scenes.length < NUM_PHOTOS_REQUIREMENT)) {
      createPicker(oauthToken);
  }
}

// Create and render a Picker object for picking user Photos.
function createPicker(oauthToken) {
  if (pickerApiLoaded && oauthToken) {
    var uploadView = new google.picker.DocsUploadView();
    var picker = new google.picker.PickerBuilder().
        enableFeature(google.picker.Feature.MULTISELECT_ENABLED).
        addView(uploadView).
        addView(google.picker.ViewId.DOCS_IMAGES).
        setOAuthToken(oauthToken).
        setDeveloperKey(developerKey).
        setCallback(function(data){pickerCallback(data,oauthToken)}).
        setTitle("Where should your story take place? Select 6 background photos!").
        build();
    picker.setVisible(true);
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// A simple callback implementation.
function pickerCallback(data, oauthToken) {
  if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
    // Add selected images to current story
    var numPhotosSelected = data[google.picker.Response.DOCUMENTS].length;
    if (numPhotosSelected == NUM_PHOTOS_REQUIREMENT) {

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

        // add permission that anyone with link can view photo
        insertPermission(imageId);
        imageUrls[i] = baseImageUrl + imageId;     
      }

      // Add a new scene for each selected image
      addScenes(imageUrls);
    }
    // Error - user didn't pick enough pictures 
    else {
      alert("You must select " + NUM_PHOTOS_REQUIREMENT + " pictures to start the story.");
      createPicker(oauthToken);
    }
  }
  else if (data[google.picker.Response.ACTION] == google.picker.Action.CANCEL) {
    alert("You must select " + NUM_PHOTOS_REQUIREMENT + " pictures to start the story.");
    createPicker(oauthToken);
  }
}

/* shareInit = function() {
  s = new gapi.drive.share.ShareClient('324627207270');
  var id = realtimeUtils.getParam('id');
  s.setItemIds([id]);
} */

/**
 * Allow anyone signed in to edit file.
 */
function insertPermission(fileId) {
  var body = {
    'type': 'anyone',
    'role': 'writer'
  };
  var request = gapi.client.drive.permissions.insert({
    'fileId': fileId,
    'resource': body
  });
  request.execute(function(resp) { });
}

// function insertPermission(fileId, userId) {
//   if (userId) {
//     console.log('specific user can access');
//     var body = {
//       'type': 'user',
//       'role': 'owner',
//       'id': userId
//     };
//   } else {
//     alert('Error: no userid');
//   }
//   var request = gapi.client.drive.permissions.insert({
//     'fileId': fileId,
//     'resource': body
//   });
//   request.execute(function(resp) { });
// }