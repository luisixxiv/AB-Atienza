// ---------- headline: the last word changes every 2 seconds ----------
var words = [
  "house plans",
  "new home",
  "renovation",
  "3D visuals",
  "finishing works",
];
var wordNumber = 0;

function swapWord() {
  wordNumber = wordNumber + 1;
  if (wordNumber == words.length) {
    wordNumber = 0;
  }
  document.getElementById("swapWord").innerHTML =
    '<span class="word">' + words[wordNumber] + "</span>";
}

setInterval(swapWord, 2200);

// ---------- flip cards: send one service to the quote page ----------
function requestService(name) {
  localStorage.setItem("pickedServices", name);
  window.location = "quote.html";
}

// ---------- finishing works: click to pick, the bar slides up ----------
var picked = [];

function toggleTrade(tile, name) {
  var spot = picked.indexOf(name);
  if (spot == -1) {
    picked.push(name);
    tile.className = "trade on";
  } else {
    picked.splice(spot, 1);
    tile.className = "trade";
  }
  showPicked();
}

function showPicked() {
  var bar = document.getElementById("pickBar");
  if (picked.length == 0) {
    bar.style.bottom = "-110px";
  } else {
    bar.style.bottom = "0px";
  }
  document.getElementById("pickCount").innerHTML = picked.length;
  document.getElementById("pickList").innerHTML = picked.join(", ");
}

function sendPicked() {
  localStorage.setItem("pickedServices", picked.join(", "));
  window.location = "quote.html";
}

// ---------- questions: click to open and close ----------
function toggleFaq(question) {
  var answer = question.parentNode.getElementsByTagName("p")[0];
  var plus = question.getElementsByTagName("span")[0];
  if (answer.style.display == "block") {
    answer.style.display = "none";
    plus.innerHTML = "+";
  } else {
    answer.style.display = "block";
    plus.innerHTML = "-";
  }
}

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
