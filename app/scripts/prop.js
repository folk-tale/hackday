//var clientId = '324627207270-ojamt80hdehm8dkup55o8cih0ag4d5j8.apps.googleusercontent.com';

// Ben-han's client ID
var clientId = '355588130388-q160ev44v09s1h2ka76fun7k1cj8ptat.apps.googleusercontent.com';

if (!/^([0-9])$/.test(clientId[0])) {
  alert('Invalid Client ID - did you forget to insert your application Client ID?');
}
// Create a new instance of the realtime utility with your client ID.
var realtimeUtils = new utils.RealtimeUtils({ clientId: clientId });

var model = null;
var photos = null;

// Uncomment for test photos
// var photos = [
//   "http://www.swampdogphotographyworkshops.com/wp-content/uploads/2013/04/MTB-thick-redwoods-HC_V3.jpg",
//   "http://www.redwoods.info/photos%5C475P4trail.bmp",
//   "http://hmbcoastsidetours.com/wp-content/uploads/2014/04/Shining-Through.jpg"
// ];

// This is automatically invoked once Google APIs have finished loading
// (We pass a parameter to the Google API library indicating that authorize 
// is the "on finished" callback function)
function authorize() {
  // Attempt to authorize
  realtimeUtils.authorize(function(response){
    if (response.error){
      // Authorization failed because this is the first time the user has used your application,
      // show the authorization prompt before the photopicker.
      realtimeUtils.authorize(function(response){
        // Invoke photo-picking process (see photopicker.js for def. of onApiLoad())
        onApiLoad();
        userDidAuthorize();
      }, true);
    } else {
        // Invoke photo-picking process (see photopicker.js for def. of onApiLoad())
        onApiLoad();
        userDidAuthorize();
    }
  }, false);
}

