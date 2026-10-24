// ---------- headline: the last word is typed and deleted ----------
var phrases = ["house.", "renovation.", "plans.", "dream home."];
var phraseNumber = 0;
var letterNumber = 0;
var deleting = false;
var hold = 0;

function typeText() {
  if (hold > 0) {
    hold = hold - 1;
    return;
  }

  var phrase = phrases[phraseNumber];
  if (deleting == false) {
    letterNumber = letterNumber + 1;
    if (letterNumber == phrase.length) {
      deleting = true;
      hold = 14;
    }
  } else {
    letterNumber = letterNumber - 1;
    if (letterNumber == 0) {
      deleting = false;
      phraseNumber = phraseNumber + 1;
      if (phraseNumber == phrases.length) {
        phraseNumber = 0;
      }
    }
  }
  document.getElementById("typed").innerHTML = phrase.substring(
    0,
    letterNumber,
  );
}

setInterval(typeText, 110);

// ---------- copy buttons ----------
function copyText(button, text) {
  navigator.clipboard.writeText(text);
  button.innerHTML = "Copied!";
  setTimeout(resetCopyButtons, 1500);
}

function resetCopyButtons() {
  var buttons = document.getElementsByClassName("copybutton");
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].innerHTML = "Copy";
  }
}

// ---------- message form ----------
var replyWay = "Call me";

function pickReply(chip, way) {
  replyWay = way;
  var chips = document.getElementsByClassName("replychip");
  for (var i = 0; i < chips.length; i++) {
    chips[i].className = "replychip";
  }
  chip.className = "replychip on";
}

function countLetters() {
  var text = document.getElementById("message").value;
  document.getElementById("letterCount").innerHTML = text.length + " / 500";
}

function sendMessage() {
  var clientName = document.getElementById("fullName").value;
  var phone = document.getElementById("phone").value;
  var email = document.getElementById("email").value;
  var subject = document.getElementById("subject").value;
  var message = document.getElementById("message").value;
  var error = document.getElementById("formError");

  if (clientName == "") {
    error.innerHTML = "Please enter your name.";
    return;
  }
  if (phone == "" && email == "") {
    error.innerHTML =
      "Please enter a phone number or an email so we can reply.";
    return;
  }
  if (email != "" && email.indexOf("@") == -1) {
    error.innerHTML = "That email does not look right.";
    return;
  }
  if (message == "") {
    error.innerHTML = "Please write a short message.";
    return;
  }

  error.innerHTML = "";
  addInbox({
    name: clientName,
    phone: phone,
    email: email,
    subject: subject,
    reply: replyWay,
    message: message,
  });

  document.getElementById("thanksName").innerHTML = clientName;
  document.getElementById("thanksWay").innerHTML = replyWay;
  document.getElementById("formBox").style.display = "none";
  document.getElementById("thanksBox").style.display = "flex";
}

function writeAnother() {
  document.getElementById("fullName").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("email").value = "";
  document.getElementById("message").value = "";
  countLetters();
  document.getElementById("thanksBox").style.display = "none";
  document.getElementById("formBox").style.display = "block";
}
