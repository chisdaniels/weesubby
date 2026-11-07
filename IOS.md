# WeeSubby iPhone app

The iPhone app is the WeeSubby website bundled into a native iOS app with
[Capacitor](https://capacitorjs.com). It uses the same Supabase backend as
weesubby.com, so accounts, jobs and messages are shared.

- Xcode project: `ios/App/App.xcodeproj`
- App settings: `capacitor.config.json` (app ID `com.weesubby.app`, name "WeeSubby")
- Icon and launch screen: rendered from `public/` by `npm run ios:assets`

## What's different inside the app

`src/platform.js` exports `isNativeApp`. When it's true:

- **No Pro purchasing.** Apple requires in-app purchase for subscriptions bought
  in an iPhone app, so the Pricing page shows "Pro can't be purchased in the
  iPhone app" instead of Upgrade, and hides Manage billing. Pros who subscribed
  on the website still get Pro in the app.
- **No install prompts.** The Install button and "add to Home Screen" tips are hidden.
- **No service worker.**

Portrait only on iPhone. The app declares it uses no non-exempt encryption
(HTTPS only), so App Store Connect won't ask about export compliance.

## What you need

1. **Apple Developer Program** membership ($99/year): https://developer.apple.com/programs/
   Enroll as an organization if WeeSubby is a company (needs a D-U-N-S number), or as an individual.
2. **A Mac with Xcode** (free from the Mac App Store). Alternatively, a cloud Mac build
   service such as Codemagic, Ionic Appflow or Bitrise.
3. **Node.js 20+** on that Mac.

## Build and run on a Mac

```sh
git clone https://github.com/chisdaniels/weesubby.git
cd weesubby
npm ci

# Same public values the website uses (Vercel → Settings → Environment Variables)
cat > .env.local <<'ENV'
VITE_SUPABASE_URL=https://mjlaniudtmdfzrcgmios.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable key from Supabase → Project Settings → API>
ENV

npm run ios        # builds the site, copies it into the iOS project, opens Xcode
```

In Xcode:

1. Select the **App** target → **Signing & Capabilities** → choose your **Team**.
   Keep the bundle identifier `com.weesubby.app` (or change it here and in `capacitor.config.json`).
2. Pick an iPhone simulator (or your phone over USB) and press **Run** (▶).

After any website change, run `npm run ios:sync` before building in Xcode again.
Each App Store release needs a higher **Version** or **Build** number (App target → General).

## Submit to the App Store

1. In **App Store Connect** (https://appstoreconnect.apple.com) → **Apps** → **+** → New App.
   Platform iOS, name "WeeSubby", bundle ID `com.weesubby.app`.
2. In Xcode: choose **Any iOS Device**, then **Product → Archive** → **Distribute App** →
   **App Store Connect** → Upload.
3. In App Store Connect, fill in:
   - Screenshots (6.9" and 6.5" iPhone sizes; take them in the simulator)
   - Description, keywords, category (Business)
   - Support URL `https://weesubby.com`, Privacy Policy URL `https://weesubby.com/privacy`
   - **App Privacy**: the app collects email, name, phone (customers' contact details),
     user content (job posts, messages, reviews, uploaded license/insurance documents).
     None of it is used for tracking.
   - **Review notes**: a test customer login and a test contractor login so Apple can sign in.
4. Pick the uploaded build and **Submit for Review**. Reviews usually take 1–3 days.

Test with friends first using **TestFlight** (App Store Connect → TestFlight) — no review wait for internal testers.

## Before Apple will approve it

- **Account deletion (required).** Apple rejects apps that let people sign up but not
  delete their account from inside the app (Guideline 5.1.1(v)). WeeSubby doesn't have
  this yet.
- **More than a website (likely).** Apple can reject apps that are just a website in a
  wrapper (Guideline 4.2). Native push notifications for new messages and job updates are
  the strongest fix. They need an Apple Push Notification key from your developer account.
- **Pro purchases.** Selling Pro inside the app would require Apple in-app purchase
  (Apple keeps 15–30%). The app currently doesn't sell Pro at all, which Apple allows.
