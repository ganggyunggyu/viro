/**
 * 등록된 전 카페의 현재 상태를 라이브로 확인한다.
 * 카페별 최근 글 목록을 실제로 읽어 오늘 발행 수와 댓글 부족 글 수를 센다.
 */
import { connectDB } from '../src/shared/lib/mongodb';
import { getAllCafes } from '../src/shared/config/cafes';
import { getCommenterAccounts } from '../src/shared/config/accounts';
import { browseCafePosts } from '../src/shared/lib/cafe-browser';
import { closeAllContexts } from '../src/shared/lib/multi-session';

const LAB_USER_ID = 'user-1768955529317';
const PER_PAGE = 20;
const LOW_COMMENT_THRESHOLD = 3;

const toKstDateKey = (ts: number): string =>
  new Date(ts + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

interface Row {
  name: string;
  slug: string;
  total: number;
  today: number;
  low: number;
  zero: number;
  latest: string;
  error?: string;
}

const main = async () => {
  await connectDB();
  const today = toKstDateKey(Date.now());
  const cafes = await getAllCafes(LAB_USER_ID);
  const viewers = (await getCommenterAccounts(LAB_USER_ID)).filter(
    (a) => !a.excludeFromAutoComment,
  );

  console.log(`오늘(KST): ${today} · 카페 ${cafes.length}곳 · 조회 계정 ${viewers.length}개\n`);

  const rows: Row[] = [];

  for (let i = 0; i < cafes.length; i += 1) {
    const cafe = cafes[i];
    const viewer = viewers[i % viewers.length];

    const browsed = await browseCafePosts(viewer, cafe.cafeId, undefined, {
      page: 1,
      perPage: PER_PAGE,
      cafeUrl: cafe.cafeUrl,
    });

    if (!browsed.success) {
      rows.push({
        name: cafe.name,
        slug: cafe.cafeUrl,
        total: 0,
        today: 0,
        low: 0,
        zero: 0,
        latest: '-',
        error: browsed.error,
      });
      console.log(`[${i + 1}/${cafes.length}] ${cafe.name} — 조회 실패: ${browsed.error}`);
      continue;
    }

    const articles = browsed.articles;
    const todayCount = articles.filter((a) => toKstDateKey(a.writeDateTimestamp) === today).length;
    const low = articles.filter((a) => a.commentCount <= LOW_COMMENT_THRESHOLD).length;
    const zero = articles.filter((a) => a.commentCount === 0).length;
    const latest = articles.length > 0 ? toKstDateKey(articles[0].writeDateTimestamp) : '-';

    rows.push({
      name: cafe.name,
      slug: cafe.cafeUrl,
      total: articles.length,
      today: todayCount,
      low,
      zero,
      latest,
    });

    console.log(
      `[${i + 1}/${cafes.length}] ${cafe.name} — 오늘 ${todayCount} · 댓글부족 ${low}/${articles.length} · 최신글 ${latest}`,
    );
  }

  console.log('\n\n========== 전체 요약 ==========');
  console.log('카페명                        오늘  댓글부족  댓글0  최신글');
  console.log('-'.repeat(70));
  rows.forEach((r) => {
    if (r.error) {
      console.log(`${r.name.padEnd(28)}  조회실패: ${r.error}`);
      return;
    }
    console.log(
      `${r.name.padEnd(28)} ${String(r.today).padStart(4)} ${String(r.low).padStart(8)} ${String(r.zero).padStart(6)}  ${r.latest}`,
    );
  });

  const ok = rows.filter((r) => !r.error);
  console.log('-'.repeat(70));
  console.log(
    `합계: 오늘 ${ok.reduce((s, r) => s + r.today, 0)}건 발행 · ` +
      `댓글부족 ${ok.reduce((s, r) => s + r.low, 0)}건 · ` +
      `댓글0 ${ok.reduce((s, r) => s + r.zero, 0)}건`,
  );
  const failed = rows.filter((r) => r.error);
  if (failed.length > 0) {
    console.log(`\n조회 실패 ${failed.length}곳: ${failed.map((f) => f.name).join(', ')}`);
  }

  await closeAllContexts();
  process.exit(0);
};

main().catch(async (e) => {
  console.error('FATAL:', e instanceof Error ? e.message : e);
  await closeAllContexts();
  process.exit(1);
});
