import { NextResponse } from 'next/server';

// electron-builder win(nsis) 산출물. build 설정의 nsis.artifactName 과 파일명을 맞춘다.
// 아직 릴리스에 Windows 바이너리가 없으면 이 URL은 404 — CI(또는 Windows에서 npm run agent:app:dist)로
// 빌드해 v0.2.0 릴리스에 업로드해야 동작한다.
const WINDOWS_RELEASE_ASSET_URL =
  'https://github.com/ganggyunggyu/viro/releases/download/v0.2.0/Viro-0.2.0-setup.exe';

export const GET = (): Response =>
  NextResponse.redirect(WINDOWS_RELEASE_ASSET_URL, {
    status: 307,
    headers: {
      'Cache-Control': 'public, max-age=300',
    },
  });
