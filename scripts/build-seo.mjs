// Runs after `vite build`. Writes, into dist/:
//   - <route>/index.html for public app routes, each with its own <title>,
//     description, canonical and social tags (same app bundle underneath)
//   - hire/index.html and hire/<trade>/index.html: static landing pages
//     that search engines can read without running JavaScript
//   - sitemap.xml
// Content lives in src/seo.js.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { SITE_URL, SITE_NAME, ROUTE_META, TRADE_PAGES } from "../src/seo.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const today = new Date().toISOString().slice(0, 10);

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const article = w => (/^[aeiou]/i.test(w) ? "an" : "a");
const jsonLd = obj => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

async function write(rel, html) {
  const file = join(dist, rel);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
}

// ---------- 1. Per-route copies of the app shell ----------
const shell = await readFile(join(dist, "index.html"), "utf8");

function withMeta(html, path, { title, description }) {
  const url = SITE_URL + (path === "/" ? "/" : path);
  const swaps = [
    [/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`],
    [/(<meta name="description" content=")[^"]*/, `$1${esc(description)}`],
    [/(<link rel="canonical" href=")[^"]*/, `$1${url}`],
    [/(<meta property="og:title" content=")[^"]*/, `$1${esc(title)}`],
    [/(<meta property="og:description" content=")[^"]*/, `$1${esc(description)}`],
    [/(<meta property="og:url" content=")[^"]*/, `$1${url}`],
    [/(<meta name="twitter:title" content=")[^"]*/, `$1${esc(title)}`],
    [/(<meta name="twitter:description" content=")[^"]*/, `$1${esc(description)}`],
  ];
  for (const [re, rep] of swaps) {
    if (!re.test(html)) throw new Error(`build-seo: index.html is missing ${re}`);
    html = html.replace(re, rep);
  }
  return html;
}

for (const [path, meta] of Object.entries(ROUTE_META)) {
  if (path === "/") continue;
  await write(join(path.slice(1), "index.html"), withMeta(shell, path, meta));
}

// ---------- 2. Trade landing pages ----------
const CSS = `
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:#f5f3ee;color:#1f2430;font:400 1.0625rem/1.6 'DM Sans',system-ui,sans-serif}
a{color:#b04a17}
.wrap{max-width:900px;margin:0 auto;padding:0 20px}
header{background:#fff;border-bottom:1px solid #e2e8f0}
header .wrap{display:flex;align-items:center;justify-content:space-between;min-height:60px;gap:12px;flex-wrap:wrap;padding-top:8px;padding-bottom:8px}
.logo{display:flex;align-items:center;gap:10px;text-decoration:none;font:800 1.625rem/1 'Inter','DM Sans',sans-serif;letter-spacing:-.03em;color:#1f2430}
.logo .wm span{color:#db6b33}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 20px;border-radius:10px;font-weight:700;text-decoration:none;border:2px solid transparent}
.btn-primary{background:#b04a17;color:#fff}
.btn-outline{background:#fff;border-color:#ddd7cb;color:#1f2430}
.hero{padding:48px 0 32px}
h1{font:800 clamp(2rem,6vw,2.75rem)/1.1 'Inter','DM Sans',sans-serif;letter-spacing:-.03em;margin:0 0 16px}
h2{font-size:1.5rem;line-height:1.25;margin:0 0 12px}
h3{font-size:1.0625rem;margin:0 0 4px}
.lede{font-size:1.1875rem;color:#475569;max-width:640px;margin:0 0 24px}
.ctas{display:flex;gap:10px;flex-wrap:wrap}
section{padding:24px 0}
.card{background:#fff;border:1px solid #e7e2d8;border-radius:16px;padding:24px}
.grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
ul.checks{list-style:none;padding:0;margin:0;display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
ul.checks li::before{content:"✓ ";color:#047857;font-weight:700}
.step b{display:inline-flex;width:32px;height:32px;border-radius:50%;background:#fbe9df;color:#b04a17;align-items:center;justify-content:center;margin-bottom:8px}
details{background:#fff;border:1px solid #e7e2d8;border-radius:12px;padding:14px 18px;margin-bottom:10px}
summary{font-weight:700;cursor:pointer}
.trades{display:flex;flex-wrap:wrap;gap:8px;list-style:none;padding:0;margin:0}
.trades a{display:inline-block;padding:8px 14px;background:#fff;border:1px solid #ddd7cb;border-radius:999px;text-decoration:none;color:#1f2430;font-weight:600}
.trades a:hover{border-color:#b04a17;color:#b04a17}
.crumbs{font-size:.9375rem;color:#64748b;padding-top:16px}
.crumbs a{color:#64748b}
footer{border-top:1px solid #e2e8f0;margin-top:32px;padding:24px 0 40px;color:#64748b;font-size:.9375rem}
`;

function page({ path, title, description, body, ld }) {
  const url = SITE_URL + path;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${url}" />
<meta name="theme-color" content="#ffffff" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="${SITE_NAME}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${SITE_URL}/og-image.png?v=4" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${SITE_URL}/og-image.png?v=4" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>${CSS}</style>
${ld.map(jsonLd).join("\n")}
</head>
<body>
<header><div class="wrap">
  <a class="logo" href="/"><img src="/favicon.svg" alt="" width="36" height="36" /><span class="wm"><span>Wee</span>Subby</span></a>
  <a class="btn btn-outline" href="/post">Post a Job</a>
</div></header>
<main class="wrap">
${body}
</main>
<footer><div class="wrap">
  <p><strong>${SITE_NAME}</strong> — the right sub for the job. Free for homeowners. <a href="/pricing">Pricing for contractors</a> · <a href="/hire">All trades</a></p>
</div></footer>
</body>
</html>
`;
}

const tradeLinks = current =>
  `<ul class="trades">${TRADE_PAGES.filter(t => t.slug !== current)
    .map(t => `<li><a href="/hire/${t.slug}">${esc(cap(t.plural))}</a></li>`)
    .join("")}</ul>`;

const howItWorks = keyword => `
<section><h2>How it works</h2><div class="grid">
  <div class="card step"><b>1</b><h3>Post your job — free</h3><p>Tell us what you need, where, and your budget. It takes about two minutes.</p></div>
  <div class="card step"><b>2</b><h3>Get matched</h3><p>Verified local pros see your job and reach out. You choose who to talk to.</p></div>
  <div class="card step"><b>3</b><h3>Hire with confidence</h3><p>Check credentials and reviews, message in the app, and hire the right ${esc(keyword)}.</p></div>
</div></section>`;

const why = `
<section><h2>Why homeowners use WeeSubby</h2><div class="grid">
  <div class="card"><h3>Vetted by people</h3><p>Every contractor profile is reviewed by our admin team before it goes live.</p></div>
  <div class="card"><h3>Licensed &amp; insured</h3><p>Contractors upload their license and insurance documents so you can see them before you hire.</p></div>
  <div class="card"><h3>Always free for you</h3><p>Homeowners never pay to post a job or contact contractors.</p></div>
</div></section>`;

const sitemapUrls = [];

for (const t of TRADE_PAGES) {
  const path = `/hire/${t.slug}`;
  const Plural = cap(t.plural);
  const title = `Find Verified Local ${Plural} Near You | ${SITE_NAME}`;
  const description = `Hire ${article(t.keyword)} ${t.keyword} you can trust. Post your job free and get matched with verified, licensed, and insured local ${t.plural} on ${SITE_NAME}.`;
  const body = `
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/hire">Hire a pro</a> › ${esc(Plural)}</nav>
<div class="hero">
  <h1>Find a verified local ${esc(t.keyword)}</h1>
  <p class="lede">${esc(t.intro)}</p>
  <div class="ctas"><a class="btn btn-primary" href="/post">Post ${article(t.keyword)} ${esc(t.keyword)} job — free</a><a class="btn btn-outline" href="/">Browse ${esc(t.plural)}</a></div>
</div>
<section class="card"><h2>What our ${esc(t.plural)} can help with</h2><ul class="checks">${t.jobs.map(j => `<li>${esc(j)}</li>`).join("")}</ul></section>
${howItWorks(t.keyword)}
${why}
<section><h2>${esc(cap(t.keyword))} FAQs</h2>${t.faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</section>
<section class="card"><h2>Are you ${article(t.keyword)} ${esc(t.keyword)}?</h2><p>Get in front of homeowners near you who are ready to hire. Create a free profile, get verified, and upgrade to WeeSubby Pro to accept jobs.</p><a class="btn btn-outline" href="/pricing">See contractor pricing</a></section>
<section><h2>Other trades on WeeSubby</h2>${tradeLinks(t.slug)}</section>`;
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: `${cap(t.keyword)} services`,
      serviceType: t.trade,
      description,
      url: SITE_URL + path,
      areaServed: { "@type": "Country", name: "United States" },
      provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL + "/" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
        { "@type": "ListItem", position: 2, name: "Hire a pro", item: SITE_URL + "/hire" },
        { "@type": "ListItem", position: 3, name: Plural, item: SITE_URL + path },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: t.faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];
  await write(join("hire", t.slug, "index.html"), page({ path, title, description, body, ld }));
  sitemapUrls.push({ loc: SITE_URL + path, priority: "0.8" });
}

// Hub page listing every trade.
{
  const path = "/hire";
  const title = `Hire Verified Local Contractors by Trade | ${SITE_NAME}`;
  const description = `Find verified, licensed, and insured local contractors on ${SITE_NAME} — plumbers, electricians, roofers, painters, drywall, landscaping, and more. Free for homeowners.`;
  const body = `
<div class="hero">
  <h1>Hire a verified local pro</h1>
  <p class="lede">Pick a trade to learn what our contractors can help with, or post your job free and let local pros come to you.</p>
  <div class="ctas"><a class="btn btn-primary" href="/post">Post a job — free</a></div>
</div>
<section><h2>Browse by trade</h2>${tradeLinks(null)}</section>
${howItWorks("pro")}
${why}`;
  const ld = [{
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: TRADE_PAGES.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: cap(t.plural), url: `${SITE_URL}/hire/${t.slug}` })),
  }];
  await write(join("hire", "index.html"), page({ path, title, description, body, ld }));
  sitemapUrls.unshift({ loc: SITE_URL + path, priority: "0.9" });
}

// ---------- 3. Sitemap ----------
const appUrls = Object.keys(ROUTE_META).map(p => ({ loc: SITE_URL + p, priority: p === "/" ? "1.0" : "0.7" }));
const all = [...appUrls, ...sitemapUrls];
await write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all.map(u => `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><priority>${u.priority}</priority></url>`).join("\n")}
</urlset>
`,
);

console.log(`build-seo: ${Object.keys(ROUTE_META).length - 1} route pages, ${TRADE_PAGES.length + 1} hire pages, sitemap with ${all.length} URLs`);
