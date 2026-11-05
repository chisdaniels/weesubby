// Search-engine content shared by the app (per-route titles, footer links)
// and scripts/build-seo.mjs (static trade landing pages + sitemap).
// Plain data, no imports — Node reads this file at build time.

export const SITE_URL = "https://weesubby.com";
export const SITE_NAME = "WeeSubby";

export const DEFAULT_TITLE = "WeeSubby — Find Verified Local Contractors & Subcontractors";
export const DEFAULT_DESCRIPTION =
  "Post a construction or home service job free and get matched with verified, licensed, and insured local contractors — plumbers, electricians, roofers, and more. Every pro is vetted by our team.";

// Public app routes worth indexing. Private ones (messages, my-jobs, jobs,
// admin) are kept out of the sitemap and blocked in robots.txt.
export const ROUTE_META = {
  "/": { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
  "/post": {
    title: "Post a Job Free — Get Matched with Local Contractors | WeeSubby",
    description:
      "Describe your project, set your budget, and get matched with verified local contractors. Posting a job on WeeSubby is always free for homeowners.",
  },
  "/pricing": {
    title: "Pricing for Contractors — WeeSubby Pro | WeeSubby",
    description:
      "Homeowners use WeeSubby free. Contractors and subcontractors upgrade to WeeSubby Pro to accept local jobs, message customers, and grow their business.",
  },
  "/reviews": {
    title: "Contractor Reviews from Real Customers | WeeSubby",
    description:
      "Read honest reviews of verified contractors and subcontractors on WeeSubby, written by the homeowners who hired them.",
  },
};

// One landing page per trade at /hire/<slug>. Names match trade_types rows.
export const TRADE_PAGES = [
  {
    slug: "general-contractors",
    trade: "General Contractor",
    plural: "general contractors",
    keyword: "general contractor",
    intro:
      "Planning a remodel, addition, or a project that needs several trades working together? A general contractor manages the schedule, the subs, and the permits so you have one person accountable for the whole job.",
    jobs: ["Kitchen and bathroom remodels", "Home additions and garage conversions", "Basement finishing", "Storm and water damage repairs", "Whole-home renovations"],
    faqs: [
      ["When do I need a general contractor?", "Hire a general contractor when a project involves more than one trade, needs permits, or has to be coordinated in stages — remodels, additions, and major repairs are typical examples."],
      ["Do general contractors need a license?", "Most states and many cities require general contractors to be licensed above a certain project value. WeeSubby asks contractors to upload their license and insurance, and our team reviews them before a profile goes live."],
    ],
  },
  {
    slug: "plumbers",
    trade: "Plumber",
    plural: "plumbers",
    keyword: "plumber",
    intro:
      "From a dripping faucet to a full repipe, find a licensed local plumber who can get the job done right. Post your job free and hear back from plumbers near you.",
    jobs: ["Leak detection and pipe repair", "Water heater installation and replacement", "Drain and sewer line clearing", "Toilet, sink, and faucet installs", "Repiping and new construction plumbing"],
    faqs: [
      ["How do I find a reliable plumber near me?", "Post your plumbing job on WeeSubby with your city and a short description. Verified local plumbers can review it and reach out, and you can check their credentials and reviews before you hire."],
      ["Are plumbers on WeeSubby licensed?", "Plumbers upload their license and proof of insurance, and our admin team reviews each profile before it's shown to homeowners."],
    ],
  },
  {
    slug: "electricians",
    trade: "Electrician",
    plural: "electricians",
    keyword: "electrician",
    intro:
      "Electrical work is one job you shouldn't DIY. Find a licensed, insured local electrician for repairs, upgrades, and new installs — post your job free.",
    jobs: ["Panel upgrades and breaker replacement", "Outlet, switch, and lighting installation", "EV charger installation", "Ceiling fan and fixture wiring", "Troubleshooting and code corrections"],
    faqs: [
      ["Do I need a licensed electrician?", "Almost every state requires electrical work to be done by a licensed electrician, and many jobs need a permit and inspection. Hiring licensed protects your home and your insurance."],
      ["Can an electrician install an EV charger?", "Yes. Most Level 2 EV chargers need a dedicated 240V circuit, and a licensed electrician can check your panel capacity and install it to code."],
    ],
  },
  {
    slug: "roofers",
    trade: "Roofer",
    plural: "roofers",
    keyword: "roofer",
    intro:
      "Whether it's a few missing shingles after a storm or a full tear-off, find a verified local roofing contractor you can trust on your roof.",
    jobs: ["Roof repair and leak fixes", "Full roof replacement", "Storm and hail damage repairs", "Gutter installation and repair", "Roof inspections"],
    faqs: [
      ["How do I avoid roofing scams after a storm?", "Be cautious of door-to-door roofers who show up right after a storm. Hire a local roofer whose license and insurance you can check — WeeSubby reviews these documents before a contractor is listed."],
      ["Repair or replace my roof?", "Small, isolated damage can usually be repaired. If your roof is near the end of its life or damage is widespread, a replacement is often better value. A roofer can inspect and advise."],
    ],
  },
  {
    slug: "carpenters",
    trade: "Carpenter",
    plural: "carpenters",
    keyword: "carpenter",
    intro:
      "Find a skilled local carpenter for framing, trim, decks, and custom woodwork. Post your project free and get matched with verified pros.",
    jobs: ["Deck and porch building and repair", "Framing and structural carpentry", "Trim, baseboard, and crown molding", "Door and window installation", "Custom built-ins and shelving"],
    faqs: [
      ["What's the difference between a carpenter and a general contractor?", "A carpenter specializes in woodwork — framing, trim, decks, and built-ins. A general contractor coordinates entire projects that may include a carpenter along with other trades."],
      ["Can a carpenter build a deck?", "Yes. Many carpenters build and repair decks. Larger or raised decks may need a permit, which your carpenter can help with."],
    ],
  },
  {
    slug: "masons",
    trade: "Mason",
    plural: "masons",
    keyword: "mason",
    intro:
      "Brick, block, stone, and concrete work built to last. Find a verified local mason for new builds and repairs.",
    jobs: ["Brick and block walls", "Stone veneer and fireplaces", "Chimney repair and tuckpointing", "Concrete patios, steps, and walkways", "Retaining walls"],
    faqs: [
      ["What does a mason do?", "Masons build and repair structures from brick, block, stone, and concrete — walls, chimneys, fireplaces, patios, steps, and retaining walls."],
      ["When does brickwork need tuckpointing?", "If mortar joints are crumbling, cracked, or recessed, tuckpointing replaces the damaged mortar to keep water out and protect the brick."],
    ],
  },
  {
    slug: "flooring-installers",
    trade: "Flooring",
    plural: "flooring installers",
    keyword: "flooring installer",
    intro:
      "Hardwood, laminate, vinyl plank, or tile — find a verified local flooring installer for a clean, level, long-lasting floor.",
    jobs: ["Hardwood installation and refinishing", "Luxury vinyl plank (LVP) and laminate", "Tile floors", "Carpet removal and subfloor repair", "Stair treads and transitions"],
    faqs: [
      ["How long does flooring installation take?", "A single room is often done in a day; a whole floor can take several days depending on the material, subfloor prep, and furniture moving."],
      ["What's the most durable flooring?", "Porcelain tile and luxury vinyl plank are among the most durable and water-resistant options. A flooring installer can recommend the best fit for each room."],
    ],
  },
  {
    slug: "cabinet-installers",
    trade: "Cabinets",
    plural: "cabinet installers",
    keyword: "cabinet installer",
    intro:
      "New kitchen or bathroom cabinets? Find a verified local cabinet installer to hang them square, level, and ready for countertops.",
    jobs: ["Kitchen cabinet installation", "Bathroom vanity installation", "Cabinet refacing and repair", "Custom and built-in cabinetry", "Hardware and soft-close upgrades"],
    faqs: [
      ["Should cabinets go in before or after flooring?", "It depends on the flooring. Floating floors usually go in after cabinets; tile and hardwood often go in first. Your installer can coordinate with the flooring contractor."],
      ["Can I reface cabinets instead of replacing them?", "If the cabinet boxes are solid, refacing — new doors, drawer fronts, and veneer — can update a kitchen for less than full replacement."],
    ],
  },
  {
    slug: "countertop-installers",
    trade: "Countertops",
    plural: "countertop installers",
    keyword: "countertop installer",
    intro:
      "Granite, quartz, butcher block, or laminate — find a verified local countertop pro to measure, fabricate, and install.",
    jobs: ["Quartz and granite countertops", "Kitchen islands", "Bathroom vanity tops", "Backsplash installation", "Countertop repair and resealing"],
    faqs: [
      ["How long does countertop installation take?", "After templating, stone countertops are typically fabricated in one to two weeks and installed in a single day."],
      ["Quartz or granite?", "Quartz is non-porous and needs no sealing; granite is natural stone with unique patterns and needs periodic sealing. Both are durable choices."],
    ],
  },
  {
    slug: "landscapers",
    trade: "Landscaping",
    plural: "landscapers",
    keyword: "landscaper",
    intro:
      "Transform your yard with a verified local landscaper — from design and planting to hardscapes, sod, and drainage.",
    jobs: ["Landscape design and planting", "Sod and lawn installation", "Pavers, patios, and hardscaping", "Yard drainage solutions", "Mulch, edging, and cleanups"],
    faqs: [
      ["What's the best time of year for landscaping?", "Spring and fall are ideal for planting in most regions. Hardscaping like patios and walkways can usually be done any time the ground isn't frozen."],
      ["Do landscapers handle drainage problems?", "Many do. French drains, regrading, and dry creek beds are common fixes for standing water."],
    ],
  },
  {
    slug: "excavation-dirt-work",
    trade: "Dirt Work",
    plural: "excavation and dirt work contractors",
    keyword: "excavation contractor",
    intro:
      "Grading, excavation, site prep, and hauling — find a verified local dirt work contractor with the equipment for the job.",
    jobs: ["Lot clearing and site preparation", "Grading and leveling", "Foundation and footing excavation", "Driveway and pad prep", "Trenching for utilities and drainage"],
    faqs: [
      ["What is dirt work?", "Dirt work covers moving and shaping earth: clearing land, excavating for foundations, grading for drainage, and preparing pads for driveways and buildings."],
      ["Do I need to call 811 before digging?", "Yes. Call 811 a few days before any excavation so underground utilities are marked. Your contractor should confirm this is done."],
    ],
  },
  {
    slug: "painters",
    trade: "Painting",
    plural: "painters",
    keyword: "painter",
    intro:
      "Interior or exterior, one room or the whole house — find a verified local painting contractor for a clean, professional finish.",
    jobs: ["Interior wall and ceiling painting", "Exterior house painting", "Cabinet painting", "Deck and fence staining", "Drywall patching before paint"],
    faqs: [
      ["How much paint prep is needed?", "Good prep — cleaning, patching, sanding, caulking, and priming — is the biggest factor in how long a paint job lasts. Ask your painter what prep is included."],
      ["How often should I paint my house exterior?", "Typically every 5–10 years depending on climate, siding material, and paint quality."],
    ],
  },
  {
    slug: "drywall-contractors",
    trade: "Sheetrock",
    plural: "drywall contractors",
    keyword: "drywall contractor",
    intro:
      "Hanging, taping, finishing, and repairs — find a verified local drywall (sheetrock) contractor for smooth walls and ceilings.",
    jobs: ["Drywall installation (hang, tape, and finish)", "Hole and water damage repair", "Ceiling repair and texture", "Popcorn ceiling removal", "Basement and garage drywall"],
    faqs: [
      ["Is sheetrock the same as drywall?", "Yes. Sheetrock is a brand name that's commonly used to mean drywall — gypsum panels used for interior walls and ceilings."],
      ["Can water-damaged drywall be repaired?", "Small areas can be cut out and patched once the leak is fixed and everything is dry. Wet insulation or mold may mean replacing larger sections."],
    ],
  },
];
