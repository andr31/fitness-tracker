import type { Metadata } from 'next';
import FitnessApp from '@/components/FitnessApp';
import {
  SITE_DESCRIPTION,
  SITE_FEATURES,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from '@/lib/seo';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: 'en_US',
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: 'en',
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#app`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      featureList: SITE_FEATURES,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      <FitnessApp />
      <section
        aria-labelledby="about-heading"
        className="bg-gray-950 text-gray-300 px-4 py-12"
      >
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 id="about-heading" className="text-2xl font-bold text-white">
            Run a fitness challenge with your friends
          </h2>
          <p>
            {SITE_NAME} is a free fitness challenge tracker. Create a
            password-protected session, invite friends with a link and
            password, and compete on a leaderboard as everyone logs progress.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            {SITE_FEATURES.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          <h3 className="text-xl font-semibold text-white">How it works</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              Create a session and choose pushups, planks, or your own custom
              exercise.
            </li>
            <li>Share the invite link and password with friends so they can join.</li>
            <li>
              Log your progress, work toward daily goals, and race to the milestone.
            </li>
          </ol>
        </div>
      </section>
    </>
  );
}
