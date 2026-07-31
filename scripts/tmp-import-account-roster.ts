import { connectDB } from '../src/shared/lib/mongodb';
import { Account } from '../src/shared/models/account';
import { User } from '../src/shared/models/user';

const LOGIN_ID = '21lab';

const RAW = `
	우동사리	https://m.blog.naver.com/godqhr5528	godqhr5528	@kim3903		gkgb404	6개월 11월8일
	대전치과	https://m.blog.naver.com/alstjs9711	alstjs9711	min39123725	사용x		최블
	양지부동산	https://m.blog.naver.com/jjs216	jjs216	dong@1105	사용x		최블
						gkgb707
	MEGATATTOO	https://m.blog.naver.com/megatattoo	megatattoo	mega9621!!		gkgb123
	너구리	https://m.blog.naver.com/odori2007?tab=1	odori2007	minako0305@		gkgb505	6개월 11월 21일
	블루망고	https://m.blog.naver.com/busansmart	busansmart	0854aabb@@		gkgb321
						gkgb404
						gkgb321
	렙용	https://m.blog.naver.com/vegetable10517	vegetable10517	jito308149		gkgb6666	준5
	렙용	https://m.blog.naver.com/rational4640	rational4640	jito308151			준5
	레플전용	https://m.blog.naver.com/hugeda14713	hugeda14713	jito308156		gkgb6060
	빨간모자앤  1	https://m.blog.naver.com/dhtksk1p	dhtksk1p	dhtksk1pp	흑염소	gkgb9900	은빈씨	라준사 가입
	소원 1	https://m.blog.naver.com/regular14631?tab=1	regular14631	r46f9sqy1	흑염소		미정씨 	라준사 가입
	똑똑한건희씨	https://m.blog.naver.com/orangeswan630	orangeswan630	l@psz9d%1	추상의구체화		경혜	260331 신규
	고래낚시 1	https://m.blog.naver.com/bigfish773	bigfish773	%3p#lape1	추상의구체화		대한 (어머님)	260401 신규
	에스앤비안과 1 (노출)	https://m.blog.naver.com/nes1p2kx?tab=1	nes1p2kx	ua(9rr5g	안과	gkgb4040	규홍	260326 신규
	에스앤비안과 2 (노출)	https://m.blog.naver.com/mh8j62wm?tab=1	mh8j62wm	bn5vkh6a1	안과		규홍	260326 신규
	에스앤비안과 정보	https://blog.naver.com/h9ag469z	h9ag469z	z*&dc#bc	에스앤비안과	gkgb4004	970706
	에스앤비안과, 29년 경력 (노출)	https://blog.naver.com/dq1h3bjy	dq1h3bjy	rls*te%k	에스앤비안과		이승주 담당자
	에스앤비안과의원 - 교체	https://m.blog.naver.com/hagyga?tab=1	hagyga	dptmdosql2020	에스앤비안과		지현우 이사님
	모험 - 교체	https://m.blog.naver.com/geenl?tab=1	geenl	dptmdosql2020	에스앤비안과-백업		지현우 이사님
	탐험기 - 교체	https://m.blog.naver.com/ghhoy?tab=1	ghhoy	dptmdosql2020	에스앤비안과-백업		이승주 담당자
	앵그리맨	https://m.blog.naver.com/angrykoala270?tab=1	angrykoala270	*&#o$xg81	법률	gkgb4400	대한 (진리)	260331 신규
	티니피쉬 1	https://m.blog.naver.com/tinyfish183	tinyfish183	s55n9jne1	윤슬		철헌	260331 신규
	강아지강하지 1	https://m.blog.naver.com/k7d9x2m4?tab=1	k7d9x2m4	p3v8n2@k5q	도그마루 글밥		위대한
	라우드 2 (5개) 1 (비밀번호 오류)	https://m.blog.naver.com/loand3324?tab=1	loand3324	akfalwk11!	도그마루 글밥	gkgb1110	대표님
	고구마스틱2 (10개) 1	https://m.blog.naver.com/fail5644?tab=1	fail5644	akfalwk12!	도그마루 글밥		대표님
	룰루랄라 2 (12개) 1	https://m.blog.naver.com/compare14310?tab=1	compare14310	akfalwk12!	도그마루 글밥		민지
					도그마루 글밥		준효
					도그마루 글밥	gkgb5050	위대한	260528 추가 실명인증 가능
	실눈캐	https://m.blog.naver.com/PostList.naver?blogId=ghostrush7&tab=1	ghostrush7	dashrun1!	도그마루 글밥		이지헌
	 		b6x2k9w3	y5t1p8?m3q	도그마루 글밥		경규 (찬호)
	햄부기	https://m.blog.naver.com/ahfflwl123?tab=1	ahfflwl123	sksekgh1	서리펫	gkgb6600	준효
	바삭바삭해 1	https://m.blog.naver.com/ahffkdlek12	ahffkdlek12	sksekgh1	서리펫		명식
			8ua1womn	efe9uwk71	서리펫		명식
	쉽고간단하게	https://m.blog.naver.com/ahsxkfldk12?tab=1	ahsxkfldk12	sksekgh1	서리펫		민지
	긍정이백퍼  1	https://m.blog.naver.com/ahffkekd12	ahffkekd12	sksekgh1	흑염소	gkgb4400	철헌
	포비 1	https://m.blog.naver.com/PostList.naver?blogId=q9v3m7a2&tab=1	q9v3m7a2	n4x8k2!r6o	흑염소		반이진
	도도 1 	https://m.blog.naver.com/laghunter8	laghunter8	fastplay7?	흑염소	gkgb2000	대한 (진리)
	오세아니야 1	https://m.blog.naver.com/eghfsa5478?tab=1	eghfsa5478	akfakfalalwkwk12	흑염소		세휘
	건강박사석사 1	https://m.blog.naver.com/pixelninja3	pixelninja3	stealth9@	흑염소		원윤준 팀장님
					흑염소	gkgb3000	대한 (어머님)	인증중
	고양이밥 1	https://m.blog.naver.com/n7c3w8z2?tab=1	n7c3w8z2	q5x9@t2m6p	서리펫		미정
	리스팩식스팩 1	https://m.blog.naver.com/respawnking9?tab=1	respawnking9	comeback3@	서리펫		파트장님 (상웅)
`;

