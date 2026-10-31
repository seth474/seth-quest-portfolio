// Built and AI work shown on the site.
// To add a Built project, append an object to `built` with a `category` id
// from `categories` and a non-empty `images` array. Cards render only when
// images exist, so leave Supermodel, MU, and Monarch Treehouse out until
// their files are in the repo.
window.SITE_WORK = {
  categories: [
    { id: "furniture", label: "Furniture Design" },
    { id: "office", label: "Office Design" },
    { id: "interior", label: "Interior Design" },
    { id: "product", label: "Product Design" },
    { id: "architecture", label: "Architecture" }
  ],
  built: [
    {
      id: "knot-light",
      title: "Knot Light",
      category: "furniture",
      line: "Commissioned by the W, and Levi’s flagship store.",
      wide: true,
      images: [
        ["/portfolio/img/knot-light.webp", "Knot Light, a chandelier of knotted black rope", 1600, 995],
        ["/portfolio/img/knot-b.webp", "Knot Light installed over a long communal table", 1600, 1487],
        ["/portfolio/img/knot-c.webp", "Knot Light hanging in a bar", 1600, 1055]
      ]
    },
    {
      id: "google",
      title: "Google",
      category: "office",
      line: "Modular wall system.",
      images: [
        ["/portfolio/img/google-a.webp", "Modular office wall system for Google, cyan patterned screens", 1600, 998],
        ["/portfolio/img/google-b.webp", "Modular office wall system for Google, lime patterned screen around a table", 1600, 1077]
      ]
    },
    {
      id: "riot-games",
      title: "Riot Games",
      category: "office",
      line: "Developer desk.",
      images: [
        ["/portfolio/img/riot-a.webp", "Riot Games developer desk, finished unit with dual monitors", 1600, 1066],
        ["/portfolio/img/riot-b.webp", "Riot Games developer desks in a floor layout", 1600, 980],
        ["/portfolio/img/riot-c.webp", "Riot Games developer desk, side view", 1600, 1066]
      ]
    },
    {
      id: "factory",
      title: "Factory",
      category: "office",
      line: "Innovation consultancy in San Francisco. Founding team; the consultancy worked with Fortune 500 companies.",
      images: [
        ["/portfolio/img/factory-a.webp", "Factory cafe, espresso machine on a stone counter", 1168, 1600],
        ["/portfolio/img/factory-b.webp", "Factory grand hall with columns and chandeliers", 1600, 1061],
        ["/portfolio/img/factory-c.webp", "Factory, detail of the weeping willow chandelier", 1600, 1066],
        ["/portfolio/img/factory-d.webp", "Factory Zen Den", 1066, 1600]
      ]
    },
    {
      id: "waterhouse",
      title: "Waterhouse",
      category: "interior",
      line: "Spa and social club in San Francisco. A community of 1000+ members with spa focused events.",
      images: [
        ["/portfolio/img/waterhouse-a.webp", "Waterhouse garden in daylight", 1600, 804],
        ["/portfolio/img/waterhouse-b.webp", "Waterhouse garden at night", 1600, 804],
        ["/portfolio/img/waterhouse-c.webp", "Waterhouse interior in daylight", 1600, 804],
        ["/portfolio/img/waterhouse-d.webp", "Waterhouse interior at night", 1600, 882]
      ]
    },
    {
      id: "waterhouse-villa",
      title: "Waterhouse Villa",
      category: "interior",
      line: "Design for a retreat center.",
      images: [
        ["/portfolio/img/villa-a.webp", "Waterhouse Villa living room render", 1600, 900],
        ["/portfolio/img/villa-b.webp", "Waterhouse Villa shower", 1600, 900],
        ["/portfolio/img/villa-c.webp", "Waterhouse Villa kitchen", 1600, 900],
        ["/portfolio/img/villa-d.webp", "Waterhouse Villa bathroom", 1600, 900]
      ]
    },
    {
      id: "juniper",
      title: "Juniper",
      category: "interior",
      line: "Meditation center in San Francisco.",
      images: [
        ["/portfolio/img/juniper-a.webp", "Juniper meditation center after the redesign", 1600, 1066],
        ["/portfolio/img/juniper-b.webp", "Juniper meditation center altar", 1600, 1066],
        ["/portfolio/img/juniper-c.webp", "Juniper meditation center, detail of a seated statue", 1600, 1066]
      ]
    },
    {
      id: "kit-tea",
      title: "Kit Tea",
      category: "interior",
      line: "Tea house in San Francisco.",
      images: [
        ["/portfolio/img/kit-tea-a.webp", "Kit Tea cafe seating", 1600, 1361],
        ["/portfolio/img/kit-tea-b.webp", "Kit Tea running wheel in the window", 1600, 1189],
        ["/portfolio/img/kit-tea-c.webp", "Kit Tea, a cat on a person’s shoulder", 1091, 1600],
        ["/portfolio/img/kit-tea-d.webp", "Kit Tea entry and counter", 1600, 988]
      ]
    },
    {
      id: "mola",
      title: "Mola",
      category: "product",
      line: "Sustainable toothbrush with replaceable bristles.",
      wide: true,
      images: [
        ["/portfolio/img/mola.webp", "Mola toothbrushes with replaceable heads", 1600, 668],
        ["/portfolio/img/mola-b.webp", "Mola toothbrush sleeves", 1600, 1200],
        ["/portfolio/img/mola-c.webp", "Mola sleeve pattern, detail", 1600, 1200]
      ]
    },
    {
      id: "fusb",
      title: "FUSB",
      category: "product",
      line: "Front USB for iMac. Accessory sold to Blue Lounge.",
      images: [
        ["/portfolio/img/fusb-a.webp", "FUSB, a front USB accessory being plugged in at the stand of an iMac", 1600, 1463],
        ["/portfolio/img/fusb-b.webp", "FUSB attached behind an iMac, with a cable running to a tablet", 986, 1463]
      ]
    },
    {
      id: "panda-overland",
      title: "Panda Overland Systems",
      category: "product",
      line: "Prototype of an interior kit for Alu-Cab.",
      images: [
        ["/portfolio/img/panda-a.webp", "Panda Overland Systems set up at night under an awning", 1600, 1200],
        ["/portfolio/img/panda-b.webp", "Panda Overland interior kit, drawers and a slat wall", 1600, 1200],
        ["/portfolio/img/panda-c.webp", "Panda Overland interior kit, lit slat wall", 1600, 1200],
        ["/portfolio/img/panda-d.webp", "Panda Overland interior kit with the tailgate open", 1600, 1200]
      ]
    },
    {
      id: "spyglass",
      title: "Spyglass",
      category: "architecture",
      line: "Treehouse for a Texas development.",
      images: [
        ["/portfolio/img/spyglass-a.webp", "Spyglass build, Seth Quest inside the timber arch", 1119, 1600],
        ["/portfolio/img/spyglass-b.webp", "Spyglass build, timber ribs of the arched structure", 1297, 1600],
        ["/portfolio/img/spyglass-c.webp", "Spyglass build, the long interior", 1600, 1200]
      ]
    },
    {
      id: "carbon-cabins",
      title: "Carbon Cabins",
      category: "architecture",
      line: "Design for a Tennessee development.",
      wide: true,
      images: [
        ["/portfolio/img/carbon-cabins.webp", "Carbon Cabins, a raised glass-and-timber cabin", 1600, 893],
        ["/portfolio/img/carbon-b.webp", "Carbon Cabins, wood-clad cabin with a deck", 1600, 900],
        ["/portfolio/img/carbon-c.webp", "Carbon Cabins module with a dark roof", 1281, 1600],
        ["/portfolio/img/carbon-d.webp", "Carbon Cabin 240, front view", 1600, 795]
      ]
    }
  ],
  ai: [
    { title: "VSL for MORE", href: "/make-more-money", line: "Getting service businesses more booked jobs." },
    { title: "Island Glow", href: "/island-glow", line: "A modern branding refresh for Island Glow by Jordan, shown in a beachside product image, alongside AI model imagery and a video ad." },
    { title: "Do or Don't", href: "/do-or-dont-project", line: "Track what you do, and what you don't." },
    { title: "Deep Fried Bananas", href: "/deep-fried-bananas", line: "A platform for food and beverage business owners to implement AI." },
    { title: "Elua", href: "/elua-ux", line: "A platform that helps investors and ecosystem stewards make sense of complex problems." },
    { title: "Puma Mala", href: "/pumamala", line: "A wellness center and condo development in Costa Rica. I refined the branding and built the concept site." },
    { title: "LizzieTours", href: "/real-estate-ai-tours", line: "A $7M Hamptons listing's flat photos, turned into a cinematic tour led by Lizzie, an AI influencer. Plus a clone of the real agent." },
    { title: "Oceanis", href: "/oceanis-project", line: "The anti wealth-management app. A simple financial planning tool for young people." },
    { title: "BS Score", href: "/bs-score", line: "A free, open Chrome extension that scores a YouTube video for clickbait, hidden funnels, and low substance." },
    { title: "Credit Climb", href: "/credit-climb", line: "Self-serve credit report reader and action plan." }
  ]
};
