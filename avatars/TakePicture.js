(function() {
  // The width and height of the captured photo. We will set the
  // width to the value defined here, but the height will be
  // calculated based on the aspect ratio of the input stream.

  var width =  200;    // We will scale the photo width to this
  var height = 200;     // This will be computed based on the input stream

  // |streaming| indicates whether or not we're currently streaming
  // video from the camera

  var streaming = false;

  // The various HTML elements we need to configure or control. These
  // will be set by the startup() function.

  var video = null;
  var canvas = null;
  var photo = null;
  var startbutton = null;

  function takePicture() {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    photo = document.getElementById('photo');
    startbutton = document.getElementById('startbutton');
    circle = document.getElementById('circle');
    retake = document.getElementById('retake');
    nextPage = document.getElementById('nextPage');
    photoTaken = document.getElementsByClassName("photoTaken");
    nextPage.style.display = 'none';
    retake.style.display = 'none';
    if (photoTaken!= null) {
      for (i = 0; i < photoTaken.length; i++) {
        photoTaken[i].setAttribute('src', sessionStorage.getItem("photoData"));
      }
    }

    navigator.getMedia = ( navigator.getUserMedia ||
                           navigator.webkitGetUserMedia ||
                           navigator.mozGetUserMedia ||
                           navigator.msGetUserMedia);

    navigator.getMedia(
      {
        video: true,
        audio: false
      },
      function(stream) {
        if (navigator.mozGetUserMedia) {
          video.mozSrcObject = stream;
        } else {
          var vendorURL = window.URL || window.webkitURL;
          video.src = vendorURL.createObjectURL(stream);
        }
        video.play();
      },
      function(err) {
        console.log("An error occured! " + err);
      }
    );

    video.addEventListener('canplay', function(ev){
      if (!streaming) {
        video.setAttribute('width', width);
        video.setAttribute('height', height);
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        streaming = true;
      }
    }, false);

    startbutton.addEventListener('click', function(ev){
      takepicture();
      ev.preventDefault();
    }, false);
    
    clearphoto();
  }
  function startup() {
    photoTaken = document.getElementsByClassName("photoTaken");
    if (photoTaken!= null) {
      for (i = 0; i < photoTaken.length; i++) {
        photoTaken[i].setAttribute('src', sessionStorage.getItem("photoData"));
      }
    }
  }

  // Fill the photo with an indication that none has been
  // captured.

  function clearphoto() {
    var context = canvas.getContext('2d');
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);
    var data = canvas.toDataURL('image/png');
    photo.setAttribute('src', data);
  }
  
  // Capture a photo by fetching the current contents of the video
  // and drawing it into a canvas, then converting that to a PNG
  // format data URL. By drawing it on an offscreen canvas and then
  // drawing that to the screen, we can change its size and/or apply
  // other changes before drawing it.

  function takepicture() {
    var context = canvas.getContext('2d');
    context.beginPath();
    context.arc(200, 200, 0, 0, 2*Math.PI);
    context.stroke();
    context.clip();
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.borderRadius = '50%';
      context.drawImage(video, -60, 0, 300, 200);
      var data = canvas.toDataURL('image/png');
      photo.setAttribute('src', data);
      photo.style.display = 'inline';
      video.style.display = 'none';
      circle.style.display = 'none';
      nextPage.style.display = 'inline';
      retake.style.display = 'inline';
      startbutton.style.display = 'none';
      sessionStorage.setItem("photoData", data);
    } else {
      clearphoto();
    }
  }

  // Set up our event listener to run the startup process
  // once loading is complete.
  var isTakingPicture = document.getElementById('take-picture');
  if (isTakingPicture != null) window.addEventListener('load', takePicture, false);
  window.addEventListener('load', startup, false);
})();