// ======================================================================
// Client dashboard. Everything on this page is read from js/data.js, so
// when the office updates the project in the admin dashboard, it shows here.
// ======================================================================

// ---------- you must be logged in to see this page ----------
// (delete these 3 lines if you want to open the dashboard directly)
if (localStorage.getItem("clientLoggedIn") != "yes") {
  window.location = "login.html";
}

function logOut() {
  localStorage.removeItem("clientLoggedIn");
  window.location = "login.html";
}

var project = null;
var currentSection = "overview";
var docFilter = "All";
var overall = 0;
var shown = 0;
var ringTimer;

function put(id, html) {
  document.getElementById(id).innerHTML = html;
}

var toastTimer;
function toast(text) {
  var box = document.getElementById("toast");
  box.innerHTML = text;
  box.className = "toast on";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 2600);
}

function hideToast() {
  document.getElementById("toast").className = "toast";
}

// saves a change the client made, then redraws everything
function saveChange(logText, toastText) {
  addLog(logText);
  if (saveData() == false) {
    loadProject();
    renderEverything();
    toast("Could not save. The browser storage is full.");
    return;
  }
  renderEverything();
  toast(toastText);
}

function loadProject() {
  loadData();
  project = getProject(clientProjectId);
}

// ---------- left panel ----------
function showSection(name) {
  currentSection = name;
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
  if (name == "messages") {
    markTeamRead();
  }
  renderEverything();
}

function renderEverything() {
  if (project == null) {
    put("overviewBody", "<h1>Project not found</h1><p>Please contact our office.</p>");
    return;
  }
  overall = overallProgress(project);
  document.getElementById("userInitials").innerHTML = initials(project.client);
  document.getElementById("userName").innerHTML = esc(project.client);
  document.getElementById("userProject").innerHTML = esc(project.name);
  renderOverview();
  renderProgress();
  renderPhotos();
  renderDocuments();
  renderPayments();
  renderMessages();
  renderBadges();
  if (currentSection == "overview") {
    animateRing();
  }
  if (currentSection == "progress") {
    setTimeout(fillBars, 100);
  }
}

function initials(name) {
  var words = name.split(" ");
  var letters = words[0].charAt(0);
  if (words.length > 1) {
    letters = letters + words[1].charAt(0);
  }
  return letters.toUpperCase();
}

function countSignatures() {
  var n = 0;
  for (var i = 0; i < project.documents.length; i++) {
    if (project.documents[i].status == "Needs signature") {
      n++;
    }
  }
  return n;
}

function countTeamUnread() {
  var n = 0;
  for (var i = 0; i < project.messages.length; i++) {
    if (project.messages[i].from == "team" && project.messages[i].read == false) {
      n++;
    }
  }
  return n;
}

function renderBadges() {
  setBadge("docBadge", countSignatures());
  setBadge("msgBadge", countTeamUnread());
}

function setBadge(id, number) {
  var badge = document.getElementById(id);
  badge.innerHTML = number;
  if (number == 0) {
    badge.style.display = "none";
  } else {
    badge.style.display = "inline";
  }
}

// ======================================================================
// OVERVIEW
// ======================================================================
function getAttention() {
  var list = [];
  for (var i = 0; i < project.documents.length; i++) {
    if (project.documents[i].status == "Needs signature") {
      list.push({ icon: "bi-pen-fill", text: "Sign " + esc(project.documents[i].name), go: "documents" });
    }
  }
  for (var j = 0; j < project.payments.length; j++) {
    var pay = project.payments[j];
    if (pay.status == "Unpaid" && daysFromToday(pay.due) <= 14) {
      list.push({ icon: "bi-cash-coin", text: "Payment of " + money(pay.amount) + " is due " + whenText(pay.due), go: "payments" });
    }
  }
  var unread = countTeamUnread();
  if (unread > 0) {
    list.push({ icon: "bi-chat-dots-fill", text: plural(unread, "new message") + " from the site team", go: "messages" });
  }
  return list;
}

