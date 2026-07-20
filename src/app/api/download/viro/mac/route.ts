import { NextResponse } from 'next/server';

const MAC_RELEASE_ASSET_URL =
  'https://github.com/ganggyunggyu/viro/releases/download/v0.2.0/Viro-0.2.0-arm64.dmg';

export const GET = (): Response =>
  NextResponse.redirect(MAC_RELEASE_ASSET_URL, {
    status: 307,
    headers: {
      'Cache-Control': 'public, max-age=300',
    },
  });
