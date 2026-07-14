import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

// check-and-fill-comments.ts가 listLiveComments를 두 번 다 "0개"로 잘못 읽어서(일시적 로딩/타이밍
// 이슈로 추정) motherrr 카페 글들에 같은 문구를 중복 게시했다. 각 글에서 문구별로 하나만 남기고
// 나머지는 삭제한다.

interface Target {
  cafeId: string;
  articleId: number;
}

const TARGETS: Target[] = [
  { cafeId: "31751094", articleId: 18 }, // motherrr
  { cafeId: "31751094", articleId: 12 }, // motherrr
];

const normalize = (s: string): string => s.replace(/\s+/g, "").trim();

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const { Account } = await import("../src/shared/models/account");
  const { closeAllContexts } = await import("../src/shared/lib/multi-session");
  const { listLiveComments, deleteCommentWithAccount } = await import(
    "../src/shared/lib/naver-cafe-writing/comment-deleter"
  );

  // qwzx16 계정이 세션이 꼬여있는지 로그인/캡차가 계속 실패하면서 listLiveComments도
  // 조용히 빈 배열을 반환하는 걸 확인함(에러 없이 success:true, comments:[]) — 검증된
  // 다른 계정을 고정으로 사용한다.
  const anyAccount = await Account.findOne({ accountId: "ggg8019" }).lean();
  if (!anyAccount) throw new Error("ggg8019 계정 없음");
  const owner = { id: (anyAccount as any).accountId, password: (anyAccount as any).password };

  for (const target of TARGETS) {
    console.log(`\n=== cafeId=${target.cafeId} articleId=${target.articleId} 중복 정리 시작 ===`);
    const listResult = await listLiveComments(owner, target.cafeId, target.articleId);
    if (!listResult.success) {
      console.log(`조회 실패: ${listResult.error}`);
      continue;
    }
    const comments = listResult.comments || [];
    console.log(`현재 댓글 ${comments.length}개`);

    const seen = new Set<string>();
    const toDelete: typeof comments = [];
    for (const c of comments) {
      const key = normalize(c.content);
      if (seen.has(key)) {
        toDelete.push(c);
      } else {
        seen.add(key);
      }
    }
    console.log(`중복 삭제 대상 ${toDelete.length}개 (고유 문구 ${seen.size}개는 유지)`);

    let deleted = 0;
    for (const c of toDelete) {
      const result = await deleteCommentWithAccount(owner, target.cafeId, target.articleId, c.commentId);
      console.log(`[${result.success ? "OK" : "FAIL"}] commentId=${c.commentId} "${c.content.slice(0, 30)}" ${result.error || ""}`);
      if (result.success) deleted++;
    }
    console.log(`=== 완료: ${deleted}/${toDelete.length} 중복 삭제됨 (최종 예상 ${comments.length - deleted}개) ===`);
  }

  await closeAllContexts();
  await mongoose.disconnect();
};

main()
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error("ERROR:", e.message);
    try {
      await closeAllContexts();
    } catch {}
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });
