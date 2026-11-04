(function () {
  var BASE = "/demos/broward-motorsports";
  var bound = false;
  var DEALER = window.BROWARD.dealer;
  var COPY = window.BROWARD.copy;
  var LANG_KEY = DEALER.langKey;
  var LOC_KEY = DEALER.locationKey || "broward-location";

  function lang() {
    try {
      return localStorage.getItem(LANG_KEY) === "es" ? "es" : "en";
    } catch (e) {
      return "en";
    }
  }
  function t(key) {
    var pack = COPY[lang()] || COPY.en;
    var node = pack;
    var fallback = COPY.en;
    String(key).split(".").forEach(function (part) {
      node = node && node[part];
      fallback = fallback && fallback[part];
    });
    if (node == null) node = fallback;
    return node == null ? key : node;
  }
  var UNITS = window.BROWARD.units.map(function (u) {
    u.brandSlug = slug(u.brand);
    u.modelSlug = slug(u.model);
    return u;
  });

  function slug(s) {
    return String(s || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  function keepModel(s) {
    return String(s == null ? "" : s).replace(/-/g, "\u2011");
  }
  function money(n) { return "$" + Number(n).toLocaleString("en-US"); }
  function img(file) { return BASE + "/img/" + file; }
  function inv(params) {
    var q = new URLSearchParams();
    Object.keys(params || {}).forEach(function (k) {
      if (params[k]) q.set(k, params[k]);
    });
    var s = q.toString();
    return BASE + "/inventory" + (s ? "?" + s : "");
  }
  function byBrand(brandSlug) {
    return UNITS.filter(function (u) { return u.brandSlug === brandSlug; });
  }
  function modelsOf(brandSlug) {
    var seen = {};
    var list = [];
    byBrand(brandSlug).forEach(function (u) {
      if (seen[u.modelSlug]) return;
      seen[u.modelSlug] = true;
      list.push(u);
    });
    return list;
  }
  function findUnit(id) {
    return UNITS.filter(function (u) { return u.id === id; })[0];
  }
  function findModel(modelSlug) {
    return UNITS.filter(function (u) { return u.modelSlug === modelSlug; })[0];
  }
  function routeKey(marker, queryName) {
    var parts = location.pathname.split("/").filter(Boolean);
    var i = parts.indexOf(marker);
    if (i >= 0 && parts[i + 1]) return decodeURIComponent(parts[i + 1]);
    return new URLSearchParams(location.search).get(queryName) || "";
  }
  function currentUnit() {
    if (document.body.getAttribute("data-page") !== "unit") return null;
    return findUnit(routeKey("inventory", "id")) || null;
  }
  function place() {
    var list = window.BROWARD.locations || [];
    var id = "";
    try { id = localStorage.getItem(LOC_KEY) || ""; } catch (e) {}
    var found = list.filter(function (loc) { return loc.id === id; })[0];
    var fallback = list.filter(function (loc) { return loc.id === "fort-lauderdale"; })[0] || list[0];
    return found || fallback || { id: "fort-lauderdale", name: "Fort Lauderdale", address: DEALER.address, city: "Fort Lauderdale, FL", phone: DEALER.phone, hours: { en: "", es: "" } };
  }
  function phoneDigits() { return place().phone || DEALER.phone; }
  function salesPretty() {
    var digits = phoneDigits();
    return "(" + digits.slice(0, 3) + ") " + digits.slice(3, 6) + "-" + digits.slice(6);
  }
  function hoursNow() {
    var hours = place().hours || {};
    return hours[lang()] || hours.en || "";
  }
  function contactMessage(unit) {
    if (unit) {
      var name = unit.year + " " + unit.brand + " " + unit.model;
      if (lang() === "es") return "Hola, me interesa el " + name + " (stock " + unit.stock + ")";
      return "Hi, I'm interested in the " + name + " (stock " + unit.stock + ")";
    }
    return t("msg.generic");
  }
  function waSvg() {
    return '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><circle cx="24" cy="24" r="24" fill="currentColor"/><g transform="translate(6.042 6.37) scale(0.205)"><path fill="#fff" d="M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.313-6.179 22.558 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.517 31.126 8.523h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.928z"/><path fill="currentColor" d="M68.772 55.603c-1.378-3.061-2.828-3.123-4.137-3.176l-3.524-.043c-1.226 0-3.218.46-4.902 2.3s-6.435 6.287-6.435 15.332 6.588 17.785 7.506 19.013 12.718 20.381 31.405 27.75c15.529 6.124 18.689 4.906 22.061 4.6s10.877-4.447 12.408-8.74 1.532-7.971 1.073-8.74-1.685-1.226-3.525-2.146-10.877-5.367-12.562-5.981-2.91-.919-4.137.921-4.746 5.979-5.819 7.206-2.144 1.381-3.984.462-7.76-2.861-14.784-9.124c-5.465-4.873-9.154-10.891-10.228-12.73s-.114-2.835.808-3.751c.825-.824 1.838-2.147 2.759-3.22s1.224-1.84 1.836-3.065.307-2.301-.153-3.22-4.032-10.011-5.666-13.647"/></g></svg>';
  }
  function chatSvg() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2z"/></svg>';
  }
  function contactLinks(unit, kind) {
    var msg = encodeURIComponent(contactMessage(unit));
    var wa = "https://wa.me/1" + phoneDigits() + "?text=" + msg;
    var sms = "sms:+1" + phoneDigits() + "?&body=" + msg;
    var cls = kind === "icon" ? "contact icon" : "contact labeled";
    return '<a class="' + cls + ' wa" href="' + wa + '" target="_blank" rel="noopener noreferrer" title="' + t("wa") + '">' + waSvg() + "<span>" + t("wa") + "</span></a>" +
      '<a class="' + cls + ' sms" href="' + sms + '" title="' + t("sms") + '">' + chatSvg() + "<span>" + t("sms") + "</span></a>";
  }
  function navLinks() {
    return '<a href="' + inv({ category: "Motorcycle" }) + '">' + t("nav.moto") + "</a>" +
      '<a href="' + inv({ category: "Off-road" }) + '">' + t("nav.off") + "</a>" +
      '<a href="' + inv({ category: "Water" }) + '">' + t("nav.water") + "</a>" +
      '<a href="' + inv({ condition: "Pre-owned" }) + '">' + t("nav.used") + "</a>" +
      '<a href="#" data-open="approve">' + t("nav.fin") + "</a>" +
      '<a href="' + BASE + '/#sec-locations">' + t("nav.service") + "</a>";
  }
  function langToggle() {
    var es = lang() === "es";
    return '<div class="lang" role="group" aria-label="' + t("lang") + '">' +
      '<button type="button" data-lang="en" aria-pressed="' + (es ? "false" : "true") + '">EN</button>' +
      '<button type="button" data-lang="es" aria-pressed="' + (es ? "true" : "false") + '">ES</button>' +
      "</div>";
  }
  function locSelect() {
    var current = place().id;
    var opts = (window.BROWARD.locations || []).map(function (loc) {
      return '<option value="' + loc.id + '"' + (loc.id === current ? " selected" : "") + ">" + loc.name + "</option>";
    }).join("");
    return '<label class="loc"><span>' + t("shoppingAt") + '</span><select data-loc aria-label="' + t("shoppingAt") + '">' + opts + "</select></label>";
  }
  function header() {
    return '<header class="top"><div class="w hd">' +
      '<a class="logo" href="' + BASE + '/"><span>' + DEALER.logo[0] + "</span><b>" + DEALER.logo[1] + "</b></a>" +
      '<button class="menu" type="button" aria-expanded="false" aria-label="' + t("menu") + '">' + t("menu") + "</button>" +
      '<nav class="nav">' + navLinks() + '</nav><div class="sp"></div>' +
      '<div class="hd-tools">' + locSelect() + langToggle() +
      '<button class="btn wh approve" type="button" data-open="approve">' + t("approve") + "</button>" +
      "</div></div></header>" +
      '<div class="drawer w" id="drawer">' +
      '<div class="drawer-loc">' + locSelect() + "</div>" +
      '<div class="drawer-tools">' + langToggle() +
      '<button class="btn wh" type="button" data-open="approve">' + t("approve") + "</button></div>" +
      navLinks() + "</div>";
  }
  function footer() {
    return '<footer class="foot"><div class="w foot-lines">' +
      "<p>" + t("footer.concept") + ' <a href="' + DEALER.creditUrl + '">' + DEALER.creditName + "</a></p>" +
      "</div></footer>";
  }
  function reach() {
    return '<div class="reach">' + contactLinks(currentUnit(), "icon") + "</div>";
  }
  function modal() {
    return '<div class="modal" id="modal" hidden><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
      '<h2 id="modal-title">' + t("note") + "</h2>" +
      '<form class="form" id="lead">' +
      "<label>" + t("form.name") + ' <input name="name" required></label>' +
      "<label>" + t("form.contact") + ' <input name="contact" required></label>' +
      '<label class="extra">' + t("form.note") + ' <textarea name="note" rows="3"></textarea></label>' +
      '<button class="btn rd" type="submit">' + t("form.send") + "</button>" +
      "</form>" +
      '<p class="thanks" hidden>' + t("form.thanks") + "</p>" +
      '<button class="btn gl" type="button" data-close style="margin-top:12px">' + t("close") + "</button>" +
      "</div></div>";
  }

  function card(u) {
    return '<article class="card"><a href="' + BASE + "/inventory/" + u.id + '">' +
      '<div class="ph"><img src="' + img(u.img) + '" alt=""><span class="tag">' + t("opt." + u.condition) + "</span></div>" +
      '<div class="pr">' + money(u.price) + "</div>" +
      '<div class="nm">' + u.year + " " + u.brand + " " + keepModel(u.model) + "</div>" +
      '<div class="meta">' + t("opt." + u.category) + " · " + t("opt." + u.style) + "</div></a>" +
      '<a class="model-link" href="' + BASE + "/models/" + u.modelSlug + '">' + t("viewModel").replace("{model}", keepModel(u.model)) + "</a></article>";
  }

  function matches(u, f) {
    if (f.q) {
      var hay = (u.year + " " + u.brand + " " + u.model + " " + u.category + " " + u.style + " " + u.stock).toLowerCase();
      if (hay.indexOf(f.q) === -1) return false;
    }
    if (f.condition && u.condition !== f.condition) return false;
    if (f.category === "Off-road" && u.category !== "ATV" && u.category !== "Side-by-Side") return false;
    if (f.category === "Water" && u.category !== "PWC" && u.category !== "Boat") return false;
    if (f.category && f.category !== "Off-road" && f.category !== "Water" && u.category !== f.category) return false;
    if (f.brand && u.brandSlug !== f.brand) return false;
    if (f.brand && f.model && u.modelSlug !== f.model) return false;
    if (f.style && u.style !== f.style) return false;
    if (f.min && u.price < Number(f.min)) return false;
    if (f.max && u.price > Number(f.max)) return false;
    return true;
  }

  function crumbs(parts) {
    var html = '<nav class="crumbs" aria-label="' + t("crumbs") + '"><a href="' + BASE + '/inventory">' + t("inv.h") + "</a>";
    parts.forEach(function (p, i) {
      var last = i === parts.length - 1;
      html += '<span class="sep" aria-hidden="true">/</span>';
      if (!last && p.href) html += '<a href="' + p.href + '">' + keepModel(p.label) + "</a>";
      else html += '<span class="here">' + keepModel(p.label) + "</span>";
    });
    return html + "</nav>";
  }

  function openForm(kind) {
    var titles = { approve: t("approve"), trade: t("trade") };
    var modalEl = document.getElementById("modal");
    var form = document.getElementById("lead");
    if (!modalEl || !form) return;
    form.hidden = false;
    form.reset();
    modalEl.querySelector(".thanks").hidden = true;
    modalEl.querySelector("h2").textContent = titles[kind] || t("note");
    modalEl.hidden = false;
    var input = form.querySelector("input");
    if (input) input.focus();
  }

  function onClick(event) {
    var langBtn = event.target.closest("[data-lang]");
    if (langBtn) {
      event.preventDefault();
      var next = langBtn.getAttribute("data-lang");
      if ((next === "en" || next === "es") && next !== lang()) {
        try { localStorage.setItem(LANG_KEY, next); } catch (e) {}
        render();
      }
      return;
    }
    var foldBtn = event.target.closest("[data-fold]");
    if (foldBtn) {
      foldBtn.setAttribute("data-open", "1");
      layoutFolds();
      return;
    }
    var menu = event.target.closest(".menu");
    if (menu) {
      var drawer = document.getElementById("drawer");
      if (!drawer) return;
      var open = drawer.classList.toggle("open");
      menu.setAttribute("aria-expanded", open ? "true" : "false");
      syncReach();
      return;
    }
    var locToggle = event.target.closest("[data-loc-toggle]");
    if (locToggle) {
      event.preventDefault();
      var list = document.getElementById("loc-drop-list");
      var open = list && list.hidden;
      if (list) list.hidden = !open;
      locToggle.setAttribute("aria-expanded", open ? "true" : "false");
      return;
    }
    var pin = event.target.closest("[data-pin]");
    if (pin) {
      event.preventDefault();
      var id = pin.getAttribute("data-pin");
      if (id && id !== place().id) {
        try { localStorage.setItem(LOC_KEY, id); } catch (e) {}
        render();
      }
      return;
    }
    var dot = event.target.closest("[data-special]");
    if (dot) {
      var track = document.getElementById("specials-track");
      if (track) track.scrollTo({ left: Number(dot.getAttribute("data-special")) * track.clientWidth, behavior: motion() });
      return;
    }
    var opener = event.target.closest("[data-open]");
    if (opener) {
      event.preventDefault();
      openForm(opener.getAttribute("data-open"));
      return;
    }
    var modalEl = document.getElementById("modal");
    if (modalEl && (event.target === modalEl || event.target.closest("[data-close]"))) modalEl.hidden = true;
  }

  function applyFilters() {
    var form = document.getElementById("filters");
    if (!form) return;
    var data = new FormData(form);
    var next = {};
    ["q", "condition", "category", "brand", "model", "style", "min", "max", "sort"].forEach(function (k) {
      next[k] = data.get(k) || "";
    });
    if (!next.brand) next.model = "";
    location.href = inv(next);
  }

  function syncHeader() {
    var bar = document.querySelector("header.top");
    if (!bar) return;
    var page = document.body.getAttribute("data-page");
    var overHero = document.body.classList.contains("home") || page === "brand" || page === "model";
    bar.classList.toggle("is-solid", !overHero || window.scrollY > 12);
  }

  function bindOnce() {
    if (bound) return;
    bound = true;
    document.body.addEventListener("click", onClick);
    document.body.addEventListener("change", function (event) {
      var sel = event.target.closest && event.target.closest("[data-loc]");
      if (!sel) return;
      if (sel.value === place().id) return;
      try { localStorage.setItem(LOC_KEY, sel.value); } catch (e) {}
      render();
    });
    document.body.addEventListener("submit", function (event) {
      if (event.target && event.target.id === "lead") {
        event.preventDefault();
        event.target.hidden = true;
        var thanks = document.querySelector("#modal .thanks");
        if (thanks) thanks.hidden = false;
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      var modalEl = document.getElementById("modal");
      if (modalEl) modalEl.hidden = true;
    });
    window.addEventListener("scroll", function () { syncHeader(); syncReach(); }, { passive: true });
    window.addEventListener("resize", function () {
      layoutFolds();
      syncSlider();
      syncStyleSlider();
      syncLotSlider();
      sizeLocationMap();
      syncReach();
    });
    var styleRow = document.getElementById("styles");
    var stylePrev = document.getElementById("style-prev");
    var styleNext = document.getElementById("style-next");
    if (stylePrev && styleNext && styleRow) {
      stylePrev.addEventListener("click", function () { styleStep(-1); });
      styleNext.addEventListener("click", function () { styleStep(1); });
      styleRow.addEventListener("scroll", syncStyleSlider, { passive: true });
      var drag = null;
      styleRow.addEventListener("pointerdown", function (event) {
        if (event.pointerType === "touch") return;
        drag = { x: event.clientX, left: styleRow.scrollLeft, id: event.pointerId };
        styleRow.setPointerCapture(event.pointerId);
      });
      styleRow.addEventListener("pointermove", function (event) {
        if (!drag || drag.id !== event.pointerId) return;
        styleRow.scrollLeft = drag.left - (event.clientX - drag.x);
      });
      styleRow.addEventListener("pointerup", function () { drag = null; });
      styleRow.addEventListener("pointercancel", function () { drag = null; });
    }
    var lotPrev = document.getElementById("lot-prev");
    var lotNext = document.getElementById("lot-next");
    var lotRow = document.getElementById("lot");
    if (lotPrev && lotNext && lotRow) {
      lotPrev.addEventListener("click", function () { lotStep(-1); });
      lotNext.addEventListener("click", function () { lotStep(1); });
      lotRow.addEventListener("scroll", syncLotSlider, { passive: true });
    }
    var tradeForm = document.getElementById("trade-form");
    if (tradeForm) tradeForm.addEventListener("submit", function (event) {
      event.preventDefault();
      tradeForm.hidden = true;
      var lead = document.getElementById("trade-lead");
      if (lead) lead.hidden = true;
      var thanks = document.getElementById("trade-thanks");
      if (thanks) thanks.hidden = false;
    });
    var search = document.getElementById("hero-search");
    if (search) search.addEventListener("submit", function (event) {
      event.preventDefault();
      location.href = inv({ q: new FormData(search).get("q") });
    });
    var prev = document.getElementById("cat-prev");
    var next = document.getElementById("cat-next");
    var row = document.getElementById("cats");
    if (prev && next && row) {
      prev.addEventListener("click", function () { sliderStep(-1); });
      next.addEventListener("click", function () { sliderStep(1); });
      row.addEventListener("scroll", syncSlider);
    }
    var filterOpen = document.getElementById("filter-open");
    var filterClose = document.getElementById("filter-close");
    var filterBack = document.getElementById("filter-backdrop");
    function setFilterSheet(open) {
      var form = document.getElementById("filters");
      if (!form) return;
      form.classList.toggle("is-open", open);
      document.body.classList.toggle("filters-open", open);
      if (filterOpen) filterOpen.setAttribute("aria-expanded", open ? "true" : "false");
    }
    if (filterOpen) filterOpen.addEventListener("click", function () { setFilterSheet(true); });
    if (filterClose) filterClose.addEventListener("click", function () { setFilterSheet(false); });
    if (filterBack) filterBack.addEventListener("click", function () { setFilterSheet(false); });
    var filters = document.getElementById("filters");
    if (filters) {
      filters.addEventListener("change", function (event) {
        if (event.target && event.target.id === "brand") {
          var model = document.getElementById("model");
          if (model) model.value = "";
        }
        applyFilters();
      });
      filters.addEventListener("submit", function (event) {
        event.preventDefault();
        applyFilters();
      });
    }
  }

  function setLeadText(el, text) {
    if (!el) return;
    var node = el.firstChild;
    while (node && node.nodeType !== 3) node = node.nextSibling;
    if (node) node.nodeValue = text + " ";
  }

  function translateOptions() {
    document.querySelectorAll("select option").forEach(function (opt) {
      if (!opt.hasAttribute("data-en")) {
        var raw = (opt.textContent || "").replace(/\s+/g, " ").trim();
        if (!COPY.en.opt[raw]) return;
        if (opt.getAttribute("value") == null) opt.setAttribute("value", opt.value);
        opt.setAttribute("data-en", raw);
      }
      var key = opt.getAttribute("data-en");
      if (COPY.en.opt[key]) opt.textContent = t("opt." + key);
    });
  }

  function applyStatic() {
    var page = document.body.getAttribute("data-page");
    if (page === "home") {
      var statement = document.querySelector(".hero h1");
      if (statement) statement.textContent = t("hero.statement");
      var input = document.querySelector("#hero-search input");
      if (input) {
        input.placeholder = t("hero.ph");
        input.setAttribute("aria-label", t("hero.aria"));
      }
      var searchBtn = document.querySelector("#hero-search button");
      if (searchBtn) searchBtn.textContent = t("search");
      var media = window.BROWARD.media || {};
      function useSrc(el, file) {
        if (!el || !file) return;
        var url = img(file);
        if (el.getAttribute("src") !== url) el.setAttribute("src", url);
      }
      var poster = document.querySelector(".hero-media img");
      if (poster && media.heroPoster) {
        useSrc(poster, media.heroPoster);
        poster.alt = t("hero.alt");
      }
      var video = document.querySelector(".hero-media video");
      if (video && media.heroPoster) video.setAttribute("poster", img(media.heroPoster));
      var sources = video ? video.querySelectorAll("source") : [];
      if (sources[0]) useSrc(sources[0], media.heroVideoMobile);
      if (sources[1]) useSrc(sources[1], media.heroVideo);
      useSrc(document.querySelector(".shop-tile.new img"), media.tileNew);
      useSrc(document.querySelector(".shop-tile.used img"), media.tileUsed);
      var chipKeys = ["chip.moto", "chip.sxs", "chip.atv", "chip.pwc", "chip.golf"];
      document.querySelectorAll(".chips .chip").forEach(function (chip, i) {
        if (chipKeys[i]) chip.textContent = t(chipKeys[i]);
      });
      var headIds = {
        "sec-cat": "h.cat",
        "sec-brand": "h.brand",
        "sec-style": "h.style",
        "sec-lot": "h.lot",
        "sec-specials": "h.specials",
        "sec-approve": "h.approve",
        "sec-trade": "h.trade",
        "sec-locations": "h.visit"
      };
      Object.keys(headIds).forEach(function (id) {
        var h = document.querySelector("#" + id + " h2");
        if (h) h.textContent = t(headIds[id]);
      });
      var more = document.getElementById("lot-all");
      if (more) more.textContent = t("seeSample");
      var shopNew = document.querySelector(".shop-tile.new span");
      var shopUsed = document.querySelector(".shop-tile.used span");
      if (shopNew) shopNew.textContent = t("shopNew");
      if (shopUsed) shopUsed.textContent = t("shopUsed");
      var approveList = document.getElementById("approve-points");
      var approvePoints = t("approvePoints");
      if (approveList && approvePoints && approvePoints.join) {
        approveList.innerHTML = approvePoints.map(function (line) { return "<li>" + line + "</li>"; }).join("");
      }
      var approveBtn = document.querySelector("#sec-approve button");
      if (approveBtn) approveBtn.textContent = t("h.approve");
      var rider = document.getElementById("approve-photo");
      if (rider && window.BROWARD.media.approve) {
        rider.src = img(window.BROWARD.media.approve);
        rider.alt = t("approveAlt");
      }
      var tradeLead = document.getElementById("trade-lead");
      if (tradeLead) tradeLead.textContent = t("tradeLead");
      [["trade-name", "tradeName"], ["trade-contact", "tradeContact"], ["trade-make", "tradeMake"], ["trade-year", "tradeYear"], ["trade-vin", "tradeVin"]].forEach(function (pair) {
        var label = document.getElementById(pair[0]);
        if (!label) return;
        var text = label.childNodes[0];
        if (text) text.textContent = t(pair[1]) + " ";
      });
      var tradeSubmit = document.getElementById("trade-submit");
      if (tradeSubmit) tradeSubmit.textContent = t("tradeSubmit");
      var tradeThanks = document.getElementById("trade-thanks");
      if (tradeThanks) tradeThanks.textContent = t("tradeThanks");
    }
    if (page === "inventory") {
      document.title = t("inv.title") + " · " + DEALER.name;
      var h1 = document.querySelector("main.page > h1");
      if (h1) h1.textContent = t("inv.h");
      var fields = {
        q: "inv.search",
        condition: "inv.condition",
        category: "inv.category",
        brand: "inv.brand",
        style: "inv.style",
        model: "inv.model",
        min: "inv.min",
        max: "inv.max",
        sort: "inv.sort"
      };
      Object.keys(fields).forEach(function (id) {
        var field = document.getElementById(id);
        if (field) setLeadText(field.parentElement, t(fields[id]));
      });
      var q = document.getElementById("q");
      if (q) q.placeholder = t("inv.ph");
      var update = document.querySelector("#filters button[type=submit]");
      if (update) update.textContent = t("inv.update");
      var filterOpen = document.getElementById("filter-open");
      if (filterOpen) filterOpen.textContent = t("inv.filters");
      var filterTitle = document.getElementById("filter-title");
      if (filterTitle) filterTitle.textContent = t("inv.filters");
      var filterClose = document.getElementById("filter-close");
      if (filterClose) filterClose.textContent = t("close");
      translateOptions();
    }
    if (!page) {
      var creditH = document.querySelector("main.page > h1");
      if (creditH) creditH.textContent = t("creditsH");
      var back = document.querySelector('main.page a[href="/demos/broward-motorsports/"]');
      if (back) back.textContent = t("creditsBack");
    }
  }

  var BRAND_IMG = {};
  window.BROWARD.brands.forEach(function (b) { BRAND_IMG[b.slug] = b.img; });
  var LOT_PICK = window.BROWARD.featured;

  function countOf(key, value) {
    return UNITS.filter(function (u) { return u[key] === value; }).length;
  }
  function oneEach(list) {
    var chosen = {};
    list.forEach(function (u) {
      var prev = chosen[u.img];
      if (!prev || (u.vin && !prev.vin)) chosen[u.img] = u;
    });
    var seen = {};
    return list.filter(function (u) {
      if (seen[u.img] || chosen[u.img] !== u) return false;
      seen[u.img] = true;
      return true;
    });
  }
  function colCount(el) {
    var parts = getComputedStyle(el).gridTemplateColumns.split(" ").filter(function (p) { return p && p !== "none"; });
    return parts.length || 1;
  }
  function layoutFolds() {
    [["brands", "brands-more"]].forEach(function (pair) {
      var container = document.getElementById(pair[0]);
      var btn = document.getElementById(pair[1]);
      if (!container || !btn) return;
      var items = Array.prototype.filter.call(container.children, function (el) { return el.tagName === "A"; });
      var cols = colCount(container);
      var full = items.length < cols ? items.length : Math.floor(items.length / cols) * cols;
      var open = btn.getAttribute("data-open") === "1";
      items.forEach(function (el, i) { el.hidden = !open && i >= full; });
      var hideBtn = open || full === items.length;
      btn.hidden = hideBtn;
      btn.textContent = t("showMore");
      if (btn.parentElement) btn.parentElement.hidden = hideBtn;
    });
  }
  function syncSlider() {
    var row = document.getElementById("cats");
    var prev = document.getElementById("cat-prev");
    var next = document.getElementById("cat-next");
    if (!row || !prev || !next) return;
    var max = row.scrollWidth - row.clientWidth;
    prev.disabled = row.scrollLeft <= 2;
    next.disabled = max <= 2 || row.scrollLeft >= max - 2;
    prev.setAttribute("aria-label", t("prev"));
    next.setAttribute("aria-label", t("next"));
  }
  function sliderStep(dir) {
    var row = document.getElementById("cats");
    if (!row) return;
    var card = row.querySelector(".tile");
    var width = card ? card.getBoundingClientRect().width + 16 : Math.round(row.clientWidth * 0.8);
    row.scrollBy({ left: dir * width, behavior: motion() });
  }
  function motion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  }
  function syncStyleSlider() {
    var row = document.getElementById("styles");
    var prev = document.getElementById("style-prev");
    var next = document.getElementById("style-next");
    if (!row || !prev || !next) return;
    var max = row.scrollWidth - row.clientWidth;
    prev.disabled = row.scrollLeft <= 2;
    next.disabled = max <= 2 || row.scrollLeft >= max - 2;
    prev.setAttribute("aria-label", t("prev"));
    next.setAttribute("aria-label", t("next"));
  }
  function styleStep(dir) {
    var row = document.getElementById("styles");
    if (!row) return;
    var card = row.querySelector(".style-card");
    var width = card ? card.getBoundingClientRect().width + 16 : Math.round(row.clientWidth * 0.8);
    row.scrollBy({ left: dir * width, behavior: motion() });
  }
  function pageSections() {
    var list = [];
    document.querySelectorAll("section.hero, section.brand-hero, section.model-hero, main > section, #main > section").forEach(function (node) {
      if (list.indexOf(node) === -1) list.push(node);
    });
    return list;
  }
  function syncReach() {
    var reach = document.querySelector(".reach");
    if (!reach) return;
    var gate = pageSections()[2];
    var drawer = document.getElementById("drawer");
    var menuOpen = drawer && drawer.classList.contains("open");
    var show = gate
      ? gate.getBoundingClientRect().top < window.innerHeight - 12
      : window.scrollY > window.innerHeight * 0.55;
    if (menuOpen) show = false;
    reach.classList.toggle("is-in", show);
    reach.setAttribute("aria-hidden", show ? "false" : "true");
  }
  function applyTheme() {
    var colors = DEALER.colors || {};
    var root = document.documentElement;
    Object.keys(colors).forEach(function (key) {
      root.style.setProperty("--" + key, colors[key]);
    });
  }

  function home() {
    var cats = window.BROWARD.categories.filter(function (c) { return countOf("category", c.id) > 0; });
    document.getElementById("cats").innerHTML = cats.map(function (c) {
      var n = countOf("category", c.id);
      return '<a class="tile" href="' + inv({ category: c.id }) + '"><img src="' + img(c.img) + '" alt=""><div><b>' + t(c.label) + "</b><small>" + n + " " + t("inSample") + "</small></div></a>";
    }).join("");

    document.getElementById("brands").innerHTML = window.BROWARD.brands.map(function (b) {
      return '<a class="brand" href="' + BASE + "/brands/" + b.slug + '"><span>' + b.name + '</span><img src="' + img(b.img) + '" alt=""></a>';
    }).join("");

    var styles = window.BROWARD.styles.filter(function (s) { return countOf("style", s.id) > 0; });
    document.getElementById("styles").innerHTML = styles.map(function (s) {
      var label = lang() === "es" ? s.es : s.en;
      return '<a class="style-card" href="' + inv({ style: s.id }) + '"><img src="' + img(s.img) + '" alt=""><span>' + label + "</span></a>";
    }).join("");
    syncStyleSlider();

    var lot = document.getElementById("lot");
    if (lot) lot.innerHTML = LOT_PICK.map(findUnit).filter(Boolean).map(card).join("");
    paintSpecials();
    paintLocations();
    layoutFolds();
    syncSlider();
    syncLotSlider();
    startSpecials();
  }

  function syncLotSlider() {
    var row = document.getElementById("lot");
    var prev = document.getElementById("lot-prev");
    var next = document.getElementById("lot-next");
    if (!row || !prev || !next) return;
    var max = row.scrollWidth - row.clientWidth;
    prev.disabled = row.scrollLeft <= 2;
    next.disabled = max <= 2 || row.scrollLeft >= max - 2;
    prev.setAttribute("aria-label", t("prev"));
    next.setAttribute("aria-label", t("next"));
  }
  function lotStep(dir) {
    var row = document.getElementById("lot");
    if (!row) return;
    var cardEl = row.querySelector(".card");
    var width = cardEl ? cardEl.getBoundingClientRect().width + 14 : Math.round(row.clientWidth * 0.8);
    row.scrollBy({ left: dir * width, behavior: motion() });
  }
  function paintSpecials() {
    var track = document.getElementById("specials-track");
    var dots = document.getElementById("specials-dots");
    if (!track || !dots) return;
    var items = window.BROWARD.specials || [];
    track.innerHTML = items.map(function (s) {
      return '<a href="' + inv({ brand: s.brand }) + '"><img src="' + img(s.img) + '" alt="' + s.alt + '"></a>';
    }).join("");
    dots.innerHTML = items.map(function (_, i) {
      return '<button type="button" data-special="' + i + '" aria-label="' + (i + 1) + '"' + (i === 0 ? ' aria-current="true"' : "") + "></button>";
    }).join("");
  }
  var specialsTimer = 0;
  function startSpecials() {
    var track = document.getElementById("specials-track");
    if (!track || specialsTimer) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    track.addEventListener("scroll", function () {
      var w = track.clientWidth || 1;
      var i = Math.round(track.scrollLeft / w);
      document.querySelectorAll("#specials-dots button").forEach(function (btn, idx) {
        if (idx === i) btn.setAttribute("aria-current", "true");
        else btn.removeAttribute("aria-current");
      });
    }, { passive: true });
    specialsTimer = window.setInterval(function () {
      var n = track.children.length;
      var w = track.clientWidth;
      if (!n || !w) return;
      var i = Math.round(track.scrollLeft / w);
      track.scrollTo({ left: ((i + 1) % n) * w, behavior: "smooth" });
    }, 4200);
  }
  function sizeLocationMap() {
    var map = document.getElementById("loc-map");
    var frame = map && map.querySelector("iframe");
    var wrap = map && map.querySelector(".loc-frame");
    if (!map || !frame) return;
    var w = map.clientWidth;
    var h = map.clientHeight;
    if (wrap) {
      wrap.style.width = w + "px";
      wrap.style.height = h + "px";
    }
    frame.style.width = w + "px";
    frame.style.height = h + "px";
  }
  function paintLocations() {
    var chips = document.getElementById("loc-chips");
    var map = document.getElementById("loc-map");
    var detail = document.getElementById("loc-detail");
    if (!chips || !map || !detail) return;
    var current = place();
    var locs = window.BROWARD.locations || [];
    chips.innerHTML = locs.map(function (loc) {
      return '<button type="button" data-pin="' + loc.id + '" aria-pressed="' + (loc.id === current.id ? "true" : "false") + '">' + loc.name + "</button>";
    }).join("");
    var drop = document.getElementById("loc-drop");
    if (drop) {
      var label = current.name;
      drop.innerHTML = '<button type="button" class="loc-drop-btn" data-loc-toggle aria-expanded="false" aria-controls="loc-drop-list">' +
        "<span>" + label + "</span>" +
        '<svg viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.2 6 6.2 11 1.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<div class="loc-drop-list" id="loc-drop-list" hidden>' +
        locs.map(function (loc) {
          return '<button type="button" data-pin="' + loc.id + '"' + (loc.id === current.id ? ' aria-current="true"' : "") + ">" + loc.name + "</button>";
        }).join("") + "</div>";
    }
    var mapSrc = "https://maps.google.com/maps?q=" + encodeURIComponent(current.address) + "&z=14&hl=" + (lang() === "es" ? "es" : "en") + "&output=embed";
    map.innerHTML = '<div class="loc-frame"><iframe title="' + current.name + '" src="' + mapSrc + '" referrerpolicy="no-referrer-when-downgrade"></iframe></div>';
    sizeLocationMap();
    var frame = map.querySelector("iframe");
    if (frame) frame.addEventListener("load", sizeLocationMap);
    var href = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(current.address);
    detail.innerHTML = "<h3>" + current.name + "</h3><p>" + current.address + "</p><p>" + hoursNow() + '</p><p><a class="btn rd" target="_blank" rel="noopener noreferrer" href="' + href + '">' + t("maps") + "</a></p>";
  }

  function inventory() {
    var params = new URLSearchParams(location.search);
    var f = {
      q: (params.get("q") || "").trim().toLowerCase(),
      condition: params.get("condition") || "",
      category: params.get("category") || "",
      brand: params.get("brand") || "",
      model: params.get("model") || "",
      style: params.get("style") || "",
      min: params.get("min") || "",
      max: params.get("max") || "",
      sort: params.get("sort") || ""
    };
    ["category", "style"].forEach(function (id) {
      var sel = document.getElementById(id);
      if (!sel) return;
      Array.prototype.forEach.call(sel.options, function (opt) {
        var val = opt.value;
        if (!val || val === "Off-road" || val === "Water") return;
        var n = countOf(id === "category" ? "category" : "style", val);
        opt.hidden = n === 0;
        opt.disabled = n === 0;
      });
    });
    document.getElementById("q").value = params.get("q") || "";
    ["condition", "category", "brand", "style", "sort", "min", "max"].forEach(function (k) {
      var el = document.getElementById(k);
      if (el && f[k]) el.value = f[k];
    });
    var modelWrap = document.getElementById("model-wrap");
    var modelSel = document.getElementById("model");
    if (f.brand) {
      modelWrap.classList.remove("hidden");
      var opts = '<option value="">' + t("inv.anyModel") + "</option>" + modelsOf(f.brand).map(function (u) {
        return '<option value="' + u.modelSlug + '">' + u.model + "</option>";
      }).join("");
      modelSel.innerHTML = opts;
      if (f.model) modelSel.value = f.model;
    } else {
      modelWrap.classList.add("hidden");
      f.model = "";
    }
    var rows = UNITS.filter(function (u) { return matches(u, f); });
    if (f.sort === "price-asc") rows.sort(function (a, b) { return a.price - b.price; });
    if (f.sort === "price-desc") rows.sort(function (a, b) { return b.price - a.price; });
    if (f.sort === "year") rows.sort(function (a, b) { return b.year - a.year; });
    document.getElementById("count").textContent = rows.length + " " + (rows.length === 1 ? t("inv.one") : t("inv.many"));
    document.getElementById("results").innerHTML = rows.map(card).join("") || "<p>" + t("inv.empty") + "</p>";
  }

  function brandPage() {
    var key = routeKey("brands", "brand");
    var configured = window.BROWARD.brands.filter(function (b) { return b.slug === key; })[0];
    var sample = byBrand(key)[0];
    var root = document.getElementById("main");
    if (!sample && !configured) {
      root.innerHTML = '<p class="w">' + t("missingBrand") + "</p>";
      return;
    }
    if (!sample) {
      document.title = configured.name + " · " + DEALER.name;
      root.innerHTML =
        '<section class="brand-hero"><img src="' + img(configured.img) + '" alt="">' +
        '<div class="w"><div class="crumbs-wrap">' + crumbs([{ label: configured.name }]) + "</div>" +
        '<p class="eyebrow">' + configured.name + "</p><h1>" + configured.name + " " + t("inCity").replace("{city}", place().name) + "</h1>" +
        "<p>0 " + t("inSample") + ".</p></div></section>";
      return;
    }
    var models = modelsOf(key);
    var units = byBrand(key);
    document.title = sample.brand + " · " + DEALER.name;
    root.innerHTML =
      '<section class="brand-hero"><img src="' + img(sample.img) + '" alt="">' +
      '<div class="w"><div class="crumbs-wrap">' + crumbs([{ label: sample.brand }]) + "</div>" +
      '<p class="eyebrow">' + sample.brand + "</p><h1>" + sample.brand + " " + t("inCity").replace("{city}", place().name) + "</h1>" +
      "<p>" + units.length + " " + t("inSample") + ". " + t("brandPick") + "</p></div></section>" +
      '<main class="w page"><div class="sh"><h2>' + t("models") + "</h2></div><div class=\"cats\">" +
      models.map(function (u) {
        var n = units.filter(function (x) { return x.modelSlug === u.modelSlug; }).length;
        return '<a class="tile" href="' + BASE + "/models/" + u.modelSlug + '"><img src="' + img(u.img) + '" alt=""><div><b>' + u.model + "</b><small>" + n + " " + t("inStock") + "</small></div></a>";
      }).join("") +
      '</div><div class="sh"><h2>' + t("inStockH") + '</h2><a href="' + inv({ brand: key }) + '">' + t("openSearch") + '</a></div><div class="grid">' +
      oneEach(units).map(card).join("") + "</div></main>";
  }

  function modelPage() {
    var key = routeKey("models", "slug");
    var sample = findModel(key);
    var root = document.getElementById("main");
    if (!sample) {
      root.innerHTML = '<p class="w">' + t("missingModel") + "</p>";
      return;
    }
    var units = UNITS.filter(function (u) { return u.modelSlug === key; });
    var hear = sample.category === "Motorcycle";
    var low = money(Math.min.apply(null, units.map(function (u) { return u.price; })));
    document.title = sample.model + " · " + DEALER.name;
    root.innerHTML =
      '<section class="model-hero"><img src="' + img(sample.img) + '" alt="">' +
      '<div class="w">' + crumbs([
        { label: sample.brand, href: BASE + "/brands/" + sample.brandSlug },
        { label: sample.model }
      ]) +
      '<p class="eyebrow">' + sample.brand + " · " + t("opt." + sample.category) + "</p><h1>" + keepModel(sample.model) + "</h1>" +
      '<div class="specs"><div><b>' + units.length + "</b><span>" + t("inThisSample") + "</span></div><div><b>" + t("opt." + sample.style) + "</b><span>" + t("styleWord") + "</span></div><div><b>" + low + "</b><span>" + t("lowest") + "</span></div></div>" +
      '<a class="btn rd" href="#stock">' + t("seeStock") + '</a> <button class="btn gl" type="button" data-open="approve">' + t("approve") + "</button>" +
      "</div></section>" +
      '<main class="w page"><div class="sh"><h2>' + t("hear") + "</h2><span>" + t("filmed") + "</span></div>" +
      '<div class="sound">' + (hear
        ? '<video data-sound src="' + img(window.BROWARD.media.startup) + '" poster="' + img(window.BROWARD.media.startupPoster) + '" muted autoplay loop playsinline></video><span class="playtag">' + t("startup") + "</span>"
        : '<img src="' + img(sample.img) + '" alt=""><video data-sound poster="' + img(sample.img) + '" muted loop playsinline></video><span class="playtag" data-sound-label>' + t("muted") + '</span><button class="sbtn" type="button" data-sound-btn>' + t("tapSound") + "</button>") +
      '<div class="cap"><b>' + t("walk") + "</b><span>" + t("walkCap") + "</span></div></div>" +
      '<div class="sh" id="stock"><h2>' + t("stockAt") + "</h2><span>" + t("priceIs") + "</span></div><div class=\"grid\">" +
      units.map(card).join("") + "</div>" +
      '<div class="actions">' + contactLinks(null, "labeled") +
      '<button class="btn gl" type="button" data-open="approve">' + t("approve") + "</button>" +
      '<button class="btn gl" type="button" data-open="trade">' + t("trade") + "</button></div></main>";
    var video = document.querySelector("[data-sound]");
    var btn = document.querySelector("[data-sound-btn]");
    var soundLabel = document.querySelector("[data-sound-label]");
    if (video && video.getAttribute("src")) {
      var play = video.play();
      if (play && play.catch) play.catch(function () {});
    }
    if (btn && video) btn.addEventListener("click", function () {
      video.muted = !video.muted;
      if (!video.muted) {
        var again = video.play();
        if (again && again.catch) again.catch(function () {});
      }
      soundLabel.textContent = video.muted ? t("muted") : t("soundOn");
      btn.textContent = video.muted ? t("tapSound") : t("tapMute");
    });
  }

  function unitPage() {
    var u = currentUnit();
    var root = document.getElementById("main");
    if (!u) {
      root.innerHTML = '<p class="w">' + t("missingUnit") + "</p>";
      return;
    }
    document.title = u.year + " " + u.brand + " " + u.model + " · " + DEALER.name;
    var vin = u.vin ? "<div><span>VIN</span>" + u.vin + "</div>" : "";
    root.innerHTML = '<main class="w page">' + crumbs([
      { label: u.brand, href: BASE + "/brands/" + u.brandSlug },
      { label: u.model, href: BASE + "/models/" + u.modelSlug },
      { label: u.year + " " + u.model }
    ]) +
      '<div class="gallery"><div class="heroimg"><img src="' + img(u.img) + '" alt="' + u.year + " " + u.brand + " " + u.model + '"></div></div>' +
      '<p class="eyebrow">' + t("opt." + u.condition) + " · " + t("opt." + u.category) + "</p>" +
      "<h1>" + u.year + " " + u.brand + " " + keepModel(u.model) + "</h1>" +
      '<p class="price-lg">' + money(u.price) + "</p>" +
      '<div class="facts">' +
      "<div><span>" + t("year") + "</span>" + u.year + "</div>" +
      "<div><span>" + t("brand") + "</span>" + u.brand + "</div>" +
      "<div><span>" + t("model") + "</span>" + u.model + "</div>" +
      "<div><span>" + t("styleWord") + "</span>" + t("opt." + u.style) + "</div>" +
      "<div><span>" + t("stock") + "</span>" + u.stock + "</div>" +
      vin +
      "<div><span>" + t("location") + "</span>" + place().city + "</div></div>" +
      '<div class="actions">' + contactLinks(u, "labeled") +
      '<button class="btn gl" type="button" data-open="approve">' + t("approve") + "</button>" +
      '<button class="btn gl" type="button" data-open="trade">' + t("trade") + "</button></div></main>";
  }

  function render() {
    document.documentElement.lang = lang() === "es" ? "es" : "en";
    document.getElementById("top").innerHTML = header();
    document.getElementById("bottom").innerHTML = footer() + reach() + modal();
    var page = document.body.getAttribute("data-page");
    if (page === "home") home();
    if (page === "inventory") inventory();
    if (page === "brand") brandPage();
    if (page === "model") modelPage();
    if (page === "unit") unitPage();
    applyStatic();
    bindOnce();
    applyTheme();
    syncHeader();
    syncReach();
    syncStyleSlider();
  }

  render();
})();