// pickPhotos is a callback function that should return a list of URLs
// of photos to use as background images
function start(pickPhotos) {
  // Register custom types.
  // Note this must happen BEFORE the shared document is loaded.
  registerTypes();

  // Pick photos:
  // If it exists, we tack on what was chosen.
  // If it doesn't exist, photos becomes what was chosen.
  photos = (photos) ? photos.concat(pickPhotos()) : pickPhotos();

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
// document structure. Any one-time setup should go here.
function onFileInitialize(model) {
  // 1. Initialize the stage
  var stage = model.create(Stage, "stage-inner", "next-stage", "prev-stage", photos, model);
  model.getRoot().set("stage", stage);
}

// After a file has been initialized and loaded, we can access the
// document. We will wire up the data model to the UI.
function onFileLoaded(doc) {
  model = doc.getModel();

  // Load existing objects
  var keys = model.getRoot().keys();
  for (var i = 0; i < keys.length; i++) {
    if (keys[i] != "searchString") {
      var prop = model.getRoot().get(keys[i]);
      // There's a gotcha here...
      // This only works because every custom class we've registered
      // uses "onload" for the onLoaded event. I can't figure out
      // how to call the onLoaded event, so this works by polymorphism.
      try {
        prop.onload();
      }
      catch (err) {}
    }
  }
}

function registerTypes(model) {

  // Prop class implementation
  function registerProps() {
    Prop = function() {}
    Prop.prototype.id = gapi.drive.realtime.custom.collaborativeField('id');
    Prop.prototype.startX = gapi.drive.realtime.custom.collaborativeField('startX');
    Prop.prototype.startY = gapi.drive.realtime.custom.collaborativeField('startY');
    Prop.prototype.lenX = gapi.drive.realtime.custom.collaborativeField('lenX');
    Prop.prototype.lenY = gapi.drive.realtime.custom.collaborativeField('lenY');
    Prop.prototype.imageURL = gapi.drive.realtime.custom.collaborativeField('imageURL');

    Prop.prototype.init = function(propID, propX, propY, propWidth, propHeight, propURL) {
      this.id = propID;
      this.startX = propX;
      this.startY = propY;
      this.lenX = propWidth;
      this.lenY = propHeight;
      this.imageURL = propURL;
    }

    // This gets called when somebody else adds a prop
    Prop.prototype.onload = function() {
      if (!this.elem) {
        this.elem = document.getElementById(this.id);
        if (!this.elem) {
          this.elem = makeDraggableElement(this.imageURL, this.id);
          console.log("Made the element: " + this.elem);

          // An alternative to this casework is to have it get the
          // parentNode of the element in createPropFromElement
          if (document.getElementById("stage")!==null) {
            document.getElementById("stage").appendChild(this.elem);
            $(this.elem).css({
              'position': 'absolute', 
              'left': this.startX, 
              'top': this.startY,
            });
          }
          else {
            document.body.appendChild(this.elem);
          }

          // Near-duplicate of what's in index.html - probably a good idea
          // to name these functions, define them once, and call them here.
          $(this.elem).hover(
            function() {
              if ($(this).parent().is($('#stage'))) {
                addGrowButton($(this));
                addShrinkButton($(this));
              }
            }, function() {
              $('.grow-button').remove();
              $('.shrink-button').remove();
            }
          );

          props[this.id] = this;
        }
        this.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, this.update);
      }
      this.elem.style.top = this.startY;
      this.elem.style.left = this.startX;
      this.elem.style.width = this.lenX;
      this.elem.style.height = this.lenY;
      $(this.elem).children('img').width(this.lenX);
      $(this.elem).children('img').height(this.lenY);
    }

    Prop.prototype.update = function(event) {
      var prop = event.target;
      prop.elem.style.left = prop.startX;
      prop.elem.style.top = prop.startY;

      //console.log("Left: " + prop.elem.style.left 
      //  + ", top: " + prop.elem.style.top);
      //prop.elem.style.left = prop.startX;
      var $img = $(prop.elem).children('img');

      // So max-width/height doesn't squash it
      if (!$img.css('max-width') || prop.lenX > $img.css('max-width'))
        $img.css('max-width', prop.lenX+"px");
      if (!$img.css('max-height') || prop.lenY > $img.css('max-height'))
        $img.css('max-height', prop.lenY+"px");

      $(prop.elem).children('img').width(prop.lenX);
      $(prop.elem).children('img').height(prop.lenY);
    }

    Prop.prototype.sync = function(stx, sty, width, height) {
      // Update properties from position on page
      this.startX = stx;
      this.startY = sty;
      this.lenX = width;
      this.lenY = height;
    }

    Prop.prototype.delete = function() {
      // ???
    }

    // Register Prop class with Realtime
    gapi.drive.realtime.custom.registerType(Prop, 'Prop');
    gapi.drive.realtime.custom.setInitializer(Prop, Prop.prototype.init);
    gapi.drive.realtime.custom.setOnLoaded(Prop, Prop.prototype.onload);
  }

  function registerScene() {
    Scene = function() {}
    Scene.prototype.key = gapi.drive.realtime.custom.collaborativeField('key');
    Scene.prototype.active = gapi.drive.realtime.custom.collaborativeField('active');
    Scene.prototype.backgroundURL = gapi.drive.realtime.custom.collaborativeField('backgroundURL');

    Scene.prototype.init = function(id, url, model) {
      this.index = id;
      this.active = false;
      this.backgroundURL = url;

      // Collaborative string updates are handled automatically so we don't
      // have to mark them as a collaborativeField above, like we do with other
      // properties.
      this.key = "_scene_description_" + id;
      var description = model.createString();
      description.setText(this.key);
      model.getRoot().set(this.key, description);
    }

    // This gets called when somebody else joins the session
    // and needs to create the current scene
    Scene.prototype.onload = function() {
      this.active ? this.show() : this.stash();
      this.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, this.update);
    }

    // This gets called when a scene goes from active to not
    // active, or vice versa. Basically, on a scene change.
    Scene.prototype.update = function(event) {
      var scene = event.target;
      scene.active ? scene.show() : scene.stash();
    }

    // Hides this scene - remove props
    Scene.prototype.stash = function() {
      // Right now, nothing to do
      // Later: remove props
    }

    // Show this scene - add props back, bind description to search field
    Scene.prototype.show = function() {
      // Bind current scene description to search field
      var model = gapi.drive.realtime.custom.getModel(this);
      var description = model.getRoot().get(this.key);
      var searchField = document.getElementById("queryfield");
      if (Scene.prototype.binding) {
        Scene.prototype.binding.unbind();
        delete Scene.prototype.binding;
      }
      Scene.prototype.binding = gapi.drive.realtime.databinding.bindString(description, searchField);

      // Update stage background
      var stage = document.getElementById("stage-inner");
      stage.style.background = '#FBFBFB url("' + this.backgroundURL + '") no-repeat';
      stage.style.backgroundSize = 'cover';
    }

    // Register Scene class with Realtime
    gapi.drive.realtime.custom.registerType(Scene, 'Scene');
    gapi.drive.realtime.custom.setInitializer(Scene, Scene.prototype.init);
    gapi.drive.realtime.custom.setOnLoaded(Scene, Scene.prototype.onload);
  }

  function registerStage() {
    Stage = function() {}
    Stage.prototype.stageId = gapi.drive.realtime.custom.collaborativeField('stageId');
    Stage.prototype.forwardId = gapi.drive.realtime.custom.collaborativeField('forwardId');
    Stage.prototype.backwardId = gapi.drive.realtime.custom.collaborativeField('backwardId');
    Stage.prototype.backgroundCount = gapi.drive.realtime.custom.collaborativeField('backgroundCount');
    Stage.prototype.currentBackgroundIndex = gapi.drive.realtime.custom.collaborativeField('currentBackgroundIndex');

    // One-time init for a stage
    Stage.prototype.init = function(stageId, forwardId, backwardId, backgrounds, model) {
      this.stageId = stageId;
      this.forwardId = forwardId;
      this.backwardId = backwardId;
      this.backgroundCount = backgrounds.length;
      this.currentBackgroundIndex = 0;

      // Create a Scene for every available background
      for (var i = 0; i < this.backgroundCount; i++) {
        var scene = model.create(Scene, i, backgrounds[i], model);
        model.getRoot().set("_scene_" + i, scene);
      }
    }

    // This gets called when somebody else joins the session
    // and needs to create and sync the stage
    Stage.prototype.onload = function() {
      if (!this.elem) {
        this.elem = document.getElementById(this.stageId);
        this.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, this.update);

        // Wire up forward button
        var stage = this;
        var forwardButton = document.getElementById(this.forwardId);
        forwardButton.addEventListener("click", function() {
          stage.flipForward();
        });

        // Wire up back button
        var backwardButton = document.getElementById(this.backwardId);
        backwardButton.addEventListener("click", function() {
          stage.flipBackwards();
        });

        // Locate all scene objects
        var model = gapi.drive.realtime.custom.getModel(this);
        this.scenes = [];
        for (var i = 0; i < this.backgroundCount; i++) {
          this.scenes.push(model.getRoot().get("_scene_" + i));
        }
      }
      // Show the active scene and hide all other scenes
      for (var i = 0; i < this.scenes.length; i++) {
        this.scenes[i].active = (i == this.currentBackgroundIndex);
      }
    }

    // Gets called whenever the stage is modified
    // (E.g. page flip)
    Stage.prototype.update = function(event) {
      var stage = event.target;
      // Show the active scene and hide all other scenes
      /*for (var i = 0; i < stage.scenes.length; i++) {
        var scene = stage.scenes[i];
        scene.active = (i == stage.currentBackgroundIndex);
      }*/
    }

    // Flips forward to the next page
    Stage.prototype.flipForward = function() {
      if (this.currentBackgroundIndex + 1 < this.backgroundCount) {
        this.currentBackgroundIndex++;
      }
    }

    // Flips back to the previous page
    Stage.prototype.flipBackwards = function() {
      if (this.currentBackgroundIndex - 1 >= 0 && this.backgroundCount > 0) {
        this.currentBackgroundIndex--;
      }
    }

    // Register stage class with Realtime
    gapi.drive.realtime.custom.registerType(Stage, 'Stage');
    gapi.drive.realtime.custom.setInitializer(Stage, Stage.prototype.init);
    gapi.drive.realtime.custom.setOnLoaded(Stage, Stage.prototype.onload);
  }

  registerProps();
  registerScene();
  registerStage();
}

