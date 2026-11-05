// Privacy Policy and Terms of Service, rendered as static pages at /privacy
// and /terms by scripts/build-seo.mjs. Plain data, no imports.
//
// Written to match what the app actually does (see the data flows listed in
// the privacy policy). It is a plain-language starting point, not legal
// advice: have it reviewed before relying on it, and update LEGAL_UPDATED
// whenever the text changes.

export const LEGAL_UPDATED = "November 5, 2026";

export const PRIVACY = {
  path: "/privacy",
  title: "Privacy Policy",
  description: "How WeeSubby collects, uses, shares, and protects information about homeowners, businesses, and contractors.",
  intro:
    "This policy explains what information WeeSubby collects when you use weesubby.com and the WeeSubby app, how we use it, who we share it with, and the choices you have.",
  sections: [
    ["Information you give us", [
      "Account details: your email address and password. Passwords are handled by our authentication provider and are never visible to us.",
      "Job posts: the title, service, location, budget, and description of jobs you post, plus the contact name, email, and phone number you add to a job.",
      "Contractor profiles: business name, services, location, rates, website, bio, and the license, insurance, and bond details and documents you upload for verification.",
      "Messages, reviews, and support requests you send through WeeSubby.",
      "Payment details for WeeSubby Pro. Card numbers are entered on Stripe's secure pages and go straight to Stripe. We never see or store your full card number.",
    ]],
    ["Information collected automatically", [
      "Basic technical data our hosting and database providers log when you use the site, such as IP address, browser type, and the pages or features you request. We use it to keep the service running, secure, and free of abuse.",
      "Small settings saved in your browser, such as whether message sounds are on and which conversations you have read. These stay on your device.",
      "If you turn on notifications, a push subscription for your device so we can alert you to new messages.",
      "We do not use advertising trackers or sell your information.",
    ]],
    ["How we use information", [
      "To run WeeSubby: create your account, post and show jobs, match homeowners with contractors, deliver messages, and show reviews.",
      "To verify contractors: our team reviews uploaded licenses, insurance, and bonds before approving a profile.",
      "To send service emails and notifications, such as when a job is accepted, a profile is approved, or you receive a message or a support reply.",
      "To bill WeeSubby Pro subscriptions and keep each contractor's plan up to date.",
      "To keep WeeSubby safe: preventing fraud, spam, and misuse, and enforcing our Terms of Service.",
    ]],
    ["What other users can see", [
      "Contractor profiles (business name, services, location, rates, bio, website, rating, and verification status) are public.",
      "Reviews are public and show the name of the person who wrote them.",
      "A job's details are visible to contractors while it is open. The contact name, email, and phone number on a job are shared only with the contractor who accepts it.",
      "A contractor can choose to email their license and insurance information to a prospective client.",
      "Messages are visible only to the people in the conversation and to our admin team when needed for support or safety.",
    ]],
    ["Who we share information with", [
      "We share information only with service providers that help us run WeeSubby, and only for that purpose: Supabase (accounts, database, and file storage), Vercel (website hosting), Stripe (payments and billing), Resend (email delivery), Google Fonts (website fonts), and your browser's push notification service if you enable notifications.",
      "We may also disclose information if required by law, to protect the rights and safety of our users or the public, or as part of a sale or merger of the business, in which case this policy will continue to apply.",
    ]],
    ["How long we keep information", [
      "We keep your information while your account is open. When you ask us to delete your account, we delete or anonymize your personal information, except where we need to keep records for legal, tax, accounting, or dispute purposes. Stripe keeps payment records as the law requires.",
    ]],
    ["Your choices", [
      "You can update your profile and job details in the app at any time.",
      "You can turn notifications and message sounds off from your profile menu.",
      "To get a copy of your information, correct it, or delete your account, contact us through Support in the app and we will respond within 30 days.",
    ]],
    ["Security", [
      "Uploaded documents are stored privately and shared only through time-limited links. Access to private data is restricted by database rules, and all traffic uses HTTPS. No system is perfectly secure, so please use a strong, unique password.",
    ]],
    ["Children", [
      "WeeSubby is for adults. We do not knowingly collect information from anyone under 18.",
    ]],
    ["Changes to this policy", [
      "If we make material changes, we will update the date at the top of this page and, where appropriate, let you know in the app or by email.",
    ]],
    ["Contact us", [
      "Questions about privacy? Use Support in the WeeSubby app.",
    ]],
  ],
};

