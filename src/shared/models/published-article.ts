import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IArticleComment {
  accountId: string;
  nickname: string;
  content: string;
  type: 'comment' | 'reply';
  parentIndex?: number; // 대댓글인 경우 원댓글 인덱스
  commentId?: string;
  commentIndex?: number;
  sequenceId?: string;
  createdAt: Date;
}

export type ExposureStatus = '노출' | '미노출' | '확인실패';

export interface IPublishedArticle extends Document {
  articleId: number;
  cafeId: string;
  menuId: string;
  keyword: string;
  title: string;
  content: string;
  articleUrl: string;
  writerAccountId: string;
  publishedAt: Date;
  status: 'published' | 'published-unverified' | 'modified';
  postType?: 'ad' | 'daily' | 'daily-ad';
  commentCount: number;
  replyCount: number;
  comments: IArticleComment[]; // 댓글/대댓글 목록
  exposureStatus?: ExposureStatus; // 네이버 카페 검색 노출체크 결과
  exposureRank?: number; // 노출 시 카페 검색결과 내 순위 (1부터)
  exposureFoundLink?: string; // 노출 시 검색결과에서 확인된 실제 링크
  exposureCheckedAt?: Date; // 마지막 노출체크 시각
}

const ArticleCommentSchema = new Schema<IArticleComment>(
  {
    accountId: { type: String, required: true },
    nickname: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['comment', 'reply'], required: true },
    parentIndex: { type: Number },
    commentId: { type: String },
    commentIndex: { type: Number },
    sequenceId: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PublishedArticleSchema = new Schema<IPublishedArticle>(
  {
    articleId: { type: Number, index: true },
    cafeId: { type: String, required: true },
    menuId: { type: String, required: true },
    keyword: { type: String, required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    articleUrl: { type: String, required: true },
    writerAccountId: { type: String, required: true },
    publishedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['published', 'published-unverified', 'modified'],
      default: 'published',
    },
    postType: { type: String, enum: ['ad', 'daily', 'daily-ad'] },
    commentCount: { type: Number, default: 0 },
    replyCount: { type: Number, default: 0 },
    comments: { type: [ArticleCommentSchema], default: [] },
    exposureStatus: { type: String, enum: ['노출', '미노출', '확인실패'] },
    exposureRank: { type: Number },
    exposureFoundLink: { type: String },
    exposureCheckedAt: { type: Date },
  },
  { timestamps: true }
);

PublishedArticleSchema.index(
  { cafeId: 1, articleId: 1 },
  {
    unique: true,
    partialFilterExpression: { articleId: { $type: 'number' } },
  },
);

export const PublishedArticle: Model<IPublishedArticle> =
  mongoose.models.PublishedArticle ||
  mongoose.model<IPublishedArticle>('PublishedArticle', PublishedArticleSchema);

export const hasCommented = async (
  cafeId: string,
  articleId: number,
  accountId: string,
  type: 'comment' | 'reply' = 'comment'
): Promise<boolean> => {
  const article = await PublishedArticle.findOne(
    { cafeId, articleId },
    { comments: 1 }
  ).lean();

  if (!article) return false;

  return (article.comments || []).some(
    (c) => c.accountId === accountId && c.type === type
  );
};

export const addCommentToArticle = async (
  cafeId: string,
  articleId: number,
  comment: Omit<IArticleComment, 'createdAt'>
): Promise<boolean> => {
  const updateField = comment.type === 'comment' ? 'commentCount' : 'replyCount';

  console.log(`[COMMENT-DB] 저장 시도: cafeId=${cafeId}, articleId=${articleId}, accountId=${comment.accountId}, type=${comment.type}`);

  const result = await PublishedArticle.findOneAndUpdate(
    { cafeId, articleId },
    {
      $push: { comments: { ...comment, createdAt: new Date() } },
      $inc: { [updateField]: 1 },
      $setOnInsert: {
        menuId: '',
        keyword: '',
        title: '외부 글',
        content: '',
        articleUrl: `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`,
        writerAccountId: '',
        status: 'published',
      },
    },
    { new: true, upsert: true }
  );

  if (result) {
    console.log(`[COMMENT-DB] 저장 성공: #${articleId} - ${comment.type} by ${comment.accountId}`);
  }

  return !!result;
};

export const removeCommentFromArticle = async (
  cafeId: string,
  articleId: number,
  commentId: string
): Promise<boolean> => {
  const result = await PublishedArticle.updateOne(
    { cafeId, articleId, 'comments.commentId': commentId },
    { $pull: { comments: { commentId } }, $inc: { commentCount: -1 } }
  );

  return result.modifiedCount > 0;
};

export const getArticleComments = async (
  cafeId: string,
  articleId: number
): Promise<IArticleComment[]> => {
  const article = await PublishedArticle.findOne(
    { cafeId, articleId },
    { comments: 1 }
  ).lean();

  return article?.comments || [];
};

export const getAccountCommentStats = async (
  accountId: string
): Promise<{ comments: number; replies: number }> => {
  const result = await PublishedArticle.aggregate([
    { $unwind: '$comments' },
    { $match: { 'comments.accountId': accountId } },
    {
      $group: {
        _id: '$comments.type',
        count: { $sum: 1 },
      },
    },
  ]);

  const stats = { comments: 0, replies: 0 };
  for (const r of result) {
    if (r._id === 'comment') stats.comments = r.count;
    if (r._id === 'reply') stats.replies = r.count;
  }

  return stats;
};

export const getArticleIdByKeyword = async (
  cafeId: string,
  keyword: string
): Promise<number | null> => {
  const article = await PublishedArticle.findOne(
    { cafeId, keyword },
    { articleId: 1 }
  )
    .sort({ publishedAt: -1 })
    .lean();

  return article?.articleId ?? null;
};

export const getRecentWriters = async (
  cafeId: string,
  limit: number = 5
): Promise<string[]> => {
  const articles = await PublishedArticle.find(
    { cafeId, writerAccountId: { $ne: '' } },
    { writerAccountId: 1 }
  )
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();

  return articles.map((a) => a.writerAccountId);
};

export const updateArticleExposure = async (
  cafeId: string,
  articleId: number,
  result: { status: ExposureStatus; rank?: number; foundLink?: string }
): Promise<boolean> => {
  const updated = await PublishedArticle.findOneAndUpdate(
    { cafeId, articleId },
    {
      $set: {
        exposureStatus: result.status,
        exposureRank: result.rank,
        exposureFoundLink: result.foundLink,
        exposureCheckedAt: new Date(),
      },
    }
  );

  return !!updated;
};

export const getRecentPublishedArticles = async (
  cafeId: string,
  limit: number = 30
): Promise<IPublishedArticle[]> => {
  return PublishedArticle.find({ cafeId, status: { $in: ['published', 'modified'] } })
    .sort({ publishedAt: -1 })
    .limit(limit);
};
