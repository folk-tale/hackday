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
    console.log($(button));
    console.log(button);
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

// Auto search as user types
$("#queryfield").on("input change propertychange paste", function() {
  searchAll();
});

$('footer').on('click', function() {
  console.log('clicked footer');
  if ($('footer').css('height') == '130px') {
    $('footer').css('height','20px');
  } else {
    $('footer').css('height','130px');
  }
});