import { ImageResponse } from 'next/og';
import { SITE_NAME } from '@/lib/seo';

export const alt = `${SITE_NAME} – Fitness Challenge Tracker`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #111827, #1f2937 55%, #7c2d12)',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 140, fontWeight: 800, color: '#facc15' }}>
          {SITE_NAME}
        </div>
        <div style={{ fontSize: 48, marginTop: 16 }}>
          Fitness challenges with friends
        </div>
        <div style={{ fontSize: 32, marginTop: 24, color: '#d1d5db' }}>
          Pushups · Planks · Custom exercises
        </div>
      </div>
    ),
    size,
  );
}
