// ======================================================================
// Admin dashboard. Everything the company needs to see is on these pages,
// and changes made here show up in the client dashboard.
// ======================================================================

// ---------- you must be logged in as staff ----------
if (localStorage.getItem("adminLoggedIn") != "yes") {
  window.location = "../portal/login.html";
}

function logOut() {
  localStorage.removeItem("adminLoggedIn");
  window.location = "../portal/login.html";
}

var currentSection = "overview";
var currentProject = "p1";
var currentTab = "progress";
var projectFilter = "Ongoing";
var paymentFilter = "action";

// ---------- small helpers ----------
// builds a text like openProject('p1', 'messages') to put inside onclick
function call(name) {
  var parts = [];
  for (var i = 1; i < arguments.length; i++) {
    if (typeof arguments[i] == "number") {
      parts.push(arguments[i]);
    } else {
      parts.push("'" + arguments[i] + "'");
    }
  }
  return name + "(" + parts.join(", ") + ")";
}

function put(id, html) {
  document.getElementById(id).innerHTML = html;
}

function val(id) {
  return document.getElementById(id).value;
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

function barHtml(percent) {
  return '<div class="bar"><div class="barfill" style="width: ' + percent + '%"></div></div>';
}

function ongoing() {
  var list = [];
  for (var i = 0; i < data.projects.length; i++) {
    if (data.projects[i].status == "Ongoing") {
      list.push(data.projects[i]);
    }
  }
  return list;
}

function completedList() {
  var list = [];
  for (var i = 0; i < data.projects.length; i++) {
    if (data.projects[i].status == "Completed") {
      list.push(data.projects[i]);
    }
  }
  return list;
}

function countNewLeads() {
  var n = 0;
  for (var i = 0; i < data.leads.length; i++) {
    if (data.leads[i].status == "New") {
      n++;
    }
  }
  return n;
}

function countUnreadInbox() {
  var n = 0;
  for (var i = 0; i < data.inbox.length; i++) {
    if (data.inbox[i].read == false) {
      n++;
    }
  }
  return n;
}

function countClientUnread(project) {
  var n = 0;
  for (var i = 0; i < project.messages.length; i++) {
    if (project.messages[i].from == "client" && project.messages[i].read == false) {
      n++;
    }
  }
  return n;
}

function needsAction(payment) {
  var state = paymentState(payment).text;
  return state == "Proof sent" || state == "Overdue" || state == "Due soon";
}

function sortByDate(list) {
  for (var i = 0; i < list.length; i++) {
    for (var j = i + 1; j < list.length; j++) {
      if (list[j].date < list[i].date) {
        var temp = list[i];
        list[i] = list[j];
        list[j] = temp;
      }
    }
  }
  return list;
}

function selectOptions(list, current) {
  var html = "";
  for (var i = 0; i < list.length; i++) {
    var selected = "";
    if (list[i] == current) {
      selected = " selected";
    }
    html += "<option" + selected + ">" + list[i] + "</option>";
  }
  return html;
}

// ---------- switching sections ----------
function showSection(name) {
  currentSection = name;
  var boxes = document.getElementsByClassName("panelbox");
  for (var i = 0; i < boxes.length; i++) {
    boxes[i].className = "panelbox";
  }
  document.getElementById(name).className = "panelbox on";

  var navName = name;
  if (name == "manage") {
    navName = "projects";
  }
  var items = document.getElementsByClassName("navitem");
  for (var j = 0; j < items.length; j++) {
    if (items[j].getAttribute("data-section") == navName) {
      items[j].className = "navitem on";
    } else {
      items[j].className = "navitem";
    }
  }
  window.scrollTo(0, 0);
  renderAll();
}

function renderAll() {
  renderBadges();
  if (currentSection == "overview") {
    renderOverview();
  }
  if (currentSection == "projects") {
    renderProjects();
  }
  if (currentSection == "manage") {
    renderManage();
  }
  if (currentSection == "leads") {
    renderLeads();
  }
  if (currentSection == "payments") {
    renderPayments();
  }
  if (currentSection == "activity") {
    renderActivity();
  }
}

function renderBadges() {
  var leadsCount = countNewLeads() + countUnreadInbox();
  var payCount = 0;
  var list = ongoing();
  for (var i = 0; i < list.length; i++) {
    for (var j = 0; j < list[i].payments.length; j++) {
      if (needsAction(list[i].payments[j])) {
        payCount++;
      }
    }
  }
  setBadge("badgeProjects", list.length);
  setBadge("badgeLeads", leadsCount);
  setBadge("badgePayments", payCount);
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

// saves, logs, redraws and shows a message
function saved(logText, toastText) {
  if (logText != "") {
    addLog(logText);
  }
  if (saveData() == false) {
    loadData();
    renderAll();
    toast("Could not save. The browser storage is full.");
    return false;
  }
  renderAll();
  toast(toastText);
  return true;
}

// ======================================================================
// OVERVIEW: everything that needs attention is here
// ======================================================================
function getAlerts() {
  var high = [];
  var mid = [];
  var low = [];

  var newLeads = countNewLeads();
  if (newLeads > 0) {
    high.push({ icon: "bi-person-plus-fill", text: plural(newLeads, "new quote request") + " to answer", go: call("showSection", "leads") });
  }
  var unread = countUnreadInbox();
  if (unread > 0) {
    high.push({ icon: "bi-envelope-fill", text: plural(unread, "new message") + " from the contact form", go: call("showSection", "leads") });
  }

  var list = ongoing();
  for (var i = 0; i < list.length; i++) {
    var p = list[i];

    var messages = countClientUnread(p);
    if (messages > 0) {
      high.push({ icon: "bi-chat-dots-fill", text: esc(p.client) + " sent " + plural(messages, "message") + " about " + esc(p.name), go: call("openProject", p.id, "messages") });
    }

    for (var d = 0; d < p.documents.length; d++) {
      var doc = p.documents[d];
      if (doc.status == "Needs signature") {
        mid.push({ icon: "bi-pen-fill", text: "Waiting for " + esc(p.client) + " to sign " + esc(doc.name), go: call("openProject", p.id, "documents") });
      }
      if (doc.status == "Received") {
        mid.push({ icon: "bi-upload", text: esc(p.client) + " sent a file: " + esc(doc.name), go: call("openProject", p.id, "documents") });
      }
      if (doc.type == "Permits" && doc.status == "Processing") {
        low.push({ icon: "bi-patch-check-fill", text: "Permit still processing: " + esc(doc.name) + " (" + esc(p.name) + ")", go: call("openProject", p.id, "documents") });
      }
    }

    for (var m = 0; m < p.payments.length; m++) {
      var pay = p.payments[m];
      if (pay.status == "Proof sent") {
        high.push({ icon: "bi-cash-coin", text: "Confirm payment: " + esc(p.client) + " sent proof for " + esc(pay.name) + " (" + money(pay.amount) + ")", go: call("showSection", "payments") });
      }
      if (pay.status == "Unpaid") {
        var days = daysFromToday(pay.due);
        if (days < 0) {
          high.push({ icon: "bi-exclamation-triangle-fill", text: "Overdue by " + plural(Math.abs(days), "day") + ": " + money(pay.amount) + " from " + esc(p.client) + " (" + esc(pay.name) + ")", go: call("showSection", "payments") });
        } else if (days <= 7) {
          mid.push({ icon: "bi-calendar-event", text: money(pay.amount) + " from " + esc(p.client) + " is due " + whenText(pay.due) + " (" + esc(pay.name) + ")", go: call("showSection", "payments") });
        }
      }
    }

    for (var h = 0; h < p.phases.length; h++) {
      var phase = p.phases[h];
      if (Number(phase.percent) < 100 && daysFromToday(phase.start) <= 0) {
        var left = daysFromToday(phase.end);
        if (left < 0) {
          high.push({ icon: "bi-clock-history", text: esc(phase.name) + " (" + esc(p.name) + ") is " + plural(Math.abs(left), "day") + " past its end date, at " + phase.percent + "%", go: call("openProject", p.id, "progress") });
        } else if (left <= 7) {
          mid.push({ icon: "bi-bar-chart-steps", text: esc(phase.name) + " (" + esc(p.name) + ") ends " + whenText(phase.end) + ", now at " + phase.percent + "%", go: call("openProject", p.id, "progress") });
        }
      }
    }
  }

  for (var n = 0; n < data.notes.length; n++) {
    var note = data.notes[n];
    if (note.done == false && note.due != "") {
      var noteDays = daysFromToday(note.due);
      if (noteDays < 0) {
        high.push({ icon: "bi-sticky-fill", text: esc(note.text) + " (was due " + whenText(note.due) + ")", go: call("showSection", "overview") });
      } else if (noteDays <= 7) {
        mid.push({ icon: "bi-sticky-fill", text: esc(note.text) + " (due " + whenText(note.due) + ")", go: call("showSection", "overview") });
      }
    }
  }

  var all = [];
  for (var a = 0; a < high.length; a++) {
    high[a].level = "high";
    all.push(high[a]);
  }
  for (var b = 0; b < mid.length; b++) {
    mid[b].level = "mid";
    all.push(mid[b]);
  }
  for (var c = 0; c < low.length; c++) {
    low[c].level = "low";
    all.push(low[c]);
  }
  return all;
}

function getEvents() {
  var events = [];
  var list = ongoing();
  for (var i = 0; i < list.length; i++) {
    var p = list[i];
    for (var j = 0; j < p.phases.length; j++) {
      if (Number(p.phases[j].percent) < 100 && daysFromToday(p.phases[j].end) <= 30) {
        events.push({ date: p.phases[j].end, icon: "bi-bar-chart-steps", text: esc(p.phases[j].name) + " ends (" + esc(p.name) + ")", go: call("openProject", p.id, "progress") });
      }
    }
    for (var k = 0; k < p.payments.length; k++) {
      if (p.payments[k].status != "Paid" && daysFromToday(p.payments[k].due) <= 30) {
        events.push({ date: p.payments[k].due, icon: "bi-cash-coin", text: money(p.payments[k].amount) + " due from " + esc(p.client) + ": " + esc(p.payments[k].name), go: call("showSection", "payments") });
      }
    }
    if (daysFromToday(p.target) <= 45) {
      events.push({ date: p.target, icon: "bi-flag-fill", text: "Target turnover: " + esc(p.name), go: call("openProject", p.id, "details") });
    }
  }
  for (var n = 0; n < data.notes.length; n++) {
    if (data.notes[n].done == false && data.notes[n].due != "" && daysFromToday(data.notes[n].due) <= 30) {
      events.push({ date: data.notes[n].due, icon: "bi-sticky-fill", text: esc(data.notes[n].text), go: call("showSection", "overview") });
    }
  }
  events = sortByDate(events);
  return events.slice(0, 8);
}

function kpi(icon, label, value, note) {
  return '<div class="box kpi"><i class="bi ' + icon + '"></i><div><p class="small">' + label + '</p><b class="big">' + value + '</b><p class="small">' + note + "</p></div></div>";
}

function miniCard(p) {
  var phaseIndex = nextPhase(p);
  var next = "All phases are done";
  if (phaseIndex != -1) {
    next = p.phases[phaseIndex].name + " ends " + whenText(p.phases[phaseIndex].end);
  }
  var percent = overallProgress(p);
  return '<div class="mini" onclick="' + call("openProject", p.id) + '"><img src="' + esc(p.image) + '" alt="" /><div class="minibody"><b>' + esc(p.name) + '</b><span class="small">' + esc(p.client) + "</span>" + barHtml(percent) + '<span class="small">' + percent + "% done. " + esc(next) + "</span></div></div>";
}

function notesHtml() {
  var html = "";
  for (var i = 0; i < data.notes.length; i++) {
    var note = data.notes[i];
    var cls = "note";
    var checked = "";
    if (note.done) {
      cls = "note finished";
      checked = " checked";
    }
    var due = "";
    if (note.due != "") {
      due = '<span class="small">' + showDate(note.due) + "</span>";
    }
    html += '<div class="' + cls + '"><input type="checkbox"' + checked + ' onclick="' + call("toggleNote", i) + '" /><span class="notetext">' + esc(note.text) + "</span>" + due + '<button class="iconbtn" onclick="' + call("deleteNote", i) + '"><i class="bi bi-trash"></i></button></div>';
  }
  html += '<div class="noteadd"><input type="text" id="noteText" placeholder="Add a reminder" /><input type="date" id="noteDue" /><button class="btn" onclick="addNote()">Add</button></div>';
  return html;
}

function renderOverview() {
  var now = new Date();
  var dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var greeting = "Good morning";
  if (now.getHours() >= 12) {
    greeting = "Good afternoon";
  }
  if (now.getHours() >= 18) {
    greeting = "Good evening";
  }

  var alerts = getAlerts();
  var alertHtml = "";
  for (var i = 0; i < alerts.length; i++) {
    alertHtml += '<div class="alert ' + alerts[i].level + '" onclick="' + alerts[i].go + '"><i class="bi ' + alerts[i].icon + '"></i><span>' + alerts[i].text + '</span><i class="bi bi-chevron-right"></i></div>';
  }
  if (alerts.length == 0) {
    alertHtml = '<p class="allclear"><i class="bi bi-check-circle-fill"></i> All clear. Nothing needs you right now.</p>';
  }

  var list = ongoing();
  var outstanding = 0;
  for (var j = 0; j < list.length; j++) {
    outstanding = outstanding + balanceOf(list[j]);
  }
  var collected = 0;
  for (var k = 0; k < data.projects.length; k++) {
    collected = collected + paidTotal(data.projects[k]);
  }
  var openLeads = 0;
  for (var l = 0; l < data.leads.length; l++) {
    if (data.leads[l].status == "New" || data.leads[l].status == "Contacted") {
      openLeads++;
    }
  }

  var miniHtml = "";
  for (var m = 0; m < list.length; m++) {
    miniHtml += miniCard(list[m]);
  }
  if (list.length == 0) {
    miniHtml = '<p class="small">No ongoing projects.</p>';
  }

  var events = getEvents();
  var eventHtml = "";
  for (var e = 0; e < events.length; e++) {
    var late = "";
    if (daysFromToday(events[e].date) < 0) {
      late = " late";
    } else if (daysFromToday(events[e].date) <= 7) {
      late = " soon";
    }
    eventHtml += '<div class="event" onclick="' + events[e].go + '"><i class="bi ' + events[e].icon + '"></i><span>' + events[e].text + '</span><b class="when' + late + '">' + whenText(events[e].date) + "</b></div>";
  }
  if (events.length == 0) {
    eventHtml = '<p class="small">Nothing due in the next 30 days.</p>';
  }

  var activityHtml = "";
  for (var a = 0; a < data.log.length && a < 6; a++) {
    activityHtml += '<div class="logrow"><span>' + esc(data.log[a].text) + '</span><span class="small">' + data.log[a].time + "</span></div>";
  }

  var html = "";
  html += "<h1>" + greeting + ", team</h1>";
  html += '<p class="pagesub">Today is ' + dayNames[now.getDay()] + ", " + showDate(todayIso()) + ". Here is everything that needs you.</p>";
  html += '<div class="box attention"><h3><i class="bi bi-bell-fill"></i> Needs your attention (' + alerts.length + ")</h3>" + alertHtml + "</div>";
  html += '<div class="kpis">';
  html += kpi("bi-buildings-fill", "Ongoing projects", list.length, completedList().length + " finished in the history");
  html += kpi("bi-inbox-fill", "Open leads", openLeads, countNewLeads() + " new");
  html += kpi("bi-wallet2", "Still to collect", money(outstanding), "on ongoing projects");
  html += kpi("bi-cash-coin", "Collected so far", money(collected), "across all projects");
  html += "</div>";
  html += '<div class="twocol">';
  html += '<div class="leftcol"><div class="box"><h3>Ongoing projects</h3>' + miniHtml + '</div><div class="box"><h3>Recent activity</h3>' + activityHtml + '<p class="small"><a class="textlink" onclick="' + call("showSection", "activity") + '">See all activity</a></p></div></div>';
  html += '<div class="rightcol"><div class="box"><h3>Coming up in the next 30 days</h3>' + eventHtml + '</div><div class="box"><h3>Company reminders</h3>' + notesHtml() + "</div></div>";
  html += "</div>";
  put("overviewBody", html);
}

// ---------- company reminders ----------
function toggleNote(i) {
  data.notes[i].done = !data.notes[i].done;
  saved("", "Reminder updated.");
}

function deleteNote(i) {
  data.notes.splice(i, 1);
  saved("", "Reminder removed.");
}

function addNote() {
  var text = val("noteText");
  if (text == "") {
    toast("Please write the reminder first.");
    return;
  }
  data.notes.push({ text: text, due: val("noteDue"), done: false });
  saved("", "Reminder added.");
}

// ======================================================================
// PROJECTS: the ongoing list and the history
// ======================================================================
function setProjectFilter(filter) {
  projectFilter = filter;
  document.getElementById("tabOngoing").className = "tab";
  document.getElementById("tabHistory").className = "tab";
  document.getElementById("tabAll").className = "tab";
  if (filter == "Ongoing") {
    document.getElementById("tabOngoing").className = "tab on";
  }
  if (filter == "History") {
    document.getElementById("tabHistory").className = "tab on";
  }
  if (filter == "All") {
    document.getElementById("tabAll").className = "tab on";
  }
  renderProjects();
}

function projectCard(p) {
  var statusCls = "progress";
  var dates = "Started " + showDate(p.start) + ". Target " + showDate(p.target) + " (" + whenText(p.target) + ")";
  var bar = barHtml(overallProgress(p)) + '<p class="small">' + overallProgress(p) + "% done</p>";
  if (p.status == "Completed") {
    statusCls = "done";
    dates = "Started " + showDate(p.start) + ". Completed " + showDate(p.completed);
    bar = "";
  }
  var contact = "";
  if (p.id == clientProjectId) {
    contact = " This project is linked to the demo client login.";
  }
  return '<div class="box prow"><img src="' + esc(p.image) + '" alt="" /><div class="pinfo"><div class="ptop"><b>' + esc(p.name) + '</b><span class="status ' + statusCls + '">' + p.status + '</span></div><p class="small">' + esc(p.client) + " | " + esc(p.location) + " | " + esc(p.type) + "</p>" + bar + '<p class="small">' + dates + '.' + contact + '</p><p class="money">Contract ' + money(p.price) + " | Paid " + money(paidTotal(p)) + " | Balance " + money(balanceOf(p)) + '</p></div><div class="pbtns"><button class="btn" onclick="' + call("openProject", p.id) + '">Manage</button></div></div>';
}

function renderProjects() {
  var search = val("projectSearch").toLowerCase();
  var html = "";
  var shown = 0;
  for (var i = 0; i < data.projects.length; i++) {
    var p = data.projects[i];
    if (projectFilter == "Ongoing" && p.status != "Ongoing") {
      continue;
    }
    if (projectFilter == "History" && p.status != "Completed") {
      continue;
    }
    var text = (p.name + " " + p.client + " " + p.location).toLowerCase();
    if (text.indexOf(search) == -1) {
      continue;
    }
    html += projectCard(p);
    shown++;
  }
  if (shown == 0) {
    html = '<div class="box empty">No projects found.</div>';
  }
  put("projectList", html);
}

function toggleNewProject() {
  var box = document.getElementById("newProjectBox");
  if (box.style.display == "none") {
    box.style.display = "block";
    document.getElementById("npStart").value = todayIso();
  } else {
    box.style.display = "none";
  }
}

function defaultPayments(price, startOffset, endOffset) {
  if (price <= 0) {
    return [];
  }
  var total = endOffset - startOffset;
  var first = Math.round(price * 0.3);
  var second = Math.round(price * 0.4);
  var third = price - first - second;
  return [
    makePayment("Down payment", first, startOffset, "Unpaid"),
    makePayment("Structure complete", second, startOffset + Math.round(total * 0.6), "Unpaid"),
    makePayment("Finishing and turnover", third, endOffset, "Unpaid"),
  ];
}

function buildProject(info) {
  var startOffset = daysFromToday(info.start);
  var endOffset = daysFromToday(info.target);
  var price = Number(info.price);
  return {
    id: newId("p"),
    name: info.name,
    client: info.client,
    email: info.email,
    phone: info.phone,
    location: info.location,
    type: info.type,
    status: "Ongoing",
    image: "../images/recent-projects/residential.jpg",
    start: info.start,
    target: info.target,
    completed: "",
    price: price,
    phases: spreadPhases(startOffset, endOffset, 0),
    updates: [],
    photos: [],
    documents: [],
    payments: defaultPayments(price, startOffset, endOffset),
    messages: [],
  };
}

function createProject() {
  var error = document.getElementById("npError");
  var price = Number(val("npPrice"));
  if (val("npName") == "" || val("npClient") == "") {
    error.innerHTML = "Please enter the project name and the client name.";
    return;
  }
  if (val("npStart") == "" || val("npTarget") == "") {
    error.innerHTML = "Please choose the start date and the target turnover date.";
    return;
  }
  if (val("npTarget") <= val("npStart")) {
    error.innerHTML = "The target date must be after the start date.";
    return;
  }
  error.innerHTML = "";
  var p = buildProject({ name: val("npName"), client: val("npClient"), email: val("npEmail"), phone: val("npPhone"), location: val("npLocation"), type: val("npType"), price: price, start: val("npStart"), target: val("npTarget") });
  data.projects.unshift(p);
  document.getElementById("newProjectBox").style.display = "none";
  document.getElementById("npName").value = "";
  document.getElementById("npClient").value = "";
  if (saved("Created the project " + p.name + " for " + p.client, "Project created.")) {
    openProject(p.id, "details");
  }
}

// ======================================================================
// MANAGE ONE PROJECT: everything here updates the client dashboard
// ======================================================================
function openProject(id, tab) {
  currentProject = id;
  currentTab = "progress";
  if (tab != undefined) {
    currentTab = tab;
  }
  showSection("manage");
}

function showManageTab(tab) {
  currentTab = tab;
  renderManage();
}

function markClientRead(p) {
  var changed = false;
  for (var i = 0; i < p.messages.length; i++) {
    if (p.messages[i].from == "client" && p.messages[i].read == false) {
      p.messages[i].read = true;
      changed = true;
    }
  }
  if (changed) {
    saveData();
    renderBadges();
  }
}

function renderManage() {
  var p = getProject(currentProject);
  if (p == null) {
    showSection("projects");
    return;
  }
  if (currentTab == "messages") {
    markClientRead(p);
  }

  var statusCls = "progress";
  var completeButton = '<button class="btn2" onclick="toggleComplete()"><i class="bi bi-check2-circle"></i> Mark as completed</button>';
  if (p.status == "Completed") {
    statusCls = "done";
    completeButton = '<button class="btn2" onclick="toggleComplete()"><i class="bi bi-arrow-counterclockwise"></i> Reopen project</button>';
  }
  var clientLink = "";
  if (p.id == clientProjectId) {
    clientLink = '<a class="btn" href="../portal/dashboard.html" target="_blank"><i class="bi bi-eye-fill"></i> View as client</a> ';
  }

  var html = '<a class="textlink" onclick="' + call("showSection", "projects") + '"><i class="bi bi-arrow-left"></i> All projects</a>';
  html += '<div class="box managehead"><img src="' + esc(p.image) + '" alt="" /><div class="manageinfo"><div class="ptop"><h1>' + esc(p.name) + '</h1><span class="status ' + statusCls + '">' + p.status + '</span></div><p class="small">' + esc(p.client) + " | " + esc(p.location) + " | Target " + showDate(p.target) + "</p>" + barHtml(overallProgress(p)) + '<p class="small">' + overallProgress(p) + "% done | Balance " + money(balanceOf(p)) + '</p></div><div class="managebtns">' + clientLink + completeButton + "</div></div>";

  var tabs = [["progress", "Progress"], ["updates", "Updates"], ["photos", "Photos"], ["documents", "Documents"], ["payments", "Payments"], ["messages", "Messages"], ["details", "Details"]];
  html += '<div class="tabs">';
  for (var i = 0; i < tabs.length; i++) {
    var cls = "tab";
    if (tabs[i][0] == currentTab) {
      cls = "tab on";
    }
    var count = "";
    if (tabs[i][0] == "messages" && countClientUnread(p) > 0) {
      count = " (" + countClientUnread(p) + ")";
    }
    html += '<button class="' + cls + '" onclick="' + call("showManageTab", tabs[i][0]) + '">' + tabs[i][1] + count + "</button>";
  }
  html += "</div>";

  if (currentTab == "progress") {
    html += manageProgress(p);
  }
  if (currentTab == "updates") {
    html += manageUpdates(p);
  }
  if (currentTab == "photos") {
    html += managePhotos(p);
  }
  if (currentTab == "documents") {
    html += manageDocuments(p);
  }
  if (currentTab == "payments") {
    html += managePayments(p);
  }
  if (currentTab == "messages") {
    html += manageMessages(p);
  }
  if (currentTab == "details") {
    html += manageDetails(p);
  }
  put("manageBody", html);

  var chat = document.getElementById("chatBox");
  if (chat != null) {
    chat.scrollTop = chat.scrollHeight;
  }
}

// ----- progress -----
function manageProgress(p) {
  var html = '<div class="box"><h3>Construction phases</h3><p class="small">Move a slider and press Save. The client sees the new progress right away.</p>';
  for (var i = 0; i < p.phases.length; i++) {
    var ph = p.phases[i];
    var state = phaseState(ph);
    html += '<div class="phaseedit"><div class="phasename"><b>' + (i + 1) + ". " + esc(ph.name) + '</b><span class="status ' + state.cls + '" id="phstate' + i + '">' + state.text + '</span></div>';
    html += '<div class="phasecontrols"><input type="date" id="phs' + i + '" value="' + ph.start + '" /><span>to</span><input type="date" id="phe' + i + '" value="' + ph.end + '" />';
    html += '<input type="range" min="0" max="100" step="5" id="ph' + i + '" value="' + ph.percent + '" oninput="' + "showSlider(" + i + ', this.value)" /><b class="slidervalue" id="phv' + i + '">' + ph.percent + "%</b></div></div>";
  }
  html += '<button class="btn" onclick="saveProgress()">Save progress</button></div>';
  return html;
}

function showSlider(i, value) {
  document.getElementById("phv" + i).innerHTML = value + "%";
  var state = phaseState({ percent: value });
  var badge = document.getElementById("phstate" + i);
  badge.className = "status " + state.cls;
  badge.innerHTML = state.text;
}

function saveProgress() {
  var p = getProject(currentProject);
  for (var i = 0; i < p.phases.length; i++) {
    p.phases[i].percent = Number(val("ph" + i));
    p.phases[i].start = val("phs" + i);
    p.phases[i].end = val("phe" + i);
  }
  saved("Updated the progress of " + p.name + " to " + overallProgress(p) + "%", "Saved. The client dashboard now shows " + overallProgress(p) + "%.");
}

// ----- updates -----
function manageUpdates(p) {
  var html = '<div class="box"><h3>Post an update to the client</h3><div class="field"><label>Title</label><input type="text" id="upTitle" placeholder="Example: Roofing sheets installed" /></div><div class="field"><label>What happened</label><textarea id="upText" rows="3"></textarea></div><button class="btn" onclick="postUpdate()">Post update</button></div>';
  html += '<div class="box"><h3>Updates the client can see</h3>';
  for (var i = 0; i < p.updates.length; i++) {
    html += '<div class="update"><span class="dot"></span><div class="updatebody"><p class="small">' + showDate(p.updates[i].date) + "</p><b>" + esc(p.updates[i].title) + "</b><p>" + esc(p.updates[i].text) + '</p></div><button class="iconbtn" onclick="' + call("deleteUpdate", i) + '"><i class="bi bi-trash"></i></button></div>';
  }
  if (p.updates.length == 0) {
    html += '<p class="small">No updates yet.</p>';
  }
  return html + "</div>";
}

function postUpdate() {
  var p = getProject(currentProject);
  if (val("upTitle") == "") {
    toast("Please write a title.");
    return;
  }
  p.updates.unshift({ date: todayIso(), title: val("upTitle"), text: val("upText") });
  saved("Posted an update to " + p.client + ": " + val("upTitle"), "Update posted. The client can see it now.");
}

function deleteUpdate(i) {
  var p = getProject(currentProject);
  p.updates.splice(i, 1);
  saved("", "Update removed.");
}

// ----- photos -----
function managePhotos(p) {
  var html = '<div class="box"><h3>Add a site photo</h3><div class="formrow"><div class="field"><label>Caption</label><input type="text" id="phTitle" placeholder="Example: Roof trusses" /></div><div class="field"><label>Photo</label><input type="file" id="photoFile" accept="image/*" /></div></div><button class="btn" onclick="addPhoto()">Add photo</button></div>';
  html += '<div class="box"><h3>Photos the client can see</h3><div class="thumbs">';
  for (var i = 0; i < p.photos.length; i++) {
    html += '<div class="thumb"><img src="' + esc(p.photos[i].src) + '" alt="" /><p><b>' + esc(p.photos[i].title) + '</b><span class="small">' + showDate(p.photos[i].date) + '</span></p><button class="iconbtn" onclick="' + call("deletePhoto", i) + '"><i class="bi bi-trash"></i></button></div>';
  }
  if (p.photos.length == 0) {
    html += '<p class="small">No photos yet.</p>';
  }
  return html + "</div></div>";
}

var pendingTitle = "";

function addPhoto() {
  var file = document.getElementById("photoFile").files[0];
  if (file == undefined) {
    toast("Please choose a photo first.");
    return;
  }
  pendingTitle = val("phTitle");
  if (pendingTitle == "") {
    pendingTitle = "Site photo";
  }
  var reader = new FileReader();
  reader.onload = photoLoaded;
  reader.readAsDataURL(file);
}

function photoLoaded(event) {
  var picture = new Image();
  picture.onload = pictureReady;
  picture.src = event.target.result;
}

// the photo is made smaller so it fits in the browser storage
function pictureReady(event) {
  var picture = event.target;
  var scale = 900 / picture.width;
  if (scale > 1) {
    scale = 1;
  }
  var canvas = document.createElement("canvas");
  canvas.width = Math.round(picture.width * scale);
  canvas.height = Math.round(picture.height * scale);
  canvas.getContext("2d").drawImage(picture, 0, 0, canvas.width, canvas.height);

  var p = getProject(currentProject);
  p.photos.unshift({ src: canvas.toDataURL("image/jpeg", 0.7), title: pendingTitle, date: todayIso() });
  saved("Added the photo " + pendingTitle + " to " + p.client + "'s photo log", "Photo added. The client can see it now.");
}

function deletePhoto(i) {
  var p = getProject(currentProject);
  p.photos.splice(i, 1);
  saved("", "Photo removed.");
}

// ----- documents -----
var docStatuses = ["Signed", "Approved", "Needs signature", "Processing", "Issued", "Received", "Pending"];
var docTypes = ["Contracts", "Permits", "Plans", "Billing"];

function manageDocuments(p) {
  var html = '<div class="box"><h3>Documents the client can see</h3><p class="small">Set a document to "Needs signature" and it shows up in the client\'s "Needs your attention" list.</p>';
  for (var i = 0; i < p.documents.length; i++) {
    var d = p.documents[i];
    html += '<div class="docrow"><div class="docname"><b>' + esc(d.name) + '</b><span>' + esc(d.type) + " | " + showDate(d.date) + '</span></div><span class="status ' + docClass(d.status) + '">' + d.status + '</span><select onchange="' + "changeDocStatus(" + i + ', this.value)">' + selectOptions(docStatuses, d.status) + '</select><button class="iconbtn" onclick="' + call("deleteDoc", i) + '"><i class="bi bi-trash"></i></button></div>';
  }
  if (p.documents.length == 0) {
    html += '<p class="small">No documents yet.</p>';
  }
  html += "</div>";
  html += '<div class="box"><h3>Add a document</h3><div class="formrow three"><div class="field"><label>Name</label><input type="text" id="docName" /></div><div class="field"><label>Type</label><select id="docType">' + selectOptions(docTypes, "Contracts") + '</select></div><div class="field"><label>Status</label><select id="docStatus">' + selectOptions(docStatuses, "Issued") + '</select></div></div><button class="btn" onclick="addDoc()">Add document</button></div>';
  return html;
}

function changeDocStatus(i, value) {
  var p = getProject(currentProject);
  p.documents[i].status = value;
  saved("Set " + p.documents[i].name + " to " + value + " for " + p.client, "Document updated.");
}

function deleteDoc(i) {
  var p = getProject(currentProject);
  p.documents.splice(i, 1);
  saved("", "Document removed.");
}

function addDoc() {
  var p = getProject(currentProject);
  if (val("docName") == "") {
    toast("Please enter the document name.");
    return;
  }
  p.documents.unshift({ name: val("docName"), type: val("docType"), date: todayIso(), status: val("docStatus") });
  saved("Added the document " + val("docName") + " for " + p.client, "Document added. The client can see it now.");
}

// ----- payments -----
function managePayments(p) {
  var html = '<div class="kpis"><div class="box kpi"><div><p class="small">Contract price</p><b class="big">' + money(p.price) + '</b></div></div><div class="box kpi"><div><p class="small">Paid so far</p><b class="big">' + money(paidTotal(p)) + '</b></div></div><div class="box kpi"><div><p class="small">Balance</p><b class="big">' + money(balanceOf(p)) + "</b></div></div></div>";
  html += '<div class="box"><h3>Payment schedule</h3>';
  for (var i = 0; i < p.payments.length; i++) {
    var pay = p.payments[i];
    var state = paymentState(pay);
    var proof = "";
    if (pay.proof != "") {
      proof = '<span class="small proof"><i class="bi bi-paperclip"></i> ' + esc(pay.proof) + "</span>";
    }
    var button = '<button class="smallbtn gold" onclick="' + call("markPaid", p.id, i) + '">Mark paid</button>';
    if (pay.status == "Paid") {
      button = '<button class="smallbtn" onclick="' + call("markUnpaid", p.id, i) + '">Mark unpaid</button>';
    }
    html += '<div class="docrow"><div class="docname"><b>' + esc(pay.name) + "</b><span>" + money(pay.amount) + " | due " + showDate(pay.due) + "</span>" + proof + '</div><span class="status ' + state.cls + '">' + state.text + "</span>" + button + '<button class="iconbtn" onclick="' + call("deletePayment", i) + '"><i class="bi bi-trash"></i></button></div>';
  }
  if (p.payments.length == 0) {
    html += '<p class="small">No payments yet. Add the first one below.</p>';
  }
  html += "</div>";
  html += '<div class="box"><h3>Add a payment</h3><div class="formrow three"><div class="field"><label>Milestone</label><input type="text" id="payName" /></div><div class="field"><label>Amount (PHP)</label><input type="number" id="payAmount" /></div><div class="field"><label>Due date</label><input type="date" id="payDue" /></div></div><button class="btn" onclick="addPayment()">Add payment</button></div>';
  return html;
}

function markPaid(pid, i) {
  var p = getProject(pid);
  p.payments[i].status = "Paid";
  saved("Marked " + p.payments[i].name + " as paid for " + p.client, "Marked as paid. The client sees it now.");
}

function markUnpaid(pid, i) {
  var p = getProject(pid);
  p.payments[i].status = "Unpaid";
  p.payments[i].proof = "";
  saved("Marked " + p.payments[i].name + " as unpaid for " + p.client, "Marked as unpaid.");
}

function deletePayment(i) {
  var p = getProject(currentProject);
  p.payments.splice(i, 1);
  saved("", "Payment removed.");
}

function addPayment() {
  var p = getProject(currentProject);
  if (val("payName") == "" || Number(val("payAmount")) <= 0 || val("payDue") == "") {
    toast("Please enter the milestone, the amount and the due date.");
    return;
  }
  p.payments.push({ name: val("payName"), amount: Number(val("payAmount")), due: val("payDue"), status: "Unpaid", proof: "" });
  saved("Added the payment " + val("payName") + " for " + p.client, "Payment added.");
}

// ----- messages -----
function manageMessages(p) {
  var html = '<div class="box chatwrap"><div class="chatbox" id="chatBox">';
  for (var i = 0; i < p.messages.length; i++) {
    var m = p.messages[i];
    if (m.from == "client") {
      html += '<div class="bubble theirs"><b>' + esc(p.client) + "</b><p>" + esc(m.text) + "</p><small>" + m.time + "</small></div>";
    } else {
      html += '<div class="bubble mine"><p>' + esc(m.text) + "</p><small>" + m.time + "</small></div>";
    }
  }
  if (p.messages.length == 0) {
    html += '<p class="small">No messages yet.</p>';
  }
  html += '</div><div class="chatinput"><input type="text" id="replyText" placeholder="Write a reply to the client" onkeydown="replyEnter(event)" /><button class="btn" onclick="sendReply()"><i class="bi bi-send-fill"></i></button></div></div>';
  return html;
}

function replyEnter(event) {
  if (event.key == "Enter") {
    sendReply();
  }
}

function sendReply() {
  var p = getProject(currentProject);
  if (val("replyText") == "") {
    return;
  }
  p.messages.push({ from: "team", text: val("replyText"), time: nowText(), read: false });
  saved("Replied to " + p.client, "Message sent. The client sees it in their dashboard.");
}

// ----- details -----
function manageDetails(p) {
  var html = '<div class="box"><h3>Project details</h3>';
  html += '<div class="formrow"><div class="field"><label>Project name</label><input type="text" id="dtName" value="' + esc(p.name) + '" /></div><div class="field"><label>Client name</label><input type="text" id="dtClient" value="' + esc(p.client) + '" /></div></div>';
  html += '<div class="formrow"><div class="field"><label>Client email</label><input type="text" id="dtEmail" value="' + esc(p.email) + '" /></div><div class="field"><label>Client phone</label><input type="text" id="dtPhone" value="' + esc(p.phone) + '" /></div></div>';
  html += '<div class="formrow"><div class="field"><label>Location</label><input type="text" id="dtLocation" value="' + esc(p.location) + '" /></div><div class="field"><label>Type</label><select id="dtType">' + selectOptions(["Residential", "Commercial", "Renovation", "Resort"], p.type) + "</select></div></div>";
  html += '<div class="formrow three"><div class="field"><label>Contract price (PHP)</label><input type="number" id="dtPrice" value="' + p.price + '" /></div><div class="field"><label>Start date</label><input type="date" id="dtStart" value="' + p.start + '" /></div><div class="field"><label>Target turnover</label><input type="date" id="dtTarget" value="' + p.target + '" /></div></div>';
  html += '<button class="btn" onclick="saveDetails()">Save details</button></div>';
  if (p.id != clientProjectId) {
    html += '<div class="box"><h3>Danger zone</h3><p class="small">Deleting a project removes it from the history too.</p><button class="btn2 danger" onclick="deleteProject()">Delete this project</button></div>';
  }
  return html;
}

function saveDetails() {
  var p = getProject(currentProject);
  if (val("dtName") == "" || val("dtClient") == "") {
    toast("The project name and the client name cannot be empty.");
    return;
  }
  p.name = val("dtName");
  p.client = val("dtClient");
  p.email = val("dtEmail");
  p.phone = val("dtPhone");
  p.location = val("dtLocation");
  p.type = val("dtType");
  p.price = Number(val("dtPrice"));
  p.start = val("dtStart");
  p.target = val("dtTarget");
  saved("Updated the details of " + p.name, "Details saved.");
}

function toggleComplete() {
  var p = getProject(currentProject);
  if (p.status == "Ongoing") {
    if (confirm("Mark " + p.name + " as completed? It moves to the project history.") == false) {
      return;
    }
    p.status = "Completed";
    p.completed = todayIso();
    for (var i = 0; i < p.phases.length; i++) {
      p.phases[i].percent = 100;
    }
    saved("Completed the project " + p.name, "Project moved to the history.");
  } else {
    p.status = "Ongoing";
    p.completed = "";
    saved("Reopened the project " + p.name, "Project is ongoing again.");
  }
}

function deleteProject() {
  var p = getProject(currentProject);
  if (confirm("Delete " + p.name + " for good?") == false) {
    return;
  }
  for (var i = 0; i < data.projects.length; i++) {
    if (data.projects[i].id == p.id) {
      data.projects.splice(i, 1);
    }
  }
  currentSection = "projects";
  showSection("projects");
  saved("Deleted the project " + p.name, "Project deleted.");
}

// ======================================================================
// LEADS AND INBOX: quote requests and messages from the public website
// ======================================================================
var leadStatuses = ["New", "Contacted", "Site visit", "Quoted", "Won", "Lost"];

function renderLeads() {
  var html = "<h1>Leads and inbox</h1>";
  html += '<p class="pagesub">Quote requests from the Get a Quote page and messages from the Contact page arrive here.</p>';
  html += '<h2 class="subtitle">Quote requests (' + data.leads.length + ")</h2>";
  for (var i = 0; i < data.leads.length; i++) {
    var l = data.leads[i];
    var contact = esc(l.phone);
    if (l.phone != "" && l.email != "") {
      contact += " | ";
    }
    contact += esc(l.email);
    var convert = '<button class="btn" onclick="' + call("convertLead", i) + '">Convert to project</button>';
    if (l.status == "Won") {
      convert = '<span class="small">Converted to a project</span>';
    }
    html += '<div class="box lead"><div class="ptop"><b>' + esc(l.name) + '</b><span class="small">' + esc(l.ref) + " | " + showDate(l.date) + '</span><select onchange="' + "changeLeadStatus(" + i + ', this.value)">' + selectOptions(leadStatuses, l.status) + "</select></div>";
    html += '<p class="small">' + contact + "</p>";
    html += "<p><b>" + esc(l.services) + "</b></p>";
    html += '<p class="small">' + esc(l.type) + " | " + esc(l.area) + " sqm | " + esc(l.finish) + " finish | " + esc(l.location) + " | Start: " + esc(l.start) + "</p>";
    html += '<p class="small">Estimate shown to the client: ' + esc(l.estimate) + "</p>";
    if (l.notes != "") {
      html += '<p class="leadnote">' + esc(l.notes) + "</p>";
    }
    html += '<div class="leadbtns">' + convert + '<button class="btn2" onclick="' + call("deleteLead", i) + '">Delete</button></div></div>';
  }
  if (data.leads.length == 0) {
    html += '<div class="box empty">No quote requests yet.</div>';
  }

  html += '<h2 class="subtitle">Contact messages (' + data.inbox.length + ")</h2>";
  for (var j = 0; j < data.inbox.length; j++) {
    var m = data.inbox[j];
    var cls = "box lead";
    var readButton = "Mark as read";
    if (m.read == false) {
      cls = "box lead unread";
    } else {
      readButton = "Mark as unread";
    }
    var how = esc(m.phone);
    if (m.phone != "" && m.email != "") {
      how += " | ";
    }
    how += esc(m.email);
    html += '<div class="' + cls + '"><div class="ptop"><b>' + esc(m.name) + '</b><span class="small">' + esc(m.subject) + " | " + showDate(m.date) + '</span><span class="small">Reply: ' + esc(m.reply) + "</span></div>";
    html += '<p class="small">' + how + "</p><p>" + esc(m.message) + '</p><div class="leadbtns"><button class="btn2" onclick="' + call("toggleInboxRead", j) + '">' + readButton + '</button><button class="btn2" onclick="' + call("deleteInbox", j) + '">Delete</button></div></div>';
  }
  if (data.inbox.length == 0) {
    html += '<div class="box empty">No messages yet.</div>';
  }
  put("leadsBody", html);
}

function changeLeadStatus(i, value) {
  data.leads[i].status = value;
  saved("Set the quote request from " + data.leads[i].name + " to " + value, "Status updated.");
}

function deleteLead(i) {
  if (confirm("Delete this quote request?") == false) {
    return;
  }
  data.leads.splice(i, 1);
  saved("", "Quote request deleted.");
}

function convertLead(i) {
  var l = data.leads[i];
  var today = todayIso();
  var p = buildProject({ name: l.type + " for " + l.name, client: l.name, email: l.email, phone: l.phone, location: l.location, type: "Residential", price: 0, start: today, target: dayOffset(180) });
  if (l.type == "Commercial building") {
    p.type = "Commercial";
  }
  if (l.type == "Renovation") {
    p.type = "Renovation";
  }
  data.projects.unshift(p);
  l.status = "Won";
  addLog("Converted the quote request " + l.ref + " into a project for " + l.name);
  if (saveData()) {
    toast("Project created. Set the contract price in Details.");
    openProject(p.id, "details");
  }
}

function toggleInboxRead(i) {
  data.inbox[i].read = !data.inbox[i].read;
  saved("", "Message updated.");
}

function deleteInbox(i) {
  data.inbox.splice(i, 1);
  saved("", "Message deleted.");
}

// ======================================================================
// PAYMENTS across all projects
// ======================================================================
function setPaymentFilter(filter) {
  paymentFilter = filter;
  renderPayments();
}

function renderPayments() {
  var list = ongoing();
  var outstanding = 0;
  var overdue = 0;
  var proofs = 0;
  for (var i = 0; i < list.length; i++) {
    outstanding = outstanding + balanceOf(list[i]);
    for (var j = 0; j < list[i].payments.length; j++) {
      var pay = list[i].payments[j];
      var state = paymentState(pay).text;
      if (state == "Overdue") {
        overdue = overdue + Number(pay.amount);
      }
      if (state == "Proof sent") {
        proofs++;
      }
    }
  }
  var collected = 0;
  for (var k = 0; k < data.projects.length; k++) {
    collected = collected + paidTotal(data.projects[k]);
  }

  var rows = [];
  for (var a = 0; a < data.projects.length; a++) {
    var p = data.projects[a];
    for (var b = 0; b < p.payments.length; b++) {
      var item = p.payments[b];
      var keep = false;
      if (paymentFilter == "action" && p.status == "Ongoing" && needsAction(item)) {
        keep = true;
      }
      if (paymentFilter == "upcoming" && p.status == "Ongoing" && item.status != "Paid" && needsAction(item) == false) {
        keep = true;
      }
      if (paymentFilter == "paid" && item.status == "Paid") {
        keep = true;
      }
      if (keep) {
        rows.push({ date: item.due, project: p, index: b, pay: item });
      }
    }
  }
  rows = sortByDate(rows);

  var html = "<h1>Payments</h1>";
  html += '<p class="pagesub">Every payment across every project, so nothing is missed.</p>';
  html += '<div class="kpis">' + kpi("bi-cash-coin", "Collected so far", money(collected), "all projects") + kpi("bi-wallet2", "Still to collect", money(outstanding), "ongoing projects") + kpi("bi-exclamation-triangle-fill", "Overdue", money(overdue), "needs a follow-up") + kpi("bi-paperclip", "Proofs to confirm", proofs, "sent by clients") + "</div>";
  html += '<div class="tabs">';
  var tabs = [["action", "Needs action"], ["upcoming", "Upcoming"], ["paid", "Paid"]];
  for (var t = 0; t < tabs.length; t++) {
    var cls = "tab";
    if (tabs[t][0] == paymentFilter) {
      cls = "tab on";
    }
    html += '<button class="' + cls + '" onclick="' + call("setPaymentFilter", tabs[t][0]) + '">' + tabs[t][1] + "</button>";
  }
  html += "</div>";
  html += '<div class="box"><div class="arow head"><span>Project</span><span>Milestone</span><span>Amount</span><span>Due</span><span>Status</span><span></span></div>';
  for (var r = 0; r < rows.length; r++) {
    var row = rows[r];
    var st = paymentState(row.pay);
    var proof = "";
    if (row.pay.proof != "") {
      proof = '<br /><span class="small"><i class="bi bi-paperclip"></i> ' + esc(row.pay.proof) + "</span>";
    }
    var action = '<button class="smallbtn gold" onclick="' + call("markPaidHere", row.project.id, row.index) + '">Mark paid</button>';
    if (row.pay.status == "Paid") {
      action = '<button class="smallbtn" onclick="' + call("openProject", row.project.id, "payments") + '">Open</button>';
    }
    html += '<div class="arow"><span><b>' + esc(row.project.name) + "</b><br /><span class=\"small\">" + esc(row.project.client) + "</span></span><span>" + esc(row.pay.name) + proof + "</span><span>" + money(row.pay.amount) + "</span><span>" + showDate(row.pay.due) + '</span><span><span class="status ' + st.cls + '">' + st.text + "</span></span><span>" + action + "</span></div>";
  }
  if (rows.length == 0) {
    html += '<p class="small">Nothing here.</p>';
  }
  html += "</div>";
  put("paymentsBody", html);
}

function markPaidHere(pid, i) {
  markPaid(pid, i);
}

// ======================================================================
// ACTIVITY LOG
// ======================================================================
function renderActivity() {
  var html = "<h1>Activity</h1>";
  html += '<p class="pagesub">Everything that happened in the dashboards, newest first.</p>';
  html += '<div class="box">';
  for (var i = 0; i < data.log.length; i++) {
    html += '<div class="logrow"><span>' + esc(data.log[i].text) + '</span><span class="small">' + data.log[i].time + "</span></div>";
  }
  html += "</div>";
  html += '<div class="box"><h3>Demo data</h3><p class="small">Put the sample projects, leads and reminders back the way they were. This also clears everything entered in the dashboards and the public forms.</p><button class="btn2 danger" onclick="resetDemo()">Reset demo data</button></div>';
  put("activityBody", html);
}

function resetDemo() {
  if (confirm("Reset all demo data?") == false) {
    return;
  }
  resetData();
  currentProject = "p1";
  showSection("overview");
  toast("Demo data was reset.");
}

// ======================================================================
// LIVE UPDATE: when the client or the website changes the data in another
// tab, this page redraws by itself
// ======================================================================
function onDataChanged(event) {
  if (event.key == dataKey) {
    loadData();
    renderAll();
    toast("New activity came in.");
  }
}

window.onstorage = onDataChanged;

// ---------- start ----------
loadData();
renderAll();
