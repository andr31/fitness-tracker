This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Install on a phone

The app can be installed from its HTTPS website without an app store:

- **iPhone:** Open the site in Safari, tap Share, then Add to Home Screen. If shown, leave "Open as Web App" enabled.
- **Android:** Open the site in Chrome, then use the browser menu to choose Install app or Add to Home screen.

The installed app uses the same server and requires an internet connection. Offline access is not supported.

## Daily reminders

Members of account-based sessions can opt in to a daily push reminder on each device. Around 7 PM in the device's local time, a reminder is sent if today's net exercise is below the current "needed per day" pace shown in the app. It includes the daily pace and progress toward the milestone. A future deadline and an unfinished milestone are required. Reminders pause when the user logs out, switches to an open session, leaves the session, or the session is archived. The device's timezone is refreshed when its reminder settings are loaded. The reminder control appears only in browsers that support push notifications; on iPhone, open the installed Home Screen app to enable them.

Reminder settings open automatically when reminders are off; use the bell in the header to open or close them.

Older exercise entries without a selected date were recorded in Los Angeles time and are not automatically corrected.

To configure reminders:

1. Generate VAPID keys with `npx web-push generate-vapid-keys` and add `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` (a `mailto:` address or HTTPS URL) to the deployment environment. Keep the private key secret.
2. Set `CRON_SECRET` to a random secret of at least 16 characters in Vercel. Vercel uses it to authorize the scheduled endpoint.
3. Run `npx tsx create-push-subscriptions-table.ts` against the deployment database before deploying.
4. Deploy the app with Vercel Schedules enabled. The schedule in `vercel.json` runs every 15 minutes; Hobby scheduling can add up to 15 minutes of jitter and has a monthly execution limit. Preview schedules are inactive by default.

Push delivery is subject to device permissions, network connectivity, and the push service. It is not guaranteed to arrive exactly at 7 PM.

## Password reset

"Forgot password?" emails a one-hour, single-use reset link over SMTP. Any free provider works, e.g. Gmail with an [app password](https://myaccount.google.com/apppasswords) (`smtp.gmail.com`, port 587) or Brevo's free SMTP tier. Set in `.env.local` / Vercel:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Fitness Tracker <you@gmail.com>"   # optional
APP_URL=https://your-app.vercel.app            # optional, defaults to the request origin
```

Run `npx tsx create-password-resets-table.ts` to create/update the reset-token and rate-limit tables. It is safe to rerun.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Search visibility

The homepage has server-rendered descriptive content, metadata, structured data,
and a canonical URL. `robots.txt` and `sitemap.xml` advertise the public
homepage; invite, admin, and password-reset pages use `noindex` and are
intentionally not in the sitemap. These settings do not guarantee indexing or
rankings, and `noindex` is not a substitute for access controls.

The canonical site defaults to `https://www.rep-rally.com`. If the production
domain changes, set `NEXT_PUBLIC_SITE_URL` to the new public origin at build
time, and redirect alternate domains to it. Do not set it to a preview URL for
a production build.

After deploying:

1. Check that the homepage, `/robots.txt`, and `/sitemap.xml` are publicly
   accessible, reference the production domain, and are not blocked by hosting
   authentication or an `X-Robots-Tag: noindex` header.
2. Verify the domain in [Google Search Console](https://search.google.com/search-console),
   submit `https://www.rep-rally.com/sitemap.xml`, and use URL Inspection to test
   and request indexing of the homepage.
3. Use the [Rich Results Test](https://search.google.com/test/rich-results)
   and monitor Search Console's indexing and performance reports. Keep the
   homepage content accurate and useful, and share the site through relevant
   communities and genuine links.

See [Google's indexing FAQ](https://developers.google.com/search/help/crawling-index-faq)
for details on discovery and indexing.
