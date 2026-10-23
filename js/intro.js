// ---------- intro: logo pieces fly in and join, then the homepage shows ----------
var introBox = document.getElementById("intro");
var introDone = document.documentElement.classList.contains("no-intro");
var animationFinished = false; // the animation has played long enough
var pageLoaded = false; // the page finished loading underneath

function startIntro() {
  document.body.classList.add("intro-on");
  introBox.classList.add("run");
  setTimeout(animationDone, 2500);
  // never make a visitor wait longer than this, even on a slow connection
  setTimeout(finishIntro, 5000);
}

function animationDone() {
  animationFinished = true;
  checkReveal();
}

function pageReady() {
  pageLoaded = true;
  checkReveal();
}

// show the homepage only when the animation is over AND the page has loaded
function checkReveal() {
  if (animationFinished && pageLoaded) {
    finishIntro();
  }
}

function finishIntro() {
  if (introDone) {
    return;
  }
  introDone = true;
  introBox.classList.add("out");
  // the hero text starts rising while the white screen is lifting
  setTimeout(unlockPage, 350);
  setTimeout(removeIntro, 900);
  try {
    sessionStorage.setItem("abIntroSeen", "1");
  } catch (e) {}
}

function unlockPage() {
  document.body.classList.remove("intro-on");
}

function removeIntro() {
  introBox.style.display = "none";
}

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    finishIntro();
  }
});

if (!introDone) {
  startIntro();
  if (document.readyState === "complete") {
    pageReady();
  } else {
    window.addEventListener("load", pageReady);
  }
}