//----- Begin wrapper API -----//

function makeDraggableElement(url, id) {
  var img = document.createElement('img');
  img.src = url;
  img.className = "hidden";
  img.onload = function() { this.className = "result"; }

  var div = document.createElement('div');
  div.className = "img-wrapper";
  div.id = id;

  div.appendChild(img);

  $(div).draggable({
    revert: "invalid",
    drag: function() {
      if (props[this.id]) {
        // Might not work if first child is a button
        props[this.id].sync(this.style.left, 
          this.style.top, 
          this.childNodes[0].style.width, 
          this.childNodes[0].style.height);
      }

      // Send $(this).position() over the internet, or do an RPC
      $('#content').css('overflow', 'visible');
    },
    stack: "div", // #stage div?
    stop: function() {
      $('#content').css('overflow-y', 'auto');
    }
  });
  return div;
}

/* Creates a new prop on the stage
 * Parameters:
 * propID (string) - CSS id for the prop
 * propX (string) - x-coordinate of top left corner of the prop
 * propY (string) - y-coordinate of top right corner of the prop
 * propWidth (string) - width of the prop
 * propHeight (string) - height of the prop
 * propURL (string) - image URL for the prop
 */
function addProp(propID, propX, propY, propWidth, propHeight, propURL) {
  var prop = model.create(Prop, propID, propX, propY, propWidth, propHeight, propURL);
  model.getRoot().set(propID, prop);
  return prop;
}

