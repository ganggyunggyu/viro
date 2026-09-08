const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const DABUT_ORIGIN = IS_DEVELOPMENT ? 'http://127.0.0.1:5522' : 'https://21lab-ai-agent.vercel.app';
const EXPOSURE_ORIGIN = IS_DEVELOPMENT ? 'http://127.0.0.1:5524' : 'https://blog-cron-bot-production.up.railway.app';

export const LANDING_LINKS = {
  service: '/',
  dabut: `${DABUT_ORIGIN}/landing/dabut`,
  viro: '/landing',
  exposure: `${EXPOSURE_ORIGIN}/landing`,
  overview: `${DABUT_ORIGIN}/landing`,
  ply: 'https://ply-browser.vercel.app/',
} as const;
