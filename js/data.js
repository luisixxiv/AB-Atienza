// ======================================================================
// Shared data for the whole site.
// The admin dashboard, the client dashboard and the public forms all read
// and write this same data in the browser (localStorage).
// All client names, amounts and dates below are SAMPLE DATA.
// ======================================================================
var dataKey = "abData";
var data = null;
var clientProjectId = "p1"; // the demo client login sees this project

var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ---------- small helpers ----------
function esc(text) {
  var s = String(text);
  s = s.replace(/&/g, "&amp;");
  s = s.replace(/</g, "&lt;");
  s = s.replace(/>/g, "&gt;");
  s = s.replace(/"/g, "&quot;");
  return s;
}

function pad(n) {
  if (n < 10) {
    return "0" + n;
  }
  return "" + n;
}

function dayOffset(n) {
  var d = new Date();
  d.setDate(d.getDate() + n);
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

function todayIso() {
  return dayOffset(0);
}

function isoToDate(iso) {
  var parts = iso.split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function showDate(iso) {
  if (iso == "" || iso == undefined) {
    return "-";
  }
  var d = isoToDate(iso);
  return monthNames[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
}

function daysFromToday(iso) {
  var today = isoToDate(todayIso());
  return Math.round((isoToDate(iso) - today) / 86400000);
}

function whenText(iso) {
  var n = daysFromToday(iso);
  if (n == 0) {
    return "today";
  }
  if (n == 1) {
    return "tomorrow";
  }
  if (n == -1) {
    return "yesterday";
  }
  if (n > 1) {
    return "in " + n + " days";
  }
  return Math.abs(n) + " days ago";
}

function clockText() {
  var d = new Date();
  var h = d.getHours();
  var ampm = "AM";
  if (h >= 12) {
    ampm = "PM";
  }
  if (h > 12) {
    h = h - 12;
  }
  if (h == 0) {
    h = 12;
  }
  return h + ":" + pad(d.getMinutes()) + " " + ampm;
}

function nowText() {
  var d = new Date();
  return monthNames[d.getMonth()] + " " + d.getDate() + ", " + clockText();
}

function timeAgo(daysAgo, clock) {
  var d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return monthNames[d.getMonth()] + " " + d.getDate() + ", " + clock;
}

function money(amount) {
  return "₱" + Number(amount).toLocaleString("en-PH");
}

function plural(n, word) {
  if (n == 1) {
    return n + " " + word;
  }
  return n + " " + word + "s";
}

function newId(prefix) {
  return prefix + Date.now() + Math.floor(Math.random() * 1000);
}

// ---------- loading and saving ----------
function saveData() {
  try {
    localStorage.setItem(dataKey, JSON.stringify(data));
    return true;
  } catch (error) {
    return false; // the browser storage is full
  }
}

function loadData() {
  var saved = localStorage.getItem(dataKey);
  if (saved == null) {
    data = makeSeed();
    saveData();
  } else {
    data = JSON.parse(saved);
  }
}

function resetData() {
  localStorage.removeItem(dataKey);
  loadData();
}

function addLog(text) {
  data.log.unshift({ text: text, time: nowText() });
  if (data.log.length > 60) {
    data.log.pop();
  }
}

function getProject(id) {
  for (var i = 0; i < data.projects.length; i++) {
    if (data.projects[i].id == id) {
      return data.projects[i];
    }
  }
  return null;
}

// ---------- numbers used by both dashboards ----------
function overallProgress(project) {
  var total = 0;
  for (var i = 0; i < project.phases.length; i++) {
    total = total + Number(project.phases[i].percent);
  }
  return Math.round(total / project.phases.length);
}

function paidTotal(project) {
  var total = 0;
  for (var i = 0; i < project.payments.length; i++) {
    if (project.payments[i].status == "Paid") {
      total = total + Number(project.payments[i].amount);
    }
  }
  return total;
}

function balanceOf(project) {
  return Number(project.price) - paidTotal(project);
}

// the text and color of a payment badge
function paymentState(payment) {
  if (payment.status == "Paid") {
    return { text: "Paid", cls: "done" };
  }
  if (payment.status == "Proof sent") {
    return { text: "Proof sent", cls: "progress" };
  }
  var days = daysFromToday(payment.due);
  if (days < 0) {
    return { text: "Overdue", cls: "action" };
  }
  if (days <= 14) {
    return { text: "Due soon", cls: "progress" };
  }
  return { text: "Upcoming", cls: "upcoming" };
}

function phaseState(phase) {
  if (Number(phase.percent) >= 100) {
    return { text: "Done", cls: "done" };
  }
  if (Number(phase.percent) > 0) {
    return { text: "In progress", cls: "progress" };
  }
  return { text: "Upcoming", cls: "upcoming" };
}

function docClass(status) {
  if (status == "Signed" || status == "Approved") {
    return "done";
  }
  if (status == "Needs signature") {
    return "action";
  }
  if (status == "Processing") {
    return "progress";
  }
  return "upcoming";
}

// the first phase that is not finished yet (or null)
function nextPhase(project) {
  for (var i = 0; i < project.phases.length; i++) {
    if (Number(project.phases[i].percent) < 100) {
      return i;
    }
  }
  return -1;
}

// the earliest payment that is not paid yet (or -1)
function nextPayment(project) {
  var best = -1;
  for (var i = 0; i < project.payments.length; i++) {
    if (project.payments[i].status != "Paid") {
      if (best == -1 || project.payments[i].due < project.payments[best].due) {
        best = i;
      }
    }
  }
  return best;
}

// ---------- forms on the public site save here ----------
function addLead(lead) {
  loadData();
  lead.id = newId("l");
  lead.date = todayIso();
  lead.status = "New";
  data.leads.unshift(lead);
  addLog("New quote request " + lead.ref + " from " + lead.name);
  saveData();
}

function addInbox(message) {
  loadData();
  message.id = newId("m");
  message.date = todayIso();
  message.read = false;
  data.inbox.unshift(message);
  addLog("New message from " + message.name + ": " + message.subject);
  saveData();
}

// ======================================================================
// Sample data. It is built from today's date, so reminders always look live.
// ======================================================================
function makePhases(list) {
  var names = [
    "Planning and permits",
    "Site preparation and foundation",
    "Structure: columns, beams and slabs",
    "Roofing and ceiling",
    "Electrical and plumbing",
    "Finishing: tiles, paint, doors and windows",
    "Final inspection and turnover",
  ];
  var phases = [];
  for (var i = 0; i < names.length; i++) {
    phases.push({
      name: names[i],
      start: dayOffset(list[i][0]),
      end: dayOffset(list[i][1]),
      percent: list[i][2],
    });
  }
  return phases;
}

// 7 phases spread between a start and an end day (numbers of days from today)
function spreadPhases(startOffset, endOffset, percent) {
  var fractions = [0.08, 0.22, 0.3, 0.15, 0.1, 0.1, 0.05];
  var total = endOffset - startOffset;
  var list = [];
  var from = startOffset;
  for (var i = 0; i < 7; i++) {
    var to = from + Math.round(total * fractions[i]);
    if (i == 6) {
      to = endOffset;
    }
    list.push([from, to, percent]);
    from = to + 1;
  }
  return makePhases(list);
}

function makeDoc(name, type, daysAgo, status) {
  return { name: name, type: type, date: dayOffset(-daysAgo), status: status };
}

function makePayment(name, amount, dueDays, status) {
  return { name: name, amount: amount, due: dayOffset(dueDays), status: status, proof: "" };
}

function makeMessage(from, text, daysAgo, clock, read) {
  return { from: from, text: text, time: timeAgo(daysAgo, clock), read: read };
}

function makeUpdate(daysAgo, title, text) {
  return { date: dayOffset(-daysAgo), title: title, text: text };
}

function makePhoto(src, title, daysAgo) {
  return { src: src, title: title, date: dayOffset(-daysAgo) };
}

function makeSeed() {
  var p1 = {
    id: "p1",
    name: "Two-Storey Triplex Residential",
    client: "Maria Santos",
    email: "client@abatienza.com",
    phone: "+63 900 000 0001",
    location: "Lucena City, Quezon",
    type: "Residential",
    status: "Ongoing",
    image: "../images/after.jpg",
    start: dayOffset(-160),
    target: dayOffset(100),
    completed: "",
    price: 4850000,
    phases: makePhases([[-160, -146, 100], [-145, -100, 100], [-99, -40, 100], [-39, 28, 60], [-25, 43, 35], [29, 80, 0], [81, 100, 0]]),
    updates: [
      makeUpdate(2, "Roof trusses installed", "The roof trusses on the main building are installed. Roofing sheets start next week."),
      makeUpdate(6, "Electrical conduits roughed in", "The conduit layout on the second floor is done and checked."),
      makeUpdate(13, "Structure inspection passed", "The structural works passed the engineer's inspection."),
    ],
    photos: [
      makePhoto("../images/after.jpg", "Front view", 2),
      makePhoto("https://placehold.co/600x420?text=Roof+trusses", "Roof trusses", 2),
      makePhoto("https://placehold.co/600x420?text=Second+floor+conduits", "Second floor conduits", 6),
      makePhoto("https://placehold.co/600x420?text=Structure+inspection", "Structure inspection", 13),
      makePhoto("https://placehold.co/600x420?text=Slab+pouring", "Slab pouring", 40),
      makePhoto("https://placehold.co/600x420?text=Foundation", "Foundation", 95),
      makePhoto("../images/team2.jpg", "Groundbreaking papers", 160),
      makePhoto("../images/team.jpg", "Groundbreaking", 160),
    ],
    documents: [
      makeDoc("Construction Contract", "Contracts", 158, "Signed"),
      makeDoc("Notice to Proceed", "Contracts", 154, "Signed"),
      makeDoc("Change Order No. 1", "Contracts", 5, "Needs signature"),
      makeDoc("Building Permit", "Permits", 150, "Approved"),
      makeDoc("Barangay Clearance", "Permits", 152, "Approved"),
      makeDoc("Electrical Permit", "Permits", 11, "Processing"),
      makeDoc("Architectural Plans (Rev. 2)", "Plans", 157, "Approved"),
      makeDoc("Structural Plans", "Plans", 157, "Approved"),
      makeDoc("3D Render Set", "Plans", 165, "Approved"),
      makeDoc("Statement of Account", "Billing", 22, "Issued"),
    ],
    payments: [
      makePayment("Down payment", 1000000, -140, "Paid"),
      makePayment("Foundation complete", 1000000, -95, "Paid"),
      makePayment("Structure complete", 1000000, -35, "Paid"),
      makePayment("Roofing complete", 620000, 9, "Unpaid"),
      makePayment("Electrical and plumbing", 600000, 34, "Unpaid"),
      makePayment("Finishing and turnover", 630000, 99, "Unpaid"),
    ],
    messages: [
      makeMessage("team", "Good morning, Maria! The roofing crew starts this Monday.", 4, "9:12 AM", true),
      makeMessage("client", "Great! Can I visit the site on Saturday?", 4, "9:40 AM", true),
      makeMessage("team", "Yes. Please wear a hard hat and closed shoes. We will meet you there.", 4, "10:05 AM", true),
      makeMessage("team", "Please send us your paint color choices this week so we can order on time.", 1, "3:30 PM", false),
    ],
  };

  var p2 = {
    id: "p2",
    name: "4 Bedroom Bungalow House",
    client: "Roberto Mendoza",
    email: "roberto@email.com",
    phone: "+63 900 000 0002",
    location: "Lucena City, Quezon",
    type: "Residential",
    status: "Ongoing",
    image: "../images/recent-projects/bungalow.jpg",
    start: dayOffset(-90),
    target: dayOffset(90),
    completed: "",
    price: 3200000,
    phases: makePhases([[-90, -80, 100], [-79, -45, 100], [-44, -5, 100], [-4, 30, 40], [10, 45, 0], [46, 75, 0], [76, 90, 0]]),
    updates: [
      makeUpdate(3, "Roof framing started", "The roof framing is going up this week."),
      makeUpdate(20, "Columns and beams done", "All columns and beams are poured and cured."),
    ],
    photos: [
      makePhoto("../images/recent-projects/bungalow.jpg", "Approved design", 90),
      makePhoto("https://placehold.co/600x420?text=Roof+framing", "Roof framing", 3),
    ],
    documents: [
      makeDoc("Construction Contract", "Contracts", 92, "Signed"),
      makeDoc("Building Permit", "Permits", 88, "Approved"),
      makeDoc("Architectural Plans", "Plans", 95, "Approved"),
    ],
    payments: [
      makePayment("Down payment", 960000, -88, "Paid"),
      makePayment("Foundation complete", 640000, -45, "Paid"),
      makePayment("Structure complete", 640000, -5, "Paid"),
      makePayment("Roofing complete", 480000, 12, "Unpaid"),
      makePayment("Finishing and turnover", 480000, 80, "Unpaid"),
    ],
    messages: [makeMessage("client", "Good day! When will the roofing start?", 0, "8:05 AM", false)],
  };

  var p3 = {
    id: "p3",
    name: "Two-Story Commercial Building",
    client: "Elena Garcia",
    email: "elena@email.com",
    phone: "+63 900 000 0003",
    location: "Lucena City, Quezon",
    type: "Commercial",
    status: "Ongoing",
    image: "../images/recent-projects/commercial.jpg",
    start: dayOffset(-50),
    target: dayOffset(160),
    completed: "",
    price: 7800000,
    phases: makePhases([[-50, -40, 100], [-39, -10, 100], [-9, 40, 25], [41, 80, 0], [60, 100, 0], [101, 140, 0], [141, 160, 0]]),
    updates: [makeUpdate(4, "Foundation complete", "The foundation works are finished and inspected.")],
    photos: [makePhoto("../images/recent-projects/commercial.jpg", "Approved design", 50)],
    documents: [
      makeDoc("Construction Contract", "Contracts", 52, "Signed"),
      makeDoc("Building Permit", "Permits", 48, "Approved"),
    ],
    payments: [
      makePayment("Down payment", 2340000, -48, "Paid"),
      makePayment("Foundation complete", 1560000, -8, "Proof sent"),
      makePayment("Structure complete", 1560000, 40, "Unpaid"),
      makePayment("Roofing complete", 1170000, 85, "Unpaid"),
      makePayment("Finishing and turnover", 1170000, 150, "Unpaid"),
    ],
    messages: [],
  };
  p3.payments[1].proof = "gcash-receipt.jpg";

  var done = [
    ["p4", "Casa Maria - Private Resort", "Reyes Family", "Resort", "../images/recent-projects/casamaria.jpg", -420, -85, 6200000],
    ["p5", "Living Room Renovation", "Dennis Villanueva", "Renovation", "../images/recent-projects/livingroom.jpg", -230, -170, 480000],
    ["p6", "High Ceiling Renovation", "Cristina Ramos", "Renovation", "../images/recent-projects/highceiling.jpg", -160, -120, 350000],
    ["p7", "Two-Story Residential Building", "Ben Alcantara", "Residential", "../images/recent-projects/residential.jpg", -520, -250, 3750000],
  ];
  var projects = [p1, p2, p3];
  for (var i = 0; i < done.length; i++) {
    var d = done[i];
    projects.push({
      id: d[0],
      name: d[1],
      client: d[2],
      email: "",
      phone: "",
      location: "Lucena City, Quezon",
      type: d[3],
      status: "Completed",
      image: d[4],
      start: dayOffset(d[5]),
      target: dayOffset(d[6]),
      completed: dayOffset(d[6]),
      price: d[7],
      phases: spreadPhases(d[5], d[6], 100),
      updates: [makeUpdate(-d[6], "Project turned over", "Final inspection passed and the keys were handed over.")],
      photos: [makePhoto(d[4], "Finished project", -d[6])],
      documents: [makeDoc("Construction Contract", "Contracts", -d[5], "Signed")],
      payments: [makePayment("Full payment", d[7], d[6], "Paid")],
      messages: [],
    });
  }

  return {
    version: 1,
    projects: projects,
    leads: [
      { id: "l1", ref: "ABQ-2026-4107", name: "Jerome Bautista", phone: "+63 900 000 0101", email: "jerome@email.com", services: "Design and Build, Painting works", type: "New house", area: "150", finish: "Standard", location: "Tayabas City", start: "Within 3 months", notes: "Corner lot, two bedrooms and a garage.", estimate: "₱4,050,000 to ₱5,700,000", date: dayOffset(-1), status: "New" },
      { id: "l2", ref: "ABQ-2026-3382", name: "Angelica Flores", phone: "+63 900 000 0102", email: "", services: "Renovation Works, Ceiling works", type: "Renovation", area: "60", finish: "Standard", location: "Lucena City", start: "As soon as possible", notes: "Second floor extension.", estimate: "₱970,000 to ₱1,370,000", date: dayOffset(-4), status: "Contacted" },
      { id: "l3", ref: "ABQ-2026-2954", name: "Mark Dizon", phone: "", email: "mark@email.com", services: "Drafting Services, 2D/3D Visualizations", type: "New house", area: "120", finish: "Basic", location: "Sariaya", start: "I am still planning", notes: "Needs plans for a permit.", estimate: "Priced after review", date: dayOffset(-9), status: "Quoted" },
    ],
    inbox: [
      { id: "m1", name: "Rosalie Cruz", phone: "+63 900 000 0201", email: "", subject: "Quotation", reply: "Text me", message: "Hello, do you also build fences and gates? I have a 200 sqm lot in Lucena.", date: dayOffset(0), read: false },
      { id: "m2", name: "Paolo Reyes", phone: "", email: "paolo@email.com", subject: "Other question", reply: "Email me", message: "Are you still hiring a structural engineer? I graduated this year.", date: dayOffset(-3), read: true },
    ],
    notes: [
      { text: "Order roofing sheets for the triplex", due: dayOffset(6), done: false },
      { text: "Send the monthly statement of account to clients", due: dayOffset(8), done: false },
      { text: "Renew the contractor license (add the expiry date)", due: dayOffset(20), done: false },
      { text: "Hiring: the Structural Engineer position is still open", due: "", done: false },
      { text: "Hiring: the 6-wheeler Driver position is still open", due: "", done: false },
    ],
    log: [
      { text: "Posted an update to Maria Santos: Roof trusses installed", time: timeAgo(2, "4:10 PM") },
      { text: "Marked Structure complete as paid for Roberto Mendoza", time: timeAgo(5, "1:45 PM") },
      { text: "Added the document Change Order No. 1 for Maria Santos", time: timeAgo(5, "11:20 AM") },
      { text: "Converted a quote request into the project for Elena Garcia", time: timeAgo(50, "10:00 AM") },
      { text: "Completed the project Living Room Renovation", time: timeAgo(170, "3:00 PM") },
    ],
  };
}
