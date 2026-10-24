// ---------- estimate numbers (price per square meter) ----------
// These are typical 2026 planning ranges for houses in the Philippines.
// Ask the owner for the company's real rates and change them here.
var lowRate = [20000, 27000, 38000];
var highRate = [26000, 38000, 55000];
var finishNames = ["Basic", "Standard", "Premium"];
var typeNames = ["New house", "Commercial building", "Renovation"];
var typeFactor = [1, 1, 0.6];

var chosenType = 0;
var chosenFinish = 1;
var currentStep = 1;

// ---------- step 1: services ----------
function getSelected() {
  var chips = document.getElementsByClassName("servicechip");
  var selected = [];
  for (var i = 0; i < chips.length; i++) {
    if (chips[i].className == "servicechip on") {
      selected.push(chips[i].textContent.trim());
    }
  }
  return selected;
}

function toggleService(chip) {
  if (chip.className == "servicechip on") {
    chip.className = "servicechip";
  } else {
    chip.className = "servicechip on";
  }
  updateSummary();
}

// services picked on the Services page are already selected here
function preselectServices() {
  var pickedText = localStorage.getItem("pickedServices");
  if (pickedText == null) {
    return;
  }
  var chips = document.getElementsByClassName("servicechip");
  for (var i = 0; i < chips.length; i++) {
    if (pickedText.indexOf(chips[i].textContent.trim()) != -1) {
      chips[i].className = "servicechip on";
    }
  }
  document.getElementById("pickedNote").innerHTML =
    "We selected these from the Services page: " + pickedText;
  localStorage.removeItem("pickedServices");
}

// ---------- step 2: project ----------
function pickType(number, card) {
  chosenType = number;
  selectCard(card);
  updateSummary();
}

function pickFinish(number, card) {
  chosenFinish = number;
  selectCard(card);
  updateSummary();
}

// highlight one card and un-highlight the other cards in the same row
function selectCard(card) {
  var cards = card.parentNode.children;
  for (var i = 0; i < cards.length; i++) {
    cards[i].className = "qcard";
  }
  card.className = "qcard on";
}

function setArea(value) {
  document.getElementById("areaSlider").value = value;
  document.getElementById("areaNumber").value = value;
  updateSummary();
}

// ---------- the live summary and estimate ----------
function updateSummary() {
  var selected = getSelected();
  var list = document.getElementById("sumServices");
  if (selected.length == 0) {
    list.innerHTML = "<li>Nothing selected yet</li>";
  } else {
    list.innerHTML = "<li>" + selected.join("</li><li>") + "</li>";
  }

  var area = Number(document.getElementById("areaNumber").value);
  document.getElementById("sumType").innerHTML = typeNames[chosenType];
  document.getElementById("sumArea").innerHTML = area + " sqm";
  document.getElementById("sumFinish").innerHTML = finishNames[chosenFinish];

  var price = document.getElementById("sumPrice");
  var note = document.getElementById("sumNote");
  var wantsBuild =
    selected.indexOf("Design and Build") != -1 ||
    selected.indexOf("Renovation Works") != -1;

  if (wantsBuild == false) {
    price.innerHTML = "Choose a service";
    note.innerHTML =
      "The estimate appears when you pick Design and Build or Renovation Works. Other services are priced after we review your request.";
  } else if (area <= 0) {
    price.innerHTML = "Enter your floor area";
  } else {
    var low = area * lowRate[chosenFinish] * typeFactor[chosenType];
    var high = area * highRate[chosenFinish] * typeFactor[chosenType];
    low = Math.round(low / 10000) * 10000;
    high = Math.round(high / 10000) * 10000;
    price.innerHTML =
      "₱" +
      low.toLocaleString("en-PH") +
      " to ₱" +
      high.toLocaleString("en-PH");
    note.innerHTML =
      "A planning range only. It leaves out the lot, permits and fees, and furniture. Your official quotation comes after we review your plan.";
    price.className = "price flash";
    setTimeout(stopFlash, 600);
  }
}

