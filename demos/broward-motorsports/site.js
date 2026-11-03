(function () {
  var BASE = "/demos/broward-motorsports";
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

  function header() {
    return '<header class="top"><div class="w hd">' +
      '<a class="logo" href="' + BASE + '/">BROWARD <b>MOTORSPORTS</b></a>' +
      '<button class="menu" type="button" aria-expanded="false" aria-label="Menu">Menu</button>' +
      '<nav class="nav">' +
      '<a href="' + inv({ category: "Motorcycle" }) + '">Motorcycles</a>' +
      '<a href="' + inv({ category: "Off-road" }) + '">Off-Road</a>' +
      '<a href="' + inv({ category: "Water" }) + '">Water</a>' +
      '<a href="' + inv({ condition: "Pre-owned" }) + '">Pre-owned</a>' +
      '<a href="#" data-open="approve">Financing</a>' +
      '<a href="' + BASE + '/#visit">Service</a>' +
      "</nav><div class=\"sp\"></div>" +
      '<button class="btn gl" type="button" data-open="text">Text us</button>' +
      '<button class="btn wh" type="button" data-open="approve">Get pre-approved</button>' +
      "</div></header>" +
      '<div class="drawer w" id="drawer">' +
      '<a href="' + inv({ category: "Motorcycle" }) + '">Motorcycles</a>' +
      '<a href="' + inv({ category: "Off-road" }) + '">Off-Road</a>' +
      '<a href="' + inv({ category: "Water" }) + '">Water</a>' +
      '<a href="' + inv({ condition: "Pre-owned" }) + '">Pre-owned</a>' +
      '<a href="#" data-open="approve">Financing</a>' +
      '<a href="' + BASE + '/#visit">Service</a>' +
      '<a href="#" data-open="text">Text us</a>' +
      "</div>";
  }
  function footer() {
    return '<footer class="foot"><div class="w">' +
      "Broward Motorsports · 4101 Davie Road Ext., Hollywood, FL 33024 · (954) 436-9905 · Mon–Sat 9–7" +
      '<p class="concept">Concept redesign by <a href="https://sethquest.com">Seth Quest</a> · <a href="' + BASE + '/credits.html">Image credits</a></p>' +
      "</div></footer>";
  }
  function modal() {
    return '<div class="modal" id="modal" hidden><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
      '<h2 id="modal-title">Text us</h2>' +
      '<form class="form" id="lead">' +
      '<label>Name <input name="name" required></label>' +
      '<label>Phone or email <input name="contact" required></label>' +
      '<label class="extra">Note <textarea name="note" rows="3"></textarea></label>' +
      '<button class="btn rd" type="submit">Send</button>' +
      "</form>" +
      '<p class="thanks" hidden>Thanks. This stayed on the page. A person at the desk would take it from here.</p>' +
      '<button class="btn gl" type="button" data-close style="margin-top:12px">Close</button>' +
      "</div></div>";
  }

  function card(u) {
    return '<article class="card"><a href="' + BASE + "/inventory/" + u.id + '">' +
      '<div class="ph"><img src="' + img(u.img) + '" alt=""><span class="tag">' + u.condition + "</span></div>" +
      '<div class="pr">' + money(u.price) + "</div>" +
      '<div class="nm">' + u.year + " " + u.brand + " " + u.model + "</div>" +
      '<div class="meta">' + u.category + " · " + u.style + "</div></a>" +
      '<a class="model-link" href="' + BASE + "/models/" + u.modelSlug + '">View the ' + u.model + " model</a></article>";
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
    var html = '<nav class="crumbs" aria-label="Breadcrumb"><a href="' + BASE + '/inventory">Inventory</a>';
    parts.forEach(function (p, i) {
      html += " <span aria-hidden=\"true\">/</span> ";
      if (p.href && i < parts.length - 1) html += '<a href="' + p.href + '">' + p.label + "</a>";
      else html += "<span>" + p.label + "</span>";
    });
    return html + "</nav>";
  }

  function bindChrome() {
    var menu = document.querySelector(".menu");
    var drawer = document.getElementById("drawer");
    if (menu) menu.addEventListener("click", function () {
      var open = drawer.classList.toggle("open");
      menu.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.body.addEventListener("click", function (event) {
      var opener = event.target.closest("[data-open]");
      if (!opener) return;
      event.preventDefault();
      openForm(opener.getAttribute("data-open"));
    });
    var modal = document.getElementById("modal");
    modal.addEventListener("click", function (event) {
      if (event.target === modal || event.target.hasAttribute("data-close")) modal.hidden = true;
    });
    document.getElementById("lead").addEventListener("submit", function (event) {
      event.preventDefault();
      event.target.hidden = true;
      modal.querySelector(".thanks").hidden = false;
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") modal.hidden = true;
    });
  }

  function openForm(kind) {
    var titles = { text: "Text us", approve: "Get pre-approved", trade: "Value your trade" };
    var modal = document.getElementById("modal");
    var form = document.getElementById("lead");
    form.hidden = false;
    form.reset();
    modal.querySelector(".thanks").hidden = true;
    modal.querySelector("h2").textContent = titles[kind] || "Send a note";
    modal.hidden = false;
    form.querySelector("input").focus();
  }

  function home() {
    var cats = [
      ["ATV", "ATVs", "outlander.jpg"],
      ["Motorcycle", "Motorcycles", "zx10r.jpg"],
      ["Side-by-Side", "Side-by-Sides", "rzr.jpg"],
      ["Golf Cart", "Golf Carts", "golf.jpg"],
      ["PWC", "PWC", "seadoo.jpg"],
      ["Boat", "Boats", ""]
    ];
    document.getElementById("cats").innerHTML = cats.map(function (c) {
      var n = UNITS.filter(function (u) { return u.category === c[0]; }).length;
      var photo = c[2] ? '<img src="' + img(c[2]) + '" alt="">' : "";
      return '<a class="tile" href="' + inv({ category: c[0] }) + '">' + photo + "<div><b>" + c[1] + "</b><small>" + n + " in this sample</small></div></a>";
    }).join("");

    var brands = {};
    UNITS.forEach(function (u) {
      brands[u.brandSlug] = brands[u.brandSlug] || { name: u.brand, n: 0 };
      brands[u.brandSlug].n += 1;
    });
    var order = ["kawasaki", "yamaha", "polaris", "can-am", "harley-davidson", "suzuki", "slingshot", "sea-doo", "indian", "italica"];
    document.getElementById("brands").innerHTML = order.filter(function (s) { return brands[s]; }).map(function (s) {
      return '<a class="brand" href="' + BASE + "/brands/" + s + '"><b>' + brands[s].name + "</b><small>" + brands[s].n + " in this sample</small></a>";
    }).join("");

    var styles = ["Cruiser", "Sport", "Adventure", "Dirt", "Utility", "Sport side-by-side"];
    document.getElementById("styles").innerHTML = styles.map(function (s) {
      var n = UNITS.filter(function (u) { return u.style === s; }).length;
      return '<a class="style" href="' + inv({ style: s }) + '"><b>' + s + "</b><small>" + n + " in this sample</small></a>";
    }).join("");

    document.getElementById("lot").innerHTML = UNITS.slice(0, 8).map(card).join("");
    var search = document.getElementById("hero-search");
    search.addEventListener("submit", function (event) {
      event.preventDefault();
      location.href = inv({ q: new FormData(search).get("q") });
    });
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
    document.getElementById("q").value = params.get("q") || "";
    ["condition", "category", "brand", "style", "sort", "min", "max"].forEach(function (k) {
      var el = document.getElementById(k);
      if (el && f[k]) el.value = f[k];
    });
    var modelWrap = document.getElementById("model-wrap");
    var modelSel = document.getElementById("model");
    if (f.brand) {
      modelWrap.classList.remove("hidden");
      var opts = '<option value="">Any model</option>' + modelsOf(f.brand).map(function (u) {
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
    document.getElementById("count").textContent = rows.length + (rows.length === 1 ? " unit" : " units");
    document.getElementById("results").innerHTML = rows.map(card).join("") || "<p>Nothing in this sample matches.</p>";

    document.getElementById("filters").addEventListener("change", function (event) {
      if (event.target && event.target.id === "brand") document.getElementById("model").value = "";
      apply();
    });
    document.getElementById("filters").addEventListener("submit", function (e) { e.preventDefault(); apply(); });
    function apply() {
      var data = new FormData(document.getElementById("filters"));
      var next = {};
      ["q", "condition", "category", "brand", "model", "style", "min", "max", "sort"].forEach(function (k) {
        next[k] = data.get(k) || "";
      });
      if (!next.brand) next.model = "";
      location.href = inv(next);
    }
  }

  function brandPage() {
    var parts = location.pathname.split("/").filter(Boolean);
    var i = parts.indexOf("brands");
    var key = i >= 0 ? decodeURIComponent(parts[i + 1] || "") : (new URLSearchParams(location.search).get("brand") || "");
    var sample = byBrand(key)[0];
    var root = document.getElementById("main");
    if (!sample) {
      root.innerHTML = "<p class=\"w\">That brand is not in this sample.</p>";
      return;
    }
    var models = modelsOf(key);
    var units = byBrand(key);
    document.title = sample.brand + " · Broward Motorsports";
    root.innerHTML =
      '<section class="brand-hero"><img src="' + img(sample.img) + '" alt="">' +
      '<div class="w"><div class="crumbs-wrap">' + crumbs([{ label: sample.brand }]) + "</div>" +
      '<p class="eyebrow">' + sample.brand + "</p><h1>" + sample.brand + " in Hollywood</h1>" +
      "<p>" + units.length + " in this sample. Pick a model, or scroll to every unit.</p></div></section>" +
      '<main class="w page"><div class="sh"><h2>Models</h2></div><div class="cats">' +
      models.map(function (u) {
        var n = units.filter(function (x) { return x.modelSlug === u.modelSlug; }).length;
        return '<a class="tile" href="' + BASE + "/models/" + u.modelSlug + '"><img src="' + img(u.img) + '" alt=""><div><b>' + u.model + "</b><small>" + n + " in stock</small></div></a>";
      }).join("") +
      '</div><div class="sh"><h2>In stock</h2><a href="' + inv({ brand: key }) + '">Open in search</a></div><div class="grid">' +
      units.map(card).join("") + "</div></main>";
  }

  function modelPage() {
    var parts = location.pathname.split("/").filter(Boolean);
    var i = parts.indexOf("models");
    var key = i >= 0 ? decodeURIComponent(parts[i + 1] || "") : (new URLSearchParams(location.search).get("slug") || "");
    var sample = findModel(key);
    var root = document.getElementById("main");
    if (!sample) {
      root.innerHTML = "<p class=\"w\">That model is not in this sample.</p>";
      return;
    }
    var units = UNITS.filter(function (u) { return u.modelSlug === key; });
    var hear = sample.category === "Motorcycle";
    document.title = sample.model + " · Broward Motorsports";
    root.innerHTML =
      '<section class="model-hero"><img src="' + img(sample.img) + '" alt="">' +
      '<div class="w">' + crumbs([
        { label: sample.brand, href: BASE + "/brands/" + sample.brandSlug },
        { label: sample.model }
      ]) +
      '<p class="eyebrow">' + sample.brand + " · " + sample.category + "</p><h1>" + sample.model + "</h1>" +
      '<div class="specs"><div><b>' + units.length + '</b><span>In this sample</span></div><div><b>' + sample.style + '</b><span>Style</span></div><div><b>' + money(Math.min.apply(null, units.map(function (u) { return u.price; }))) + '</b><span>Lowest price here</span></div></div>' +
      '<a class="btn rd" href="#stock">See what is in stock</a> <button class="btn gl" type="button" data-open="approve">Get pre-approved</button>' +
      "</div></section>" +
      '<main class="w page"><div class="sh"><h2>Hear it start</h2><span>Filmed on our lot</span></div>' +
      '<div class="sound">' + (hear
        ? '<video data-sound src="' + BASE + '/img/start.mp4" poster="' + BASE + '/img/start.jpg" muted autoplay loop playsinline></video><span class="playtag">Startup</span>'
        : '<img src="' + img(sample.img) + '" alt=""><video data-sound poster="' + img(sample.img) + '" muted loop playsinline></video><span class="playtag" data-sound-label>Playing muted</span><button class="sbtn" type="button" data-sound-btn>Tap for sound</button>') +
      '<div class="cap"><b>Walk-up, start, rev</b><span>Walk-up, start, rev. Filmed on our lot.</span></div></div>' +
      '<div class="sh" id="stock"><h2>In stock at Broward</h2><span>Price shown is the price</span></div><div class="grid">' +
      units.map(card).join("") + "</div>" +
      '<div class="actions"><button class="btn wh" type="button" data-open="text">Text us about this</button>' +
      '<button class="btn gl" type="button" data-open="approve">Get pre-approved</button>' +
      '<button class="btn gl" type="button" data-open="trade">Value your trade</button></div></main>';
    var video = document.querySelector("[data-sound]");
    var btn = document.querySelector("[data-sound-btn]");
    var label = document.querySelector("[data-sound-label]");
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
      label.textContent = video.muted ? "Playing muted" : "Sound on";
      btn.textContent = video.muted ? "Tap for sound" : "Tap to mute";
    });
  }

  function unitPage() {
    var parts = location.pathname.split("/").filter(Boolean);
    var i = parts.indexOf("inventory");
    var id = i >= 0 ? decodeURIComponent(parts[i + 1] || "") : (new URLSearchParams(location.search).get("id") || "");
    var u = findUnit(id);
    var root = document.getElementById("main");
    if (!u) {
      root.innerHTML = "<p class=\"w\">That unit is not in this sample.</p>";
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
      '<p class="eyebrow">' + u.condition + " · " + u.category + "</p>" +
      "<h1>" + u.year + " " + u.brand + " " + u.model + "</h1>" +
      '<p class="price-lg">' + money(u.price) + "</p>" +
      '<div class="facts">' +
      "<div><span>Year</span>" + u.year + "</div>" +
      "<div><span>Brand</span>" + u.brand + "</div>" +
      "<div><span>Model</span>" + u.model + "</div>" +
      "<div><span>Style</span>" + u.style + "</div>" +
      "<div><span>Stock</span>" + u.stock + "</div>" +
      vin +
      "<div><span>Location</span>Hollywood, FL</div></div>" +
      '<div class="actions"><button class="btn rd" type="button" data-open="text">Text us about this</button>' +
      '<button class="btn gl" type="button" data-open="approve">Get pre-approved</button>' +
      '<button class="btn gl" type="button" data-open="trade">Value your trade</button></div></main>';
  }

  document.getElementById("top").innerHTML = header();
  document.getElementById("bottom").innerHTML = footer() + modal();
  bindChrome();
  var page = document.body.getAttribute("data-page");
  if (page === "home") home();
  if (page === "inventory") inventory();
  if (page === "brand") brandPage();
  if (page === "model") modelPage();
  if (page === "unit") unitPage();
})();
