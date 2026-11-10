/* Muhammad Owais portfolio: small, dependency-free behaviour layer. */
(function () {
  "use strict";
  var doc = document;

  /* Header: solid background once the page scrolls */
  var hdr = doc.querySelector(".hdr");
  function onScroll() { if (hdr) hdr.classList.toggle("scrolled", window.scrollY > 24); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  var menuBtn = doc.querySelector(".menu-btn");
  if (menuBtn && hdr) {
    menuBtn.addEventListener("click", function () {
      var open = hdr.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.textContent = open ? "Close" : "Menu";
    });
    doc.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        hdr.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.textContent = "Menu";
      });
    });
  }

  /* Work filters */
  var filterBar = doc.querySelector("[data-filters]");
  if (filterBar) {
    var cards = doc.querySelectorAll("[data-tags]");
    var count = doc.querySelector("[data-count]");
    filterBar.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-filter]");
      if (!b) return;
      var f = b.getAttribute("data-filter");
      filterBar.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      var shown = 0;
      cards.forEach(function (c) {
        var ok = f === "all" || (" " + c.getAttribute("data-tags") + " ").indexOf(" " + f + " ") > -1;
        c.hidden = !ok; if (ok) shown++;
      });
      if (count) count.textContent = shown + (shown === 1 ? " project" : " projects");
    });
  }

  /* Lightbox for proof screenshots and certificates */
  var lb = doc.createElement("dialog");
  lb.className = "lb";
  lb.setAttribute("aria-label", "Enlarged image");
  lb.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure><button class="x" type="button">Close</button>';
  doc.body.appendChild(lb);
  var lbImg = lb.querySelector("img"), lbCap = lb.querySelector("figcaption");
  lb.querySelector(".x").addEventListener("click", function () { lb.close(); });
  lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
  doc.addEventListener("click", function (e) {
    var t = e.target.closest("[data-zoom]");
    if (!t) return;
    var img = t.querySelector("img");
    lbImg.src = t.getAttribute("data-zoom");
    lbImg.alt = img ? img.alt : "";
    lbCap.textContent = t.getAttribute("data-caption") || (img ? img.alt : "");
    if (typeof lb.showModal === "function") lb.showModal(); else window.open(lbImg.src, "_self");
  });

  /* Charts grow when they scroll into view (they rest at their final state) */
  var anim = doc.querySelectorAll("[data-animate]");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("play"); io.unobserve(en.target); }
      });
    }, { threshold: 0.35 });
    anim.forEach(function (el) { io.observe(el); });
  }

  /* Case page table of contents */
  var toc = doc.querySelector(".toc");
  if (toc && "IntersectionObserver" in window) {
    var links = {};
    toc.querySelectorAll("a").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var tio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && links[en.target.id]) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove("active"); });
          links[en.target.id].classList.add("active");
        }
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    doc.querySelectorAll(".csec[id]").forEach(function (s) { tio.observe(s); });
  }

  /* Planning-chain calculator */
  var calc = doc.querySelector("[data-calc]");
  if (calc) {
    var fmt = function (n, d) {
      if (!isFinite(n)) return "–";
      return n.toLocaleString("en-US", { maximumFractionDigits: d === undefined ? 0 : d, minimumFractionDigits: d || 0 });
    };
    var run = function () {
      var v = function (k) { var el = calc.querySelector('[name="' + k + '"]'); return parseFloat(el.value) || 0; };
      var budget = v("budget"), cpc = v("cpc"), cvr = v("cvr") / 100, q = v("qual") / 100, close = v("close") / 100, rev = v("rev"), margin = v("margin") / 100;
      var clicks = cpc > 0 ? budget / cpc : 0, leads = clicks * cvr, customers = leads * q * close;
      var cpl = leads > 0 ? budget / leads : NaN, cpa = customers > 0 ? budget / customers : NaN;
      var roas = budget > 0 ? (customers * rev) / budget : NaN, be = margin > 0 ? 1 / margin : NaN;
      var set = function (k, val) { var el = calc.querySelector('[data-out="' + k + '"]'); if (el) el.textContent = val; };
      set("leads", fmt(leads)); set("cpl", fmt(cpl, 2)); set("customers", fmt(customers, 1)); set("cpa", fmt(cpa));
      set("roas", fmt(roas, 1) + "x"); set("be", fmt(be, 1) + "x");
      var verdict = calc.querySelector("[data-verdict]");
      if (verdict) {
        var ok = roas >= be;
        verdict.className = "calc-verdict " + (ok ? "ok" : "no");
        verdict.textContent = isFinite(roas) && isFinite(be) ? (ok ? "Above break-even: this plan pays back at these rates." : "Below break-even: improve conversion, close rate or order value before adding budget.") : "Enter values to see the result.";
      }
    };
    calc.addEventListener("input", run);
    run();
  }

  /* Copy buttons: clipboard API first, then a textarea fallback (sandboxed previews often block the API) */
  var live = doc.createElement("p");
  live.className = "sr"; live.setAttribute("aria-live", "polite"); doc.body.appendChild(live);
  doc.querySelectorAll("[data-copy]").forEach(function (b) {
    var label = b.querySelector("span") || b;
    var orig = label.textContent;
    var flash = function (t) {
      label.textContent = t; live.textContent = t;
      setTimeout(function () { label.textContent = orig; }, 1800);
    };
    var legacy = function (txt) {
      try {
        var ta = doc.createElement("textarea");
        ta.value = txt; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
        doc.body.appendChild(ta); ta.select();
        var ok = doc.execCommand("copy"); doc.body.removeChild(ta);
        return ok;
      } catch (e) { return false; }
    };
    b.addEventListener("click", function () {
      var txt = b.getAttribute("data-copy");
      var fail = function () { flash(legacy(txt) ? "Copied" : txt); };
      try {
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(function () { flash("Copied"); }, fail);
        else fail();
      } catch (e) { fail(); }
    });
  });

  var y = doc.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
