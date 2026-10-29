/* Email sign-up boxes: <form data-signup="PREFIX" data-done="message with {email} and {ref}">.
   The request is registered with a reference number and remembered in this browser; the list itself is kept
   by the office, so the confirmation email is sent from there. */
(function () {
  "use strict";
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function fill(t, rec) { return t.replace(/\{email\}/g, "<b>" + esc(rec.email) + "</b>").replace(/\{ref\}/g, "<b>" + esc(rec.ref) + "</b>").replace(/\{date\}/g, esc(rec.date)); }

  Array.prototype.forEach.call(document.querySelectorAll("form[data-signup]"), function (form) {
    var prefix = form.getAttribute("data-signup"), key = "signup:" + prefix;
    var msg = document.createElement("p");
    msg.className = "signup-msg";
    msg.setAttribute("role", "status");
    form.parentNode.insertBefore(msg, form.nextSibling);
    function done(rec, again) {
      form.hidden = true;
      msg.innerHTML = fill(again ? (form.getAttribute("data-again") || form.getAttribute("data-done")) : form.getAttribute("data-done"), rec);
    }
    var old = load(key);
    if (old) done(old, true);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"]'), email = (input.value || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        msg.textContent = form.getAttribute("data-bad") || "Please enter a valid email address.";
        input.focus();
        return;
      }
      var d = new Date(Date.now() + 6 * 3600000);
      var rec = { email: email, date: d.toISOString().slice(0, 10),
                  ref: prefix + "-" + d.getUTCFullYear() % 100 + "-" + ("00000" + hash(prefix + email + d.toISOString().slice(0, 10)) % 1000000).slice(-6) };
      save(key, rec);
      done(rec, false);
    });
  });
})();
