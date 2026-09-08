import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { load } from 'cheerio';

const requireLanding = () => {
  assert.ok(existsSync(resolve('src/app/landing/page.tsx')), 'Viro 프로젝트가 /landing 페이지를 제공해야 합니다.');
};

test('소개 페이지는 자체 서비스로 진입하고 다른 프로젝트는 절대 주소로 연결한다', async () => {
  requireLanding();
  const { LandingPage } = await import('@/app/landing/_components/landing-page');
  const $ = load(renderToStaticMarkup(createElement(LandingPage)));
  assert.match($('h1').text(), /여러 계정의 발행을/);
  assert.equal($('.product-header .product-button').attr('href'), '/');
  assert.equal($('.hero-actions .product-button').attr('href'), '/');
  assert.match($('.hero-actions .product-button').text(), /바이로 사용해보기/);
  assert.equal($('.product-closing .product-button').attr('href'), '/');
  assert.equal($('a[href="#experience"]').length, 1);
  const links = $('.product-nav a').map((_, element) => $(element).attr('href')).get();
  assert.deepEqual(links, [
    'https://21lab-ai-agent.vercel.app/landing/dabut', '/landing',
    'https://blog-cron-bot-production.up.railway.app/landing',
  ]);
});

test('계정 준비부터 진행 확인까지 접근 가능한 세 단계와 FAQ를 제공한다', async () => {
  requireLanding();
  const { LandingPage } = await import('@/app/landing/_components/landing-page');
  const $ = load(renderToStaticMarkup(createElement(LandingPage)));
  assert.equal($('.demo-sidebar button').length, 3);
  assert.equal($('.demo-sidebar button[aria-pressed="true"]').text().trim(), '01계정 준비');
  assert.equal($('#stage-preview').attr('aria-live'), 'polite');
  assert.equal($('#questions details').length, 3);
  assert.equal($('#workflow ol li').length, 4);
  assert.match($('#workflow').text(), /작업 접수만으로 게시가 완료된 것은 아니며/);
});

test('단계에 맞는 예시 결과를 보여주며 확인이 필요한 작업을 완료로 표시하지 않는다', async () => {
  requireLanding();
  const { QueueScene } = await import('@/app/landing/_components/queue-scene');
  const prepare = renderToStaticMarkup(createElement(QueueScene, { activeStage: 0 }));
  const publish = renderToStaticMarkup(createElement(QueueScene, { activeStage: 1 }));
  const result = renderToStaticMarkup(createElement(QueueScene, { activeStage: 2 }));
  assert.match(prepare, /게시판 연결/);
  assert.match(publish, /본문 발행/);
  assert.match(publish, /대댓글 대기/);
  assert.match(result, /처리 완료/);
  assert.match(result, /확인 필요/);
  assert.match(result, /세션 확인/);
});

test('공개 접근은 소개 페이지에만 적용하고 서비스 화면의 인증을 유지한다', async () => {
  requireLanding();
  const { isStandaloneLanding } = await import('@/app/public-route');
  assert.equal(isStandaloneLanding('/landing'), true);
  for (const path of ['/', '/manual-post', '/accounts', '/landing-secret', '/landing/admin']) {
    assert.equal(isStandaloneLanding(path), false, path);
  }
});