function renderOverview() {
  var first = project.client.split(" ")[0];
  var latest = project.image;
  if (project.photos.length > 0) {
    latest = project.photos[0].src;
  }
  var statusBadge = '<span class="status progress">In progress</span>';
  if (project.status == "Completed") {
    statusBadge = '<span class="status done">Completed</span>';
  }

  var phaseIndex = nextPhase(project);
  var phaseText = "All phases done";
  var milestone = "Turnover";
  var milestoneDate = "Completed " + showDate(project.completed);
  if (phaseIndex != -1) {
    phaseText = "Phase " + (phaseIndex + 1) + " of " + project.phases.length;
    milestone = project.phases[phaseIndex].name;
    milestoneDate = "Target " + showDate(project.phases[phaseIndex].end);
  }

  var payIndex = nextPayment(project);
  var payNote = "No more payments";
  if (payIndex != -1) {
    payNote = "Next: " + money(project.payments[payIndex].amount) + " on " + showDate(project.payments[payIndex].due);
  }

  var daysLeft = daysFromToday(project.target);
  var daysText = daysLeft + " days left";
  if (daysLeft == 0) {
    daysText = "Due today";
  }
  if (daysLeft < 0) {
    daysText = "Past the target date";
  }
  if (project.status == "Completed") {
    daysText = "Project completed";
  }

  var updates = "";
  for (var i = 0; i < project.updates.length && i < 3; i++) {
    updates += '<div class="update"><span class="dot"></span><div><p class="small">' + showDate(project.updates[i].date) + "</p><b>" + esc(project.updates[i].title) + "</b><p>" + esc(project.updates[i].text) + "</p></div></div>";
  }
  if (project.updates.length == 0) {
    updates = '<p class="small">No updates yet. Your first update will show here.</p>';
  }

  var attention = getAttention();
  var todo = "";
  for (var j = 0; j < attention.length; j++) {
    todo += '<div class="todo" onclick="showSection(\'' + attention[j].go + '\')"><i class="bi ' + attention[j].icon + '"></i><span>' + attention[j].text + '</span><i class="bi bi-chevron-right"></i></div>';
  }
  if (attention.length == 0) {
    todo = '<p class="small">You are all caught up. Nothing needs you right now.</p>';
  }

  var html = "";
  html += '<div class="welcome"><div class="welcometext"><p class="small">CLIENT PORTAL</p><h1>Welcome back, ' + esc(first) + '</h1><p class="projectname">' + esc(project.name) + ", " + esc(project.location) + "</p>" + statusBadge + '</div><img src="' + esc(latest) + '" alt="Latest site photo" /></div>';
  html += '<div class="kpis">';
  html += '<div class="box kpi"><div class="ring" id="ring"><div class="ringinner" id="ringText">0%</div></div><div><p class="small">Overall progress</p><b>' + phaseText + "</b></div></div>";
  html += '<div class="box kpi"><i class="bi bi-calendar-event"></i><div><p class="small">Next milestone</p><b>' + esc(milestone) + '</b><p class="small">' + milestoneDate + "</p></div></div>";
  html += '<div class="box kpi"><i class="bi bi-wallet2"></i><div><p class="small">Balance due</p><b>' + money(balanceOf(project)) + '</b><p class="small">' + payNote + "</p></div></div>";
  html += '<div class="box kpi"><i class="bi bi-clock-history"></i><div><p class="small">Target turnover</p><b>' + showDate(project.target) + '</b><p class="small">' + daysText + "</p></div></div>";
  html += "</div>";
  html += '<div class="twocol"><div class="box leftcol"><h3>Recent updates</h3>' + updates + "</div>";
  html += '<div class="rightcol"><div class="box"><h3>Needs your attention</h3>' + todo + "</div>";
  html += '<div class="box"><h3>Your contact</h3><p class="contactname"><b>Engr. Alvin Atienza</b></p><p class="small">Your main point of contact</p><div class="contactbtns"><a class="btn" href="tel:+639624495318"><i class="bi bi-telephone-fill"></i> Call</a><button class="btn2" onclick="showSection(\'messages\')"><i class="bi bi-chat-dots"></i> Message</button></div></div></div></div>';
  put("overviewBody", html);
}

