var clientId = '324627207270-ojamt80hdehm8dkup55o8cih0ag4d5j8.apps.googleusercontent.com';

// Ben-han's client ID
// var clientId = '355588130388-q160ev44v09s1h2ka76fun7k1cj8ptat.apps.googleusercontent.com';

if (!/^([0-9])$/.test(clientId[0])) {
  alert('Invalid Client ID - did you forget to insert your application Client ID?');
}
// Create a new instance of the realtime utility with your client ID.
var realtimeUtils = new utils.RealtimeUtils({ clientId: clientId });

var model = null;

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

  // Register custom types
  registerTypes();

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
  // Nothing necessary here
}

// After a file has been initialized and loaded, we can access the
// document. We will wire up the data model to the UI.
function onFileLoaded(doc) {
  var collaborativeString = doc.getModel().getRoot().get('demo_string');
  model = doc.getModel();
}

function registerTypes(model) {
  // Prop class implementation
  Prop = function() {}
  Prop.prototype.id = gapi.drive.realtime.custom.collaborativeField('id');
  Prop.prototype.startX = gapi.drive.realtime.custom.collaborativeField('startX');
  Prop.prototype.startY = gapi.drive.realtime.custom.collaborativeField('startY');
  Prop.prototype.lenX = gapi.drive.realtime.custom.collaborativeField('lenX');
  Prop.prototype.lenY = gapi.drive.realtime.custom.collaborativeField('lenY');
  Prop.prototype.imageURL = gapi.drive.realtime.custom.collaborativeField('imageURL');

  Prop.prototype.init = function(ide, stx, sty, width, height, url) {
    this.id = ide;
    if (document.getElementById(this.id))
      this.elem = document.getElementById(this.id);
    this.startX = stx;
    this.startY = sty;
    this.lenX = width;
    this.lenY = height;
    this.imageURL = url;
    this.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, this.update);
  }

  // This gets called when somebody else adds a prop
  Prop.prototype.onload = function() {
    if (!this.elem) {
      this.elem = document.getElementById(this.id);
      if (!this.elem) {
        this.elem = makeDraggableElement(this.imageURL, this.id);
        console.log("Made the element: " + this.elem);

        // this.elem = document.createElement("img");
        // this.elem.id = this.id;
        // this.elem.src = this.imageURL;
        // this.elem.style.display = "inline-block";
        // this.elem.style.position = "absolute";

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
        else
          document.body.appendChild(this.elem);

        // Near-duplicate of what's in index.html - probably a good idea
        // to name these functions, define them once, and call them here.
        $(this.elem).hover(
            function() {
              if ($(this).parent().is($('#stage'))) {
                addGrowButton($(this));
                addShrinkButton($(this));
              }
            },function() {
              $('.grow-button').remove();
              $('.shrink-button').remove();
          });
        props[this.id] = this;
        this.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, this.update);
      }
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

    console.log("Left: " + prop.elem.style.left 
      + ", top: " + prop.elem.style.top);
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

  


  // Register prop class
  gapi.drive.realtime.custom.registerType(Prop, 'Prop');
  gapi.drive.realtime.custom.setInitializer(Prop, Prop.prototype.init);
  gapi.drive.realtime.custom.setOnLoaded(Prop, Prop.prototype.onload);
}

//----- Begin wrapper API -----//

/* Creates a new prop on the stage
 * Parameters:
 * ide (string) - CSS id for the prop
 * stx (string) - x-coordinate of top left corner of the prop
 * sty (string) - y-coordinate of top right corner of the prop
 * width (string) - width of the prop
 * height (string) - height of the prop
 * url (string) - image URL for the prop
 */

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
function addProp(ide, stx, sty, width, height, url) {
  var prop = model.create(Prop, ide, stx, sty, width, height, url);
  model.getRoot().set(ide, prop);
  return prop;
}

function createPropFromElement(elem) {
  return addProp(elem.id, 
    elem.style.left, 
    elem.style.top, 
    elem.childNodes[0].style.width,
    elem.childNodes[0].style.height,
    elem.childNodes[0].src);
    //$(elem).children('img').width(), 
    //$(elem).children('img').height(), 
    //$(elem).children('img').attr('src'));
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