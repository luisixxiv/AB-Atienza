// ---------- numbers count up when you scroll to them ----------
var statsBox = document.getElementById("statsBox");
var counted = false;
var counter;
var servicesCount = 0;
var followersCount = 0;
var rolesCount = 0;

function countUp() {
  if (servicesCount < 12) {
    servicesCount = servicesCount + 1;
  }
  if (followersCount < 3900) {
    followersCount = followersCount + 100;
  }
  if (rolesCount < 2) {
    rolesCount = rolesCount + 1;
  }
  document.getElementById("count1").innerHTML = servicesCount;
  document.getElementById("count2").innerHTML =
    (followersCount / 1000).toFixed(1) + "K";
  document.getElementById("count3").innerHTML = rolesCount;

  if (servicesCount == 12 && followersCount == 3900 && rolesCount == 2) {
    clearInterval(counter);
  }
}

// ---------- scroll: start the count and light up the steps ----------
function checkScroll() {
  var box = statsBox.getBoundingClientRect();
  if (box.top < window.innerHeight && counted == false) {
    counted = true;
    counter = setInterval(countUp, 60);
  }

  var steps = document.getElementsByClassName("step");
  for (var i = 0; i < steps.length; i++) {
    var stepBox = steps[i].getBoundingClientRect();
    if (stepBox.top < window.innerHeight * 0.75) {
      steps[i].className = "step on";
    } else {
      steps[i].className = "step";
    }
  }
}

window.onscroll = checkScroll;
checkScroll();

// ---------- service list: a photo follows the mouse ----------
var preview = document.getElementById("preview");

function showPreview(src) {
  preview.src = src;
  preview.style.display = "block";
}

function movePreview(event) {
  preview.style.left = event.clientX + 24 + "px";
  preview.style.top = event.clientY - 75 + "px";
}

function hidePreview() {
  preview.style.display = "none";
}

// ---------- photo stack: click to bring the next photo to the front ----------
var stackCards = document.getElementsByClassName("stackcard");
var stackTop = 0;

function updateStack() {
  for (var i = 0; i < stackCards.length; i++) {
    var place = (i - stackTop + stackCards.length) % stackCards.length;
    stackCards[i].style.zIndex = stackCards.length - place;
    stackCards[i].style.transform =
      "translateX(" + place * 18 + "px) rotate(" + (place * 3 - 2) + "deg)";
  }
  document.getElementById("stackCount").innerHTML =
    stackTop + 1 + " / " + stackCards.length;
}

function nextCard() {
  stackTop = stackTop + 1;
  if (stackTop == stackCards.length) {
    stackTop = 0;
  }
  updateStack();
}

updateStack();

// ---------- copy phone number ----------
function copyPhone(button) {
  navigator.clipboard.writeText("+63 962 449 5318");
  button.innerHTML = "Copied!";
  setTimeout(resetCopyButtons, 1500);
}

function resetCopyButtons() {
  var buttons = document.getElementsByClassName("copybutton");
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].innerHTML = "Copy";
  }
}
