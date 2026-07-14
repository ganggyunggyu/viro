import fs from "fs";
import mongoose from "mongoose";
import { User } from "../src/shared/models/user";
import { getAllAccounts } from "../src/shared/config/accounts";
import {
  acquireAccountLock,
  releaseAccountLock,
  loginAccount,
  isAccountLoggedIn,
  getPageForAccount,
  saveCookiesForAccount,
  closeAllContexts,
} from "../src/shared/lib/multi-session";
import { uploadImages } from "../src/shared/lib/naver-cafe-writing/image-uploader";

const CAFE_ID = "31750246";
const ARTICLE_ID = 18;
const AUTHOR_ACCOUNT_ID = "alsrudgus531";
const IMAGES_JSON_PATH = process.argv[2];

const EDITOR_READY_SELECTOR =
  'p.se-text-paragraph, .FlexableTextArea textarea.textarea_input, .se-component-content';

const CONTENT = `여름철 보양식,
더위에 지칠수록 더 생각나죠.

땀을 많이 흘리는 여름엔
몸속 기력과 수분, 영양이 함께 빠져나가요.
그래서 잘 챙겨 먹는 것만으로도
여름을 한결 수월하게 날 수 있어요.
매년 여름만 되면 축 처지신다면
음식부터 점검해보는 게 좋아요.
오늘은 대표 여름 보양식과
체질·상황별로 맞는 선택법까지 정리했어요.

왜 여름에 보양이 필요할까

여름엔 더위로 입맛이 떨어지고,
땀으로 체력과 영양이 빠져나가요.
게다가 찬 음식을 자주 먹으면
속이 차가워져 소화도 약해지기 쉬워요.
그래서 "이열치열", 즉 따뜻하고 영양 있는 음식으로
빠져나간 기력을 채우는 게 여름철 보양식의 핵심이에요.
단백질과 미네랄을 충분히 챙기는 게 특히 중요해요.

대표 여름 보양식 리스트

첫째, 삼계탕이에요.
닭과 인삼, 대추가 어우러진
여름 보양식의 대명사예요.
단백질이 풍부해 기력 회복에 좋고,
소화도 비교적 편해 남녀노소 부담이 적어요.

둘째, 장어예요.
불포화지방산과 비타민 A가 풍부해
스태미나 보충에 즐겨 찾는 음식이에요.
다만 기름기가 있어 소화가 약하면 조금만 드세요.

셋째, 추어탕이에요.
미꾸라지를 통째로 갈아 만들어
단백질과 칼슘이 풍부하고 소화도 편해요.

넷째, 전복과 낙지예요.
타우린과 미네랄이 풍부해
더위에 지친 몸에 활력을 더해줘요.
회나 죽으로 드시면 소화 부담도 적어요.

다섯째, 오리고기예요.
비교적 담백하면서 단백질이 풍부해
기름진 게 부담스러운 분께 좋아요.
불포화지방이 많아 여름 보양으로 인기가 많아요.

여섯째, 민어예요.
살이 부드럽고 단백질이 풍부해
예부터 여름 최고의 생선 보양식으로 꼽혔어요.

일곱째, 흑염소나 보양 진액류예요.
예부터 기력이 약한 어른들이 찾던 보양식으로,
요즘은 진액 형태로 간편하게 챙기기도 해요.
입맛이 없어 잘 못 드시는 분께 특히 편해요.

체질·상황별로 고르세요

기력이 없고 입맛까지 없다면,
삼계탕이나 장어처럼
따뜻하고 든든한 음식이 잘 맞아요.

소화가 약한 편이라면,
추어탕이나 오리처럼
부담이 덜한 음식이 편해요.

열이 많고 더위를 심하게 탄다면,
콩국수나 초계탕, 오이냉국처럼
시원하게 즐기는 보양식도 좋은 선택이에요.
꼭 뜨거운 것만 보양은 아니에요.

어르신이나 바쁜 분이라면,
매일 챙기기 어려우니
간편하게 드시는 진액·죽 형태가 실용적이에요.

여름 보양, 이것만 지키세요

첫째, 물을 충분히 드세요.
땀으로 빠진 수분을 채워야
보양 효과도 제대로 나요.

둘째, 과식은 피하세요.
아무리 좋아도 한 번에 많이 먹으면
소화에 부담이 돼요.

셋째, 찬 음식과 번갈아 드시지 마세요.
뜨거운 보양식과 얼음물을 오가면
오히려 배탈이 나기 쉬워요.

넷째, 냉방병도 함께 챙기세요.
잘 먹어도 찬 바람을 계속 쐬면
컨디션이 쉽게 무너져요.
가벼운 산책과 충분한 잠도
음식만큼 중요한 보양이에요.

알아두면 좋은 점

보양식은 약이 아니라
영양을 채우는 음식이에요.
효과도 사람마다 다를 수 있으니
너무 큰 기대보다
꾸준히 균형 있게 드시는 게 중요해요.
지병이 있거나 약을 드시는 분,
임신·수유 중인 분은
특정 보양식이 맞지 않을 수 있어
전문가와 상의하시는 게 안전해요.
특히 기름지거나 자극적인 보양식은
소화가 약한 분께 오히려 부담이 될 수 있어요.

정리하며

여름철 보양식의 핵심은
"비싼 것"이 아니라 "내 몸에 맞는 것"이에요.
기력이 없으면 든든한 것,
소화가 약하면 부담 없는 것,
열이 많으면 시원한 것으로 고르고,
물과 휴식을 함께 챙기면
올여름도 거뜬하게 나실 수 있어요.
잘 챙겨 드시고 건강한 여름 보내세요.

#여름철보양식#여름보양`;

