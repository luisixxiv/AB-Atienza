// ---------- you must be logged in to see this page ----------
// (delete these 3 lines if you want to open the dashboard directly)
if (localStorage.getItem("clientLoggedIn") != "yes") {
  window.location = "login.html";
}

function logOut() {
  localStorage.removeItem("clientLoggedIn");
  window.location = "login.html";
}

// ---------- left panel: switch between sections ----------
function showSection(name) {
  var boxes = document.getElementsByClassName("panelbox");
  for (var i = 0; i < boxes.length; i++) {
    boxes[i].className = "panelbox";
  }
  document.getElementById(name).className = "panelbox on";

  var items = document.getElementsByClassName("navitem");
  for (var j = 0; j < items.length; j++) {
    if (items[j].getAttribute("data-section") == name) {
      items[j].className = "navitem on";
    } else {
      items[j].className = "navitem";
    }
  }

  window.scrollTo(0, 0);
  if (name == "overview") {
    animateRing();
  }
  if (name == "progress") {
    resetBars();
    setTimeout(fillBars, 100);
  }
}

// ---------- overall progress is the average of the 7 phases ----------
var overall = 0;

function computeOverall() {
  var fills = document.getElementsByClassName("phasefill");
  var total = 0;
  for (var i = 0; i < fills.length; i++) {
    total = total + Number(fills[i].getAttribute("data-percent"));
  }
  overall = Math.round(total / fills.length);
  document.getElementById("overallText").innerHTML = overall + "%";
}

function resetBars() {
  var fills = document.getElementsByClassName("phasefill");
  for (var i = 0; i < fills.length; i++) {
    fills[i].style.width = "0%";
  }
  document.getElementById("overallFill").style.width = "0%";
}

function fillBars() {
  var fills = document.getElementsByClassName("phasefill");
  for (var i = 0; i < fills.length; i++) {
    fills[i].style.width = fills[i].getAttribute("data-percent") + "%";
  }
  document.getElementById("overallFill").style.width = overall + "%";
}

// ---------- the progress ring counts up ----------
var shown = 0;
var ringTimer;

function animateRing() {
  clearInterval(ringTimer);
  shown = 0;
  ringTimer = setInterval(stepRing, 20);
}

function stepRing() {
  shown = shown + 1;
  document.getElementById("ring").style.background =
    "conic-gradient(#c9a13b 0%, #c9a13b " +
    shown +
    "%, #e4e2dc " +
    shown +
    "%)";
  document.getElementById("ringText").innerHTML = shown + "%";
  if (shown >= overall) {
    clearInterval(ringTimer);
  }
}

// ---------- days left until turnover ----------
function showDaysLeft() {
  var target = new Date("2027-01-30");
  var today = new Date();
  var days = Math.ceil((target - today) / 86400000);
  document.getElementById("daysLeft").innerHTML = days + " days left";
}

// ---------- photo log ----------
function openPhoto(src) {
  document.getElementById("bigPhoto").src = src;
  document.getElementById("lightbox").style.display = "flex";
}

function closePhoto() {
  document.getElementById("lightbox").style.display = "none";
}

// ---------- documents ----------
function filterDocs(type, button) {
  var docs = document.getElementsByClassName("doc");
  for (var i = 0; i < docs.length; i++) {
    if (type == "All" || docs[i].getAttribute("data-type") == type) {
      docs[i].style.display = "flex";
    } else {
      docs[i].style.display = "none";
    }
  }
  var tabs = document.getElementsByClassName("tab");
  for (var j = 0; j < tabs.length; j++) {
    tabs[j].className = "tab";
  }
  button.className = "tab on";
}

// the client signs Change Order No. 1
function signDocument(button) {
  var row = button.parentNode;
  var status = row.getElementsByClassName("status")[0];
  status.className = "status done";
  status.innerHTML = "Signed";
  button.className = "smallbtn";
  button.innerHTML = "Signed. Download";
  button.onclick = null;
  document.getElementById("docBadge").style.display = "none";
}

function showFileName() {
  var file = document.getElementById("docFile").files[0];
  if (file == undefined) {
    document.getElementById("fileName").innerHTML = "No file chosen";
  } else {
    document.getElementById("fileName").innerHTML = file.name;
  }
}

// ---------- payments ----------
function sendProof() {
  var file = document.getElementById("proofFile").files[0];
  var note = document.getElementById("proofNote");
  if (file == undefined) {
    note.style.color = "#b3261e";
    note.innerHTML = "Please choose a file first.";
  } else {
    note.style.color = "#2e7d4f";
    note.innerHTML =
      "Thank you! We received " +
      file.name +
      ". Our office will confirm your payment.";
  }
}

// ---------- messages ----------
function sendChat() {
  var input = document.getElementById("chatText");
  var box = document.getElementById("chatBox");
  if (input.value == "") {
    return;
  }
  var bubble = document.createElement("div");
  bubble.className = "bubble mine";
  var text = document.createElement("p");
  text.textContent = input.value;
  var time = document.createElement("small");
  time.textContent = "Just now";
  bubble.appendChild(text);
  bubble.appendChild(time);
  box.appendChild(bubble);
  box.scrollTop = box.scrollHeight;
  input.value = "";
}

function chatEnter(event) {
  if (event.key == "Enter") {
    sendChat();
  }
}

// ---------- start ----------
computeOverall();
showDaysLeft();
animateRing();
