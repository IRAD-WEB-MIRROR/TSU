/* Applications: submit, follow by number, my applications. Nothing typed is sent anywhere. */
window.MoveCore = (function () {
  "use strict";
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function ri(r, a, b) { return a + Math.floor(r() * (b - a + 1)); }
  function pick(r, a) { return a[Math.floor(r() * a.length)]; }
  /* dates are UTC midnights standing for days of the Irad calendar */
  function addDays(d, n) { var x = new Date(d.getTime()); x.setUTCDate(x.getUTCDate() + n); return x; }
  function isW(d) { var g = d.getUTCDay(); return g !== 0 && g !== 6; }
  function addW(d, n) { var x = d; while (n > 0) { x = addDays(x, 1); if (isW(x)) n--; } return x; }
  function onW(d) { var x = d; while (!isW(x)) x = addDays(x, 1); return x; }
  function onDow(d, dow) { var x = d; while (x.getUTCDay() !== dow) x = addDays(x, 1); return x; }
  function wdays(a, b) { var n = 0, x = a; while (x < b) { x = addDays(x, 1); if (isW(x)) n++; } return n; }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function day(s) { return new Date(s + "T00:00:00Z"); }
  function ymd(s) { var d = day("20" + s.slice(0, 2) + "-" + s.slice(2, 4) + "-" + s.slice(4, 6)); return isNaN(d) || iso(d).replace(/-/g, "").slice(2) !== s ? null : d; }
  /* now in Irad time: {today, hour, min} */
  function irt(at) { var t = new Date((at || Date.now()) + 6 * 3600e3); return { today: day(t.toISOString().slice(0, 10)), hour: t.getUTCHours(), min: t.getUTCMinutes() }; }
  function check(s, alpha) { return alpha.charAt(hash("mv" + s) % alpha.length); }
  /* the events that have happened by now: an event without an hour happens at 10:00 */
  function upTo(ev, now) { return ev.filter(function (e) { return e.d < now.today || (+e.d === +now.today && (e.h == null ? 10 : e.h) <= now.hour); }); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fill(s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v && v[k] != null ? v[k] : m; }); }

  /* the kept list: [{r: number, t: day taken, a: day of the visitor's step}] */
  function store(key, max) {
    function load() { try { var a = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(a) ? a.filter(function (x) { return x && x.r; }) : []; } catch (e) { return []; } }
    function save(a) { try { localStorage.setItem(key, JSON.stringify(a.slice(-max))); } catch (e) {} }
    return {
      load: load,
      get: function (ref) { return load().filter(function (x) { return x.r === ref; })[0] || null; },
      keep: function (ref, extra) { var a = load(), o = a.filter(function (x) { return x.r === ref; })[0] || { r: ref }; a = a.filter(function (x) { return x.r !== ref; }); for (var k in extra) o[k] = extra[k]; a.push(o); save(a); },
      drop: function (ref) { save(load().filter(function (x) { return x.r !== ref; })); }
    };
  }

  /* The page: three tabs (submit, follow, mine) inside el. O is the office (see offices/*.js). */
  function mount(el, O) {
    var S = store(O.key, O.max || 10), c = O.cls, L = O.L;
    function $(s) { return el.querySelector(s); }
    function $$(s) { return Array.prototype.slice.call(el.querySelectorAll(s)); }
    function now() { return irt(); }
    var tabIds = ["submit", "follow", "mine"], cur = 0;
    function draw() {
      el.innerHTML = '<div class="' + c.tabs + '" role="tablist">' + tabIds.map(function (id, i) { return '<a href="#' + id + '" role="tab" data-tab="' + i + '">' + esc(L(O.t.tabs[i])) + "</a>"; }).join("") + "</div>" +
        '<div data-pane="0"><form class="' + c.form + '" id="mvs" novalidate>' + O.form(now()) + '<div><button class="' + c.btn + '" type="submit">' + esc(L(O.t.send)) + '</button></div></form><div id="mvsr"></div></div>' +
        '<div data-pane="1" hidden><form class="' + c.form + '" id="mvf" novalidate><div><label for="mvn">' + esc(L(O.t.number)) + '</label><input id="mvn" type="text" autocomplete="off" spellcheck="false" placeholder="' + esc(O.sample) + '"></div><div><button class="' + c.btn + '" type="submit">' + esc(L(O.t.follow)) + '</button></div></form><div id="mvfr"></div></div>' +
        '<div data-pane="2" hidden><div id="mvm"></div></div>';
      $$("[data-tab]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); tab(+a.getAttribute("data-tab")); try { history.replaceState(null, "", location.pathname + location.search + (O.hashPrefix || "#") + tabIds[+a.getAttribute("data-tab")]); } catch (x) {} }); });
      $("#mvs").addEventListener("submit", function (e) {
        e.preventDefault();
        var r = O.submit($("#mvs"), now());
        if (typeof r === "string") { $("#mvsr").innerHTML = '<div class="' + c.warn + '">' + r + "</div>"; return; }
        S.keep(r.ref, { t: iso(now().today) });
        $("#mvsr").innerHTML = '<div class="' + c.done + '">' + r.html + '</div><p><a href="#" class="' + c.btn2 + '" data-go="' + esc(r.ref) + '">' + esc(L(O.t.followThis)) + "</a></p>";
        $("#mvs").reset(); if (O.after) O.after($("#mvs"));
        $("#mvsr [data-go]").addEventListener("click", function (ev) { ev.preventDefault(); go(r.ref); });
      });
      $("#mvf").addEventListener("submit", function (e) { e.preventDefault(); show($("#mvn").value); });
      if (O.wire) O.wire($("#mvs"), now());
      tab(cur);
    }
    function tab(i) { cur = i; $$("[data-pane]").forEach(function (p) { p.hidden = p.getAttribute("data-pane") !== String(i); }); $$("[data-tab]").forEach(function (a) { a.className = a.getAttribute("data-tab") === String(i) ? "on" : ""; }); if (i === 2) mine(); }
    function go(ref) { tab(1); $("#mvn").value = ref; show(ref); }
    function show(s) {
      var n = now(), p = O.parse(s, n.today), out = $("#mvfr");
      if (p === "bad" || p === "none") { out.innerHTML = '<div class="' + c.warn + '">' + esc(L(O.t[p])) + "</div>"; return; }
      var kept = S.get(p.ref), act = kept && kept.a || null, pl = O.plan(p, act), seen = upTo(pl.ev, n);
      if (!seen.length) seen = pl.ev.slice(0, 1);
      var last = seen[seen.length - 1], wait = pl.wait && last.k === pl.wait.at && !act ? pl.wait : null;
      var rows = seen.slice().reverse().map(function (e) { return '<tr><td class="' + (c.num || "") + '">' + esc(O.when(e)) + "</td><td>" + O.text(e, p) + "</td></tr>"; }).join("");
      out.innerHTML = '<div class="' + c.box + '"><p><b>' + esc(L(O.t.number)) + ":</b> " + esc(p.ref) + "<br>" + O.head(p) + "<br><b>" + esc(L(O.t.status)) + ":</b> " + esc(O.status(last, p)) + "</p></div>" +
        (wait ? '<div class="' + c.note + '">' + wait.html + '<p><button type="button" class="' + c.btn + '" id="mvact">' + esc(wait.btn) + "</button></p></div>" : "") +
        '<table class="' + c.table + '"><thead><tr><th>' + esc(L(O.t.date)) + "</th><th>" + esc(L(O.t.event)) + "</th></tr></thead><tbody>" + rows + "</tbody></table>" +
        (kept ? "" : '<p><a href="#" class="' + c.btn2 + '" id="mvkeep">' + esc(L(O.t.keep)) + "</a></p>");
      if ($("#mvact")) $("#mvact").addEventListener("click", function () { S.keep(p.ref, { a: iso(now().today) }); show(p.ref); });
      if ($("#mvkeep")) $("#mvkeep").addEventListener("click", function (e) { e.preventDefault(); S.keep(p.ref, {}); show(p.ref); });
    }
    function mine() {
      var a = S.load(), n = now(), box = $("#mvm");
      if (!a.length) { box.innerHTML = "<p>" + esc(L(O.t.empty)) + "</p>"; return; }
      box.innerHTML = '<table class="' + c.table + '"><thead><tr><th>' + esc(L(O.t.number)) + "</th><th>" + esc(L(O.t.status)) + "</th><th></th></tr></thead><tbody>" +
        a.slice().reverse().map(function (x) {
          var p = O.parse(x.r, n.today);
          if (typeof p === "string") return "";
          var pl = O.plan(p, x.a || null), seen = upTo(pl.ev, n), last = seen[seen.length - 1] || pl.ev[0];
          return '<tr><td><a href="#" data-go="' + esc(x.r) + '">' + esc(x.r) + "</a><br><small>" + O.head(p) + "</small></td><td>" + esc(O.status(last, p)) + '</td><td><a href="#" data-rm="' + esc(x.r) + '">' + esc(L(O.t.remove)) + "</a></td></tr>";
        }).join("") + "</tbody></table>";
      $$("#mvm [data-go]").forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); go(b.getAttribute("data-go")); }); });
      $$("#mvm [data-rm]").forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); S.drop(b.getAttribute("data-rm")); mine(); }); });
    }
    var h = (location.hash || "").replace(O.hashPrefix || "#", "");
    if (h === "follow") cur = 1; else if (h === "mine") cur = 2;
    draw();
    var q = /[?&]n=([^&#]+)/.exec(location.search) || /[?&]n=([^&#]+)/.exec(location.hash);
    if (q) go(decodeURIComponent(q[1]));
    return { redraw: draw };
  }

  return { hash: hash, rng: rng, ri: ri, pick: pick, addDays: addDays, isW: isW, addW: addW, onW: onW, onDow: onDow, wdays: wdays,
    iso: iso, day: day, ymd: ymd, irt: irt, check: check, upTo: upTo, esc: esc, fill: fill, store: store, mount: mount };
})();

