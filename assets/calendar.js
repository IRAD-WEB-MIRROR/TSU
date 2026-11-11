/* Calendar converter: traditional month, müçöl year, church day and the Talas Herald of the day. All in the browser. */
(function () {
  "use strict";
  var B = document.body.getAttribute("data-base") || "";
  var form = document.getElementById("calf"), inp = document.getElementById("cald"), out = document.getElementById("calout");
  if (!form) return;
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  // traditional month names (lore dictionary, official spelling) and their literal meanings
  var TRAD = [["Üçtün ayı", "month of the three, counted from the Pleiades"], ["Birdin ayı", "month of the one"], ["Jalgan kuran", "false roe deer"],
    ["Çın kuran", "true roe deer"], ["Bugu", "red deer"], ["Kulja", "argali ram"], ["Teke", "ibex"], ["Baş oona", "early oona"],
    ["Ayak oona", "late oona"], ["Toguzdun ayı", "month of the nine"], ["Jetinin ayı", "month of the seven"], ["Beştin ayı", "month of the five"]];
  // the müçöl, 2026 = Horse; Iradi names from the dictionary
  var ANIMALS = [["Mouse", "çıçkan jılı"], ["Cow", "uy jılı", "thought unlucky; some highland grandmothers call it the Year of the Argali, arkar jılı"], ["Tiger", "jolbors jılı"], ["Hare", "koyon jılı"], ["Fish", "balık jılı"],
    ["Snake", "jılan jılı"], ["Horse", "jılkı jılı", "thought a good year"], ["Sheep", "koy jılı"], ["Monkey", "meçin jılı"], ["Hen", "took jılı"], ["Dog", "it jılı"], ["Pig", "doñuz jılı"]];
  function animal(y) { return ANIMALS[(((y - 2020) % 12) + 12) % 12]; }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fl(x) { return Math.floor(x); }
  // day numbers (Julian Day Number) for both calendars
  function g2j(y, m, d) { var a = fl((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3; return d + fl((153 * mm + 2) / 5) + 365 * yy + fl(yy / 4) - fl(yy / 100) + fl(yy / 400) - 32045; }
  function j2j(y, m, d) { var a = fl((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3; return d + fl((153 * mm + 2) / 5) + 365 * yy + fl(yy / 4) - 32083; }
  function jd2jul(n) { var c = n + 32082, d = fl((4 * c + 3) / 1461), e = c - fl(1461 * d / 4), m = fl((5 * e + 2) / 153);
    return [d - 4800 + fl(m / 10), m + 3 - 12 * fl(m / 10), e - fl((153 * m + 2) / 5) + 1]; }
  function jd2greg(n) { var a = n + 32044, b = fl((4 * a + 3) / 146097), c = a - fl(146097 * b / 4), d = fl((4 * c + 3) / 1461), e = c - fl(1461 * d / 4), m = fl((5 * e + 2) / 153);
    return [100 * b + d - 4800 + fl(m / 10), m + 3 - 12 * fl(m / 10), e - fl((153 * m + 2) / 5) + 1]; }
  function wd(n) { return (n + 1) % 7; }   // 0 = Sunday
  function easter(y, jul) {
    if (jul) { var a = y % 4, b = y % 7, c = y % 19, d = (19 * c + 15) % 30, e = (2 * a + 4 * b - d + 34) % 7, f = d + e + 114; return j2j(y, fl(f / 31), (f % 31) + 1); }
    var A = y % 19, Bc = fl(y / 100), C = y % 100, D = fl(Bc / 4), E = Bc % 4, F = fl((Bc + 8) / 25), G = fl((Bc - F + 1) / 3), H = (19 * A + Bc - D - G + 15) % 30,
      I = fl(C / 4), K = C % 4, L = (32 + 2 * E + 2 * I - H - K) % 7, M = fl((A + 11 * H + 22 * L) / 451), mo = fl((H + L - 7 * M + 114) / 31), da = ((H + L - 7 * M + 114) % 31) + 1;
    return g2j(y, mo, da);
  }
  var FIXED = {   // church month-day: [name, note, kind, from year]
    "01-06": ["Denha, the Epiphany", "Blessing of the waters; water is taken home for the winter.", "great"],
    "03-25": ["Süyünchü Künü, the Annunciation", "“The day of good tidings”, the Christian spring feast; the turn of the year for some highland clans.", "great"],
    "04-23": ["St. Gewargis", "The mounted saint of the icons. Spring blessing of the horses in the Talas Alatau.", "feast"],
    "08-15": ["The Assumption", "Memorial prayers for the Lost Tribes of 1916.", "feast"],
    "08-23": ["Eve of the Feast of St. Janyl", "Vigil procession from the old town of Iyık Janyl.", "feast"],
    "08-24": ["Feast of St. Janyl", "The great pilgrimage to Iyık Janyl; Holy Qurbana and the blessing of the herds. Name day of every Janyl.", "great"],
    "09-14": ["Salyba Künü, the Feast of the Cross", "The end of the pilgrimage and of summer: “after the Cross, no yurt on the jayloo”.", "great"],
    "11-02": ["All Souls", "Prayers for the faithful departed at the cemeteries.", "feast"],
    "11-14": ["Commemoration of the victims of 1937", "The names of clergy and laity taken in 1937–38 are read in full; the great bell tolls.", "great", 1993],
    "11-20": ["Yuhanna of Merv", "The monk who, by tradition, built the first house of prayer in the Talas valley.", "feast"],
    "12-25": ["Yalda, the Nativity of Our Lord", "Night Qurbana on the eve.", "great"]
  };
  var CIVIL = { "01-01": ["New Year", 1900], "03-11": ["Irad Day, the national day", 1993], "03-21": ["Nooruz (navbahor), public holiday", 1993] };
  function sundayNearest(n) { var w = wd(n); return w <= 3 ? n - w : n + 7 - w; }
  function church(n, saints) {
    var jul = n < g2j(1931, 9, 14);
    var cd = jul ? jd2jul(n) : jd2greg(n), Y = cd[0];
    var mk = function (m, d) { return jul ? j2j(Y, m, d) : g2j(Y, m, d); };
    var E = easter(Y, jul), sub = mk(11, 27); sub += (7 - wd(sub)) % 7;
    var moses = sub - 56, kud = sub - 28, season;
    if (n >= sub) season = n < mk(12, 25) ? "Subara, the Annunciation season" : "Yalda–Denha, the Nativity and Epiphany season";
    else if (n < E - 48) season = "Yalda–Denha, the Nativity and Epiphany season";
    else if (n < E) season = "Uluu Savma, the Great Fast";
    else if (n < E + 49) season = "Kyamta, the Resurrection season";
    else if (n < E + 98) season = "Shlihe, the season of the Apostles";
    else if (n < E + 147) season = "Kaita, the Summer season";
    else if (n < moses) season = "Eliya–Salyba, the season of Elijah and the Cross";
    else if (n < kud) season = "the Season of Moses";
    else season = "Kudash Idta, the Dedication of the Church";
    var md = (cd[1] < 10 ? "0" : "") + cd[1] + "-" + (cd[2] < 10 ? "0" : "") + cd[2];
    var feasts = [], f = FIXED[md];
    if (f && !(f[3] && Y < f[3])) feasts.push({ name: f[0], note: f[1], kind: f[2] });
    var mov = [[E - 69, "Ninevi Savmasy, the Rogation of the Ninevites", "Three days of fasting: no meat, milk or butter.", "fast"], [E - 68, "Ninevi Savmasy, second day", "", "fast"], [E - 67, "Ninevi Savmasy, third day", "", "fast"],
      [E - 48, "Uluu Savma, the Great Fast, begins", "The nakus is beaten to open the fast.", "fast"], [E - 3, "Achytky Beyshembi, Holy Thursday", "“Leaven Thursday”: the malka is renewed in the highland parishes.", "great"],
      [E - 2, "Good Friday", "The bells are silent; the nakus is beaten.", "fast"], [E - 1, "Holy Saturday", "", "fast"], [E, "Kyamta, the Resurrection", "Christ is risen!", "great"],
      [E + 39, "The Ascension", "", "feast"], [E + 49, "Pentecost", "", "great"],
      [mk(9, 14) + 7 - wd(mk(9, 14)), "Sunday of the Saints of Irad", "The end of the pilgrimage season: the cathedral names all the saints of Irad in order and the parishes bring their icons out on the bema.", "feast"],
      [sundayNearest(mk(5, 6)), "Jazgy Chabandoz, the spring Feast of the White Rider", "Folk feast as the herds go up: white horses led round the chapels, milk poured at the springs.", "folk"],
      [sundayNearest(mk(10, 1)), "Küzgü Chabandoz, the autumn Feast of the White Rider", "Folk feast as the herds come down.", "folk"]];
    mov.forEach(function (m) { if (m[0] === n) feasts.push({ name: m[1], note: m[2], kind: m[3] }); });
    var mem = saints && saints.days && saints.days[md], devotion = saints && saints.week ? saints.week[wd(n)] : "";
    var inFast = n >= E - 48 && n < E || (n >= E - 69 && n <= E - 67);
    var great = feasts.some(function (x) { return x.kind === "great"; });
    var fast = inFast ? "Fast day" : ((wd(n) === 3 || wd(n) === 5) && !(n > E && n <= E + 49) && !great) ? "Day of abstinence" : "";
    return { jul: jul, cd: cd, season: season, feasts: feasts, mem: mem, devotion: devotion, fast: fast, Y: Y, easter: jul ? jd2jul(E) : jd2greg(E) };
  }
  var saints = null, herald = {};
  function getJSON(u) { return fetch(u).then(function (r) { if (!r.ok) throw 0; return r.json(); }); }
  function heraldYear(y) { if (!herald[y]) herald[y] = getJSON(B + "data/herald/" + y + ".json").catch(function () { return null; }); return herald[y]; }
  function hlink(d, it) { return "https://talasherald.com/archive/print.html?d=" + d + "&s=" + encodeURIComponent(it[0]) + "&h=" + encodeURIComponent(it[1]); }
  function fmt(c) { return c[2] + " " + MONTHS[c[1] - 1] + " " + c[0]; }
  function iso(c) { return c[0] + "-" + (c[1] < 10 ? "0" : "") + c[1] + "-" + (c[2] < 10 ? "0" : "") + c[2]; }

  function show(s) {
    var p = s.split("-").map(Number); if (p.length !== 3 || !p[0]) return;
    var y = p[0], m = p[1], d = p[2], n = g2j(y, m, d), c = [y, m, d], rows = [];
    rows.push(["Date", "<b>" + DAYS[wd(n)] + ", " + fmt(c) + "</b>"]);
    var t = TRAD[m - 1];
    rows.push(["Traditional month", "<b><i>" + esc(t[0]) + "</i></b> (“" + esc(t[1]) + "”)" + (m === 8 ? ", also <i>Janıl ayı</i>, Janyl's month" : "") + '<br><span class="muted">In speech and documents: ' + MONTHS[m - 1] + "</span>"]);
    var a = animal(y), tr = (m < 3 || (m === 3 && d < 21)) ? animal(y - 1) : a, hi = (m < 3 || (m === 3 && d < 25)) ? animal(y - 1) : a;
    var an = function (x) { return "Year of the " + x[0] + (x[1] ? " (<i>" + esc(x[1]) + "</i>)" : ""); };
    var mu = "<b>" + an(a) + "</b>" + (a[2] ? ", " + esc(a[2]) : "") + ' <span class="muted">(reckoned from 1 January)</span>';
    if (tr !== a) mu += "<br>In the traditional reckoning, until Nooruz on 21 March, still the " + an(tr) + " (for some highland clans, until <i>Süyünchü Künü</i> on 25 March).";
    else if (hi !== a) mu += "<br>For the highland clans that count from <i>Süyünchü Künü</i>, still the " + an(hi) + " until 25 March.";
    mu += '<br><span class="muted">Someone born on this day reaches the müçöl years at 12, 24, 36 and 48: in ' + [12, 24, 36, 48].map(function (k) { return y + k; }).join(", ") + ".</span>";
    rows.push(["Animal year (<i>müçöl</i>)", mu]);
    var ch = church(n, saints), h = "";
    if (ch.jul) h += '<span class="muted">Church calendar (Julian, kept until 1931): </span><b>' + fmt(ch.cd) + "</b><br>";
    ch.feasts.forEach(function (f) { h += "<b>" + esc(f.name) + "</b>" + (f.note ? ". " + esc(f.note) : "") + "<br>"; });
    if (ch.mem && !ch.feasts.length) h += (/^(The |Our |All )/.test(ch.mem[0]) ? "" : "Memory of ") + esc(ch.mem[0]) + (ch.mem[1] ? ' <span class="muted">' + esc(ch.mem[1]) + "</span>" : "") + "<br>";
    else if (!ch.feasts.length && ch.devotion) h += esc(ch.devotion) + "<br>";
    h += "Season: " + esc(ch.season) + (ch.fast ? " · " + ch.fast : "") + "<br>";
    h += '<span class="muted">Easter (Kyamta) that year: ' + fmt(ch.easter) + (ch.jul ? " (Julian)" : "") + ".</span>";
    if (n >= g2j(1937, 1, 1) && n < g2j(1992, 9, 14)) h += '<br><span class="muted">From 1937 the churches were closed; until the cathedral was reconsecrated on 14 September 1992 the feasts were kept in secret, in flats and herders\' camps.</span>';
    if (y === 1931 && m === 9 && d === 14) h += '<br><span class="muted">The day of the bull <i>Orientalis Stella</i>; the Church takes the Gregorian calendar.</span>';
    if (y === 1992 && m === 9 && d === 14) h += '<br><span class="muted">The Church of St. Janyl is reconsecrated.</span>';
    rows.push(['Church calendar <span class="muted">(Syro-Iradi)</span>', h]);
    var civ = CIVIL[s.slice(5)];
    if (civ && y >= civ[1]) rows.push(["Public holiday", esc(civ[0])]);
    rows.push(["<i>Talas Herald</i>", '<span id="calh" class="muted">…</span>']);
    out.innerHTML = '<table class="cal-t">' + rows.map(function (r) { return "<tr><th>" + r[0] + "</th><td>" + r[1] + "</td></tr>"; }).join("") + "</table>";
    var box = document.getElementById("calh");
    var today = new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 10);
    if (s < "1993-03-15") { box.innerHTML = "The <i>Talas Herald</i> first appeared on 15 March 1993."; return; }
    if (s > today) { box.innerHTML = "That issue has not been printed yet."; return; }
    box.innerHTML = wd(n) === 0 ? "The <i>Herald</i> does not appear on Sundays." : "";
    heraldYear(y).then(function (data) {
      var yl = '<a href="https://talasherald.com/archive/' + y + '.html">The Herald in ' + y + "</a>";
      if (!data) { box.innerHTML += yl; return; }
      var items = data[s];
      if (items) { box.className = ""; box.innerHTML = "That day the paper printed:<br>" + items.map(function (it) { return '<a href="' + hlink(s, it) + '">' + esc(it[1]) + "</a> " + '<span class="muted">(' + esc(it[0]) + ")</span>"; }).join("<br>") + '<br><span class="muted">' + yl + "</span>"; return; }
      var ds = Object.keys(data).sort(), before = null, after = null;
      ds.forEach(function (k) { if (k < s) before = k; else if (k > s && !after) after = k; });
      var near = function (k) { var it = data[k][0], q = k.split("-").map(Number); return '<a href="' + hlink(k, it) + '">' + esc(it[1]) + '</a> <span class="muted">(' + q[2] + " " + MONTHS[q[1] - 1] + ")</span>"; };
      box.className = "";
      box.innerHTML += (wd(n) === 0 ? "" : "Nothing from this day is in the online archive yet.") + (before ? "<br>Before: " + near(before) : "") + (after ? "<br>After: " + near(after) : "") + '<br><span class="muted">' + yl + " · the full file is in the newspaper collection of the National Library.</span>";
    });
  }
  function go(s) { inp.value = s; show(s); try { history.replaceState(null, "", "#" + s); } catch (e) {} }
  window.addEventListener("hashchange", function () { var h = location.hash.slice(1); if (/^\d{4}-\d\d-\d\d$/.test(h) && h !== inp.value) { inp.value = h; show(h); } });
  form.addEventListener("submit", function (ev) { ev.preventDefault(); if (inp.value) go(inp.value); });
  document.getElementById("caltoday").onclick = function () { go(new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 10)); };
  getJSON(B + "data/saints.json").catch(function () { return null; }).then(function (sd) {
    saints = sd;
    var h = location.hash.slice(1);
    go(/^\d{4}-\d\d-\d\d$/.test(h) ? h : new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 10));
  });
})();