const KNOWN_CATEGORIES = new Set([
  '흑염소', '도그마루 글밥', '서리펫', '안과', '법률', '윤슬', '추상의구체화',
  '에스앤비안과', '에스앤비안과-백업', '사용x',
]);

interface ParsedRow {
  raw: string;
  nickname?: string;
  blogUrl?: string;
  accountId?: string;
  password?: string;
  category?: string;
  mvpn?: string;
  owner?: string;
  note?: string;
}

const parseLine = (line: string): ParsedRow | null => {
  const cols = line.split('\t').map((c) => c.trim());
  if (cols.every((c) => !c)) return null;

  const nonEmpty = cols.filter(Boolean);
  if (nonEmpty.length === 0) return null;

  const urlIdx = cols.findIndex((c) => /blog\.naver\.com/i.test(c));
  let blogUrl: string | undefined;
  let accountId: string | undefined;
  let password: string | undefined;
  let nickname: string | undefined;
  let restStartIdx = 0;

  if (urlIdx >= 0) {
    blogUrl = cols[urlIdx];
    nickname = cols[urlIdx - 1] || undefined;
    accountId = cols[urlIdx + 1] || undefined;
    password = cols[urlIdx + 2] || undefined;
    restStartIdx = urlIdx + 3;

    // blogId in URL as fallback/verification
    const urlIdMatch = blogUrl.match(/blog\.naver\.com\/(?:PostList\.naver\?blogId=)?([a-zA-Z0-9_-]+)/i);
    const urlBlogId = urlIdMatch?.[1];
    if (!accountId && urlBlogId) accountId = urlBlogId;
  } else {
    // no URL column present — look for accountId directly (row has only id+password+meta)
    // pattern: first alnum-ish token that's not a known category/mvpn/etc is accountId
    for (let i = 0; i < cols.length; i++) {
      const c = cols[i];
      if (!c) continue;
      if (/^gkgb\d+$/i.test(c)) continue;
      if (KNOWN_CATEGORIES.has(c)) continue;
      if (!/^[a-zA-Z0-9_-]+$/.test(c)) continue; // 네이버 아이디는 한글/공백/특수문자 없음 — 담당자명 등 오탐 방지
      accountId = c;
      password = cols[i + 1] || undefined;
      restStartIdx = i + 2;
      break;
    }
  }

  if (!accountId || !/^[a-zA-Z0-9_-]+$/.test(accountId)) return null;

  const rest = cols.slice(restStartIdx).filter(Boolean);
  let category: string | undefined;
  let mvpn: string | undefined;
  const remaining: string[] = [];

  for (const token of rest) {
    if (/^gkgb\d+$/i.test(token)) {
      mvpn = token;
    } else if (KNOWN_CATEGORIES.has(token)) {
      category = token;
    } else {
      remaining.push(token);
    }
  }

  // heuristic: short (<=6 chars, no digits) tokens look like an owner name; longer/date-like -> note
  let owner: string | undefined;
  let note: string | undefined;
  for (const token of remaining) {
    const looksLikeOwner = token.length <= 10 && !/\d{2,}/.test(token);
    if (!owner && looksLikeOwner) {
      owner = token;
    } else if (!note) {
      note = token;
    } else {
      note = `${note} / ${token}`;
    }
  }

  return { raw: line, nickname, blogUrl, accountId, password, category, mvpn, owner, note };
};

