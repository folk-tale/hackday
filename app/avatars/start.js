window.onload = function(e){
	var name = document.getElementById('name');
	donebutton = document.getElementById('donebutton');
	warning = document.getElementById('warning');

	donebutton.addEventListener('click', function(ev){
		if (name.value != undefined) {
			if (name.value.length != 0) {
				sessionStorage.setItem("name", name.value);
				window.open("file:///TakePicture.html", "_self")
			} else {
				warning.style.display = "block";
			}
			ev.preventDefault();
		}
	}, false);
};
