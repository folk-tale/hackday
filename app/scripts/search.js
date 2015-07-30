// $(function() {
//   var id = "i"+Math.random();
//   var className = 'avatar';
//   var propDiv = makeDraggableElement(sessionStorage.cmb, id, className);
//   document.getElementById("content").appendChild(propDiv);
// })

function addAvatarToBackstage() {
  var id = "avatar"+sessionStorage.getItem('name')+Math.random();
  var classNames = ['onScene'];
  var propDiv = makeDraggableElement(sessionStorage.cmb, id, classNames);
  document.getElementById("content").appendChild(propDiv);
}

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
    var id = "i"+Math.random();
    var propDiv = makeDraggableElement(item.url, id);
    contentarea.insertBefore(propDiv, contentarea.firstChild);
  }
}

// Using old Image Search API (allows searching for transparent images)
function addSearchButton(noun) {
  var button = document.createElement("span");
  button.textContent = noun;
  button.style.cursor = "pointer";
  button.classList.add("term");
  button.addEventListener("click", function() {
    var query = encodeURI(noun);
    var reqURL = "https://ajax.googleapis.com/ajax/services/search/images?v=1.0&callback=hndlr&rsz=8&imgc=trans&imgsz=medium&safe=active&q=" + query;
    var script = document.createElement("script");
    script.src = reqURL;
    document.getElementById("content").appendChild(script);
  })
  document.getElementById("terms").appendChild(button);
}

function searchAll() {
  clearAllButAvatars();
  document.getElementById("terms").innerHTML = "";
  var input = document.querySelector("#queryfield").value;
  var sentence = nlp.pos(input).sentences[0];
  if (!sentence) {
    return;
  }
  var nouns = sentence.nouns();
  for (var i = 0; i < nouns.length; i++) {
    var noun = nouns[i];
    if (noun.pos.tag.lastIndexOf("NNP", 0) === 0 || // Skip proper nouns
        noun.pos.tag.lastIndexOf("PRP", 0) === 0 || // Skip pronouns
        noun.pos.tag.lastIndexOf("WH", 0) === 0)    // Skip wh- pronouns
    {
      continue;
    }
    addSearchButton(noun.text);
  }
}

// Auto search
$("#queryfield").keyup(function(e) {
  /*
  if (e.keyCode === 13 ||     // Enter
      e.keyCode === 32 ||     // Space
      e.keyCode === 190 ||    // Period
      e.keyCode === 188 ||    // Comma 
      e.keyCode === 110  ||   // Decimal point
      e.keyCode === 46 ||     // Delete
      e.keyCode === 8) {      // Backspace
    searchAll();
  }*/
  searchAll(); // Lolz
});