function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
}

var clientId = '324627207270-ojamt80hdehm8dkup55o8cih0ag4d5j8.apps.googleusercontent.com';

// Ben-han's client ID
//var clientId = '355588130388-q160ev44v09s1h2ka76fun7k1cj8ptat.apps.googleusercontent.com';

if (!/^([0-9])$/.test(clientId[0])) {
  alert('Invalid Client ID - did you forget to insert your application Client ID?');
}

// make sure user has photo & name
function checkSignupFlow() {
  console.log(sessionStorage);
  var id = getURLParameter('id');
  if (!sessionStorage.getItem('name')) {
    if (id)
      window.location.replace("./avatars/start.html?id="+id);
    else 
      window.location.replace("./avatars/start.html");

  } else if (!sessionStorage.getItem('cmb')) {
    if (id)
      window.location.replace("./avatars/takePicture.html?id="+id);
    else 
      window.location.replace("./avatars/takePicture.html");
  }
}

checkSignupFlow();

// Create a new instance of the realtime utility with your client ID.
var realtimeUtils = new utils.RealtimeUtils({ clientId: clientId });

var model = null;
var photos = null;

// This is automatically invoked once Google APIs have finished loading
// (We pass a parameter to the Google API library indicating that authorize 
// is the "on finished" callback function)
function authorize() {
  // Attempt to authorize
  realtimeUtils.authorize(function(response){
    if (response.error){
      // Authorization failed because this is the first time the user has used your application,
      // show the authorization prompt before the photopicker.
      realtimeUtils.authorize(function(response) {
        start();
      }, true);
    } else {
      start();
    }
  }, false);
}

// Creates a new file for a new story or loads an existing story.
function start() {
  // Register custom types.
  // Note this must happen BEFORE the shared document is loaded.
  registerTypes();

  // With auth taken care of, load a file, or create one if there
  // is not an id in the URL.
  var id = realtimeUtils.getParam('id');
  if (id) {
    // Load the document id from the URL
    realtimeUtils.load(id.replace('/', ''), onFileLoaded, onFileInitialize);
  } else {
    // Create a new document, add it to the URL
    realtimeUtils.createRealtimeFile('My Folktale story', function(createResponse) {
      window.history.pushState(null, null, '?id=' + createResponse.id);
      realtimeUtils.load(createResponse.id, onFileLoaded, onFileInitialize);
    });
  }
}

// The first time a file is opened, it must be initialized with the
// document structure. Any one-time setup should go here.
function onFileInitialize(model) {
  // Create global player list
  var players = model.createList();
  model.getRoot().set('players', players);

  // Initialize the stage
  var stage = model.create(Stage, "stage-inner", "next-stage", "prev-stage", null, model);
  model.getRoot().set("stage", stage);
  firstLoad = true;
}

