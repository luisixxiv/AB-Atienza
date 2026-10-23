// ---------- hero: the photos slide as you move the mouse ----------
function moveParallax(event) {
  var box = document.getElementById("phero").getBoundingClientRect();
  var offset = event.clientX - (box.left + box.width / 2);
  var photos = document.getElementsByClassName("pimg");
  for (var i = 0; i < photos.length; i++) {
    var speed = (i + 1) * 0.025;
    if (i % 2 == 1) {
      speed = speed * -1;
    }
    var tilt = (i - 1.5) * 2;
    photos[i].style.transform =
      "translateX(" + offset * speed + "px) rotate(" + tilt + "deg)";
  }
}

// ---------- filter buttons ----------
var allCards = document.getElementsByClassName("pcard");

function filterProjects(category, button) {
  for (var i = 0; i < allCards.length; i++) {
    if (
      category == "All" ||
      allCards[i].getAttribute("data-category") == category
    ) {
      allCards[i].style.display = "block";
    } else {
      allCards[i].style.display = "none";
    }
  }

  var chips = document.getElementsByClassName("filterchip");
  for (var j = 0; j < chips.length; j++) {
    chips[j].className = "filterchip";
  }
  button.className = "filterchip on";
}

// ---------- project viewer ----------
var currentCard = 0;

function openProject(card) {
  for (var i = 0; i < allCards.length; i++) {
    if (allCards[i] == card) {
      currentCard = i;
    }
  }
  showProject();
  document.getElementById("viewer").style.display = "flex";
}

function showProject() {
  var card = allCards[currentCard];
  document.getElementById("vImage").src =
    card.getElementsByTagName("img")[0].src;
  document.getElementById("vTitle").innerHTML =
    card.getElementsByTagName("h3")[0].innerHTML;
  document.getElementById("vTag").innerHTML =
    card.getAttribute("data-category") + " | " + card.getAttribute("data-kind");
  document.getElementById("vDesc").innerHTML =
    card.getElementsByClassName("carddesc")[0].innerHTML;
}

// go to the next (or previous) project that is not hidden by the filter
function moveProject(step) {
  var tries = 0;
  currentCard = currentCard + step;
  while (tries < allCards.length) {
    if (currentCard >= allCards.length) {
      currentCard = 0;
    }
    if (currentCard < 0) {
      currentCard = allCards.length - 1;
    }
    if (allCards[currentCard].style.display != "none") {
      break;
    }
    currentCard = currentCard + step;
    tries = tries + 1;
  }
  showProject();
}

function closeProject() {
  document.getElementById("viewer").style.display = "none";
}

function handleKey(event) {
  if (document.getElementById("viewer").style.display == "flex") {
    if (event.key == "Escape") {
      closeProject();
    }
    if (event.key == "ArrowRight") {
      moveProject(1);
    }
    if (event.key == "ArrowLeft") {
      moveProject(-1);
    }
  }
}

document.onkeydown = handleKey;

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
