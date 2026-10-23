// ---------- hero: gold glow and photo trail that follow the mouse ----------
var hero = document.getElementById("hero");
var glow = document.getElementById("glow");
var lastX = 0;
var lastY = 0;
var trailNumber = 0;
var trailPhotos = [
  "images/builds/1.jpg",
  "images/builds/2.jpg",
  "images/builds/3.jpg",
  "images/builds/4.jpg",
  "images/builds/5.jpg",
];

function moveInHero(event) {
  var box = hero.getBoundingClientRect();
  var x = event.clientX - box.left;
  var y = event.clientY - box.top;
  glow.style.background =
    "radial-gradient(circle 180px at " +
    x +
    "px " +
    y +
    "px, rgba(201,161,59,0.3), rgba(201,161,59,0))";

  var moved = Math.abs(x - lastX) + Math.abs(y - lastY);
  if (moved > 110) {
    makeTrail(x, y);
    lastX = x;
    lastY = y;
  }
}

function makeTrail(x, y) {
  var pic = document.createElement("img");
  pic.src = trailPhotos[trailNumber];
  pic.className = "trail";
  pic.style.left = x - 56 + "px";
  pic.style.top = y - 40 + "px";
  hero.appendChild(pic);

  trailNumber = trailNumber + 1;
  if (trailNumber == trailPhotos.length) {
    trailNumber = 0;
  }
  setTimeout(removeTrail, 900);
}

function removeTrail() {
  var oldest = hero.getElementsByClassName("trail")[0];
  hero.removeChild(oldest);
}

// ---------- gold band: moves faster and tilts when you scroll ----------
var bandText = document.getElementById("bandText");
var bandPosition = 0;
var lastScroll = 0;

function moveBand() {
  var scrollSpeed = Math.abs(window.scrollY - lastScroll);
  lastScroll = window.scrollY;
  if (scrollSpeed > 20) {
    scrollSpeed = 20;
  }

  bandPosition = bandPosition - (2 + scrollSpeed);
  if (bandPosition < -(bandText.scrollWidth / 3)) {
    bandPosition = 0;
  }
  bandText.style.marginLeft = bandPosition + "px";
  bandText.style.transform = "skewX(" + scrollSpeed * -0.6 + "deg)";
}

setInterval(moveBand, 20);

// ---------- services: the cards stack up and shrink a little as you scroll ----------
var stackCards = document.getElementsByClassName("stackcard");

function stackEffect() {
  for (var i = 0; i < stackCards.length - 1; i++) {
    var myTop = stackCards[i].getBoundingClientRect().top;
    var nextTop = stackCards[i + 1].getBoundingClientRect().top;
    var gap = nextTop - myTop;
    var fullGap = stackCards[i].offsetHeight + 40;
    var scale = 1;
    if (gap < fullGap) {
      scale = 0.94 + (0.06 * (gap - 14)) / (fullGap - 14);
    }
    if (scale < 0.94) {
      scale = 0.94;
    }
    stackCards[i].style.transform = "scale(" + scale + ")";
  }
}


window.onscroll = stackEffect;

// ---------- reviews: copy the cards so the loop never ends ----------
var track1 = document.getElementById("track1");
var track2 = document.getElementById("track2");
track2.innerHTML = track1.innerHTML + track1.innerHTML + track1.innerHTML;
track1.innerHTML = track1.innerHTML + track1.innerHTML + track1.innerHTML;

// ---------- copy phone number ----------
function copyPhone(button) {
  navigator.clipboard.writeText("63+ 962 449 5318");
  button.innerHTML = "Copied!";
  setTimeout(resetCopyButtons, 1500);
}

function resetCopyButtons() {
  var buttons = document.getElementsByClassName("copybutton");
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].innerHTML = "Copy";
  }
}