// the progress ring counts up
function animateRing() {
  clearInterval(ringTimer);
  shown = 0;
  ringTimer = setInterval(stepRing, 20);
}

function stepRing() {
  shown = shown + 1;
  var ring = document.getElementById("ring");
  if (ring == null) {
    clearInterval(ringTimer);
    return;
  }
  ring.style.background = "conic-gradient(#c9a13b 0%, #c9a13b " + shown + "%, #e4e2dc " + shown + "%)";
  document.getElementById("ringText").innerHTML = shown + "%";
  if (shown >= overall) {
    clearInterval(ringTimer);
  }
}

// ======================================================================
// CONSTRUCTION
// ======================================================================
function renderProgress() {
  var html = "<h1>Construction progress</h1>";
  html += '<p class="pagesub">Seven phases from permits to turnover.</p>';
  html += '<div class="box overall"><div class="overalltop"><b>Overall progress</b><b>' + overall + '%</b></div><div class="bar"><div class="overallfill" id="overallFill" data-percent="' + overall + '"></div></div><p class="small">Started ' + showDate(project.start) + " | Target turnover " + showDate(project.target) + "</p></div>";
  html += '<div class="phases">';
  for (var i = 0; i < project.phases.length; i++) {
    var ph = project.phases[i];
    var state = phaseState(ph);
    var circle = '<span class="phasenum">' + (i + 1) + "</span>";
    if (state.text == "Done") {
      circle = '<span class="phasenum done"><i class="bi bi-check-lg"></i></span>';
    }
    if (state.text == "In progress") {
      circle = '<span class="phasenum now">' + (i + 1) + "</span>";
    }
    html += '<div class="phase">' + circle + '<div class="phasebody"><div class="phasetop"><b>' + (i + 1) + ". " + esc(ph.name) + '</b><span class="status ' + state.cls + '">' + state.text + '</span></div><p class="small">' + showDate(ph.start) + " - " + showDate(ph.end) + '</p><div class="bar"><div class="phasefill" data-percent="' + ph.percent + '"></div></div></div></div>';
  }
  html += "</div>";
  put("progressBody", html);
}

function fillBars() {
  var fills = document.getElementsByClassName("phasefill");
  for (var i = 0; i < fills.length; i++) {
    fills[i].style.width = fills[i].getAttribute("data-percent") + "%";
  }
  var overallFill = document.getElementById("overallFill");
  if (overallFill != null) {
    overallFill.style.width = overallFill.getAttribute("data-percent") + "%";
  }
}

// ======================================================================
// PHOTO LOG
// ======================================================================
function renderPhotos() {
  var html = "<h1>Photo log</h1>";
  html += '<p class="pagesub">Photos from your site. Click a photo to see it bigger.</p><div class="photos">';
  for (var i = 0; i < project.photos.length; i++) {
    var ph = project.photos[i];
    html += '<div class="photo"><img src="' + esc(ph.src) + '" onclick="openPhoto(this.src)" alt="' + esc(ph.title) + '" /><p><b>' + esc(ph.title) + "</b><span>" + showDate(ph.date) + "</span></p></div>";
  }
  if (project.photos.length == 0) {
    html += '<p class="small">No photos yet. Our team adds photos as the work moves along.</p>';
  }
  html += "</div>";
  put("photosBody", html);
}

function openPhoto(src) {
  document.getElementById("bigPhoto").src = src;
  document.getElementById("lightbox").style.display = "flex";
}

function closePhoto() {
  document.getElementById("lightbox").style.display = "none";
}

