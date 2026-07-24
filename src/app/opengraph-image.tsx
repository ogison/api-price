import { ImageResponse } from 'next/og';
import { SITE_NAME } from '@/lib/constants/site';

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Latin-only copy so the default Satori font renders without fetching a
// Japanese webfont at build time (which is unavailable offline).
const TAGLINE = 'Compare LLM API pricing';
const SUBLINE = 'OpenAI · Google (Vertex AI) · Anthropic · Sakura AI';

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '80px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#f8fafc',
      }}
    >
      <div style={{ fontSize: 40, color: '#38bdf8', marginBottom: 16 }}>
        {TAGLINE}
      </div>
      <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.1 }}>
        {SITE_NAME}
      </div>
      <div style={{ fontSize: 34, color: '#94a3b8', marginTop: 28 }}>
        {SUBLINE}
      </div>
    </div>,
    { ...size }
  );
}
