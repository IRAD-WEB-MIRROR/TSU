/* Talas State University — site scripts */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; }
  }

  // hero slider
  var slides = $$(".hero .slide"), dots = $(".hero .dots"), cur = 0, timer;
  if (slides.length > 1 && dots) {
    slides.forEach(function (s, i) {
      var b = document.createElement("button");
      b.type = "button"; b.setAttribute("aria-label", "Slide " + (i + 1));
      if (i === 0) b.className = "on";
      b.onclick = function () { show(i); play(); };
      dots.appendChild(b);
    });
    var show = function (n) {
      slides[cur].classList.remove("on"); dots.children[cur].classList.remove("on");
      cur = (n + slides.length) % slides.length;
      slides[cur].classList.add("on"); dots.children[cur].classList.add("on");
    };
    var play = function () { clearInterval(timer); timer = setInterval(function () { show(cur + 1); }, 6000); };
    play();
  }

  // search bar, language note, burger
  var sb = $(".searchbar");
  var sbtn = $(".top-tools .search");
  if (sb && sbtn) sbtn.onclick = function () { sb.classList.toggle("show"); if (sb.classList.contains("show")) sb.querySelector("input").focus(); };
  var lb = $(".lang-btn"), ln = $(".lang-note");
  if (lb && ln) lb.onclick = function () { ln.classList.add("show"); setTimeout(function () { ln.classList.remove("show"); }, 2500); };
  var burger = $(".burger"), side = $(".side");
  if (burger && side) burger.onclick = function () { side.classList.toggle("open"); };
  var eye = $(".eye");
  if (eye) eye.onclick = function () {
    var big = document.documentElement.style.fontSize === "120%";
    document.documentElement.style.fontSize = big ? "" : "120%";
    document.body.style.fontSize = big ? "" : "17px";
  };

  // digital archive filter
  var wq = $("#wq"), wc = $("#wc");
  function filterWorks() {
    var q = (wq.value || "").toLowerCase().trim(), c = wc.value, shown = 0;
    $$("#works .work").forEach(function (w) {
      var ok = (!q || w.getAttribute("data-s").indexOf(q) !== -1) && (!c || w.getAttribute("data-c") === c);
      w.hidden = !ok; if (ok) shown++;
    });
    $("#wnone").hidden = shown > 0;
  }
  if (wq && wc) {
    wq.oninput = filterWorks; wc.onchange = filterWorks;
    $$(".subnav [data-c]").forEach(function (a) {
      a.onclick = function (ev) { ev.preventDefault(); wc.value = a.getAttribute("data-c"); filterWorks(); };
    });
  }

  // press catalogue search (also takes ?q= from the header search)
  var pq = $("#pq"), pd = $("#pd");
  function filterPress() {
    var q = (pq.value || "").toLowerCase().trim(), d = pd.value, n = 0;
    $$("#plist li").forEach(function (li) {
      var s = li.getAttribute("data-s"), y = li.querySelector(".y").textContent;
      var ok = (!q || q.split(/\s+/).every(function (w) { return s.indexOf(w) !== -1; })) && (!d || y.indexOf(d) === 0);
      li.hidden = !ok; if (ok) n++;
    });
    $("#pcount").textContent = n + (n === 1 ? " title" : " titles");
  }
  if (pq && pd) {
    var m = location.search.match(/[?&]q=([^&]*)/);
    if (m) pq.value = decodeURIComponent(m[1].replace(/\+/g, " "));
    pq.oninput = filterPress; pd.onchange = filterPress; filterPress();
  }

  // reader: progress bar, chapter highlight, font size, remembered position
  var text = $("#text");
  if (text) {
    var bar = $(".progress i"), heads = $$("#text h2"), links = $$(".toc li a");
    var key = "tsu-read-" + location.pathname;
    var fs = parseFloat(store("tsu-read-fs") || "0");
    var applyFs = function () { text.style.fontSize = fs ? (19 + fs) + "px" : ""; };
    applyFs();
    $$(".toc [data-fs]").forEach(function (b) {
      b.onclick = function () { fs = Math.max(-3, Math.min(5, fs + parseInt(b.getAttribute("data-fs"), 10))); store("tsu-read-fs", String(fs)); applyFs(); };
    });
    var sideBtn = $(".toc [data-side]");
    if (sideBtn) sideBtn.onclick = function () { document.body.classList.toggle("reading"); };
    var onScroll = function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.width = (h > 0 ? 100 * scrollY / h : 0) + "%";
      var on = -1;
      heads.forEach(function (hd, i) { if (hd.getBoundingClientRect().top < 140) on = i; });
      links.forEach(function (a, i) { a.classList.toggle("on", i === on); });
      store(key, String(Math.round(scrollY)));
    };
    addEventListener("scroll", onScroll, { passive: true });
    var saved = parseInt(store(key) || "0", 10);
    if (saved > 400 && !location.hash) setTimeout(function () { scrollTo(0, saved); }, 50);
    onScroll();
  }
})();

/* holiday, half-mast, pass and power notices shared by the state sites (iradgov.org/assets/irad-bar.js) */
(function () {
  var s = document.createElement("script");
  s.src = "https://iradgov.org/assets/irad-bar.js"; s.defer = true; s.setAttribute("data-kind", "univ");
  document.head.appendChild(s);
})();
