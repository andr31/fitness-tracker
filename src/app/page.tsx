import FitnessApp from '@/components/FitnessApp';
import {
  SITE_DESCRIPTION,
  SITE_FEATURES,
  SITE_NAME,
  SITE_URL,
} from '@/lib/seo';

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
            {SITE_NAME} is a free fitness challenge tracker. Create a private
            session, invite friends with a link, and compete on a live
            leaderboard as everyone logs reps.
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
            <li>Share the invite link with friends so they can join.</li>
            <li>
              Log reps every day, hit daily goals, and race to the milestone.
            </li>
          </ol>
        </div>
      </section>
    </>
  );
}
