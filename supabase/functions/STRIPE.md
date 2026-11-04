# WeeSubby Stripe functions

| Function          | Called by                | JWT verification |
|-------------------|--------------------------|------------------|
| `create-checkout` | App "Upgrade to Pro"     | on (default)     |
| `create-portal`   | App "Manage billing"     | on (default)     |
| `stripe-webhook`  | Stripe                   | **off**          |

## Setup

1. Run `supabase/migrations/035_contractor_pro_plan.sql` in the SQL Editor.
2. In Stripe (Test mode): create a product "WeeSubby Pro" with a recurring $49/month price. Copy the `price_...` ID and the `sk_test_...` secret key.
3. In Stripe → Settings → Billing → Customer portal, click **Activate** (needed for "Manage billing").
4. Set the function secrets (Dashboard → Edge Functions → Secrets, or CLI):

   ```sh
   supabase secrets set STRIPE_SECRET_KEY=sk_test_... STRIPE_PRICE_ID=price_...
   # APP_URL (already set for the notify- functions) is where Stripe sends people back to.
   supabase secrets set APP_URL=https://weesubby.com
   ```

5. Deploy:

   ```sh
   supabase functions deploy create-checkout
   supabase functions deploy create-portal
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```

6. In Stripe → Developers → Webhooks → Add endpoint:
   - URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`,
     `customer.subscription.updated`, `customer.subscription.deleted`
7. Copy the endpoint's signing secret and set it:

   ```sh
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

8. Test: sign in as a contractor → Pricing → Upgrade to Pro → card `4242 4242 4242 4242`, any future date, any CVC.

## Plan rules

Admins can also give a contractor Pro by setting `contractors.plan` directly.
The webhook sets `contractors.plan` to `pro` while the subscription is `active`,
`trialing`, or `past_due` (a grace period while Stripe retries a failed card), and
back to `free` for any other status, including cancellation.
