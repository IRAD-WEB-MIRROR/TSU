/* National Library of Irad: electronic catalogue (search, records, request slips). Slips stay in this browser. */
(function () {
  "use strict";
  var B = document.body.getAttribute("data-base") || "";
  var list = document.getElementById("clist"), cnt = document.getElementById("ccount"), more = document.getElementById("cmore");
  var q = document.getElementById("cq"), cc = document.getElementById("cc"), ca = document.getElementById("ca"), slipsBox = document.getElementById("cslips");
  if (!list) return;
  var R = [], hits = [], shown = 0, PAGE = 40, open = null;
  var STATUS = {
    "": ["Available", "Lending desk"], ro: ["Reading room only", ""], rb: ["Rare books and manuscripts", "By appointment"],
    nur: ["Nurzhan branch", "Delivery 5–10 working days"], online: ["Digital archive", "Read online"],
    restricted: ["On restricted loan", "Issued with the Director's permission"], withdrawn: ["Withdrawn", "Not available"],
    nyr: ["Not yet received", "Legal deposit awaited"], loan: ["On loan", ""]
  };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fold(s) { return String(s || "").toLowerCase().replace(/ç/g, "ch").replace(/ş/g, "sh").replace(/ñ/g, "ng").replace(/ı/g, "y").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ä/g, "a").replace(/i̇/g, "i"); }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  var now = new Date(Date.now() + 6 * 3600000);   // Irad Time
  var week = Math.floor((now.getTime() / 86400000 + 3) / 7);
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dmy(d) { return pad(d.getUTCDate()) + "." + pad(d.getUTCMonth() + 1) + "." + d.getUTCFullYear(); }
  function status(r) {
    if (r.status) return r.status;
    if (hash(r.id + ":" + week) % 9 === 0) return "loan";
    return "";
  }
  function due(r) { return dmy(new Date((week * 7 - 3) * 86400000 + (14 + hash(r.id) % 21) * 86400000)); }
  function statusHtml(r) {
    var s = status(r), t = STATUS[s] || STATUS[""];
    var cls = s === "" || s === "online" ? "s" : "s ro";
    return '<span class="' + cls + '">' + esc(t[0]) + (s === "loan" ? ", due " + due(r) : "") + "</span>";
  }
  function href(r) { return /^https?:/.test(r.href) ? r.href : B + r.href; }
  function row(r, i) {
    return '<li data-i="' + i + '"><span class="y">' + esc(r.years || r.year) + '</span><span class="t"><a href="#r' + esc(r.id) + '" class="lc-open">' + esc(r.title) + "</a>" +
      (r.sub ? ' <span class="lc-sub">' + esc(r.sub) + "</span>" : "") + '<span class="a">' + esc(r.author || r.pub || "") + " · " + esc(r.call) + "</span></span>" + statusHtml(r) + "</li>";
  }
  function card(r) {
    var s = status(r);
    var h = '<div class="lc-card"><p class="lc-call">' + esc(r.call) + "<br>" + esc(r.loc) + "</p><p>" + (r.author ? "<b>" + esc(r.author) + "</b><br>" : "") +
      "<i>" + esc(r.title) + "</i>" + (r.sub ? " : " + esc(r.sub) : "") + ". – " + (r.pub ? esc(r.pub) + ", " : "") + esc(r.years || r.year) + ".</p>";
    h += "<p>Language: " + esc(r.lang) + " · Collection: " + esc(r.coll) + " · Record No. " + esc(r.id) + "</p>";
    if (r.note) h += "<p>" + esc(r.note) + "</p>";
    if (r.year < 1996 && r.coll !== "Newspapers") h += '<p class="muted">Record converted from the card catalogue.</p>';
    h += "<p>Status: " + statusHtml(r) + (STATUS[s] && STATUS[s][1] && s !== "loan" ? ' <span class="muted">' + esc(STATUS[s][1]) + "</span>" : "") + "</p>";
    if (r.href) h += '<p><a href="' + esc(href(r)) + '">' + (s === "online" ? "Read in the Digital archive" : "Online") + " &rarr;</a></p>";
    if (s === "withdrawn") h += '<p class="muted">This item has been withdrawn and cannot be ordered. Enquiries: Director\'s office, library building, room 3.</p>';
    else if (s === "nyr") h += '<p class="muted">The legal deposit copy has not been received. It cannot be ordered yet.</p>';
    else if (s !== "online") h += slipForm(r, s);
    return h + "</div>";
  }
  function slipForm(r, s) {
    var rooms = s === "rb" ? ["Rare books and manuscripts"] : s === "nur" ? ["Nurzhan branch reading room", "Great Reading Room (delivery from Nurzhan)"] :
      ["Great Reading Room", "Reading room 2 (sciences), Building 4", "Lending desk"];
    if (s === "ro" || s === "restricted") rooms = rooms.filter(function (x) { return x !== "Lending desk"; });
    return '<form class="lc-slip" data-id="' + esc(r.id) + '"><b>Request slip</b>' +
      '<label>Library or reader\'s card No. <input name="card" required maxlength="14" placeholder="e.g. 26-04117" autocomplete="off"></label>' +
      '<label>Surname and initials <input name="name" required maxlength="40" autocomplete="off"></label>' +
      '<label>To <select name="room">' + rooms.map(function (x) { return "<option>" + esc(x) + "</option>"; }).join("") + "</select></label>" +
      (s === "restricted" ? '<label class="lc-chk"><input type="checkbox" name="why" required> I attach a letter from my department or employer stating the purpose of my research.</label>' : "") +
      '<button class="btn" type="submit">Request</button></form>';
  }
  function filter() {
    var t = fold(q.value.trim()), c = cc.value, a = ca.value;
    var words = t ? t.split(/\s+/) : [];
    hits = [];
    R.forEach(function (r, i) {
      if (c && r.coll !== c) return;
      if (a && ["", "ro", "online"].indexOf(status(r)) < 0) return;
      if (words.length) { for (var k = 0; k < words.length; k++) if (r._s.indexOf(words[k]) < 0) return; }
      hits.push(i);
    });
    shown = 0; list.innerHTML = ""; open = null;
    cnt.textContent = hits.length ? hits.length + (hits.length === 1 ? " record" : " records") + (t || c || a ? " found" : " in the catalogue") : "Nothing found. Try another spelling, or ask at the reference desk: not every record has been converted from the card catalogue.";
    page();
  }
  function page() {
    var h = "";
    hits.slice(shown, shown + PAGE).forEach(function (i) { h += row(R[i], i); });
    list.insertAdjacentHTML("beforeend", h); shown += PAGE; more.style.display = shown >= hits.length ? "none" : "";
  }
  list.addEventListener("click", function (ev) {
    var a = ev.target.closest(".lc-open"); if (!a) return;
    ev.preventDefault();
    var li = a.closest("li"), next = li.nextElementSibling;
    if (next && next.classList.contains("lc-rec")) { next.parentNode.removeChild(next); return; }
    li.insertAdjacentHTML("afterend", '<li class="lc-rec">' + card(R[+li.getAttribute("data-i")]) + "</li>");
  });
  list.addEventListener("submit", function (ev) {
    var f = ev.target; if (!f.classList.contains("lc-slip")) return;
    ev.preventDefault();
    var slips = load();
    if (slips.filter(function (x) { return !x.cancelled; }).length >= 5) { f.insertAdjacentHTML("beforeend", '<p class="note">You already have five requests. Wait for one of them before ordering more.</p>'); return; }
    var r = R.filter(function (x) { return x.id === f.getAttribute("data-id"); })[0];
    var no = (now.getUTCFullYear() % 100) + "/" + (10000 + hash(r.id + Date.now()) % 89999);
    slips.unshift({ no: no, id: r.id, title: r.title, call: r.call, st: status(r), room: f.room.value, card: f.card.value.slice(0, 14), name: f.name.value.slice(0, 40), t: Date.now() });
    save(slips);
    f.outerHTML = '<div class="note">Request No. ' + esc(no) + ' has been registered. <a href="#requests">My requests</a></div>';
    drawSlips();
  });
  function load() { try { return JSON.parse(localStorage.getItem("nli-slips") || "[]"); } catch (e) { return []; } }
  function save(s) { try { localStorage.setItem("nli-slips", JSON.stringify(s.slice(0, 20))); } catch (e) {} }
  function stage(x) {
    var m = (Date.now() - x.t) / 60000;
    if (m < 5) return "Registered";
    if (x.st === "restricted") return m < 120 ? "Being processed" : "Being processed: passed to the Director's office for signature";
    if (x.st === "rb") return m < 120 ? "Being processed" : "Being processed: waiting for an appointment in the Rare books room";
    if (x.st === "nur") return m < 1440 ? "Being processed: ordered from the Nurzhan branch" : "Being processed: in transit from the Nurzhan branch";
    if (x.st === "loan") return "Being processed: the item is on loan; a recall has been sent";
    if (m < 60) return "Being processed";
    if (m < 1440) return "Being processed: passed to the stacks";
    if (m < 4320) return "Being processed: the item is being located";
    return "Being processed: the item is being located. Please do not order it again";
  }
  function drawSlips() {
    var s = load();
    if (!s.length) { slipsBox.innerHTML = '<p class="muted">You have no requests.</p>'; return; }
    slipsBox.innerHTML = '<table class="lc-slips"><tr><th>Slip</th><th>Item</th><th>To</th><th>Status</th></tr>' + s.map(function (x, i) {
      return "<tr><td>No. " + esc(x.no) + "<br><span class=\"muted\">" + dmy(new Date(x.t + 6 * 3600000)) + "</span></td><td><i>" + esc(x.title) + "</i><br><span class=\"muted\">" + esc(x.call) + "</span></td><td>" + esc(x.room) +
        "</td><td>" + (x.cancelled ? "Cancelled by the reader" : esc(stage(x)) + '<br><a href="#" data-x="' + i + '">Cancel</a>') + "</td></tr>";
    }).join("") + "</table>";
  }
  slipsBox.addEventListener("click", function (ev) {
    var a = ev.target.closest("[data-x]"); if (!a) return;
    ev.preventDefault(); var s = load(); if (s[+a.getAttribute("data-x")]) s[+a.getAttribute("data-x")].cancelled = true; save(s); drawSlips();
  });
  more.onclick = page;
  q.oninput = filter; cc.onchange = filter; ca.onchange = filter;
  var m = location.search.match(/[?&]q=([^&]*)/);
  if (m) q.value = decodeURIComponent(m[1].replace(/\+/g, " "));
  fetch(B + "data/catalogue.json").then(function (r) { return r.json(); }).then(function (d) {
    R = d; R.forEach(function (r) { r._s = fold([r.title, r.sub, r.author, r.pub, r.call, r.coll, r.lang, r.note, r.year].join(" ")); });
    filter(); drawSlips();
  }).catch(function () { cnt.textContent = "The catalogue is not responding. Please try again later."; });
})();
