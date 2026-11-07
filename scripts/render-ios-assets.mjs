// Renders the iOS app icon and launch screen from the files in public/.
// Run after changing the logo: node scripts/render-ios-assets.mjs
import sharp from "sharp";

const ICON_SRC = "public/icon-maskable.svg";   // full-bleed square, no transparency
const LOGO_SRC = "public/weesubby-logo.png";
const XC = "ios/App/App/Assets.xcassets";

// App Store icon: 1024x1024, opaque (Apple rejects icons with an alpha channel).
await sharp(ICON_SRC, { density: 1024 })
  .resize(1024, 1024)
  .flatten({ background: "#1f2430" })
  .removeAlpha()
  .png()
  .toFile(`${XC}/AppIcon.appiconset/AppIcon-512@2x.png`);

// Launch screen: logo centred on white. Capacitor ships three copies of the same image.
const logo = await sharp(LOGO_SRC).resize({ width: 1200 }).png().toBuffer();
const splash = await sharp({ create: { width: 2732, height: 2732, channels: 3, background: "#ffffff" } })
  .composite([{ input: logo, gravity: "center" }])
  .png()
  .toBuffer();
for (const name of ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]) {
  await sharp(splash).toFile(`${XC}/Splash.imageset/${name}`);
}
console.log("iOS icon and launch screen rendered.");
