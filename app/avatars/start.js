function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
}

var id = getURLParameter('id');

window.onload = function(e){
	var name = document.getElementById('name');
	donebutton = document.getElementById('donebutton');
	warning = document.getElementById('warning');

	donebutton.addEventListener('click', function(ev){
		if (name.value != undefined) {
			if (name.value.length != 0) {
				sessionStorage.setItem("name", name.value);
				if (id)
					window.open("TakePicture.html?id=" + id, "_self")
				else
					window.open("TakePicture.html", "_self")
			} else {
				warning.style.display = "block";
			}
			ev.preventDefault();
		}
	}, false);
};