// ======================================================================
// DOCUMENTS
// ======================================================================
function docIcon(type) {
  if (type == "Permits") {
    return "bi-patch-check-fill";
  }
  if (type == "Plans") {
    return "bi-rulers";
  }
  if (type == "Billing") {
    return "bi-receipt";
  }
  if (type == "Client upload") {
    return "bi-upload";
  }
  return "bi-file-earmark-text-fill";
}

function setDocFilter(type) {
  docFilter = type;
  renderDocuments();
}

function renderDocuments() {
  var html = "<h1>Documents</h1>";
  html += '<p class="pagesub">Your contracts, permits, plans and billing papers in one place.</p><div class="tabs">';
  var types = ["All", "Contracts", "Permits", "Plans", "Billing"];
  for (var t = 0; t < types.length; t++) {
    var cls = "tab";
    if (types[t] == docFilter) {
      cls = "tab on";
    }
    html += '<button class="' + cls + '" onclick="setDocFilter(\'' + types[t] + '\')">' + types[t] + "</button>";
  }
  html += '</div><div class="box doclist">';
  var shownDocs = 0;
  for (var i = 0; i < project.documents.length; i++) {
    var d = project.documents[i];
    if (docFilter != "All" && d.type != docFilter) {
      continue;
    }
    var button = '<a class="smallbtn" href="#">Download</a>';
    if (d.status == "Needs signature") {
      button = '<button class="smallbtn gold" onclick="signDocument(' + i + ')">Review and sign</button>';
    }
    html += '<div class="doc"><i class="bi ' + docIcon(d.type) + '"></i><div class="docname"><b>' + esc(d.name) + "</b><span>" + showDate(d.date) + '</span></div><span class="status ' + docClass(d.status) + '">' + d.status + "</span>" + button + "</div>";
    shownDocs++;
  }
  if (shownDocs == 0) {
    html += '<p class="small">No documents here yet.</p>';
  }
  html += '</div><div class="box uploadbox"><div><b>Send us a document</b><p class="small">Valid ID, signed forms or anything our office asked for.</p></div><div class="uploadside"><input type="file" id="docFile" onchange="showFileName()" /><span class="small" id="fileName">No file chosen</span><button class="btn" onclick="sendDocument()">Send</button></div></div>';
  put("documentsBody", html);
}

function signDocument(i) {
  project.documents[i].status = "Signed";
  saveChange(project.client + " signed " + project.documents[i].name, "Thank you. The document is signed.");
}

function showFileName() {
  var file = document.getElementById("docFile").files[0];
  if (file == undefined) {
    document.getElementById("fileName").innerHTML = "No file chosen";
  } else {
    document.getElementById("fileName").innerHTML = esc(file.name);
  }
}

function sendDocument() {
  var file = document.getElementById("docFile").files[0];
  if (file == undefined) {
    toast("Please choose a file first.");
    return;
  }
  project.documents.unshift({ name: file.name, type: "Client upload", date: todayIso(), status: "Received" });
  saveChange(project.client + " sent the file " + file.name, "Thank you. Our office received your file.");
}

