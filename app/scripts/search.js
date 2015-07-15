// For old Image Search API (we actually use this, though)
function hndlr(response) {
  for (var i = 0; i < response.responseData.results.length; i++) {
    var item = response.responseData.results[i];
    var id = "i"+Math.random();
    var propDiv = makeDraggableElement(item.url, id);
    document.getElementById("content").appendChild(propDiv);
  }
}

// Using old Image Search API (allows searching for transparent images)
function searchNoun(noun) {
  var query = encodeURI(noun);
  var reqURL = "http://ajax.googleapis.com/ajax/services/search/images?v=1.0&callback=hndlr&rsz=8&imgc=trans&imgsz=medium&safe=active&q=" + query;
  var script = document.createElement("script");
  script.src = reqURL;
  document.getElementById("content").appendChild(script);
  document.getElementById("terms").innerHTML += "<span class=\"term\">" + noun + "</span>";
}

function searchAll() {
  document.getElementById("content").innerHTML = "";
  document.getElementById("terms").innerHTML = "";
  var input = document.querySelector("#queryfield").value;
  var nouns = nlp.pos(input).sentences[0].nouns();
  for (var i = 0; i < nouns.length; i++) {
    var noun = nouns[i];
    if (noun.pos.tag.lastIndexOf("NNP", 0) === 0 || // Skip proper nouns
        noun.pos.tag.lastIndexOf("PRP", 0) === 0 || // Skip pronouns
        noun.pos.tag.lastIndexOf("WH", 0) === 0)    // Skip wh- pronouns
    {
      continue;
    }
    searchNoun(noun.text);
  }
}