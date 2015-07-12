var clientId = '355588130388-q160ev44v09s1h2ka76fun7k1cj8ptat.apps.googleusercontent.com';

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
        this.elem = document.createElement("img");
        this.elem.id = this.id;
        this.elem.src = this.imageURL;
        this.elem.style.display = "inline-block";
        this.elem.style.position = "absolute";

        // An alternative to this casework is to have it get the
        // parentNode of the element in createPropFromElement
        if (document.getElementById("stage")!==null)
          document.getElementById("stage").appendChild(this.elem);
        else
          document.body.appendChild(this.elem);
      }
    }
    this.elem.style.top = this.startY;
    this.elem.style.left = this.startX;
    this.elem.style.width = this.lenX;
    this.elem.style.height = this.lenY;
  }

  Prop.prototype.update = function() {
    // Reposition element (this.elem) on the page
    this.elem.style.top = this.startY;
    this.elem.style.left = this.startX;
    this.elem.style.width = this.lenX;
    this.elem.style.height = this.lenY;
  }

  Prop.prototype.sync = function(stx, sty, width, height) {
    // Update properties from position on page
    this.startY = stx;
    this.startX = sty;
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
function addProp(ide, stx, sty, width, height, url) {
  var prop = model.create(Prop, ide, stx, sty, width, height, url);
  model.getRoot().set(ide, prop);
  return prop;
}

function createPropFromElement(elem) {
  return addProp(elem.id, elem.style.left, elem.style.top, node.style.width, node.style.height, node.src)
}