function stopFlash() {
  document.getElementById("sumPrice").className = "price";
}

function showQuoteFile() {
  var file = document.getElementById("quoteFile").files[0];
  if (file == undefined) {
    document.getElementById("quoteFileName").innerHTML = "No file chosen";
  } else {
    document.getElementById("quoteFileName").innerHTML = file.name;
  }
}

// ---------- the three steps ----------
function showStep(number) {
  currentStep = number;
  for (var i = 1; i <= 3; i++) {
    document.getElementById("step" + i).className = "stepbox";
    if (i < number) {
      document.getElementById("p" + i).className = "pstep done";
    } else if (i == number) {
      document.getElementById("p" + i).className = "pstep on";
    } else {
      document.getElementById("p" + i).className = "pstep";
    }
  }
  document.getElementById("step" + number).className = "stepbox on";
  document.getElementById("pl1").className = "pline";
  document.getElementById("pl2").className = "pline";
  if (number > 1) {
    document.getElementById("pl1").className = "pline done";
  }
  if (number > 2) {
    document.getElementById("pl2").className = "pline done";
  }

  if (number == 1) {
    document.getElementById("backBtn").style.visibility = "hidden";
  } else {
    document.getElementById("backBtn").style.visibility = "visible";
  }
  if (number == 3) {
    document.getElementById("nextBtn").innerHTML = "Send my request";
  } else {
    document.getElementById("nextBtn").innerHTML = "Next";
  }
  document.getElementById("qError").innerHTML = "";
}

function goBack() {
  showStep(currentStep - 1);
}

function goNext() {
  var error = document.getElementById("qError");

  if (currentStep == 1 && getSelected().length == 0) {
    error.innerHTML = "Please pick at least one service.";
    return;
  }
  if (currentStep == 2) {
    if (Number(document.getElementById("areaNumber").value) <= 0) {
      error.innerHTML = "Please enter your floor area.";
      return;
    }
    if (document.getElementById("location").value == "") {
      error.innerHTML = "Please enter your project location.";
      return;
    }
  }
  if (currentStep == 3) {
    sendQuote();
    return;
  }
  showStep(currentStep + 1);
}

// ---------- send the request ----------
function sendQuote() {
  var error = document.getElementById("qError");
  var clientName = document.getElementById("fullName").value;
  var phone = document.getElementById("phone").value;
  var email = document.getElementById("email").value;

  if (clientName == "") {
    error.innerHTML = "Please enter your name.";
    return;
  }
  if (phone == "" && email == "") {
    error.innerHTML =
      "Please enter a phone number or an email so we can reach you.";
    return;
  }
  if (email != "" && email.indexOf("@") == -1) {
    error.innerHTML = "That email does not look right.";
    return;
  }

  var reference =
    "ABQ-" +
    new Date().getFullYear() +
    "-" +
    (Math.floor(Math.random() * 9000) + 1000);
  var estimate = document.getElementById("sumPrice").innerHTML;
  if (estimate == "Choose a service" || estimate == "Enter your floor area") {
    estimate = "Priced after review";
  }
  addLead({
    ref: reference,
    name: clientName,
    phone: phone,
    email: email,
    services: getSelected().join(", "),
    type: typeNames[chosenType],
    area: document.getElementById("areaNumber").value,
    finish: finishNames[chosenFinish],
    location: document.getElementById("location").value,
    start: document.getElementById("startTime").value,
    notes: document.getElementById("notes").value,
    estimate: estimate,
  });

  document.getElementById("thanksName").innerHTML = clientName;
  document.getElementById("refNumber").innerHTML = reference;
  document.getElementById("step3").className = "stepbox";
  document.getElementById("navButtons").style.display = "none";
  error.innerHTML = "";
  document.getElementById("p3").className = "pstep done";
  document.getElementById("successBox").style.display = "flex";
  window.scrollTo(0, 0);
}

// ---------- start ----------
preselectServices();
showStep(1);
updateSummary();