const main = async (): Promise<void> => {
  const images: string[] = JSON.parse(fs.readFileSync(IMAGES_JSON_PATH, "utf8"));
  console.log("[IMAGES] 총", images.length, "장");

  await mongoose.connect(process.env.MONGODB_URI!);
  const user = await User.findOne({ loginId: "21lab", isActive: true }).lean();
  const accounts = await getAllAccounts((user as any).userId);
  const author = accounts.find((x: any) => x.id === AUTHOR_ACCOUNT_ID);
  if (!author) throw new Error("author account not found");

  await acquireAccountLock(AUTHOR_ACCOUNT_ID);
  try {
    const loggedIn = await isAccountLoggedIn(AUTHOR_ACCOUNT_ID);
    if (!loggedIn) {
      const r = await loginAccount(author.id, author.password, {
        waitForLoginMs: 60000,
        reason: "rewrite_full",
      });
      if (!r.success) throw new Error(`login failed: ${r.error}`);
    }

    const page = await getPageForAccount(AUTHOR_ACCOUNT_ID);
    page.on("dialog", async (d: any) => {
      console.log(`[DIALOG] ${d.type()}: ${d.message()}`);
      await d.accept().catch(() => {});
    });

    const modifyUrl = `https://cafe.naver.com/ca-fe/cafes/${CAFE_ID}/articles/${ARTICLE_ID}/modify`;
    console.log("[NAV]", modifyUrl);
    await page.goto(modifyUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector(EDITOR_READY_SELECTOR, { timeout: 15000 });
    await page.waitForTimeout(2000);

    const contentArea = await page.$("p.se-text-paragraph");
    if (!contentArea) throw new Error("본문 입력창을 찾을 수 없음");

    console.log("[CLEAR] Cmd+A로 본문 전체 선택 후 삭제");
    await contentArea.click();
    await page.waitForTimeout(300);
    await page.keyboard.press("Meta+A");
    await page.waitForTimeout(200);
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(500);

    console.log("[TYPE] 본문 즉시 삽입 (insertText, 지연 없음)");
    const lines = CONTENT.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]) {
        await page.keyboard.insertText(lines[i]);
      }
      if (i < lines.length - 1) {
        await page.keyboard.press("Enter");
      }
    }
    console.log("[TYPE] 본문 삽입 완료");
    await page.waitForTimeout(500);

    console.log("[IMAGE] 마지막에 이미지", images.length, "장 삽입");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    const uploaded = await uploadImages(page, images);
    console.log("[IMAGE] 업로드 결과:", uploaded);
    await page.waitForTimeout(1500);

    const finalCount = await page.$$eval(".se-image-resource", (els) => els.length);
    console.log("[CHECK] 제출 전 에디터 내 이미지:", finalCount);

    const submitButton = await page.$("a.BaseButton--skinGreen, a.BaseButton");
    if (!submitButton) throw new Error("수정 완료 버튼을 찾을 수 없음");
    await submitButton.click();

    try {
      await page.waitForURL((url: URL) => !url.toString().includes("/modify"), { timeout: 10000 });
      console.log("[DONE] 수정 완료, URL:", page.url());
    } catch {
      console.log("[DONE] URL 변화 대기 실패, 추가 대기...");
      await page.waitForTimeout(3000);
      console.log("[DONE] 현재 URL:", page.url());
    }

    await saveCookiesForAccount(AUTHOR_ACCOUNT_ID);
    console.log("[RESULT] success");
  } finally {
    releaseAccountLock(AUTHOR_ACCOUNT_ID);
  }

  await closeAllContexts();
  await mongoose.disconnect();
};

main()
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error("ERROR:", e.message);
    try { await closeAllContexts(); } catch {}
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  });