window.TSU_ENQ = function () {
  "use strict";
  var C = window.MoveCore, START = "2026-10-01", CHK = "ABCEHKMPTX";
  var MONL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function L(x) { return x; }
  function dl(d) { return d.getUTCDate() + " " + MONL[d.getUTCMonth()] + " " + d.getUTCFullYear(); }
  var TOP = {
    B: ["Undergraduate admission", "the Admissions Office secretary"],
    M: ["Master's or PhD admission", "the Department of Postgraduate Studies"],
    F: ["Foreign school certificates and the diaspora", "the International Office"],
    G: ["Fees, state grants and the 50% reduction", "the Accounts Department (tuition fees)"],
    T: ["Transfer from another university", "the Registry"],
    E: ["Evening courses for adults", "Evening courses, Building 3, room 104"],
    D: ["Certificates of study and duplicate diplomas", "the Registry and University archive, room 112"]
  };
  var ANS = {
    B: ["Admission {Y} opens on 20 June {Y}. Applicants are admitted on the results of the University Entrance Examination; the thresholds are published in May. The documents are listed on the Admission page. The Admissions Office does not say in advance whether a particular score will be enough for a state grant place.",
      "Consultations for applicants and parents are held in room 105 of the main building from 20 June {Y}, Monday to Friday 9:00–16:00. Questions about a particular programme are answered by the faculties at the spring open day; the date is sent to schools through the Education Network.",
      "Prize-winners of the republican school olympiads are admitted to state grant places without the threshold only to programmes in the subject of the olympiad, on the original olympiad diploma. Other applicants compete on the UEE score."],
    M: ["Entrance examinations to master's programmes are held in July: an examination in the speciality and in English (a B2 certificate is accepted instead). Bring the original bachelor's diploma with its supplement. Graduates of other universities take the same examinations.",
      "Doctoral (PhD) places are announced in June. Applicants need a master's degree, a research proposal agreed with a prospective supervisor, and at least one published paper. Contact the department of your field before applying."],
    F: ["Foreign school certificates must be recognised by the Ministry of Education before admission: bring the original certificate, the list of marks, a translation into Iradi certified by a notary and a copy of the passport. Recognition takes up to two months, so apply before May. Certificates issued by the clan councils of the ATR are not recognised in the ISEZ.",
      "Applicants from the diaspora apply on the same terms as other applicants, with a recognised certificate and UEE results. Those who did not take the UEE may take it in the additional session in July; ask the Education Quality Agency for the dates."],
    G: ["The 50% reduction for students from the districts and from families of the 1992 and 2007 wars is applied for after enrolment, by 15 September, with a certificate from the district administration. It is granted by the Rector's order for one year at a time and is applied for again each year.",
      "Contract fees are paid at any Talasbank branch, in full or in two instalments (by 1 October and by 1 February). The fee for the year is fixed in the contract and does not change during the year. State grant places are given only at admission and when a grant place becomes free after a session."],
    T: ["Transfers between universities are made in the vacations, if there is a free place on the course: a written request to the Rector, a certificate of study with marks from your university, and the agreement of the dean. A transfer to a state grant place is possible only when one is free. The list of free places is posted outside the Registry after the winter session (February) and the summer session (July)."],
    E: ["The next evening courses and their dates are announced on the website and at Building 3, room 104 (tel. 2-31-40-17). Enrolment is in person with an ID card; the fee is paid at Talasbank before the first class. A state certificate is given to those who attend at least 80% of the hours and pass the final test."],
    D: ["A certificate of study (that you study or studied at TSU) is issued by the Registry, room 112, within 3 working days, on a written request with an ID card. Someone else may collect it with a notarised power of attorney.",
      "A duplicate diploma is issued on a written request to the Rector with the state duty receipt and a notice of the loss published in a newspaper (for example the Talas Herald). It takes up to 30 days. Records from before 1993 are in the University archive and are found through the Registry."]
  };
  var ST = { recv: "Registered", fwd: "Being answered", wait: "Being answered", remind: "Being answered", out: "Forwarded to the Ministry", ans: "Answered", aug: "Registered" };
  var TX = {
    recv: "Enquiry registered by the Admissions Office under No. {n}. Enquiries are answered within 30 days.",
    aug: "The Admissions Office does not work with enquiries in August. Your enquiry will be dealt with from 1 September.",
    fwd: "Passed to {u}.",
    wait: "A reply is awaited from {u}.",
    remind: "Reminder sent to {u}.",
    out: "Your question is about the results of the University Entrance Examination, which are not within the competence of the University. The enquiry has been forwarded to the Education Quality Agency of the Ministry of Education, which will answer you directly.",
    ans: "Answer: {a} If your question is not answered, come to room 105 of the main building or telephone +996-39-2-31-40-11."
  };
  function body(t, d, n) { return "AO" + t + "-" + C.iso(d).slice(2).replace(/-/g, "") + "-" + n; }
  function makeRef(t, d, n) { var b = body(t, d, n || String(100 + Math.floor(Math.random() * 900))); return b + C.check(b, CHK); }
  function parse(s, today) {
    var m = /^AO([BMFGTED])(\d{6})(\d{3})([A-Z])$/.exec(String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, ""));
    if (!m) return "bad";
    var d0 = C.ymd(m[2]); if (!d0) return "none";
    var b = body(m[1], d0, m[3]);
    if (C.check(b, CHK) !== m[4] || d0 < C.day(START) || d0 > today) return "none";
    return { ref: b + m[4], t: m[1], d0: d0, no: m[3] };
  }
  function plan(a) {
    var r = C.rng(C.hash("tsuplan" + a.ref)), ev = [], d = a.d0, ri = function (x, y) { return C.ri(r, x, y); }, u = TOP[a.t][1];
    function add(k, date, v, h) { if (ev.length && date <= d) { date = d; } ev.push({ k: k, d: date, v: v || {}, h: h }); d = date; }
    add("recv", a.d0, { n: a.no + "/" + String(a.d0.getUTCFullYear()).slice(2) }, 0);
    var start = C.onW(a.d0);
    if (a.d0.getUTCMonth() === 7) { add("aug", C.onW(a.d0)); start = C.onW(C.day(a.d0.getUTCFullYear() + "-09-01")); }
    if ((a.t === "B" || a.t === "G") && r() < 0.12) { add("out", C.addW(start, ri(3, 8))); return { ev: ev }; }
    add("fwd", C.addW(start, ri(1, 3)), { u: u });
    var due = C.addDays(a.d0, 30);
    if (r() < 0.3) { add("wait", C.addW(d, ri(8, 12)), { u: u }); add("remind", C.addW(d, ri(2, 4)), { u: u }); }
    var x = C.addW(d, ri(4, 12));
    if (x > due && r() < 0.7) x = C.addW(C.addDays(due, -3), 0);
    add("ans", C.onW(x), { a: C.pick(r, ANS[a.t]) });
    return { ev: ev };
  }
  var O = {
    key: "tsu_enq", max: 10, L: L, sample: "AOB-261103-417K",
    cls: { tabs: "mvtabs", form: "signup mvform", btn: "btn", btn2: "btn btn-o", warn: "note mverr", done: "note", note: "note", box: "mvbox", table: "mvt", num: "mvd" },
    t: { tabs: ["Send an enquiry", "Check an enquiry", "My enquiries"], send: "Send the enquiry", number: "Enquiry number", follow: "Check",
      followThis: "Check this enquiry", status: "Status", date: "Date", event: "Progress", keep: "Keep this number in this browser", remove: "remove",
      empty: "No enquiries are kept in this browser.",
      bad: "This is not an enquiry number of the Admissions Office. It looks like AOB-261103-417K.",
      none: "No enquiry with this number. Check the letters and figures." },
    when: function (e) { return dl(e.d); },
    status: function (e) { return ST[e.k]; },
    head: function (p) { return C.esc(TOP[p.t][0]) + ". Sent " + dl(p.d0) + "."; },
    text: function (e, p) { var y = e.d.getUTCFullYear(), Y = e.d < C.day(y + "-06-20") ? y : y + 1; return C.esc(C.fill(C.fill(TX[e.k], { n: e.v.n, u: e.v.u, a: e.v.a }), { Y: Y })); },
    form: function () {
      return '<p><label for="mvt">Subject of the enquiry</label><br><select id="mvt">' + Object.keys(TOP).map(function (k) { return '<option value="' + k + '">' + TOP[k][0] + "</option>"; }).join("") + "</select></p>" +
        '<p><label for="mvq">Your question</label><br><textarea id="mvq" rows="5" maxlength="2000"></textarea></p>' +
        '<p class="mvchk"><label><input type="checkbox" id="mv1"> I have read the Admission page and the answers to common questions.</label></p>' +
        '<p class="mvsmall">Do not write your passport number or exam results here. The answer is given against the enquiry number on this page.</p>';
    },
    submit: function (f, now) {
      var q = (f.querySelector("#mvq").value || "").trim();
      if (q.length < 20) return "Please write your question (at least 20 characters).";
      if (!f.querySelector("#mv1").checked) return "Please confirm that you have read the Admission page.";
      var t = f.querySelector("#mvt").value, ref = makeRef(t, now.today);
      return { ref: ref, html: "Your enquiry has been sent. Its number is <b>" + ref + "</b>. Keep the number: the answer will appear under it on this page within 30 days." };
    },
    parse: parse, plan: plan
  };
  O._gen = function (k, d0) { return makeRef("BMFGTED".charAt(k % 7), d0, String(100 + k % 900)); };
  return O;
};