// After a file has been initialized and loaded, we can access the
// document. We'll fetch all existing collaborative objects and
// update the UI to show the current state of those objects
// (hidden, visible, etc.)
function onFileLoaded(doc) {
  model = doc.getModel();

  // Add current player to player list
  var players = model.getRoot().get('players');
  var currentPlayer = sessionStorage.getItem('name');
  if (currentPlayer && players && players.indexOf(currentPlayer) == -1 && currentPlayer!='alice') {
    players.push(currentPlayer);
  }

  // Load custom objects
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

  // Let the user pick photos
  onApiLoad();
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
      $(this.img).width(this.width).height(this.height);
      if (this.active) {
        $(this.elem).addClass('onScene');
        $(this.elem).removeClass('offScene');
      }
      else {
        $(this.elem).addClass('offScene')
        $(this.elem).removeClass('onScene')
      }
    }

    Prop.prototype.update = function(event) {
      if (!event.isLocal) {
        // Update position, visibility, and dimensions
        var prop = event.target;
        $(prop.elem).css({"top": prop.top, "left": prop.left});
        $(prop.img).width(prop.width).height(prop.height);
        if (prop.active) {
          $(prop.elem).addClass('onScene');
          $(prop.elem).removeClass('offScene');
        }
        else {
          $(prop.elem).addClass('offScene')
          $(prop.elem).removeClass('onScene')
        }

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
      // this.elem.style.display = "none";
      $(this.elem).addClass('offScene');
      $(this.elem).removeClass('onScene');
    }

    Prop.prototype.show = function() {
      this.active = true;
      // Apply local change immediately
      $(this.elem).addClass('onScene');
      $(this.elem).removeClass('offScene');

    }

    Prop.prototype.delete = function() {
      var model = gapi.drive.realtime.custom.getModel(this);
      model.getRoot().delete(this.id);
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
    Scene.prototype.descriptionTemplate = gapi.drive.realtime.custom.collaborativeField('descriptionTemplate');
    Scene.prototype.description = gapi.drive.realtime.custom.collaborativeField('description');
    Scene.prototype.backgroundURL = gapi.drive.realtime.custom.collaborativeField('backgroundURL');

    // Declare template strings here
    // {#} will be sub'ed with the number of players
    // {@} will be sub'ed with player names
    Scene.prototype.starters = [
      "Once upon a time, there were {#} dragons, {@}. They lived in … ",
      "Everyday, when {@} woke up in the morning, they [what did the dragons do in the morning?]",
      "One day, everything changed. [What did the dragons do this day?]"
    ];

    Scene.prototype.fillers = [
      "Because of that, [what happened?]"
    ];

    Scene.prototype.enders = [
      "Finally, the {#} dragons … ",
      "The end!"
    ];

    Scene.prototype.init = function(id, url, model) {
      this.index = id;
      this.active = false;
      this.backgroundURL = url;
      this.props = model.createList();
      this.description = model.createString();
      this.descriptionTemplate = model.createString();

      // Choose a random description for each scene
      if (id >= 0 && id <= 2) {
        var randomText = this.starters[id];
      } else if (id == 5) {
        var randomText = this.enders[0];
      } else if (id == 6) {
        var randomText = this.enders[1];
      } else {
        var randomText = this.fillers[Math.floor(Math.random() * this.fillers.length)];
      }
      this.description.setText(randomText);
      this.descriptionTemplate.setText(randomText);
    }

    // Adds a prop to this scene
    Scene.prototype.addProp = function(prop) {
      this.props.push(prop);
    }

    // Removes a prop from the current scene
    Scene.prototype.removeProp = function(propID) {
      for (var i = 0; i < this.props.length; i++) {
        var prop = this.props.get(i);
        if (prop.id == propID) {
          this.props.remove(i);
          return true;
        }
      }
      return false;
    }

    // This gets called when somebody else joins the session
    // and needs to create the current scene
    Scene.prototype.onload = function() {
      this.active ? this.show() : this.stash();
      this.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, this.update);

      // Update the scene description (but ONLY if it's the default one)
      var model = gapi.drive.realtime.custom.getModel(this);
      var players = model.getRoot().get('players');
      var names = this.namesToString(players);
      
      // Build a regex to check if the users have changed the default description
      var pattern = this.descriptionTemplate.text;
      pattern = pattern.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      pattern = pattern.replace("\\{\\#\\}", "([0-9]*|{#})");
      pattern = pattern.replace("\\{@\\}", "(.*|{@})");
      var regex = new RegExp(pattern);

      // If the regex matches - i.e. users haven't changed the default description,
      // then update the text
      if (this.description.text.match(regex)) { 
        var formattedText = this.descriptionTemplate.getText().replace("{#}", players.length);
        formattedText = formattedText.replace("{@}", names);
        this.description.setText(formattedText);
      }

      // Fire JS change events when description changes
      this.description.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, function() {
        $("#queryfield").trigger("change");
      });
      this.description.addEventListener(gapi.drive.realtime.EventType.TEXT_DELETED, function() {
        $("#queryfield").trigger("change");
      });
    }

    // This gets called when a scene goes from active to not
    // active, or vice versa. Basically, on a scene change.
    Scene.prototype.update = function(event) {
      var scene = (event == undefined) ? this : event.target;
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
      var avatarExists = false;
      for (var i = 0; i < this.props.length; i++) {
        var prop = this.props.get(i);
        prop.show();

        // Check if the user avatar is one of the props
        var avatarIDPrefix = 'avatar' + sessionStorage.getItem('name');
        if (prop.id.indexOf(avatarIDPrefix) != -1) {
          avatarExists = true;
        }
      }

      // Add avatar to backstage if it's not in the scene
      removeAvatarFromBackstage();
      if(!avatarExists) {
        addAvatarToBackstage();
      }

      // Update prop generators
      $("#queryfield").trigger("change");
    }

    // Player names to string
    // 'names' should be a list of strings
    Scene.prototype.namesToString = function(names) {
      if (names.length == 0) {
        return "no one";
      }
      else if (names.length == 1) {
        return names.get(0);
      }
      else if (names.length == 2) {
        return names.get(0) + " and " + names.get(1);
      }
      else {
        var str = "";
        for (var i = 0; i < names.length - 1; i++) {
          str += names.get(i) + ", "
        }
        str += "and " + names.get(names.length - 1);
        return str;
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
    Stage.prototype.players = gapi.drive.realtime.custom.collaborativeField('players');

    // One-time init for a stage
    Stage.prototype.init = function(stageId, forwardId, backwardId, backgrounds, model) {
      this.stageId = stageId;
      this.forwardId = forwardId;
      this.backwardId = backwardId;
      this.sceneIndex = 0;
      this.scenes = model.createList();

      // Create a Scene for every available background
      if (backgrounds) {
        this.addScenes(backgrounds);
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
      this.update();
    }

    // Gets called whenever the stage is modified
    // (E.g. page flip)
    Stage.prototype.update = function(event) {
      if (event == undefined || !event.isLocal) {
        var stage = (event == undefined) ? this : event.target;
        for (var i = 0; i < stage.scenes.length; i++) {
          stage.scenes.get(i).active = (i == stage.sceneIndex);

          // Continue propagating local changes
          if (event == undefined) {
            stage.scenes.get(i).update();
          }
        }
      }
    }

    // Flips forward to the next page.
    // Changing sceneIndex automatically triggers a call to
    // Stage.prototype.update across all active user sessions.
    Stage.prototype.flipForward = function() {
      if (this.sceneIndex + 1 < this.scenes.length) {
        this.sceneIndex++;
        this.update();
      }
    }

    // Flips back to the previous page
    // Changing sceneIndex automatically triggers a call to
    // Stage.prototype.update across all active user sessions.
    Stage.prototype.flipBackwards = function() {
      if (this.sceneIndex - 1 >= 0 && this.scenes.length > 0) {
        this.sceneIndex--;
        this.update();
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

function makeDraggableElement(url, id, additionalClasses) {
  var img = document.createElement('img');
  img.src = url;
  img.className = "hidden";
  img.onload = function() { this.className = "result"; }

  var div = document.createElement('div');
  $(div).addClass('onScene');
  // div.style.display = "inline-block";
  div.classList.add("img-wrapper");

  if (additionalClasses != null) {
    for (var i = 0; i < additionalClasses.length; i++) {
      div.classList.add(additionalClasses[i]);
    }
  }

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
 * propElem (DOM node) - a DOM element to turn into a prop
 * propID (string) - CSS id for the prop
 * propX (string) - x-coordinate of top left corner of the prop
 * propY (string) - y-coordinate of top right corner of the prop
 * propWidth (string) - width of the prop
 * propHeight (string) - height of the prop
 * propURL (string) - image URL for the prop
 */
function addProp(propElem) {
  // Create prop
  var prop = model.create(Prop, propElem.id, 
                                propElem.style.left, 
                                propElem.style.top, 
                                propElem.childNodes[0].style.width,
                                propElem.childNodes[0].style.height,
                                propElem.childNodes[0].src);

  // Add prop to current scene
  var stage = model.getRoot().get("stage");
  var currentScene = stage.currentScene();
  currentScene.addProp(prop);
  return prop;
}

/* Deletes a prop from the stage.
 * Parameters:
 * propID (string) - CSS id for the prop
 */
function removeProp(propID) {
  var stage = model.getRoot().get("stage");
  var currentScene = stage.currentScene();
  var success = currentScene.removeProp(propID);
  console.log("Removed prop? " + success);
  return success;
}

/* Adds scenes to the current tale.
 * Parameters:
 * photos (list) - A list of image URLs to serve as backgrounds for
 *                 the additional scenes.
 */
function addScenes(photos) {
  if (photos == undefined || !photos || photos.length == 0) {
    return;
  }
  var stage = model.getRoot().get("stage");
  stage.addScenes(photos);
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