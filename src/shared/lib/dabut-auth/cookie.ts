export const DABUT_COOKIE_NAME = 'cafe-bot-user-id';
export const serviceCookieOptions = (expiresAt: string) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: Math.max(0, Math.floor((Date.parse(expiresAt) - Date.now()) / 1000)),
});