function createPropFromElement(elem) {
  return addProp(elem.id, 
    elem.style.left, 
    elem.style.top, 
    elem.childNodes[0].style.width,
    elem.childNodes[0].style.height,
    elem.childNodes[0].src);
}

function addGrowButton($imgWrapper) {
  var growButton = document.createElement('button');
  growButton.className = "grow-button";
  growButton.innerHTML = "+";
  $imgWrapper.append(growButton);
  $(growButton).css({position: 'absolute', left: 10, top: 10});

  // Grow button click callback - increases it 
  $(growButton).click(function(event) {

    console.log("Original Left: " + $imgWrapper.get(0).style.left 
      + ", top: " + $imgWrapper.get(0).style.top);
    $imgWrapper = $(this).parent();
    var scaleFactor = 1.5;
    var $img = $(this).siblings('img');
    var aspectRatio = $img.width()*1.0/$img.height();
    console.log("Aspect ratio: " + aspectRatio);


    $img.width($img.width()*scaleFactor);
    $img.height($img.height()*scaleFactor); 

    // Updating max size based on position (and aspect ratio)
    var x = $imgWrapper.position().left;
    var y = $imgWrapper.position().top;

    console.log("X: " + x + ", y: " + y);
    console.log("Left: " + $imgWrapper.get(0).style.left 
      + ", top: " + $imgWrapper.get(0).style.top);

    // Probably semantically cleaner to move this max-width/height 
    // code to the draw function
    var absoluteMaxWidth = $("#stage").width() - x;
    var absoluteMaxHeight = $("#stage").height() - y;
    
    var scaledMaxWidth = absoluteMaxHeight * aspectRatio;
    var newMaxWidth = Math.min(absoluteMaxWidth, scaledMaxWidth);

    var scaledMaxHeight = newMaxWidth / aspectRatio;
    var newMaxHeight = Math.min(absoluteMaxHeight, scaledMaxHeight);

    $img.css({
      'max-width': newMaxWidth + "px",
      'max-height': newMaxHeight + "px"
    });

    var propId = $imgWrapper.attr('id');
    console.log(props);
    props[propId].sync(x, y, $img.width(), $img.height());

  });
}

function addShrinkButton($imgWrapper) {
  var shrinkButton = document.createElement('button');
  shrinkButton.className = "shrink-button";
  shrinkButton.innerHTML = "-";
  $imgWrapper.append(shrinkButton);
  $(shrinkButton).css({position: 'absolute', left: 35, top: 10});

  // Grow button click callback - increases it 
  $(shrinkButton).click(function(event) {

    var scaleFactor = 0.67;
    var $img = $(this).siblings('img');
    var aspectRatio = $img.width()*1.0/$img.height();

    $img.width($img.width()*scaleFactor);
    $img.height($img.height()*scaleFactor); 
    
    var propId = $(this).parent().attr('id');
    props[propId].sync(
      $(this).parent().position().left, 
      $(this).parent().position().top,
      $img.width(), 
      $img.height());
  });
}