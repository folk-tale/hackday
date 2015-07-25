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
  var takephotobutton = null;

  function takePicture() {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    photo = document.getElementById('photo');
    takephotobutton = document.getElementById('takephotobutton');
    bluebutton = document.getElementById('bluebutton');
    redbutton = document.getElementById('redbutton');
    yellowbutton = document.getElementById('yellowbutton');
    purplebutton = document.getElementById('purplebutton');
    donebutton = document.getElementById('donebutton');
    character_frame = document.getElementById('character_frame');
    retake = document.getElementById('retakebutton');
    photoTaken = document.getElementsByClassName("photoTaken");
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

    takephotobutton.addEventListener('click', function(ev){
      takepicture();
      ev.preventDefault();
    }, false);

    bluebutton.addEventListener('click', function(ev){
      character_frame.src="dragon_blue_bkgd.png";
      ev.preventDefault();
    }, false);

    redbutton.addEventListener('click', function(ev){
      character_frame.src="dragon_red_bkgd.png";
      ev.preventDefault();
    }, false);

    yellowbutton.addEventListener('click', function(ev){
      character_frame.src="dragon_yellow_bkgd.png";
      ev.preventDefault();
    }, false);

    purplebutton.addEventListener('click', function(ev){
      character_frame.src="dragon_purple_bkgd.png";
      ev.preventDefault();
    }, false);

    retakebutton.addEventListener('click', function(ev){
      clearphoto();
      photo.style.display = 'none';
      video.style.display = 'inline';
      retake.style.display = 'none';
      takephotobutton.style.display = 'block';
      ev.preventDefault();
    }, false);

    donebutton.addEventListener('click', function(ev){
      window.open("../index.html","_self")
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
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.borderRadius = '50%';
      context.drawImage(video, 0, -22, 200, 200);
      var data = canvas.toDataURL('image/png');
      photo.setAttribute('src', data);
      photo.style.display = 'inline';
      video.style.display = 'none';
      donebutton.style.display = 'block';
      retakebutton.style.display = 'block';
      takephotobutton.style.display = 'none';
      sessionStorage.setItem("photoData", data);
      sessionStorage.setItem("color", character_frame.src);

      var c = document.getElementById("canvas2");
      var ctx = c.getContext("2d");
      var photo_img = new Image();
      var character_frame_img = new Image();
      photo_img.src = data;
      photo_img.onload = function() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(190, 110, 93, 0, 2*Math.PI);
        ctx.stroke();
        ctx.strokeStyle = 'blue';
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(photo_img, -5, 25, 320, 240);
        ctx.restore();
         character_frame_img.src = character_frame.src.substr(0,character_frame.src.length-'_bkgd.png'.length)+".png";
         character_frame_img.onload = function() {
            ctx.drawImage(character_frame_img, 0, 0, 320, 449);
            var img = new Image();
            img.setAttribute('crossOrigin', 'anonymous');
            var img = c.toDataURL("image/png");
            console.log("img: " + img);
            console.log("img.src: " , img.src);
            // $("#test").append('<img src="' + img + '" width="320" height="449"/>');
            sessionStorage.setItem("cmb", img);
         }
      };
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