// ======================================================================
// PAYMENTS
// ======================================================================
function renderPayments() {
  var html = "<h1>Payments</h1>";
  html += '<p class="pagesub">Your contract price, what you paid and what is next.</p>';
  html += '<div class="kpis"><div class="box kpi"><div><p class="small">Contract price</p><b class="big">' + money(project.price) + '</b></div></div><div class="box kpi"><div><p class="small">Paid so far</p><b class="big">' + money(paidTotal(project)) + '</b></div></div><div class="box kpi"><div><p class="small">Balance</p><b class="big">' + money(balanceOf(project)) + "</b></div></div></div>";
  html += '<div class="box"><h3>Payment schedule</h3><div class="payrow head"><span>Milestone</span><span>Amount</span><span>Due date</span><span>Status</span></div>';
  var options = "";
  for (var i = 0; i < project.payments.length; i++) {
    var pay = project.payments[i];
    var state = paymentState(pay);
    html += '<div class="payrow"><span>' + esc(pay.name) + "</span><span>" + money(pay.amount) + "</span><span>" + showDate(pay.due) + '</span><span class="status ' + state.cls + '">' + state.text + "</span></div>";
    if (pay.status == "Unpaid") {
      options += '<option value="' + i + '">' + esc(pay.name) + " (" + money(pay.amount) + ")</option>";
    }
  }
  if (project.payments.length == 0) {
    html += '<p class="small">Your payment schedule will show here.</p>';
  }
  html += "</div>";
  if (options != "") {
    html += '<div class="box uploadbox"><div><b>Upload proof of payment</b><p class="small">Choose the payment, then send a photo or screenshot of your receipt. Our office will confirm it.</p></div><div class="uploadside"><select id="proofFor">' + options + '</select><input type="file" id="proofFile" /><button class="btn" onclick="sendProof()">Send proof</button></div></div>';
  }
  html += '<p class="proofnote" id="proofNote"></p>';
  put("paymentsBody", html);
}

function sendProof() {
  var file = document.getElementById("proofFile").files[0];
  var note = document.getElementById("proofNote");
  if (file == undefined) {
    note.style.color = "#b3261e";
    note.innerHTML = "Please choose a file first.";
    return;
  }
  var i = Number(document.getElementById("proofFor").value);
  project.payments[i].status = "Proof sent";
  project.payments[i].proof = file.name;
  saveChange(project.client + " sent proof of payment for " + project.payments[i].name, "Thank you. Our office will confirm your payment.");
}

// ======================================================================
// MESSAGES
// ======================================================================
function renderMessages() {
  var html = "<h1>Messages</h1>";
  html += '<p class="pagesub">Talk to the site team about your project.</p><div class="box chatwrap"><div class="chatbox" id="chatBox">';
  for (var i = 0; i < project.messages.length; i++) {
    var m = project.messages[i];
    if (m.from == "team") {
      html += '<div class="bubble theirs"><b>Engr. Alvin Atienza</b><p>' + esc(m.text) + "</p><small>" + m.time + "</small></div>";
    } else {
      html += '<div class="bubble mine"><p>' + esc(m.text) + "</p><small>" + m.time + "</small></div>";
    }
  }
  if (project.messages.length == 0) {
    html += '<p class="small">No messages yet. Write the first one below.</p>';
  }
  html += '</div><div class="chatinput"><input type="text" id="chatText" placeholder="Write a message to the site team" onkeydown="chatEnter(event)" /><button class="btn" onclick="sendChat()"><i class="bi bi-send-fill"></i></button></div></div>';
  put("messagesBody", html);
  var box = document.getElementById("chatBox");
  box.scrollTop = box.scrollHeight;
}

function markTeamRead() {
  var changed = false;
  for (var i = 0; i < project.messages.length; i++) {
    if (project.messages[i].from == "team" && project.messages[i].read == false) {
      project.messages[i].read = true;
      changed = true;
    }
  }
  if (changed) {
    saveData();
  }
}

function sendChat() {
  var input = document.getElementById("chatText");
  if (input.value == "") {
    return;
  }
  project.messages.push({ from: "client", text: input.value, time: nowText(), read: false });
  saveChange(project.client + " sent a message", "Message sent.");
}

function chatEnter(event) {
  if (event.key == "Enter") {
    sendChat();
  }
}

// ======================================================================
// LIVE UPDATE: when the office changes the project in the admin dashboard
// (another tab), this page redraws by itself
// ======================================================================
function onDataChanged(event) {
  if (event.key == dataKey) {
    loadProject();
    if (currentSection == "messages") {
      markTeamRead();
    }
    renderEverything();
    toast("Your project was just updated.");
  }
}

window.onstorage = onDataChanged;

// ---------- start ----------
loadProject();
renderEverything();
