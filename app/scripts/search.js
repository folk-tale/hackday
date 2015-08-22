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

function toggleFooter() {
  $('#overlay').toggle();
  $('#footer-help').toggle('slide', { direction: "down" });
}

// Auto search as user types
$("#queryfield").on("input change propertychange paste", function() {
  searchAll();
});

$("#invite-link").bind('copy', function() {
  $('#invite-link').trigger('copied');
}); 

$('#footer5').click(function(){
  $('#footer-help').toggle('slide', { direction: "down" });
});

// EDU 
$('#invite-link').on('copied', function () {
  alert("Copied to clipboard! Simply paste & send this link with your soon-to-be dragon friend!");
  $('#footer-next').addClass('hidden');
  $('#footer1').addClass('hidden');
  $('#footer2').removeClass('hidden');
  $('#overlay').addClass('hidden');

  var myAvatar = $('.avatar').first();

  if ($('.avatar').first()[0]) {
    myAvatar.addClass('glow');
    myAvatar.mouseup(function() {
      myAvatar.off('mouseup');
      myAvatar.removeClass('glow');
      narrationEdu();
    });
  } else {
    narrationEdu();
  }
});

function narrationEdu() {
  $('#footer2').addClass('hidden');
  $('#footer3').removeClass('hidden');
  $('#queryfield').select();

  $("#queryfield").keypress(function(e) {
    console.log('propGeneratorEdu');
    propGeneratorEdu(e);
  });
}

function propGeneratorEdu(e) {
  if (e.keyCode === 0 || e.keyCode === 32 || e.keyCode === 190 || e.keyCode === 188 || e.keyCode === 110  || e.keyCode === 46 || e.keyCode === 44) {
    $("#queryfield").off('keypress');
    $('#footer3').addClass('hidden');
    $('#footer4').removeClass('hidden');
    $('#terms').click(function(){
      console.log('click');
      $('.term').off('click');
      $('#footer4').addClass('hidden');
      $('#footer5').removeClass('hidden');
    });
  }
}

// $('footer').on('click', function() {
//   console.log('clicked footer');
//   if ($('footer').css('height') == '130px') {
//     $('footer').css('height','20px');
//   } else {
//     $('footer').css('height','130px');
//   }
// });