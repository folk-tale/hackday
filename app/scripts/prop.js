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
var firstLoad = false;

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
  // Initialize the stage
  var stage = model.create(Stage, "stage-inner", "next-stage", "prev-stage", photos, model);
  model.getRoot().set("stage", stage);
  firstLoad = true;
}

// After a file has been initialized and loaded, we can access the
// document. We'll fetch all existing collaborative objects and
// update the UI to show the current state of those objects
// (hidden, visible, etc.)
function onFileLoaded(doc) {
  model = doc.getModel();
  var keys = model.getRoot().keys();
  for (var i = 0; i < keys.length; i++) {
    var obj = model.getRoot().get(keys[i]);
    try {
      obj.onload();
    }
    // Only our custom objects will have onload() defined,
    // so we can catch and ignore errors for default objects
    catch (err) {}
  }

  // Allow new users to contribute photos as well
  if (!firstLoad) {
    var stage = model.getRoot().get("stage");
    stage.addScenes(photos);
  }
}

function registerTypes(model) {

  // Prop class implementation
  function registerProps() {
    Prop = function() { /* See Realtime-friendly init function below */ }
    Prop.prototype.id = gapi.drive.realtime.custom.collaborativeField('id');
    Prop.prototype.left = gapi.drive.realtime.custom.collaborativeField('left');
    Prop.prototype.top = gapi.drive.realtime.custom.collaborativeField('top');
    Prop.prototype.width = gapi.drive.realtime.custom.collaborativeField('width');
    Prop.prototype.height = gapi.drive.realtime.custom.collaborativeField('height');
    Prop.prototype.imageURL = gapi.drive.realtime.custom.collaborativeField('imageURL');
    Prop.prototype.active = gapi.drive.realtime.custom.collaborativeField('active');

    // This gets called by the person creating the prop. 'Init' only happens
    // once in the lifetime of a prop. Other people will see 'onload' instead. 
    //
    // Constructor requires:
    // id (string) - CSS id of the DOM element
    // left (string) - CSS 'left' property of the DOM element
    // top (string) - CSS 'top' property of the DOM element
    // width (string) - CSS 'width' property of the img inside the DOM element
    // height (string) - CSS 'height' property of the img inside the DOM element
    // imageURL (string) - URL to the prop's image
    Prop.prototype.init = function(id, left, top, width, height, imageURL) {
      this.id = id;
      this.left = left;
      this.top = top;
      this.width = width;
      this.height = height;
      this.imageURL = imageURL;
      this.active = true;
    }

    // This gets called when somebody else adds a prop
    Prop.prototype.onload = function() {
      // Fetch this prop's corresponding DOM element and hold on to it
      if (!this.elem) {
        this.elem = document.getElementById(this.id);

        // Element doesn't exist yet? Then create it.
        if (!this.elem) {
          this.elem = makeDraggableElement(this.imageURL, this.id);
          this.elem.style.position = "absolute";
          var stage = document.getElementById("stage");
          (stage) ? stage.appendChild(this.elem) : document.body.appendChild(this.elem);

          // Set up hover callbacks
          $(this.elem).hover(
            // On mouse enter, add +/- buttons
            function() {
              if ($(this).parent().is($('#stage'))) {
                addGrowButton($(this));
                addShrinkButton($(this));
              }
            }, 
            // On mouse leave, remove +/- buttons
            function() {
              $('.grow-button').remove();
              $('.shrink-button').remove();
            }
          );

          props[this.id] = this;
        }
        this.img = $(this.elem).children('img');
        this.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, this.update);
      }
      $(this.elem).css({"top": this.top, "left": this.left});
      $(this.elem).css("display", (this.active) ? "inline-block" : "none");
      $(this.img).width(this.width).height(this.height);
    }

    Prop.prototype.update = function(event) {
      if (!event.isLocal) {
        // Update position, visibility, and dimensions
        var prop = event.target;
        $(prop.elem).css({"top": prop.top, "left": prop.left});
        $(prop.elem).css("display", (prop.active) ? "inline-block" : "none");
        $(prop.img).width(prop.width).height(prop.height);

        // Set max-width and max-height styles on the image to prevent
        // them from growing outside the stage bounds
        if (!$(prop.img).css('max-width') || prop.width > $(prop.img).css('max-width'))
          $(prop.img).css('max-width', prop.width + "px");
        if (!$(prop.img).css('max-height') || prop.height > $(prop.img).css('max-height'))
          $(prop.img).css('max-height', prop.height + "px");
      }
    }

    Prop.prototype.sync = function() {
      // Update properties based on from position of DOM element on page.
      // Changing these properties will automatically trigger a call to
      // Prop.prototype.update in all active user sessions.
      this.left = $(this.elem).css("left");
      this.top = $(this.elem).css("top");
      this.width = $(this.img).css("width");
      this.height = $(this.img).css("height");
    }

    Prop.prototype.stash = function() {
      this.active = false;
      // Apply local change immediately
      this.elem.style.display = "none";
    }

    Prop.prototype.show = function() {
      this.active = true;
      // Apply local change immediately
      this.elem.style.display = "inline-block";
    }

    Prop.prototype.delete = function() {
      var model = gapi.drive.realtime.custom.getModel(this);
      model.getRoot().delete(gapi.drive.realtime.custom.getId(this));
    }

    // Register Prop class with Realtime
    gapi.drive.realtime.custom.registerType(Prop, 'Prop');
    gapi.drive.realtime.custom.setInitializer(Prop, Prop.prototype.init);
    gapi.drive.realtime.custom.setOnLoaded(Prop, Prop.prototype.onload);
  }

  function registerScene() {
    Scene = function() { /* See Realtime-friendly init function below */ }
    Scene.prototype.props = gapi.drive.realtime.custom.collaborativeField('props');
    Scene.prototype.active = gapi.drive.realtime.custom.collaborativeField('active');
    Scene.prototype.description = gapi.drive.realtime.custom.collaborativeField('description');
    Scene.prototype.backgroundURL = gapi.drive.realtime.custom.collaborativeField('backgroundURL');

    Scene.prototype.init = function(id, url, model) {
      this.index = id;
      this.active = false;
      this.backgroundURL = url;
      this.props = model.createList();

      this.description = model.createString();
      this.description.setText("_scene_description_" + id);
    }

    // Adds a prop to this scene
    Scene.prototype.addProp = function(prop) {
      this.props.push(prop);
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
      for (var i = 0; i < this.props.length; i++) {
        this.props.get(i).stash();
      }
    }

    // Show this scene - add props back, bind description to search field
    Scene.prototype.show = function() {
      // Bind current scene description to search field
      var searchField = document.getElementById("queryfield");
      if (Scene.prototype.binding) {
        Scene.prototype.binding.unbind();
        delete Scene.prototype.binding;
      }
      Scene.prototype.binding = gapi.drive.realtime.databinding.bindString(this.description, searchField);

      // Update stage background
      var stage = document.getElementById("stage-inner");
      stage.style.background = '#FBFBFB url("' + this.backgroundURL + '") no-repeat';
      stage.style.backgroundSize = 'cover';

      // Show owned props
      for (var i = 0; i < this.props.length; i++) {
        this.props.get(i).show();
      }
    }

    // Register Scene class with Realtime
    gapi.drive.realtime.custom.registerType(Scene, 'Scene');
    gapi.drive.realtime.custom.setInitializer(Scene, Scene.prototype.init);
    gapi.drive.realtime.custom.setOnLoaded(Scene, Scene.prototype.onload);
  }

  function registerStage() {
    Stage = function() { /* See Realtime-friendly init function below */ }
    Stage.prototype.stageId = gapi.drive.realtime.custom.collaborativeField('stageId');
    Stage.prototype.forwardId = gapi.drive.realtime.custom.collaborativeField('forwardId');
    Stage.prototype.backwardId = gapi.drive.realtime.custom.collaborativeField('backwardId');
    Stage.prototype.sceneIndex = gapi.drive.realtime.custom.collaborativeField('currentBackgroundIndex');
    Stage.prototype.scenes = gapi.drive.realtime.custom.collaborativeField('scenes');

    // One-time init for a stage
    Stage.prototype.init = function(stageId, forwardId, backwardId, backgrounds, model) {
      this.stageId = stageId;
      this.forwardId = forwardId;
      this.backwardId = backwardId;
      this.sceneIndex = 0;
      this.scenes = model.createList();

      // Create a Scene for every available background
      for (var i = 0; i < backgrounds.length; i++) {
        var scene = model.create(Scene, i, backgrounds[i], model);
        model.getRoot().set("_scene_" + i, scene);
        this.scenes.push(scene);
      }
    }

    // This gets called when somebody else joins the session
    // and needs to create and sync the stage
    Stage.prototype.onload = function() {
      if (!Stage.prototype.didSetup) {
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

        // Register update function
        this.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, this.update);

        Stage.prototype.didSetup = true;
      }
      // Show the active scene and hide all other scenes
      for (var i = 0; i < this.scenes.length; i++) {
        this.scenes.get(i).active = (i == this.sceneIndex);
      }
    }

    // Gets the current scene on the stage
    Stage.prototype.currentScene = function() {
      return this.scenes.get(this.sceneIndex);
    }

    // Adds more scenes to this stage
    Stage.prototype.addScenes = function(backgrounds) {
      var model = gapi.drive.realtime.custom.getModel(this);
      var oldCount = this.scenes.length;
      for (var i = oldCount; i < oldCount + backgrounds.length; i++) {
        var scene = model.create(Scene, i, backgrounds[i - oldCount], model);
        model.getRoot().set("_scene_" + i, scene);
        this.scenes.push(scene);
      }
    }

    // Gets called whenever the stage is modified
    // (E.g. page flip)
    Stage.prototype.update = function(event) {
      if (!event.isLocal) {
        var stage = event.target;
        for (var i = 0; i < stage.scenes.length; i++) {
          stage.scenes.get(i).active = (i == stage.sceneIndex);
        }
      }
    }

    // Flips forward to the next page.
    // Changing sceneIndex automatically triggers a call to
    // Stage.prototype.update across all active user sessions.
    Stage.prototype.flipForward = function() {
      if (this.sceneIndex + 1 < this.scenes.length) {
        this.sceneIndex++;
      }
    }

    // Flips back to the previous page
    // Changing sceneIndex automatically triggers a call to
    // Stage.prototype.update across all active user sessions.
    Stage.prototype.flipBackwards = function() {
      if (this.sceneIndex - 1 >= 0 && this.scenes.length > 0) {
        this.sceneIndex--;
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

function makeDraggableElement(url, id, additionalClass) {
  var img = document.createElement('img');
  img.src = url;
  img.className = "hidden";
  img.onload = function() { this.className = "result"; }

  var div = document.createElement('div');
  div.style.display = "inline-block";
  div.classList.add("img-wrapper");
  div.classList.add(additionalClass);
  div.id = id;

  div.appendChild(img);

  $(div).draggable({
    revert: "invalid",
    drag: function() {
      if (props[this.id]) {
        // Might not work if first child is a button
        props[this.id].sync();
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
  // Create prop
  var prop = model.create(Prop, propID, propX, propY, propWidth, propHeight, propURL);
  model.getRoot().set(propID, prop);

  // Add prop to current scene
  var stage = model.getRoot().get("stage");
  var currentScene = stage.currentScene();
  currentScene.addProp(prop);

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
    props[propId].sync();

  });
}

function addShrinkButton($imgWrapper) {
  var shrinkButton = document.createElement('button');
  shrinkButton.className = "shrink-button";
  shrinkButton.innerHTML = "-";
  $imgWrapper.append(shrinkButton);
  $(shrinkButton).css({position: 'absolute', left: 35, top: 10});

  // Grow button click callback.
  // Scales prop down to 2/3 of its size and syncs
  // changes across active sessions.
  $(shrinkButton).click(function(event) {
    var scaleFactor = 0.67;
    var $img = $(this).siblings('img');
    $img.width($img.width() * scaleFactor);
    $img.height($img.height() * scaleFactor); 
    var propId = $(this).parent().attr('id');
    props[propId].sync();
  });
}