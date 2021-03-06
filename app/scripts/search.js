// Adds the user avatar as a sticker to backstage
function addAvatarToBackstage() {
  var id = "avatar" + sessionStorage.getItem('name') + Math.random();
  var classNames = ['onScene','avatar'];
  var propDiv = makeDraggableElement(sessionStorage.cmb, id, classNames);
  var contentarea = document.getElementById("content");
  contentarea.appendChild(propDiv, contentarea.firstChild);
}

// Removes a user avatar as a sticker to backstage
// Parameter: the CSS id of the avatar to remove
function removeAvatarFromBackstage() {
  $("#content").children('div').each(function(i) { 
    if ($(this).attr('id').indexOf('avatar' + sessionStorage.getItem('name')) != -1) {
      $(this).remove();
    }
  });
}

// Clears all current stickers except the user avatar
function clearAllButAvatars() {
  $("#content").children('div').each(function(i) { 
    if (! $(this).hasClass('avatar')) {
      $(this).remove();
    }
  });
}

// For old Image Search API (we actually use this, though)
function hndlr(response) {
  var contentarea = document.getElementById("content");
  for (var i = response.responseData.results.length - 1; i >=0 ; i--) {
    var item = response.responseData.results[i];
    var id = "i" + Math.random(); // Hopefully no collisions lol
    var propDiv = makeDraggableElement(item.url, id);
    contentarea.appendChild(propDiv, contentarea.firstChild);
  }
  var searchScript = document.getElementById("current-query");
  searchScript.parentNode.removeChild(searchScript);
}

// Using old Image Search API (allows searching for transparent images)
function addSearchButton(noun) {
  var button = document.createElement("span");
  button.textContent = noun;
  button.style.cursor = "pointer";
  button.classList.add("term");
  button.addEventListener("click", function() {
    // unhighlight previous terms and highlight this one
    $('.searching').removeClass('searching');
    $(button).addClass('searching');
    var query = encodeURI(noun);
    var reqURL = "https://ajax.googleapis.com/ajax/services/search/images?v=1.0&callback=hndlr&rsz=8&imgc=trans&imgsz=medium&safe=active&q=" + query;
    var script = document.createElement("script");
    script.id = "current-query";
    script.src = reqURL;
    clearAllButAvatars();
    document.getElementById("content").appendChild(script);
  })
  document.getElementById("terms").appendChild(button);
}

// Add search buttons for all terms in all sentences
function searchAll() {
  clearAllButAvatars();
  document.getElementById("terms").innerHTML = "";
  var input = document.querySelector("#queryfield").value;
  var tokens = input.split(" ");
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    var formattedToken = token.replace(/\W/g, '')
    if (formattedToken.trim() !== '') {
      addSearchButton(formattedToken);
    }
  }
}

// Toggle (slide up/ slide down) footer help bar
function toggleFooter() {
  $('#footer-help').toggle('slide', { direction: "down" });
  $('.footer-wrapper').addClass('hidden');
  $('#footer1').removeClass('hidden');
}

// Auto search as user types
$("#queryfield").on("input change propertychange paste", function() {
  searchAll();
});

// Collapse instructions footer on click
$('#closable-footers').click(function(){
  $('#footer-help').toggle('slide', { direction: "down" });
});

// Give more instructions after user copies invite link
$("#invite-link").on('copy', function() {
  alert("Copied to clipboard! Simply paste & send this link with your soon-to-be dragon friend!");

  setTimeout(function() {
    $('#footer1').addClass('hidden');
    $('#footer2').removeClass('hidden');
    $('#overlay').addClass('hidden');

    // if own avatar is backstage, tell user to put it into the stage
    var myAvatar = $('.avatar').first();
    if ($('.avatar').first()[0]) {
      myAvatar.addClass('glow');
      myAvatar.mouseup(function() {
        myAvatar.off('mouseup');
        myAvatar.removeClass('glow');
        narrationEdu();
      });
    } 
    // if avatar is already on the scene, tell user about the narration
    else {
      narrationEdu();
    }
  }, 1000);
});

// EDU about narration
function narrationEdu() {
  $('#footer2').addClass('hidden');
  $('#footer3').removeClass('hidden');
  $('#queryfield').select();

  $("#queryfield").keypress(function(e) {
    if (e.keyCode === 0 || e.keyCode === 32 || e.keyCode === 190 || e.keyCode === 188 || e.keyCode === 110  || e.keyCode === 46 || e.keyCode === 44) {
      $("#queryfield").off('keypress');
      propGeneratorEdu();
    }
  });

}

// EDU about prop generator
function propGeneratorEdu(e) {
  $('#footer3').addClass('hidden');
  $('#footer4').removeClass('hidden');
  $('#terms').click(function(){
    $('.term').off('click');
    $('#footer4').addClass('hidden');
    $('#footer5').removeClass('hidden');
  });
}

function confirmNew() {
  var r = confirm("Are you sure you want to start a new story?");
  if (r == true) {
      window.open('index.html');
  } 
}