const main = async () => {
  await connectDB();
  const user = await User.findOne({ loginId: LOGIN_ID }).lean();
  if (!user) throw new Error('user not found');

  const lines = RAW.split('\n');
  const parsed: ParsedRow[] = [];
  const skipped: string[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const row = parseLine(line);
    if (!row || !row.accountId || !row.password) {
      if (line.trim()) skipped.push(line);
      continue;
    }
    parsed.push(row);
  }

  console.log(`총 ${parsed.length}건 파싱됨, 스킵 ${skipped.length}건`);
  console.log('\n--- 스킵된 줄(계정정보 없음, 예비 mvpn 등) ---');
  skipped.forEach((s) => console.log(JSON.stringify(s)));

  console.log('\n--- 파싱 결과 미리보기 (비밀번호 마스킹) ---');
  parsed.forEach((r) => {
    console.log(
      `${r.accountId} | pw=${r.password ? r.password[0] + '***' : '-'} | nick=${r.nickname || '-'} | cat=${r.category || '-'} | mvpn=${r.mvpn || '-'} | owner=${r.owner || '-'} | note=${r.note || '-'}`,
    );
  });

  if (!process.argv.includes('--write')) {
    console.log('\n[DRY RUN] --write 없이 실행됨. DB에 아무것도 쓰지 않았음.');
    process.exit(0);
  }

  const existing = await Account.find({ userId: user.userId }).select('accountId').lean();
  const existingIds = new Set(existing.map((a) => a.accountId));

  let created = 0;
  let updated = 0;

  for (const row of parsed) {
    const isNew = !existingIds.has(row.accountId!);
    const setFields: Record<string, unknown> = {
      password: row.password,
    };
    if (row.nickname) setFields.nickname = row.nickname;
    if (row.mvpn) setFields.mvpn = row.mvpn;
    if (row.category) setFields.campaignTag = row.category;
    if (row.blogUrl || row.category || row.owner || row.note) {
      setFields.sheetMeta = {
        ...(row.blogUrl ? { blogUrl: row.blogUrl } : {}),
        ...(row.category ? { category: row.category } : {}),
        ...(row.owner ? { owner: row.owner } : {}),
        ...(row.note ? { masterNote: row.note } : {}),
      };
    }

    const setOnInsert: Record<string, unknown> = {
      userId: user.userId,
      accountId: row.accountId,
      role: 'commenter',
      isActive: true,
    };

    await Account.updateOne(
      { userId: user.userId, accountId: row.accountId },
      { $set: setFields, $setOnInsert: setOnInsert },
      { upsert: true },
    );

    if (isNew) created++;
    else updated++;
  }

  console.log(`\n신규 생성 ${created}건, 기존 업데이트 ${updated}건`);
  process.exit(0);
};

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
