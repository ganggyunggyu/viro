import { NextResponse } from 'next/server';

// electron-builder win(nsis) 산출물. build 설정의 artifactName 과 파일명을 맞춘다.
const WINDOWS_RELEASE_ASSET_URL =
  'https://github.com/ganggyunggyu/viro/releases/download/v0.2.2/Viro-0.2.2-setup.exe';

export const GET = (): Response =>
  NextResponse.redirect(WINDOWS_RELEASE_ASSET_URL, {
    status: 307,
    headers: {
      'Cache-Control': 'public, max-age=300',
    },
  });
