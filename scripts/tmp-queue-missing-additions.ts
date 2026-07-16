import mongoose from 'mongoose';
import { ManualCommentJob } from '../src/shared/models';
import { createManualCommentJobForUser } from '../src/features/manual-comment-job/actions';

const USER_ID = 'user-1768955529317';

interface JobDef {
  articleUrl: string;
  fixedComments: string[];
}

const JOBS: JobDef[] = [
  { articleUrl: 'https://cafe.naver.com/driveee/130', fixedComments: [
    '이런정보 추려주셔서 감사해요!',
    '방향성이 많이 좁혀지네요 감사합니다.',
    '글 잘 보고 가요 좋은 정보네요!',
    '이래저래 저와 우여곡절을 많이 이겨온 동료에게 주고싶은 선물이네요!',
  ]},
  { articleUrl: 'https://cafe.naver.com/healthhhh/103', fixedComments: [
    '이런정보 추려주셔서 감사해요!',
    '방향성이 많이 좁혀지네요 감사합니다.',
    '글 잘 보고 가요 좋은 정보네요!',
    '이래저래 저와 우여곡절을 많이 이겨온 친구에게 주고싶은 선물이네요!',
  ]},
  { articleUrl: 'https://cafe.naver.com/driveee/100', fixedComments: [
    '제품정보 링크 받아볼 수 있을까요?',
    '곧 아내가 출산인데 기력회복으로 주기에 너무 좋은 것 같아요.',
    '아내가 요즘 기력이 떨어졌는데 지금 제 상황에 딱이네여',
    '임신한 친구에게 선물해줘도 괜찮겠죠?',
  ]},
  { articleUrl: 'https://cafe.naver.com/menunote702/30', fixedComments: [
    '저도 부평웨딩홀들 견적 받아보고 있는데, cn계산이 가장 괜찮다는 생각이 들어요. 꽃장식이 풍성해서 홀 자체도 너무 예쁘고요',
  ]},
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);

  const ids: string[] = [];
  for (const job of JOBS) {
    const res = await createManualCommentJobForUser(USER_ID, {
      articleUrl: job.articleUrl,
      mode: 'fixed',
      fixedComments: job.fixedComments,
      deleteExisting: false,
      delayMinMinutes: 0.5,
      delayMaxMinutes: 3,
    });
    console.log(job.articleUrl, JSON.stringify(res));
    if (res.success) ids.push(res.jobId);
  }

  // 우선순위 재정렬 - 백로그보다 앞에 배치 (raw driver로 timestamps immutable 우회)
  const BASE = new Date('2026-07-14T10:00:00.000Z').getTime();
  for (let i = 0; i < ids.length; i += 1) {
    await ManualCommentJob.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(ids[i]) },
      { $set: { createdAt: new Date(BASE + i * 1000) } },
    );
  }
  console.log('reordered:', ids.length, '개');

  await mongoose.disconnect();
})();
