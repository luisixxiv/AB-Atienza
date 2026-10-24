// the logins for this demo: change these lines to change the accounts
// client account (opens the client dashboard)
var correctEmail = "client@abatienza.com";
var correctPassword = "build2026";
// office account (opens the admin dashboard)
var adminEmail = "admin@abatienza.com";
var adminPassword = "admin2026";

function logIn() {
  var email = document.getElementById("loginEmail").value;
  var password = document.getElementById("loginPassword").value;
  var error = document.getElementById("loginError");
  var box = document.getElementsByClassName("loginbox")[0];

  if (email == correctEmail && password == correctPassword) {
    localStorage.setItem("clientLoggedIn", "yes");
    window.location = "dashboard.html";
  } else if (email == adminEmail && password == adminPassword) {
    localStorage.setItem("adminLoggedIn", "yes");
    window.location = "../admin/dashboard.html";
  } else {
    error.innerHTML = "Wrong email or password. Please try again.";
    box.className = "loginbox shake";
    setTimeout(stopShake, 500);
  }
}

function stopShake() {
  document.getElementsByClassName("loginbox")[0].className = "loginbox";
}

// pressing Enter in the password box also logs in
function checkEnter(event) {
  if (event.key == "Enter") {
    logIn();
  }
}

// eye button: show or hide the password
function showPassword() {
  var box = document.getElementById("loginPassword");
  var eye = document.getElementById("eyeButton");
  if (box.type == "password") {
    box.type = "text";
    eye.innerHTML = '<i class="bi bi-eye-slash-fill"></i>';
  } else {
    box.type = "password";
    eye.innerHTML = '<i class="bi bi-eye-fill"></i>';
  }
}

function forgotPassword() {
  document.getElementById("loginError").innerHTML =
    "Please call our office to reset your password: +63 962 449 5318";
}