export const TERMS = {
  path: "/terms",
  title: "Terms of Service",
  description: "The terms that apply when homeowners, businesses, and contractors use WeeSubby, including WeeSubby Pro subscriptions.",
  intro:
    "These terms are an agreement between you and WeeSubby. By creating an account or using weesubby.com or the WeeSubby app, you agree to them. If you do not agree, please do not use WeeSubby.",
  sections: [
    ["What WeeSubby is", [
      "WeeSubby is an online marketplace that connects homeowners and businesses (\"customers\") with independent contractors and subcontractors (\"pros\"). Customers post jobs, and pros find and accept them.",
      "WeeSubby is not a contractor and does not perform, supervise, or guarantee any work. Pros are independent businesses, not employees or agents of WeeSubby. Any agreement for work is between the customer and the pro.",
    ]],
    ["Accounts", [
      "You must be at least 18 and able to enter a binding contract. Give accurate information and keep it up to date.",
      "You are responsible for keeping your password secure and for activity on your account. Tell us through Support if you think your account has been used without permission.",
    ]],
    ["Customers", [
      "Posting jobs, browsing pros, messaging, and leaving reviews are free for customers.",
      "Describe your job honestly and only add contact details you are allowed to share. Your job's contact details are shared with the pro who accepts it.",
      "Before hiring, it is your responsibility to check that a pro is right for your job, including licenses, insurance, permits, references, and written agreements on price and scope.",
    ]],
    ["Pros", [
      "You may create a profile and browse jobs for free. Accepting jobs requires an active WeeSubby Pro subscription and a profile approved by our team.",
      "You confirm that the license, insurance, bond, and other information you provide is true, current, and yours, and that you hold every license and insurance the law requires for the work you accept. Keep your documents up to date.",
      "Our verification is a check of the documents you upload at the time we review them. It is not a guarantee of your work, and we may remove or suspend a profile at any time.",
      "Use customer contact details only to discuss and carry out the job you accepted.",
    ]],
    ["WeeSubby Pro subscriptions", [
      "WeeSubby Pro costs the price shown on our Pricing page (currently $49 per month, plus any applicable taxes) and is billed in advance through Stripe.",
      "Your subscription renews automatically each month until you cancel. You authorize us, through Stripe, to charge your payment method on each renewal.",
      "You can cancel any time from Manage billing on the Pricing page. Cancellation takes effect at the end of the current billing period, and you keep Pro until then.",
      "Payments are non-refundable except where the law requires otherwise, or where we decide to issue a refund.",
      "If a payment fails, we may pause Pro features until it is resolved. We may change the price with at least 30 days' notice, and the new price applies from your next billing period after that notice.",
    ]],
    ["Acceptable use", [
      "Do not post anything false, misleading, unlawful, harassing, discriminatory, or that infringes someone else's rights.",
      "Do not impersonate anyone, upload documents that are not yours, scrape the site, send spam, or try to get around WeeSubby's security or payment features.",
      "Reviews must reflect a genuine experience. Do not offer or accept anything in exchange for a review.",
    ]],
    ["Your content", [
      "You keep ownership of what you post. You give WeeSubby permission to host, display, and share it as needed to run the service, for example showing your profile, jobs, and reviews. We may remove content that breaks these terms.",
    ]],
    ["Suspension and termination", [
      "You can stop using WeeSubby and ask us to close your account at any time through Support. We may suspend or close accounts that break these terms or put other users at risk.",
    ]],
    ["Disclaimers", [
      "WeeSubby is provided \"as is\" and \"as available.\" To the fullest extent the law allows, we make no warranties about the service, the users on it, or the quality, safety, legality, or timeliness of any work arranged through it.",
    ]],
    ["Limitation of liability", [
      "To the fullest extent the law allows, WeeSubby is not liable for indirect, incidental, special, or consequential damages, or for any dispute, injury, loss, or damage arising from work between customers and pros. Our total liability for any claim is limited to the greater of the amount you paid WeeSubby in the 12 months before the claim or $100.",
    ]],
    ["Disputes between users", [
      "Disputes about a job are between the customer and the pro. We may try to help, but we are not obliged to. You release WeeSubby from claims arising from those disputes, to the extent the law allows.",
    ]],
    ["Changes to these terms", [
      "We may update these terms. If changes are material, we will update the date at the top of this page and let you know in the app or by email. Continuing to use WeeSubby after changes take effect means you accept them.",
    ]],
    ["Contact us", [
      "Questions about these terms? Use Support in the WeeSubby app. Our Privacy Policy explains how we handle your information.",
    ]],
  ],
};
