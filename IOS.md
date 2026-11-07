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
2. **Either** a Codemagic account (cloud builds, works from an iPad — see below) **or**
   a Mac with Xcode and Node.js 20+.

## Build in the cloud (Codemagic) — no Mac needed

`codemagic.yaml` builds the app on Codemagic's Macs and uploads it to TestFlight.
Everything below works from a web browser, including on an iPad. Codemagic's free plan
includes 500 build minutes a month; one build takes about 10–15.

### One-time setup

1. **Register the app ID with push** — https://developer.apple.com/account/resources/identifiers
   → **+** → App IDs → App → Description "WeeSubby", Bundle ID **Explicit**
   `com.weesubby.app` → under Capabilities tick **Push Notifications** → Continue → Register.
2. **Create the app in App Store Connect** — https://appstoreconnect.apple.com → **Apps** →
   **+** → New App → iOS, name "WeeSubby", language, bundle ID `com.weesubby.app`,
   SKU `weesubby` → Create.
3. **Create an App Store Connect API key** (lets Codemagic sign and upload) — App Store
   Connect → **Users and Access** → **Integrations** → **App Store Connect API** → Team Keys
   → **+** → name "Codemagic", access **App Manager** → Generate. Note the **Issuer ID**
   and **Key ID**, and **Download** the `.p8` file (only possible once). This is a different
   key from the push key below.
4. **Sign up for Codemagic** — https://codemagic.io/signup → sign in with GitHub → add the
   `chisdaniels/weesubby` repository. Codemagic finds `codemagic.yaml` on its own.
5. **Connect Apple to Codemagic** — Codemagic → **Team settings** → **Team integrations** →
   **Developer Portal** → Connect → name it exactly **`WeeSubby App Store Connect`**, then
   enter the Issuer ID, Key ID, and upload the `.p8` from step 3.
6. **Signing certificate** — Codemagic → **Team settings** → **codemagic.yaml settings** →
   **Code signing identities** → **iOS certificates** → **Generate certificate** → type
   **Apple Distribution**, use the `WeeSubby App Store Connect` key → reference name
   "WeeSubby Distribution" → Create.
7. **Provisioning profile** — https://developer.apple.com/account/resources/profiles →
   **+** → Distribution: **App Store Connect** → App ID `com.weesubby.app` → choose the
   certificate Codemagic just created (newest Apple Distribution) → name "WeeSubby App
   Store" → Generate. Back in Codemagic → **Code signing identities** → **iOS provisioning
   profiles** → **Fetch profiles** → tick "WeeSubby App Store" → **Download selected**.

### Each build

Codemagic → the weesubby app → **Start new build** → branch `main` → workflow
**iOS → TestFlight** → Start. When it finishes (about 15 minutes) the build appears in
App Store Connect → **TestFlight** after Apple processes it (usually 5–30 minutes).

To install it on your iPhone or iPad: App Store Connect → TestFlight → **Internal
Testing** → **+** → add yourself → install Apple's **TestFlight** app and accept the
invite. Internal testers don't need Apple's review.

If a build fails, the log for each step is on the build page; the `.ipa` and Xcode logs
are under **Artifacts**.

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

- **Account deletion (done).** Apple requires apps that let people sign up to let them
  delete their account in the app (Guideline 5.1.1(v)). Account menu → **Delete my account**
  does this via the `delete-account` Edge Function. Mention it in the review notes.
- **More than a website (likely).** Apple can reject apps that are just a website in a
  wrapper (Guideline 4.2). The app has native push notifications for new messages (see
  below); mention them in the review notes.
- **Pro purchases.** Selling Pro inside the app would require Apple in-app purchase
  (Apple keeps 15–30%). The app currently doesn't sell Pro at all, which Apple allows.

## Push notifications

New messages notify the recipient's iPhone through Apple Push Notification service (APNs),
alongside the website's web push. Tapping a notification opens Messages.

How it fits together:

- **App:** "Turn on notifications" (account menu, or the banner on Messages) asks for iOS
  permission and saves the iPhone's token with `save_native_push_token()`
  (`src/nativePush.js`). Signing out removes it.
- **Database:** `native_push_tokens` (migration `038_native_push_tokens.sql`, already applied).
- **Sending:** `notify-message-push` sends to every iPhone the recipient has, trying Apple's
  production server first and the sandbox (builds run from Xcode) if the token isn't
  recognised. Tokens Apple reports as gone are removed. Already deployed.
- **iOS project:** push capability (`App/App.entitlements`) and the token hand-off in
  `AppDelegate.swift`.

### One-time setup (needs your Apple Developer account)

1. **Create a push key.** developer.apple.com → Certificates, Identifiers & Profiles →
   **Keys** → **+** → name it "WeeSubby Push", tick **Apple Push Notifications service (APNs)**,
   Continue → Register → **Download** the `.p8` file (you can only download it once).
   Note the **Key ID** shown on that page.
2. **Find your Team ID:** developer.apple.com → Account → Membership details.
3. **Add the secrets** in Supabase → Edge Functions → Secrets:

   | Name | Value |
   |------|-------|
   | `APNS_KEY_ID` | the Key ID from step 1 |
   | `APNS_TEAM_ID` | your Team ID |
   | `APNS_PRIVATE_KEY` | the whole contents of the `.p8` file, including the `BEGIN`/`END` lines |
   | `APNS_BUNDLE_ID` | optional; only if you changed it from `com.weesubby.app` |

   No redeploy needed; the function reads them on each call.
4. **In Xcode**, App target → **Signing & Capabilities**: check that **Push Notifications**
   is listed (it comes from `App.entitlements`). If Xcode reports a provisioning error, click
   **+ Capability** → Push Notifications to let it update your App ID.

### Testing

Push doesn't work in the iOS Simulator for remote notifications from a server, so use a real
iPhone: run the app from Xcode (or install from TestFlight), sign in, tap **Turn on
notifications** and allow. From another account (e.g. on the website) send that user a
message and lock the iPhone. In Supabase → Edge Functions → `notify-message-push` → Logs,
the response includes `ios_sent`; `apns failed` lines show Apple's reason if one fails.
