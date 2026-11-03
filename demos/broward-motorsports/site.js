(function () {
  var BASE = "/demos/broward-motorsports";
  var SALES = "9544369905";
  var LANG_KEY = "broward-lang";
  var bound = false;

  var COPY = {
    en: {
      menu: "Menu",
      lang: "Language",
      wa: "WhatsApp",
      sms: "Text",
      approve: "Get pre-approved",
      trade: "Value your trade",
      start: "Start",
      search: "Search",
      showMore: "Show more",
      prev: "Previous",
      next: "Next",
      close: "Close",
      note: "Send a note",
      nav: { moto: "Motorcycles", off: "Off-Road", water: "Water", used: "Pre-owned", fin: "Financing", service: "Service" },
      msg: { generic: "Hi, I have a question about a vehicle" },
      footer: { hours: "Mon–Sat 9–7", concept: "Concept redesign by", credits: "Image credits" },
      form: {
        name: "Name",
        contact: "Phone or email",
        note: "Note",
        send: "Send",
        thanks: "Thanks. This stayed on the page. A person at the desk would take it from here."
      },
      hero: {
        eyebrow: "Hollywood, Florida · 4101 Davie Road Ext.",
        lead: 'ATVs, motorcycles and <span class="keep">side-by-sides</span>',
        line: "in Hollywood, FL.",
        sub: "386 new and 37 pre-owned on the lot.",
        ph: "Search Ninja, RZR, Outlander, golf carts…",
        aria: "Search the lot"
      },
      chip: { moto: "Motorcycles", sxs: "Side-by-Sides", atv: "ATVs", pwc: "PWC", boat: "Boats", golf: "Golf Carts" },
      h: { cat: "Shop by category", brand: "Shop by brand", style: "Shop by style", lot: "On the lot now" },
      seeSample: "See this sample",
      lot: { fresh: "386 on the lot", used: "37 on the lot" },
      inSample: "in this sample",
      box: {
        approveH: "Get pre-approved",
        approveP: "Tell us who you are. This concept keeps the note on the page.",
        tradeH: "Value your trade",
        tradeP: "Year, make, and model are enough for a first look.",
        visitH: "Visit the store",
        visitP: "4101 Davie Road Ext., Hollywood, FL 33024. Mon–Sat 9–7.",
        visitCta: "Browse the sample lot"
      },
      inv: {
        h: "Inventory",
        title: "Inventory",
        search: "Search",
        ph: "Name, brand, stock",
        condition: "Condition",
        category: "Category",
        brand: "Brand",
        style: "Style",
        model: "Model",
        anyModel: "Any model",
        min: "Min price",
        max: "Max price",
        sort: "Sort",
        update: "Update",
        one: "unit",
        many: "units",
        empty: "Nothing in this sample matches."
      },
      opt: {
        Any: "Any",
        New: "New",
        "Pre-owned": "Pre-owned",
        ATV: "ATV",
        Motorcycle: "Motorcycle",
        "Side-by-Side": "Side-by-Side",
        "Golf Cart": "Golf Cart",
        PWC: "PWC",
        Boat: "Boat",
        "Off-road": "Off-road",
        Water: "Water",
        Cruiser: "Cruiser",
        Sport: "Sport",
        Adventure: "Adventure",
        Dirt: "Dirt",
        Utility: "Utility",
        "Sport side-by-side": "Sport side-by-side",
        Featured: "Featured",
        "Price, low to high": "Price, low to high",
        "Price, high to low": "Price, high to low",
        "Newest year": "Newest year"
      },
      viewModel: "View the {model} model",
      crumbs: "Breadcrumb",
      inHollywood: "in Hollywood",
      brandPick: "Pick a model, or scroll to every unit.",
      models: "Models",
      inStock: "in stock",
      inStockH: "In stock",
      openSearch: "Open in search",
      missingBrand: "That brand is not in this sample.",
      missingModel: "That model is not in this sample.",
      missingUnit: "That unit is not in this sample.",
      inThisSample: "In this sample",
      styleWord: "Style",
      lowest: "Lowest price here",
      seeStock: "See what is in stock",
      hear: "Hear it start",
      filmed: "Filmed on our lot",
      startup: "Startup",
      muted: "Playing muted",
      soundOn: "Sound on",
      tapSound: "Tap for sound",
      tapMute: "Tap to mute",
      walk: "Walk-up, start, rev",
      walkCap: "Walk-up, start, rev. Filmed on our lot.",
      stockAt: "In stock at Broward",
      priceIs: "Price shown is the price",
      year: "Year",
      brand: "Brand",
      model: "Model",
      stock: "Stock",
      location: "Location",
      creditsH: "Image credits",
      creditsBack: "Back to the concept"
    },
    es: {
      menu: "Menú",
      lang: "Idioma",
      wa: "WhatsApp",
      sms: "Texto",
      approve: "Pide preaprobación",
      trade: "Cotiza tu intercambio",
      start: "Empezar",
      search: "Buscar",
      showMore: "Ver más",
      prev: "Anterior",
      next: "Siguiente",
      close: "Cerrar",
      note: "Enviar una nota",
      nav: { moto: "Motos", off: "Todoterreno", water: "Agua", used: "Usados", fin: "Financiamiento", service: "Servicio" },
      msg: { generic: "Hola, tengo una pregunta sobre un vehículo" },
      footer: { hours: "Lun–Sáb 9–7", concept: "Rediseño conceptual de", credits: "Créditos de imágenes" },
      form: {
        name: "Nombre",
        contact: "Teléfono o correo",
        note: "Nota",
        send: "Enviar",
        thanks: "Gracias. Esto se quedó en la página. Alguien en el mostrador lo toma desde aquí."
      },
      hero: {
        eyebrow: "Hollywood, Florida · 4101 Davie Road Ext.",
        lead: 'ATV, motos y <span class="keep">side-by-sides</span>',
        line: "en Hollywood, FL.",
        sub: "386 nuevos y 37 usados en el lote.",
        ph: "Busca Ninja, RZR, Outlander, carritos de golf…",
        aria: "Buscar en el lote"
      },
      chip: { moto: "Motos", sxs: "Side-by-Sides", atv: "ATV", pwc: "PWC", boat: "Botes", golf: "Carritos de golf" },
      h: { cat: "Compra por categoría", brand: "Compra por marca", style: "Compra por estilo", lot: "En el lote ahora" },
      seeSample: "Ver esta muestra",
      lot: { fresh: "386 en el lote", used: "37 en el lote" },
      inSample: "en esta muestra",
      box: {
        approveH: "Pide preaprobación",
        approveP: "Cuéntanos quién eres. Este concepto deja la nota en la página.",
        tradeH: "Cotiza tu intercambio",
        tradeP: "Con el año, la marca y el modelo basta para un primer vistazo.",
        visitH: "Visita la tienda",
        visitP: "4101 Davie Road Ext., Hollywood, FL 33024. Lun–Sáb 9–7.",
        visitCta: "Ver el lote de muestra"
      },
      inv: {
        h: "Inventario",
        title: "Inventario",
        search: "Buscar",
        ph: "Nombre, marca, stock",
        condition: "Condición",
        category: "Categoría",
        brand: "Marca",
        style: "Estilo",
        model: "Modelo",
        anyModel: "Cualquier modelo",
        min: "Precio mín.",
        max: "Precio máx.",
        sort: "Ordenar",
        update: "Actualizar",
        one: "unidad",
        many: "unidades",
        empty: "Nada en esta muestra coincide."
      },
      opt: {
        Any: "Cualquiera",
        New: "Nuevo",
        "Pre-owned": "Usado",
        ATV: "ATV",
        Motorcycle: "Moto",
        "Side-by-Side": "Side-by-Side",
        "Golf Cart": "Carrito de golf",
        PWC: "PWC",
        Boat: "Bote",
        "Off-road": "Todoterreno",
        Water: "Agua",
        Cruiser: "Cruiser",
        Sport: "Deportiva",
        Adventure: "Aventura",
        Dirt: "Cross",
        Utility: "Utilitario",
        "Sport side-by-side": "Side-by-side deportivo",
        Featured: "Destacados",
        "Price, low to high": "Precio: menor a mayor",
        "Price, high to low": "Precio: mayor a menor",
        "Newest year": "Año más reciente"
      },
      viewModel: "Ver el modelo {model}",
      crumbs: "Ruta",
      inHollywood: "en Hollywood",
      brandPick: "Elige un modelo o baja hasta cada unidad.",
      models: "Modelos",
      inStock: "en inventario",
      inStockH: "En inventario",
      openSearch: "Abrir en la búsqueda",
      missingBrand: "Esa marca no está en esta muestra.",
      missingModel: "Ese modelo no está en esta muestra.",
      missingUnit: "Esa unidad no está en esta muestra.",
      inThisSample: "En esta muestra",
      styleWord: "Estilo",
      lowest: "Precio más bajo aquí",
      seeStock: "Ver lo que hay en inventario",
      hear: "Escúchalo arrancar",
      filmed: "Grabado en nuestro lote",
      startup: "Arranque",
      muted: "Sin sonido",
      soundOn: "Con sonido",
      tapSound: "Toca para el sonido",
      tapMute: "Toca para silenciar",
      walk: "Te acercas, arranca, acelera",
      walkCap: "Te acercas, arranca y acelera. Grabado en nuestro lote.",
      stockAt: "En inventario en Broward",
      priceIs: "El precio que ves es el precio",
      year: "Año",
      brand: "Marca",
      model: "Modelo",
      stock: "Stock",
      location: "Ubicación",
      creditsH: "Créditos de imágenes",
      creditsBack: "Volver al concepto"
    }
  };

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
  function salesPretty() {
    return "(" + SALES.slice(0, 3) + ") " + SALES.slice(3, 6) + "-" + SALES.slice(6);
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
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M20.5 3.5A11 11 0 0 0 2.1 17.2L1 23l6-1.6A11 11 0 1 0 20.5 3.5zM12 21a9 9 0 0 1-4.6-1.3l-.3-.2-3.5.9.9-3.4-.2-.3A9 9 0 1 1 12 21zm5-6.7c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5.2-.3a.5.5 0 0 0 0-.5c-.1-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4.1c.6.3 1.1.4 1.5.5a3.6 3.6 0 0 0 1.7.1 2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3z"/></svg>';
  }
  function chatSvg() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2z"/></svg>';
  }
  function contactLinks(unit, kind) {
    var msg = encodeURIComponent(contactMessage(unit));
    var wa = "https://wa.me/1" + SALES + "?text=" + msg;
    var sms = "sms:+1" + SALES + "?&body=" + msg;
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
      '<a href="' + BASE + '/#visit">' + t("nav.service") + "</a>";
  }
  function langToggle() {
    var es = lang() === "es";
    return '<div class="lang" role="group" aria-label="' + t("lang") + '">' +
      '<button type="button" data-lang="en" aria-pressed="' + (es ? "false" : "true") + '">EN</button>' +
      '<button type="button" data-lang="es" aria-pressed="' + (es ? "true" : "false") + '">ES</button>' +
      "</div>";
  }
  function header() {
    return '<header class="top"><div class="w hd">' +
      '<a class="logo" href="' + BASE + '/">BROWARD <b>MOTORSPORTS</b></a>' +
      '<button class="menu" type="button" aria-expanded="false" aria-label="' + t("menu") + '">' + t("menu") + "</button>" +
      '<nav class="nav">' + navLinks() + '</nav><div class="sp"></div>' +
      '<div class="hd-tools">' + langToggle() +
      '<button class="btn wh approve" type="button" data-open="approve">' + t("approve") + "</button>" +
      "</div></div></header>" +
      '<div class="drawer w" id="drawer">' + navLinks() +
      '<button class="btn wh" type="button" data-open="approve">' + t("approve") + "</button></div>";
  }
  function footer() {
    return '<footer class="foot"><div class="w">' +
      "Broward Motorsports · 4101 Davie Road Ext., Hollywood, FL 33024 · " + salesPretty() + " · " + t("footer.hours") +
      '<p class="concept">' + t("footer.concept") + ' <a href="https://sethquest.com">Seth Quest</a> · <a href="' + BASE + '/credits.html">' + t("footer.credits") + "</a></p>" +
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
      '<div class="nm">' + u.year + " " + u.brand + " " + u.model + "</div>" +
      '<div class="meta">' + t("opt." + u.category) + " · " + t("opt." + u.style) + "</div></a>" +
      '<a class="model-link" href="' + BASE + "/models/" + u.modelSlug + '">' + t("viewModel").replace("{model}", u.model) + "</a></article>";
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
      html += ' <span aria-hidden="true">/</span> ';
      if (p.href && i < parts.length - 1) html += '<a href="' + p.href + '">' + p.label + "</a>";
      else html += "<span>" + p.label + "</span>";
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
    window.addEventListener("scroll", syncHeader, { passive: true });
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
      window.addEventListener("resize", function () { layoutFolds(); syncSlider(); });
    }
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
      var eyebrow = document.querySelector(".hero .eyebrow");
      if (eyebrow) eyebrow.textContent = t("hero.eyebrow");
      var lead = document.querySelector(".hero h1 .lead");
      if (lead) lead.innerHTML = t("hero.lead");
      var line = document.querySelector(".hero h1 .line");
      if (line) line.textContent = t("hero.line");
      var sub = document.querySelector(".hero .sub");
      if (sub) sub.textContent = t("hero.sub");
      var input = document.querySelector("#hero-search input");
      if (input) {
        input.placeholder = t("hero.ph");
        input.setAttribute("aria-label", t("hero.aria"));
      }
      var searchBtn = document.querySelector("#hero-search button");
      if (searchBtn) searchBtn.textContent = t("search");
      var chipKeys = ["chip.moto", "chip.sxs", "chip.atv", "chip.pwc", "chip.golf"];
      document.querySelectorAll(".chips .chip").forEach(function (chip, i) {
        if (chipKeys[i]) chip.textContent = t(chipKeys[i]);
      });
      var heads = ["h.cat", "h.brand", "h.style", "h.lot"];
      document.querySelectorAll("main .sec h2").forEach(function (h, i) {
        if (heads[i]) h.textContent = t(heads[i]);
      });
      var more = document.querySelector("main .sec .sh a");
      if (more) more.textContent = t("seeSample");
      var fresh = document.querySelector(".wide.new");
      if (fresh) {
        fresh.querySelector("b").textContent = t("opt.New");
        fresh.querySelector("small").textContent = t("lot.fresh");
      }
      var used = document.querySelector(".wide.used");
      if (used) {
        used.querySelector("b").textContent = t("opt.Pre-owned");
        used.querySelector("small").textContent = t("lot.used");
      }
      var boxes = document.querySelectorAll("#visit .box");
      if (boxes.length === 3) {
        boxes[0].querySelector("h3").textContent = t("box.approveH");
        boxes[0].querySelector("p").textContent = t("box.approveP");
        boxes[0].querySelector("button").textContent = t("start");
        boxes[1].querySelector("h3").textContent = t("box.tradeH");
        boxes[1].querySelector("p").textContent = t("box.tradeP");
        boxes[1].querySelector("button").textContent = t("start");
        boxes[2].querySelector("h3").textContent = t("box.visitH");
        boxes[2].querySelector("p").textContent = t("box.visitP");
        boxes[2].querySelector("a").textContent = t("box.visitCta");
      }
    }
    if (page === "inventory") {
      document.title = t("inv.title") + " · Broward Motorsports";
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
      translateOptions();
    }
    if (!page) {
      var creditH = document.querySelector("main.page > h1");
      if (creditH) creditH.textContent = t("creditsH");
      var back = document.querySelector('main.page a[href="/demos/broward-motorsports/"]');
      if (back) back.textContent = t("creditsBack");
    }
  }

  var BRAND_IMG = {
    kawasaki: "brand-kawasaki.jpg",
    yamaha: "brand-yamaha.jpg",
    polaris: "brand-polaris.jpg",
    "can-am": "brand-canam.jpg",
    "harley-davidson": "brand-harley.jpg",
    slingshot: "brand-slingshot.jpg",
    "sea-doo": "brand-seadoo.jpg",
    indian: "brand-indian.jpg",
    italica: "brand-italica.jpg"
  };
  var LOT_PICK = ["bat001407", "but002678", "but001453", "bms2411", "uma017348", "bms-rzr", "bms-mt1", "bms-wr1"];

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
    [["brands", "brands-more"], ["styles", "styles-more"]].forEach(function (pair) {
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
    var width = card ? card.getBoundingClientRect().width + 14 : Math.round(row.clientWidth * 0.8);
    row.scrollBy({ left: dir * width, behavior: "smooth" });
  }

  function home() {
    var cats = [
      ["ATV", "chip.atv", "cat-atv.jpg"],
      ["Motorcycle", "chip.moto", "cat-moto.jpg"],
      ["Side-by-Side", "chip.sxs", "cat-sxs.jpg"],
      ["Golf Cart", "chip.golf", "cat-golf.jpg"],
      ["PWC", "chip.pwc", "cat-pwc.jpg"]
    ].filter(function (c) { return countOf("category", c[0]) > 0; });
    document.getElementById("cats").innerHTML = cats.map(function (c) {
      var n = countOf("category", c[0]);
      return '<a class="tile" href="' + inv({ category: c[0] }) + '"><img src="' + img(c[2]) + '" alt=""><div><b>' + t(c[1]) + "</b><small>" + n + " " + t("inSample") + "</small></div></a>";
    }).join("");

    var brands = {};
    UNITS.forEach(function (u) {
      brands[u.brandSlug] = brands[u.brandSlug] || { name: u.brand, n: 0 };
      brands[u.brandSlug].n += 1;
    });
    var order = ["kawasaki", "yamaha", "polaris", "can-am", "harley-davidson", "slingshot", "sea-doo", "indian", "italica"];
    document.getElementById("brands").innerHTML = order.filter(function (s) { return brands[s]; }).map(function (s) {
      var thumb = BRAND_IMG[s] ? '<img class="thumb" src="' + img(BRAND_IMG[s]) + '" alt="">' : "";
      return '<a class="brand" href="' + BASE + "/brands/" + s + '"><span class="brand-copy"><b>' + brands[s].name + "</b><small>" + brands[s].n + " " + t("inSample") + "</small></span>" + thumb + "</a>";
    }).join("");

    var styles = ["Cruiser", "Sport", "Adventure", "Dirt", "Utility", "Sport side-by-side"].filter(function (s) {
      return countOf("style", s) > 0;
    });
    document.getElementById("styles").innerHTML = styles.map(function (s) {
      var n = countOf("style", s);
      return '<a class="style" href="' + inv({ style: s }) + '"><b>' + t("opt." + s) + "</b><small>" + n + " " + t("inSample") + "</small></a>";
    }).join("");

    document.getElementById("lot").innerHTML = LOT_PICK.map(findUnit).filter(Boolean).map(card).join("");
    layoutFolds();
    syncSlider();
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
    var sample = byBrand(key)[0];
    var root = document.getElementById("main");
    if (!sample) {
      root.innerHTML = '<p class="w">' + t("missingBrand") + "</p>";
      return;
    }
    var models = modelsOf(key);
    var units = byBrand(key);
    document.title = sample.brand + " · Broward Motorsports";
    root.innerHTML =
      '<section class="brand-hero"><img src="' + img(sample.img) + '" alt="">' +
      '<div class="w"><div class="crumbs-wrap">' + crumbs([{ label: sample.brand }]) + "</div>" +
      '<p class="eyebrow">' + sample.brand + "</p><h1>" + sample.brand + " " + t("inHollywood") + "</h1>" +
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
    document.title = sample.model + " · Broward Motorsports";
    root.innerHTML =
      '<section class="model-hero"><img src="' + img(sample.img) + '" alt="">' +
      '<div class="w">' + crumbs([
        { label: sample.brand, href: BASE + "/brands/" + sample.brandSlug },
        { label: sample.model }
      ]) +
      '<p class="eyebrow">' + sample.brand + " · " + t("opt." + sample.category) + "</p><h1>" + sample.model + "</h1>" +
      '<div class="specs"><div><b>' + units.length + "</b><span>" + t("inThisSample") + "</span></div><div><b>" + t("opt." + sample.style) + "</b><span>" + t("styleWord") + "</span></div><div><b>" + low + "</b><span>" + t("lowest") + "</span></div></div>" +
      '<a class="btn rd" href="#stock">' + t("seeStock") + '</a> <button class="btn gl" type="button" data-open="approve">' + t("approve") + "</button>" +
      "</div></section>" +
      '<main class="w page"><div class="sh"><h2>' + t("hear") + "</h2><span>" + t("filmed") + "</span></div>" +
      '<div class="sound">' + (hear
        ? '<video data-sound src="' + BASE + '/img/start.mp4" poster="' + BASE + '/img/start.jpg" muted autoplay loop playsinline></video><span class="playtag">' + t("startup") + "</span>"
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
    document.title = u.year + " " + u.brand + " " + u.model + " · Broward Motorsports";
    var vin = u.vin ? "<div><span>VIN</span>" + u.vin + "</div>" : "";
    root.innerHTML = '<main class="w page">' + crumbs([
      { label: u.brand, href: BASE + "/brands/" + u.brandSlug },
      { label: u.model, href: BASE + "/models/" + u.modelSlug },
      { label: u.year + " " + u.model }
    ]) +
      '<div class="gallery"><div class="heroimg"><img src="' + img(u.img) + '" alt="' + u.year + " " + u.brand + " " + u.model + '"></div></div>' +
      '<p class="eyebrow">' + t("opt." + u.condition) + " · " + t("opt." + u.category) + "</p>" +
      "<h1>" + u.year + " " + u.brand + " " + u.model + "</h1>" +
      '<p class="price-lg">' + money(u.price) + "</p>" +
      '<div class="facts">' +
      "<div><span>" + t("year") + "</span>" + u.year + "</div>" +
      "<div><span>" + t("brand") + "</span>" + u.brand + "</div>" +
      "<div><span>" + t("model") + "</span>" + u.model + "</div>" +
      "<div><span>" + t("styleWord") + "</span>" + t("opt." + u.style) + "</div>" +
      "<div><span>" + t("stock") + "</span>" + u.stock + "</div>" +
      vin +
      "<div><span>" + t("location") + "</span>Hollywood, FL</div></div>" +
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
    syncHeader();
  }

  render();
})();
