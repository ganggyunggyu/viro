/**
 * 캡처를 data URI로 박아 넣은 단일 HTML 가이드를 만든다.
 * (Artifact는 외부 호스트를 막으므로 이미지를 인라인해야 한다)
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const SHOT_DIR = join(process.cwd(), 'docs', 'guide-shots');
const OUT = join(process.cwd(), 'docs', 'cafe-publish-guide.html');

const img = (name: string): string => {
  const b64 = readFileSync(join(SHOT_DIR, `${name}.png`)).toString('base64');
  return `data:image/png;base64,${b64}`;
};

const SHOTS = {
  commentJobs: img('01-comment-jobs'),
  commentStyle: img('02-comment-style'),
  commentAdvanced: img('03-comment-advanced'),
  publish: img('04-publish'),
  manualPost: img('05-manual-post'),
  queue: img('06-queue'),
};

const html = `<title>카페 발행·댓글 작업 가이드</title>
<style>
  :root {
    --paper: #faf9f6;
    --panel: #ffffff;
    --ink: #14201d;
    --ink-soft: #3d4d48;
    --muted: #6c7b75;
    --line: #e2e6e3;
    --accent: #1b6f5e;
    --accent-soft: #e6f1ee;
    --warn: #a8481a;
    --warn-soft: #fbeee6;
    --ok: #2f7d4f;
    --shot-frame: #dfe4e1;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --paper: #0f1614;
      --panel: #16201d;
      --ink: #e8efec;
      --ink-soft: #b6c4bf;
      --muted: #8397908;
      --muted: #839790;
      --line: #26332f;
      --accent: #5fc4aa;
      --accent-soft: #16302a;
      --warn: #e89463;
      --warn-soft: #2e2018;
      --ok: #6cc38c;
      --shot-frame: #26332f;
    }
  }
  :root[data-theme="dark"] {
    --paper: #0f1614; --panel: #16201d; --ink: #e8efec; --ink-soft: #b6c4bf;
    --muted: #839790; --line: #26332f; --accent: #5fc4aa; --accent-soft: #16302a;
    --warn: #e89463; --warn-soft: #2e2018; --ok: #6cc38c; --shot-frame: #26332f;
  }
  :root[data-theme="light"] {
    --paper: #faf9f6; --panel: #ffffff; --ink: #14201d; --ink-soft: #3d4d48;
    --muted: #6c7b75; --line: #e2e6e3; --accent: #1b6f5e; --accent-soft: #e6f1ee;
    --warn: #a8481a; --warn-soft: #fbeee6; --ok: #2f7d4f; --shot-frame: #dfe4e1;
  }

  body {
    margin: 0;
    background: var(--paper);
    color: var(--ink);
    font-family: Pretendard, "Apple SD Gothic Neo", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    font-size: 16px;
    line-height: 1.75;
    -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 980px; margin: 0 auto; padding: 56px 24px 120px; }

  header { border-bottom: 2px solid var(--ink); padding-bottom: 28px; margin-bottom: 12px; }
  .eyebrow {
    font-size: 12px; letter-spacing: .14em; text-transform: uppercase;
    color: var(--accent); font-weight: 700; margin: 0 0 10px;
  }
  h1 { font-size: clamp(30px, 4.4vw, 44px); line-height: 1.2; margin: 0 0 12px; letter-spacing: -.02em; text-wrap: balance; }
  .lede { font-size: 17px; color: var(--ink-soft); margin: 0; max-width: 62ch; }

  .step { display: grid; grid-template-columns: 56px 1fr; gap: 20px; padding: 44px 0; border-bottom: 1px solid var(--line); }
  .step:last-of-type { border-bottom: 0; }
  .num {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 13px; font-weight: 600; color: var(--accent);
    border-top: 2px solid var(--accent); padding-top: 8px;
    font-variant-numeric: tabular-nums;
  }
  h2 { font-size: 24px; margin: 0 0 6px; letter-spacing: -.015em; text-wrap: balance; }
  .sub { color: var(--muted); font-size: 14px; margin: 0 0 20px; }
  p { margin: 0 0 14px; max-width: 64ch; }

  .shot { margin: 22px 0 8px; border: 1px solid var(--shot-frame); border-radius: 10px; overflow: hidden; background: var(--panel); }
  .shot img { display: block; width: 100%; height: auto; }
  .cap { font-size: 13px; color: var(--muted); margin: 0 0 18px; }

  pre {
    background: var(--panel); border: 1px solid var(--line); border-left: 3px solid var(--accent);
    border-radius: 8px; padding: 14px 16px; overflow-x: auto;
    font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 13.5px; line-height: 1.65;
    margin: 0 0 16px;
  }
  code { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: .92em; background: var(--accent-soft); color: var(--accent); padding: 1px 6px; border-radius: 4px; }
  pre code { background: none; color: inherit; padding: 0; }

  .box { border-radius: 10px; padding: 16px 18px; margin: 0 0 18px; border: 1px solid var(--line); background: var(--panel); }
  .box.warn { border-color: color-mix(in srgb, var(--warn) 35%, transparent); background: var(--warn-soft); }
  .box.tip { border-color: color-mix(in srgb, var(--accent) 30%, transparent); background: var(--accent-soft); }
  .box p:last-child { margin-bottom: 0; }
  .box .label { font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; margin: 0 0 6px; }
  .box.warn .label { color: var(--warn); }
  .box.tip .label { color: var(--accent); }

  .tblwrap { overflow-x: auto; margin: 0 0 18px; }
  table { border-collapse: collapse; width: 100%; font-size: 14.5px; }
  th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--line); vertical-align: top; }
  th { font-size: 12px; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); font-weight: 700; }
  td.n { font-variant-numeric: tabular-nums; font-family: ui-monospace, Menlo, monospace; }

  ul { margin: 0 0 14px; padding-left: 20px; }
  li { margin-bottom: 7px; max-width: 62ch; }
  strong { font-weight: 700; }
  .pill { display: inline-block; font-size: 12px; font-weight: 700; padding: 3px 9px; border-radius: 99px; background: var(--accent-soft); color: var(--accent); vertical-align: middle; }
  .pill.no { background: var(--warn-soft); color: var(--warn); }

  footer { margin-top: 56px; padding-top: 20px; border-top: 1px solid var(--line); color: var(--muted); font-size: 13.5px; }
</style>

<div class="wrap">
  <header>
    <p class="eyebrow">Viro 운영 매뉴얼</p>
    <h1>카페 발행하고 댓글 다는 법</h1>
    <p class="lede">발행은 이제 매일 아침 9시에 알아서 돌아간다. 손으로 할 일은 댓글 작업뿐이고, 그건 브라우저에서 바로 된다.</p>
  </header>

  <section class="step">
    <div class="num">01</div>
    <div>
      <h2>발행은 이미 자동이다</h2>
      <p class="sub">매일 오전 9시 · 맛집 3카페 × 3편 = 9편</p>
      <p>맥에 스케줄을 걸어놨다. 맥이 켜져 있기만 하면 아침 9시에 알아서 돈다. 미식노트, 한끼일기, 맛기행 세 곳에 각각 3편씩 올라간다.</p>
      <p>원고 서버(dabut-backend)가 꺼져 있으면 발행이 통째로 실패하는데, 스케줄 스크립트가 먼저 서버를 켜고 준비될 때까지 기다린 다음 발행을 시작하니 신경 안 써도 된다.</p>

      <div class="box tip">
        <p class="label">돌았는지 확인</p>
        <pre><code>tail -30 ~/Programing/.automation/logs/cafe-matjip-publish.out.log</code></pre>
        <p>마지막 줄에 <code>전체 완료: 성공 9 / 실패 0</code>이 찍혀 있으면 정상이다.</p>
      </div>

      <p>시간을 바꾸고 싶으면 <code>~/Library/LaunchAgents/com.ganggyunggyu.cafe-bot.matjip-publish.plist</code>에서 <code>Hour</code>를 고치고 다시 로드하면 된다.</p>
      <pre><code>launchctl unload ~/Library/LaunchAgents/com.ganggyunggyu.cafe-bot.matjip-publish.plist
launchctl load ~/Library/LaunchAgents/com.ganggyunggyu.cafe-bot.matjip-publish.plist</code></pre>
    </div>
  </section>

  <section class="step">
    <div class="num">02</div>
    <div>
      <h2>지금 당장 발행하고 싶을 때</h2>
      <p class="sub">스케줄 기다리지 않고 손으로</p>
      <p>터미널에서 한 줄이면 된다. 스케줄이 쓰는 스크립트와 같은 것이라 결과도 똑같다.</p>
      <pre><code>~/Programing/.automation/run-cafe-matjip-publish.sh</code></pre>
      <p>카페 3곳이 동시에 돌고, 한 카페 안에서는 글 사이에 10분씩 쉰다. 전부 끝나는 데 20분쯤 걸린다.</p>

      <div class="box">
        <p class="label">키워드 바꾸려면</p>
        <p><code>scripts/publish-3-matjip-cafes-daily.ts</code> 안의 <code>KEYWORD_POOL</code> 배열만 고치면 된다. 거기서 랜덤으로 9개를 뽑아 쓴다.</p>
      </div>
    </div>
  </section>

  <section class="step">
    <div class="num">03</div>
    <div>
      <h2>댓글 작업 — 여기가 진짜 UI 작업</h2>
      <p class="sub">브라우저에서 바로 된다 <span class="pill">데스크톱 앱 필요 없음</span></p>
      <p>왼쪽 메뉴에서 <strong>댓글 작업</strong>을 연다. 위쪽 초록 띠에 "워커 연결됨"이라고 떠 있으면 등록하는 즉시 처리된다. 회색이면 워커가 꺼진 거라 <code>pm2 resurrect</code>로 살려야 한다.</p>

      <div class="shot"><img src="${SHOTS.commentJobs}" alt="댓글 작업 화면" /></div>
      <p class="cap">댓글 작업 첫 화면. 위쪽 띠가 워커 상태다.</p>

      <p>쓰는 법은 단순하다. 카페 글 링크를 <strong>그냥 붙여넣는다</strong>. 카톡에서 대화째로 복사해도 링크만 알아서 골라낸다. 여러 개 한꺼번에 넣어도 된다. 링크를 인식하면 버튼이 "3개 글에 댓글 달기"처럼 바뀐다.</p>

      <div class="box tip">
        <p class="label">어떤 링크든 된다</p>
        <ul>
          <li><code>cafe.naver.com/babsangnote702/14</code> — 일반 주소</li>
          <li><code>naver.me/5c8bfNME</code> — 단축 주소</li>
          <li><code>cafe.naver.com/ca-fe/cafes/31640041/articles/91</code> — 카페 ID 형태</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="step">
    <div class="num">04</div>
    <div>
      <h2>댓글 어조 고르기</h2>
      <p class="sub">본문 되짚기 / 티키타카 질문</p>
      <p>"AI 자동 작성"을 고르면 어조 버튼 두 개가 나온다. 글 하나당 댓글 8개가 붙는 건 양쪽 다 같고, 말투만 다르다.</p>

      <div class="shot"><img src="${SHOTS.commentStyle}" alt="댓글 어조 선택" /></div>
      <p class="cap">티키타카 질문을 고른 상태. 아래 목록에도 어떤 어조로 돌았는지 표시된다.</p>

      <div class="tblwrap">
        <table>
          <thead><tr><th>어조</th><th>어떤 댓글이 달리나</th><th>언제 쓰나</th></tr></thead>
          <tbody>
            <tr>
              <td><strong>본문 되짚기</strong></td>
              <td>글에서 인상 깊은 대목을 각자 자기 말로 풀어 설명</td>
              <td>정보성 글, 후기 글</td>
            </tr>
            <tr>
              <td><strong>티키타카 질문</strong></td>
              <td>본문을 짚고 글쓴이한테 궁금한 걸 하나씩 물어봄</td>
              <td>댓글이 오가는 느낌을 내고 싶을 때</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>티키타카는 8개 댓글에 각각 다른 질문 각도(방법·기준·상황·비교·경험·예외·정도·다음단계)를 배정해서 만든다. 그래서 여덟 개가 같은 틀로 찍혀 나오지 않는다.</p>
    </div>
  </section>

  <section class="step">
    <div class="num">05</div>
    <div>
      <h2>댓글 부족한 글 한꺼번에 채우기</h2>
      <p class="sub">운영자 도구 → 지금 스캔</p>
      <p>링크를 일일이 넣기 귀찮으면 아래 <strong>운영자 도구</strong>를 펼친다. "지금 스캔"을 누르면 등록된 카페 전부를 돌면서 댓글 3개 이하인 글을 찾아 자동으로 큐에 넣는다.</p>

      <div class="shot"><img src="${SHOTS.commentAdvanced}" alt="운영자 도구 패널" /></div>
      <p class="cap">스캔은 위에서 고른 어조를 그대로 쓴다. 어떤 어조로 돌지 여기 표시된다.</p>

      <div class="box warn">
        <p class="label">한 번에 꽤 많이 잡힌다</p>
        <p>카페 37곳을 훑으면 보통 100~350건이 큐에 들어간다. 글당 8개씩이니 댓글 수천 개다. 스캔 전에 어조를 먼저 확인하고 누르는 게 좋다.</p>
      </div>

      <p>큐가 얼마나 남았는지는 아래 <strong>최근 작업</strong> 목록에서 바로 보인다. 대기 → 진행 중 → 완료 순으로 상태가 바뀐다.</p>
    </div>
  </section>

  <section class="step">
    <div class="num">06</div>
    <div>
      <h2>UI에서 글을 발행하려면</h2>
      <p class="sub">이건 데스크톱 앱이 있어야 한다 <span class="pill no">브라우저만으론 안 됨</span></p>
      <p>분리 발행이나 수동 발행 화면은 브라우저에서 열어도 버튼이 안 먹는다. "이 기능은 Viro 데스크톱 프로그램에서 실행하세요"가 뜬다. 네이버에 실제로 글을 쓰는 건 로컬 크롬이 하는 일이라 그렇다.</p>

      <div class="shot"><img src="${SHOTS.publish}" alt="분리 발행 화면" /></div>
      <p class="cap">분리 발행. 데스크톱 앱 안에서 열어야 실제로 동작한다.</p>

      <p>쓰려면 순서가 이렇다.</p>
      <ul>
        <li><code>npm run agent:app</code>으로 Viro 앱을 켠다</li>
        <li>브라우저에서 <strong>프로그램</strong> 메뉴에 들어가 연결 토큰을 발급받는다</li>
        <li>앱 연결 설정에 토큰을 붙여넣는다 (한 번만 하면 됨)</li>
        <li>그다음부터는 <strong>앱 창 안에서</strong> 분리 발행을 쓴다</li>
      </ul>

      <div class="box tip">
        <p class="label">계정은 정리해뒀다</p>
        <p>맛집 3카페의 주인 계정을 각자 자기 카페 전담으로 묶어놨다. 예전엔 UI로 발행하면 그 카페와 상관없는 계정이 뽑혀서 엉뚱한 명의로 글이 올라갈 수 있었는데, 이제 미식노트는 앵그리맨, 한끼일기는 모험, 맛기행은 채송민1로 고정된다.</p>
      </div>

      <div class="shot"><img src="${SHOTS.manualPost}" alt="수동 발행 화면" /></div>
      <p class="cap">수동 발행. 써둔 원고 폴더를 드래그해서 그대로 올릴 때 쓴다.</p>
    </div>
  </section>

  <section class="step">
    <div class="num">07</div>
    <div>
      <h2>안 될 때 여기부터 본다</h2>
      <p class="sub">막히면 대부분 아래 넷 중 하나다</p>

      <div class="tblwrap">
        <table>
          <thead><tr><th>증상</th><th>원인</th><th>조치</th></tr></thead>
          <tbody>
            <tr>
              <td>발행이 <code>fetch failed</code>로 전부 실패</td>
              <td>원고 서버가 꺼짐</td>
              <td><code>curl localhost:8000/docs</code>로 확인, 죽었으면 다시 켜기</td>
            </tr>
            <tr>
              <td>글은 올라갔는데 이미지가 0장</td>
              <td>원고 서버가 옛날 상태로 떠 있음</td>
              <td>서버 재시작. 이미지는 GPT-5.6-luna로 생성된다</td>
            </tr>
            <tr>
              <td>댓글이 등록만 되고 안 붙음</td>
              <td>워커가 꺼짐</td>
              <td><code>pm2 resurrect</code> 후 <code>pm2 ls</code>로 확인</td>
            </tr>
            <tr>
              <td>로그인 단계에서 계속 실패</td>
              <td>캡차 풀이 API 잔액</td>
              <td>캡차는 지금 GPT-5.6-luna로 돌고 있다. OpenAI 잔액 확인</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="shot"><img src="${SHOTS.queue}" alt="큐 대시보드" /></div>
      <p class="cap">큐 화면. 예약된 작업이 어디까지 갔는지 볼 수 있다.</p>
    </div>
  </section>

  <footer>
    화면은 실제 Viro에서 캡처했다. UI가 바뀌면 <code>scripts/tmp-capture-ui-guide.ts</code>를 다시 돌려 갱신하면 된다.
  </footer>
</div>
`;

writeFileSync(OUT, html, 'utf8');
console.log(`생성: ${OUT}`);
console.log(`크기: ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB`);
