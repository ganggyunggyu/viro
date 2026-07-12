module.exports = [
"[project]/src/shared/lib/mongodb.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "connectDB",
    ()=>connectDB,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe-bot';
const cached = global.mongooseCache || {
    conn: null,
    promise: null
};
if (!global.mongooseCache) {
    global.mongooseCache = cached;
}
const connectDB = async ()=>{
    if (cached.conn && __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].connection.readyState === 1) {
        return cached.conn;
    }
    if (cached.promise && __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].connection.readyState === 0) {
        console.log('[MongoDB] 이전 연결 끊김, 캐시 초기화');
        cached.promise = null;
        cached.conn = null;
    }
    if (!cached.promise) {
        console.log('[MongoDB] 새 연결 시도...');
        cached.promise = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            bufferCommands: false
        });
    }
    try {
        cached.conn = await cached.promise;
        if (__TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].connection.readyState !== 1) {
            await new Promise((resolve, reject)=>{
                const timeout = setTimeout(()=>{
                    reject(new Error('MongoDB 연결 타임아웃'));
                }, 10000);
                __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].connection.once('connected', ()=>{
                    clearTimeout(timeout);
                    resolve();
                });
                __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].connection.once('error', (err)=>{
                    clearTimeout(timeout);
                    reject(err);
                });
            });
        }
        console.log('[MongoDB] 연결 완료, readyState:', __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].connection.readyState);
        return cached.conn;
    } catch (error) {
        console.error('[MongoDB] 연결 실패:', error);
        cached.promise = null;
        cached.conn = null;
        throw error;
    }
};
const __TURBOPACK__default__export__ = connectDB;
}),
"[project]/src/shared/models/published-article.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PublishedArticle",
    ()=>PublishedArticle,
    "addCommentToArticle",
    ()=>addCommentToArticle,
    "getAccountCommentStats",
    ()=>getAccountCommentStats,
    "getArticleComments",
    ()=>getArticleComments,
    "getArticleIdByKeyword",
    ()=>getArticleIdByKeyword,
    "getRecentWriters",
    ()=>getRecentWriters,
    "hasCommented",
    ()=>hasCommented
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
;
const ArticleCommentSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    accountId: {
        type: String,
        required: true
    },
    nickname: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: [
            'comment',
            'reply'
        ],
        required: true
    },
    parentIndex: {
        type: Number
    },
    commentId: {
        type: String
    },
    commentIndex: {
        type: Number
    },
    sequenceId: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    _id: false
});
const PublishedArticleSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    articleId: {
        type: Number,
        required: true,
        index: true
    },
    cafeId: {
        type: String,
        required: true
    },
    menuId: {
        type: String,
        required: true
    },
    keyword: {
        type: String,
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    articleUrl: {
        type: String,
        required: true
    },
    writerAccountId: {
        type: String,
        required: true
    },
    publishedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: [
            'published',
            'modified'
        ],
        default: 'published'
    },
    postType: {
        type: String,
        enum: [
            'ad',
            'daily',
            'daily-ad'
        ]
    },
    commentCount: {
        type: Number,
        default: 0
    },
    replyCount: {
        type: Number,
        default: 0
    },
    comments: {
        type: [
            ArticleCommentSchema
        ],
        default: []
    }
}, {
    timestamps: true
});
PublishedArticleSchema.index({
    cafeId: 1,
    articleId: 1
}, {
    unique: true
});
const PublishedArticle = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].models.PublishedArticle || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].model('PublishedArticle', PublishedArticleSchema);
const hasCommented = async (cafeId, articleId, accountId, type = 'comment')=>{
    const article = await PublishedArticle.findOne({
        cafeId,
        articleId
    }, {
        comments: 1
    }).lean();
    if (!article) return false;
    return (article.comments || []).some((c)=>c.accountId === accountId && c.type === type);
};
const addCommentToArticle = async (cafeId, articleId, comment)=>{
    const updateField = comment.type === 'comment' ? 'commentCount' : 'replyCount';
    console.log(`[COMMENT-DB] 저장 시도: cafeId=${cafeId}, articleId=${articleId}, accountId=${comment.accountId}, type=${comment.type}`);
    const result = await PublishedArticle.findOneAndUpdate({
        cafeId,
        articleId
    }, {
        $push: {
            comments: {
                ...comment,
                createdAt: new Date()
            }
        },
        $inc: {
            [updateField]: 1
        },
        $setOnInsert: {
            menuId: '',
            keyword: '',
            title: '외부 글',
            content: '',
            articleUrl: `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`,
            writerAccountId: '',
            status: 'published'
        }
    }, {
        new: true,
        upsert: true
    });
    if (result) {
        console.log(`[COMMENT-DB] 저장 성공: #${articleId} - ${comment.type} by ${comment.accountId}`);
    }
    return !!result;
};
const getArticleComments = async (cafeId, articleId)=>{
    const article = await PublishedArticle.findOne({
        cafeId,
        articleId
    }, {
        comments: 1
    }).lean();
    return article?.comments || [];
};
const getAccountCommentStats = async (accountId)=>{
    const result = await PublishedArticle.aggregate([
        {
            $unwind: '$comments'
        },
        {
            $match: {
                'comments.accountId': accountId
            }
        },
        {
            $group: {
                _id: '$comments.type',
                count: {
                    $sum: 1
                }
            }
        }
    ]);
    const stats = {
        comments: 0,
        replies: 0
    };
    for (const r of result){
        if (r._id === 'comment') stats.comments = r.count;
        if (r._id === 'reply') stats.replies = r.count;
    }
    return stats;
};
const getArticleIdByKeyword = async (cafeId, keyword)=>{
    const article = await PublishedArticle.findOne({
        cafeId,
        keyword
    }, {
        articleId: 1
    }).sort({
        publishedAt: -1
    }).lean();
    return article?.articleId ?? null;
};
const getRecentWriters = async (cafeId, limit = 5)=>{
    const articles = await PublishedArticle.find({
        cafeId,
        writerAccountId: {
            $ne: ''
        }
    }, {
        writerAccountId: 1
    }).sort({
        publishedAt: -1
    }).limit(limit).lean();
    return articles.map((a)=>a.writerAccountId);
};
}),
"[project]/src/shared/models/modified-article.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ModifiedArticle",
    ()=>ModifiedArticle
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
;
const ModifiedArticleSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    originalArticleId: {
        type: __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"].Types.ObjectId,
        ref: 'PublishedArticle',
        required: true
    },
    articleId: {
        type: Number,
        required: true,
        index: true
    },
    cafeId: {
        type: String,
        required: true
    },
    keyword: {
        type: String,
        required: true
    },
    newTitle: {
        type: String,
        required: true
    },
    newContent: {
        type: String,
        required: true
    },
    modifiedAt: {
        type: Date,
        default: Date.now
    },
    modifiedBy: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});
ModifiedArticleSchema.index({
    cafeId: 1,
    articleId: 1
});
const ModifiedArticle = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].models.ModifiedArticle || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].model('ModifiedArticle', ModifiedArticleSchema);
}),
"[project]/src/shared/models/batch-job-log.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BatchJobLog",
    ()=>BatchJobLog
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
;
const KeywordResultSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    keyword: {
        type: String,
        required: true
    },
    articleId: {
        type: Number
    },
    success: {
        type: Boolean,
        required: true
    },
    commentCount: {
        type: Number,
        default: 0
    },
    replyCount: {
        type: Number,
        default: 0
    },
    error: {
        type: String
    }
}, {
    _id: false
});
const BatchJobLogSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    jobType: {
        type: String,
        enum: [
            'publish',
            'modify'
        ],
        required: true
    },
    cafeId: {
        type: String,
        required: true
    },
    keywords: [
        {
            type: String
        }
    ],
    results: [
        KeywordResultSchema
    ],
    totalKeywords: {
        type: Number,
        required: true
    },
    completed: {
        type: Number,
        default: 0
    },
    failed: {
        type: Number,
        default: 0
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    finishedAt: {
        type: Date
    },
    status: {
        type: String,
        enum: [
            'running',
            'completed',
            'failed'
        ],
        default: 'running'
    }
}, {
    timestamps: true
});
BatchJobLogSchema.index({
    status: 1,
    startedAt: -1
});
const BatchJobLog = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].models.BatchJobLog || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].model('BatchJobLog', BatchJobLogSchema);
}),
"[project]/src/shared/models/account.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Account",
    ()=>Account
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
;
const ActivityHoursSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    start: {
        type: Number,
        min: 0,
        max: 23
    },
    end: {
        type: Number,
        min: 0,
        max: 24
    }
}, {
    _id: false
});
const AccountSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    userId: {
        type: String,
        required: true,
        index: true
    },
    accountId: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    nickname: {
        type: String
    },
    isMain: {
        type: Boolean,
        default: false
    },
    activityHours: {
        type: ActivityHoursSchema
    },
    restDays: {
        type: [
            Number
        ]
    },
    dailyPostLimit: {
        type: Number
    },
    personaId: {
        type: String
    },
    role: {
        type: String,
        enum: [
            'writer',
            'commenter'
        ]
    },
    isActive: {
        type: Boolean,
        default: true
    },
    campaignTag: {
        type: String
    },
    excludeFromAutoComment: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
// 같은 유저 내에서 accountId 중복 방지
AccountSchema.index({
    userId: 1,
    accountId: 1
}, {
    unique: true
});
const Account = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].models.Account || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].model('Account', AccountSchema);
}),
"[project]/src/shared/models/user.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "User",
    ()=>User
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
;
const UserSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    loginId: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    displayName: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
const User = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].models.User || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].model('User', UserSchema);
}),
"[project]/src/shared/models/cafe.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Cafe",
    ()=>Cafe
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
;
const CafeSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    userId: {
        type: String,
        required: true,
        index: true
    },
    cafeId: {
        type: String,
        required: true
    },
    cafeUrl: {
        type: String,
        required: true
    },
    menuId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    categories: {
        type: [
            String
        ],
        default: []
    },
    categoryMenuIds: {
        type: Map,
        of: String
    },
    categoryAliases: {
        type: Map,
        of: String
    },
    commentableMenuIds: {
        type: [
            Number
        ],
        default: []
    },
    ownerAccountId: {
        type: String
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
// 같은 유저 내에서 cafeId 중복 방지
CafeSchema.index({
    userId: 1,
    cafeId: 1
}, {
    unique: true
});
const Cafe = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].models.Cafe || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].model('Cafe', CafeSchema, 'cafes');
}),
"[project]/src/shared/models/work-cafe-article.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WorkCafeArticle",
    ()=>WorkCafeArticle
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
;
const WorkCafeArticleSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    ownerName: {
        type: String,
        required: true,
        index: true
    },
    cafeSlug: {
        type: String,
        required: true,
        index: true
    },
    cafeUrl: {
        type: String,
        required: true
    },
    cafeId: {
        type: String,
        required: true,
        index: true
    },
    articleId: {
        type: Number,
        required: true,
        index: true
    },
    articleUrl: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    nickname: {
        type: String,
        default: ''
    },
    memberKey: {
        type: String
    },
    menuId: {
        type: Number,
        default: 0
    },
    menuName: {
        type: String,
        default: ''
    },
    readCount: {
        type: Number,
        default: 0
    },
    likeCount: {
        type: Number,
        default: 0
    },
    commentCount: {
        type: Number,
        default: 0
    },
    writeDateTimestamp: {
        type: Number,
        default: 0
    },
    collectedAt: {
        type: Date,
        required: true
    },
    latestCollectionId: {
        type: String,
        required: true,
        index: true
    },
    needsCommentWork: {
        type: Boolean,
        default: false,
        index: true
    },
    targetCommentCount: {
        type: Number,
        default: 8
    },
    commentWorkStatus: {
        type: String,
        enum: [
            'pending',
            'generated',
            'queued',
            'done',
            'skipped'
        ],
        default: 'pending',
        index: true
    }
}, {
    timestamps: true
});
WorkCafeArticleSchema.index({
    cafeId: 1,
    articleId: 1
}, {
    unique: true
});
WorkCafeArticleSchema.index({
    needsCommentWork: 1,
    commentWorkStatus: 1,
    cafeId: 1
});
const WorkCafeArticle = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].models.WorkCafeArticle || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].model('WorkCafeArticle', WorkCafeArticleSchema, 'workcafearticles');
}),
"[project]/src/shared/models/manual-comment-job.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ManualCommentJob",
    ()=>ManualCommentJob
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
;
const ManualCommentResultSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    index: {
        type: Number,
        required: true
    },
    accountId: {
        type: String
    },
    nickname: {
        type: String
    },
    content: {
        type: String,
        required: true
    },
    success: {
        type: Boolean,
        required: true
    },
    error: {
        type: String
    },
    commentId: {
        type: String
    },
    postedAt: {
        type: Date
    }
}, {
    _id: false
});
const ManualCommentJobSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    userId: {
        type: String,
        required: true,
        index: true
    },
    articleUrl: {
        type: String,
        required: true
    },
    cafeSlug: {
        type: String,
        required: true
    },
    cafeId: {
        type: String,
        required: true,
        index: true
    },
    articleId: {
        type: Number,
        required: true
    },
    mode: {
        type: String,
        enum: [
            'fixed',
            'generate',
            'agent'
        ],
        required: true
    },
    fixedComments: {
        type: [
            String
        ]
    },
    generateMinCount: {
        type: Number
    },
    generateMaxCount: {
        type: Number
    },
    delayMinMs: {
        type: Number,
        required: true
    },
    delayMaxMs: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: [
            'pending',
            'running',
            'done',
            'failed'
        ],
        default: 'pending',
        index: true
    },
    errorMessage: {
        type: String
    },
    agentSummary: {
        type: String
    },
    results: {
        type: [
            ManualCommentResultSchema
        ],
        default: []
    },
    claimedAt: {
        type: Date
    },
    claimedBy: {
        type: String
    }
}, {
    timestamps: true
});
ManualCommentJobSchema.index({
    status: 1,
    createdAt: 1
});
const ManualCommentJob = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].models.ManualCommentJob || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].model('ManualCommentJob', ManualCommentJobSchema, 'manualcommentjobs');
}),
"[project]/src/shared/models/daily-post-count.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DailyPostCount",
    ()=>DailyPostCount,
    "canPostToday",
    ()=>canPostToday,
    "getRemainingPostsToday",
    ()=>getRemainingPostsToday,
    "getTodayPostCount",
    ()=>getTodayPostCount,
    "incrementTodayPostCount",
    ()=>incrementTodayPostCount
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
;
const DailyPostCountSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    accountId: {
        type: String,
        required: true,
        index: true
    },
    cafeId: {
        type: String,
        required: true,
        index: true
    },
    date: {
        type: String,
        required: true,
        index: true
    },
    count: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});
// 계정 + 카페 + 날짜 조합으로 유니크
DailyPostCountSchema.index({
    accountId: 1,
    cafeId: 1,
    date: 1
}, {
    unique: true
});
const DailyPostCount = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].models.DailyPostCount || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].model('DailyPostCount', DailyPostCountSchema);
const getTodayString = ()=>{
    const now = new Date();
    // 한국 시간대(KST, UTC+9) 기준으로 날짜 계산
    const kstOffset = 9 * 60; // 9시간을 분으로
    const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
    return kstTime.toISOString().split('T')[0];
};
const getTodayPostCount = async (accountId, cafeId)=>{
    const today = getTodayString();
    const record = await DailyPostCount.findOne({
        accountId,
        cafeId,
        date: today
    });
    return record?.count ?? 0;
};
const incrementTodayPostCount = async (accountId, cafeId)=>{
    const today = getTodayString();
    const result = await DailyPostCount.findOneAndUpdate({
        accountId,
        cafeId,
        date: today
    }, {
        $inc: {
            count: 1
        }
    }, {
        upsert: true,
        new: true
    });
    return result.count;
};
const canPostToday = async (accountId, cafeId, dailyLimit)=>{
    if (!dailyLimit) {
        return true;
    }
    const todayCount = await getTodayPostCount(accountId, cafeId);
    return todayCount < dailyLimit;
};
const getRemainingPostsToday = async (accountId, cafeId, dailyLimit)=>{
    if (!dailyLimit) {
        return Infinity;
    }
    const todayCount = await getTodayPostCount(accountId, cafeId);
    return Math.max(0, dailyLimit - todayCount);
};
}),
"[project]/src/shared/models/viral-response.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ViralResponse",
    ()=>ViralResponse,
    "clearViralResponses",
    ()=>clearViralResponses,
    "deleteViralResponse",
    ()=>deleteViralResponse,
    "getViralResponseById",
    ()=>getViralResponseById,
    "getViralResponseList",
    ()=>getViralResponseList,
    "getViralResponseStats",
    ()=>getViralResponseStats,
    "saveViralResponse",
    ()=>saveViralResponse
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
;
const ViralResponseSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    userId: {
        type: String,
        required: true,
        index: true
    },
    keyword: {
        type: String,
        required: true,
        index: true
    },
    prompt: {
        type: String,
        required: true
    },
    response: {
        type: String,
        required: true
    },
    parsedTitle: {
        type: String
    },
    parsedBody: {
        type: String
    },
    parsedComments: {
        type: Number
    },
    parseError: {
        type: String
    },
    cafeId: {
        type: String,
        index: true
    },
    contentStyle: {
        type: String
    },
    writerPersona: {
        type: String
    }
}, {
    timestamps: true
});
ViralResponseSchema.index({
    createdAt: -1
});
const ViralResponse = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].models.ViralResponse || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].model('ViralResponse', ViralResponseSchema);
const saveViralResponse = async (entry)=>{
    const doc = await ViralResponse.create(entry);
    console.log(`[VIRAL-DB] 저장됨: ${doc._id}`);
    return doc._id.toString();
};
const getViralResponseList = async (options = {})=>{
    const { userId, cafeId, keyword, hasError, limit, skip = 0 } = options;
    const filter = {};
    if (userId) filter.userId = userId;
    if (cafeId) filter.cafeId = cafeId;
    if (keyword) filter.keyword = {
        $regex: keyword,
        $options: 'i'
    };
    if (hasError === true) filter.parseError = {
        $exists: true,
        $ne: null
    };
    if (hasError === false) filter.parseError = {
        $exists: false
    };
    const query = ViralResponse.find(filter).sort({
        createdAt: -1
    }).skip(skip);
    if (limit && limit > 0) {
        query.limit(limit);
    }
    return query.lean();
};
const getViralResponseById = async (id)=>{
    return ViralResponse.findById(id).lean();
};
const deleteViralResponse = async (id)=>{
    const result = await ViralResponse.findByIdAndDelete(id);
    return !!result;
};
const clearViralResponses = async (options = {})=>{
    const filter = {};
    if (options.userId) filter.userId = options.userId;
    if (options.cafeId) filter.cafeId = options.cafeId;
    const result = await ViralResponse.deleteMany(filter);
    return result.deletedCount || 0;
};
const getViralResponseStats = async (userId)=>{
    const filter = {};
    if (userId) filter.userId = userId;
    const [total, failed] = await Promise.all([
        ViralResponse.countDocuments(filter),
        ViralResponse.countDocuments({
            ...filter,
            parseError: {
                $exists: true,
                $ne: null
            }
        })
    ]);
    return {
        total,
        success: total - failed,
        failed
    };
};
}),
"[project]/src/shared/models/index.ts [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$published$2d$article$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/published-article.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$modified$2d$article$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/modified-article.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$batch$2d$job$2d$log$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/batch-job-log.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$account$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/account.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/user.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$cafe$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/cafe.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$work$2d$cafe$2d$article$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/work-cafe-article.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$manual$2d$comment$2d$job$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/manual-comment-job.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$daily$2d$post$2d$count$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/daily-post-count.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$viral$2d$response$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/viral-response.ts [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
}),
"[project]/src/shared/config/user.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_USER_ID",
    ()=>DEFAULT_USER_ID,
    "USER_COOKIE_NAME",
    ()=>USER_COOKIE_NAME,
    "getCurrentUserId",
    ()=>getCurrentUserId,
    "setCurrentUserId",
    ()=>setCurrentUserId
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-rsc] (ecmascript)");
;
const DEFAULT_USER_ID = 'default-user';
const USER_COOKIE_NAME = 'cafe-bot-user-id';
const getCurrentUserId = async ()=>{
    try {
        const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
        return cookieStore.get(USER_COOKIE_NAME)?.value || DEFAULT_USER_ID;
    } catch  {
        return DEFAULT_USER_ID;
    }
};
const setCurrentUserId = async (userId)=>{
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    cookieStore.set(USER_COOKIE_NAME, userId, {
        httpOnly: true,
        secure: ("TURBOPACK compile-time value", "development") === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30
    });
};
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/src/shared/lib/password.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "hashPassword",
    ()=>hashPassword,
    "isHashedPassword",
    ()=>isHashedPassword,
    "verifyPassword",
    ()=>verifyPassword
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
const KEY_LENGTH = 64;
const HASH_PATTERN = /^[0-9a-f]{32}:[0-9a-f]{128}$/;
const hashPassword = (plain)=>{
    const salt = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomBytes"])(16).toString('hex');
    const hash = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["scryptSync"])(plain, salt, KEY_LENGTH).toString('hex');
    return `${salt}:${hash}`;
};
const isHashedPassword = (value)=>HASH_PATTERN.test(value);
const verifyPassword = (plain, stored)=>{
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    const hashBuffer = Buffer.from(hash, 'hex');
    const candidateBuffer = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["scryptSync"])(plain, salt, KEY_LENGTH);
    if (hashBuffer.length !== candidateBuffer.length) return false;
    return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["timingSafeEqual"])(hashBuffer, candidateBuffer);
};
}),
"[project]/src/features/auth/actions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"00ab089168221bbcc44bae95d2a2913f08e616e2c2":"getCurrentUser","00ba43b06b44b5ff61002c5831f0aac3fa1d4ed9c2":"logout","60a194a865e3bd3af5d71919804cba241403cd6503":"login","700ec4dea6a8c98297860ed1a21c9d8d4489b6c1f0":"register"},"",""] */ __turbopack_context__.s([
    "getCurrentUser",
    ()=>getCurrentUser,
    "login",
    ()=>login,
    "logout",
    ()=>logout,
    "register",
    ()=>register
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/mongodb.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/models/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/user.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/config/user.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$password$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/password.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
const login = async (loginId, password)=>{
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
        const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["User"].findOne({
            loginId,
            isActive: true
        });
        if (!user) {
            return {
                success: false,
                error: '존재하지 않는 아이디'
            };
        }
        const passwordMatches = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$password$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isHashedPassword"])(user.password) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$password$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyPassword"])(password, user.password) : user.password === password;
        if (!passwordMatches) {
            return {
                success: false,
                error: '비밀번호 불일치'
            };
        }
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$password$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isHashedPassword"])(user.password)) {
            user.password = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$password$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hashPassword"])(password);
            await user.save();
        }
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["setCurrentUserId"])(user.userId);
        return {
            success: true,
            user: {
                userId: user.userId,
                loginId: user.loginId,
                displayName: user.displayName
            }
        };
    } catch (error) {
        console.error('[AUTH] 로그인 실패:', error);
        return {
            success: false,
            error: '로그인 처리 중 오류 발생'
        };
    }
};
const logout = async ()=>{
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["setCurrentUserId"])('');
};
const getCurrentUser = async ()=>{
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
        const userId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCurrentUserId"])();
        if (!userId || userId === 'default-user') {
            return null;
        }
        const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["User"].findOne({
            userId,
            isActive: true
        }).lean();
        if (!user) {
            return null;
        }
        return {
            userId: user.userId,
            loginId: user.loginId,
            displayName: user.displayName
        };
    } catch  {
        return null;
    }
};
const register = async (loginId, password, displayName)=>{
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
        const existing = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["User"].findOne({
            loginId
        });
        if (existing) {
            return {
                success: false,
                error: '이미 존재하는 아이디'
            };
        }
        const userId = `user-${Date.now()}`;
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["User"].create({
            userId,
            loginId,
            password: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$password$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hashPassword"])(password),
            displayName
        });
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["setCurrentUserId"])(userId);
        return {
            success: true,
            user: {
                userId,
                loginId,
                displayName
            }
        };
    } catch (error) {
        console.error('[AUTH] 회원가입 실패:', error);
        return {
            success: false,
            error: '회원가입 처리 중 오류 발생'
        };
    }
};
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    login,
    logout,
    getCurrentUser,
    register
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(login, "60a194a865e3bd3af5d71919804cba241403cd6503", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(logout, "00ba43b06b44b5ff61002c5831f0aac3fa1d4ed9c2", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getCurrentUser, "00ab089168221bbcc44bae95d2a2913f08e616e2c2", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(register, "700ec4dea6a8c98297860ed1a21c9d8d4489b6c1f0", null);
}),
"[project]/src/shared/config/accounts.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NAVER_ACCOUNTS",
    ()=>NAVER_ACCOUNTS,
    "addAccount",
    ()=>addAccount,
    "getAccountById",
    ()=>getAccountById,
    "getAllAccounts",
    ()=>getAllAccounts,
    "getAllAccountsForMonitoring",
    ()=>getAllAccountsForMonitoring,
    "getCommentAccounts",
    ()=>getCommentAccounts,
    "getCommenterAccounts",
    ()=>getCommenterAccounts,
    "getMainAccount",
    ()=>getMainAccount,
    "getWriterAccounts",
    ()=>getWriterAccounts,
    "removeAccount",
    ()=>removeAccount,
    "setMainAccount",
    ()=>setMainAccount
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/mongodb.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/models/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$account$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/account.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/config/user.ts [app-rsc] (ecmascript)");
;
;
;
const getAllAccounts = async (userId)=>{
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
        const targetUserId = userId || await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCurrentUserId"])();
        console.log('[ACCOUNTS] 조회 시작, userId:', targetUserId);
        const dbAccounts = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$account$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Account"].find({
            userId: targetUserId,
            isActive: true
        }).sort({
            isMain: -1,
            createdAt: 1
        }).lean();
        console.log('[ACCOUNTS] 조회 결과:', dbAccounts.length, '개');
        return dbAccounts.map((a)=>({
                id: a.accountId,
                password: a.password,
                nickname: a.nickname,
                isMain: a.isMain,
                activityHours: a.activityHours,
                restDays: a.restDays,
                dailyPostLimit: a.dailyPostLimit,
                personaId: a.personaId,
                role: a.role,
                campaignTag: a.campaignTag,
                excludeFromAutoComment: a.excludeFromAutoComment
            }));
    } catch (error) {
        console.error('[ACCOUNTS] MongoDB 조회 실패:', error);
        return [];
    }
};
const getMainAccount = async ()=>{
    const accounts = await getAllAccounts();
    return accounts.find((a)=>a.isMain) || accounts[0];
};
const getCommentAccounts = async ()=>{
    const accounts = await getAllAccounts();
    return accounts.filter((a)=>!a.isMain);
};
const getAllAccountsForMonitoring = async ()=>{
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
        console.log('[ACCOUNTS] 모니터링용 전체 계정 조회');
        const dbAccounts = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$account$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Account"].find({
            isActive: true
        }).sort({
            userId: 1,
            isMain: -1,
            createdAt: 1
        }).lean();
        console.log('[ACCOUNTS] 모니터링용 조회 결과:', dbAccounts.length, '개');
        return dbAccounts.map((a)=>({
                id: a.accountId,
                password: a.password,
                nickname: a.nickname,
                isMain: a.isMain,
                activityHours: a.activityHours,
                restDays: a.restDays,
                dailyPostLimit: a.dailyPostLimit,
                personaId: a.personaId,
                role: a.role,
                campaignTag: a.campaignTag,
                excludeFromAutoComment: a.excludeFromAutoComment
            }));
    } catch (error) {
        console.error('[ACCOUNTS] 모니터링용 조회 실패:', error);
        return [];
    }
};
const getAccountById = async (accountId)=>{
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
        console.log(`[ACCOUNTS] accountId 직접 조회: ${accountId}`);
        const dbAccount = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$account$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Account"].findOne({
            accountId,
            isActive: true
        }).lean();
        console.log(`[ACCOUNTS] 조회 결과:`, dbAccount ? `찾음 (${dbAccount.nickname})` : '없음');
        if (!dbAccount) return null;
        return {
            id: dbAccount.accountId,
            password: dbAccount.password,
            nickname: dbAccount.nickname,
            isMain: dbAccount.isMain,
            activityHours: dbAccount.activityHours,
            restDays: dbAccount.restDays,
            dailyPostLimit: dbAccount.dailyPostLimit,
            personaId: dbAccount.personaId,
            role: dbAccount.role,
            campaignTag: dbAccount.campaignTag,
            excludeFromAutoComment: dbAccount.excludeFromAutoComment
        };
    } catch (error) {
        console.error('[ACCOUNTS] accountId 조회 실패:', error);
        return null;
    }
};
const NAVER_ACCOUNTS = [];
const getWriterAccounts = async (userId)=>{
    const accounts = await getAllAccounts(userId);
    return accounts.filter((a)=>a.role === 'writer');
};
const getCommenterAccounts = async (userId)=>{
    const accounts = await getAllAccounts(userId);
    return accounts.filter((a)=>a.role === 'commenter');
};
const addAccount = async (account, userId)=>{
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
    const targetUserId = userId || await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCurrentUserId"])();
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$account$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Account"].findOneAndUpdate({
        userId: targetUserId,
        accountId: account.id
    }, {
        userId: targetUserId,
        accountId: account.id,
        password: account.password,
        nickname: account.nickname,
        isMain: account.isMain ?? false,
        activityHours: account.activityHours,
        restDays: account.restDays,
        dailyPostLimit: account.dailyPostLimit,
        personaId: account.personaId,
        role: account.role,
        campaignTag: account.campaignTag,
        excludeFromAutoComment: account.excludeFromAutoComment ?? false,
        isActive: true
    }, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
    });
    return getAllAccounts(targetUserId);
};
const removeAccount = async (accountId, userId)=>{
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
    const targetUserId = userId || await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCurrentUserId"])();
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$account$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Account"].deleteOne({
        userId: targetUserId,
        accountId
    });
    return getAllAccounts(targetUserId);
};
const setMainAccount = async (accountId, userId)=>{
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
    const targetUserId = userId || await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCurrentUserId"])();
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$account$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Account"].updateMany({
        userId: targetUserId
    }, {
        isMain: false
    });
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$account$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Account"].updateOne({
        userId: targetUserId,
        accountId
    }, {
        isMain: true
    });
    return getAllAccounts(targetUserId);
};
}),
"[project]/src/shared/config/cafe-account-policy.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LUXURY_CAFE_WRITER_ACCOUNT_IDS",
    ()=>LUXURY_CAFE_WRITER_ACCOUNT_IDS,
    "getCafeAccountPolicy",
    ()=>getCafeAccountPolicy,
    "getCafeCommenterAccounts",
    ()=>getCafeCommenterAccounts,
    "getCafeWriterAccounts",
    ()=>getCafeWriterAccounts
]);
const LUXURY_CAFE_WRITER_ACCOUNT_IDS = [];
const uniqueAccountsById = (accounts)=>{
    const seenAccountIds = new Set();
    return accounts.filter(({ id })=>{
        if (seenAccountIds.has(id)) {
            return false;
        }
        seenAccountIds.add(id);
        return true;
    });
};
const filterAccountsByIds = (accounts, allowedAccountIds)=>{
    if (!allowedAccountIds?.length) {
        return accounts;
    }
    const allowedIds = new Set(allowedAccountIds);
    return accounts.filter(({ id })=>allowedIds.has(id));
};
const isWriterAccount = ({ role })=>role === 'writer';
const isEligibleForAutoComment = ({ excludeFromAutoComment })=>!excludeFromAutoComment;
const getCafeAccountPolicy = (accounts)=>{
    const uniqueAccounts = uniqueAccountsById(accounts).filter(isEligibleForAutoComment);
    const writerRoleAccounts = uniqueAccounts.filter(isWriterAccount);
    return {
        writerAccounts: writerRoleAccounts,
        commenterAccounts: uniqueAccounts
    };
};
const getCafeWriterAccounts = (accounts, cafeId, allowedAccountIds)=>{
    void cafeId;
    const { writerAccounts } = getCafeAccountPolicy(accounts);
    return filterAccountsByIds(writerAccounts, allowedAccountIds);
};
const getCafeCommenterAccounts = (accounts, cafeId, excludedAccountId, allowedAccountIds)=>{
    void cafeId;
    const { commenterAccounts } = getCafeAccountPolicy(accounts);
    const filteredCommenters = filterAccountsByIds(commenterAccounts, allowedAccountIds);
    if (!excludedAccountId) {
        return filteredCommenters;
    }
    return filteredCommenters.filter(({ id })=>id !== excludedAccountId);
};
}),
"[project]/src/shared/config/cafes.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CAFE_LIST",
    ()=>CAFE_LIST,
    "getAllCafes",
    ()=>getAllCafes,
    "getCafeById",
    ()=>getCafeById,
    "getDefaultCafe",
    ()=>getDefaultCafe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/mongodb.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/models/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$cafe$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/cafe.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/config/user.ts [app-rsc] (ecmascript)");
;
;
;
const getAllCafes = async (userId)=>{
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
        const targetUserId = userId || await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCurrentUserId"])();
        const dbCafes = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$cafe$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Cafe"].find({
            userId: targetUserId,
            isActive: true
        }).sort({
            isDefault: -1,
            createdAt: 1
        }).lean();
        return dbCafes.map((c)=>{
            const categoryMenuIds = c.categoryMenuIds instanceof Map ? Object.fromEntries(c.categoryMenuIds) : c.categoryMenuIds;
            const categoryAliases = c.categoryAliases instanceof Map ? Object.fromEntries(c.categoryAliases) : c.categoryAliases;
            return {
                cafeId: c.cafeId,
                cafeUrl: c.cafeUrl,
                menuId: c.menuId,
                name: c.name,
                categories: c.categories || [],
                isDefault: c.isDefault,
                categoryMenuIds,
                categoryAliases
            };
        });
    } catch (error) {
        console.error('[CAFES] MongoDB 조회 실패:', error);
        return [];
    }
};
const getDefaultCafe = async (userId)=>{
    const cafes = await getAllCafes(userId);
    return cafes.find((c)=>c.isDefault) || cafes[0];
};
const getCafeById = async (cafeId, userId)=>{
    const cafes = await getAllCafes(userId);
    return cafes.find((c)=>c.cafeId === cafeId);
};
const CAFE_LIST = [];
}),
"[project]/src/shared/models/queue-settings.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_QUEUE_SETTINGS",
    ()=>DEFAULT_QUEUE_SETTINGS,
    "QueueSettings",
    ()=>QueueSettings,
    "getQueueSettings",
    ()=>getQueueSettings,
    "getRandomDelay",
    ()=>getRandomDelay,
    "updateQueueSettings",
    ()=>updateQueueSettings
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/mongodb.ts [app-rsc] (ecmascript)");
;
;
const DelayRangeSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    min: {
        type: Number,
        required: true
    },
    max: {
        type: Number,
        required: true
    }
}, {
    _id: false
});
const QueueSettingsSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    delays: {
        betweenPosts: {
            type: DelayRangeSchema,
            default: {
                min: 30 * 1000,
                max: 60 * 1000
            }
        },
        betweenComments: {
            type: DelayRangeSchema,
            default: {
                min: 3 * 60 * 1000,
                max: 8 * 60 * 1000
            }
        },
        afterPost: {
            type: DelayRangeSchema,
            default: {
                min: 5 * 1000,
                max: 15 * 1000
            }
        }
    },
    retry: {
        attempts: {
            type: Number,
            default: 3
        },
        backoffDelay: {
            type: Number,
            default: 5000
        }
    },
    limits: {
        enableDailyPostLimit: {
            type: Boolean,
            default: false
        },
        maxCommentsPerAccount: {
            type: Number,
            default: 0
        }
    },
    timeout: {
        type: Number,
        default: 5 * 60 * 1000
    }
}, {
    timestamps: true
});
const QueueSettings = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].models.QueueSettings || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].model('QueueSettings', QueueSettingsSchema);
const DEFAULT_QUEUE_SETTINGS = {
    delays: {
        betweenPosts: {
            min: 30 * 1000,
            max: 60 * 1000
        },
        betweenComments: {
            min: 3 * 60 * 1000,
            max: 8 * 60 * 1000
        },
        afterPost: {
            min: 5 * 1000,
            max: 15 * 1000
        }
    },
    retry: {
        attempts: 3,
        backoffDelay: 5000
    },
    limits: {
        enableDailyPostLimit: false,
        maxCommentsPerAccount: 0
    },
    timeout: 5 * 60 * 1000
};
const getQueueSettings = async ()=>{
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
    let settings = await QueueSettings.findOne().lean();
    if (!settings) {
        const created = await QueueSettings.create(DEFAULT_QUEUE_SETTINGS);
        settings = created.toObject();
    }
    return settings;
};
const updateQueueSettings = async (updates)=>{
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
    const settings = await QueueSettings.findOneAndUpdate({}, {
        $set: updates
    }, {
        new: true,
        upsert: true,
        lean: true
    });
    return settings;
};
const getRandomDelay = (range)=>{
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
};
}),
"[project]/src/shared/lib/account-manager.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getNextActiveTime",
    ()=>getNextActiveTime,
    "getPersonaId",
    ()=>getPersonaId,
    "isAccountActive",
    ()=>isAccountActive
]);
const getPersonaId = (account)=>{
    return account.personaId || null;
};
const isAccountActive = (account)=>{
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    if (account.restDays?.includes(currentDay)) return false;
    if (!account.activityHours) return true;
    const { start, end } = account.activityHours;
    if (start > end) {
        return currentHour >= start || currentHour < end;
    }
    return currentHour >= start && currentHour < end;
};
const getNextActiveTime = (account)=>{
    const now = new Date();
    const currentHour = now.getHours();
    if (isAccountActive(account)) return 0;
    if (!account.activityHours) return 0;
    const { start, end } = account.activityHours;
    const targetDate = new Date(now);
    targetDate.setMinutes(0, 0, 0);
    if (start > end) {
        if (currentHour < end) return 0;
        if (currentHour < start) {
            targetDate.setHours(start);
        } else {
            return 0;
        }
    } else {
        if (currentHour < start) {
            targetDate.setHours(start);
        } else {
            targetDate.setDate(targetDate.getDate() + 1);
            targetDate.setHours(start);
        }
    }
    if (account.restDays) {
        let safetyCounter = 0;
        while(account.restDays.includes(targetDate.getDay()) && safetyCounter < 7){
            targetDate.setDate(targetDate.getDate() + 1);
            safetyCounter++;
        }
    }
    const MAX_DELAY_MS = 24 * 60 * 60 * 1000;
    const delay = targetDate.getTime() - now.getTime();
    return Math.min(Math.max(0, delay), MAX_DELAY_MS);
};
}),
"[externals]/child_process [external] (child_process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("child_process", () => require("child_process"));

module.exports = mod;
}),
"[externals]/net [external] (net, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("net", () => require("net"));

module.exports = mod;
}),
"[externals]/worker_threads [external] (worker_threads, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("worker_threads", () => require("worker_threads"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[externals]/assert [external] (assert, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("assert", () => require("assert"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[externals]/tty [external] (tty, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("tty", () => require("tty"));

module.exports = mod;
}),
"[externals]/os [external] (os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/dns [external] (dns, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("dns", () => require("dns"));

module.exports = mod;
}),
"[externals]/tls [external] (tls, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("tls", () => require("tls"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[externals]/string_decoder [external] (string_decoder, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("string_decoder", () => require("string_decoder"));

module.exports = mod;
}),
"[project]/src/shared/lib/redis.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "closeRedisConnection",
    ()=>closeRedisConnection,
    "getRedisConnection",
    ()=>getRedisConnection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ioredis$2f$built$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/ioredis/built/index.js [app-rsc] (ecmascript)");
;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/1';
let redisConnection = null;
const getRedisConnection = ()=>{
    if (!redisConnection) {
        redisConnection = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ioredis$2f$built$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"](REDIS_URL, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false
        });
        redisConnection.on('error', (err)=>{
            console.error('[REDIS] 연결 에러:', err.message);
        });
        redisConnection.on('connect', ()=>{
            console.log('[REDIS] 연결됨');
        });
    }
    return redisConnection;
};
const closeRedisConnection = async ()=>{
    if (redisConnection) {
        await redisConnection.quit();
        redisConnection = null;
        console.log('[REDIS] 연결 종료');
    }
};
}),
"[project]/src/shared/lib/queue/types.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GENERATE_QUEUE_NAME",
    ()=>GENERATE_QUEUE_NAME,
    "TASK_QUEUE_NAME",
    ()=>TASK_QUEUE_NAME,
    "getTaskQueueName",
    ()=>getTaskQueueName
]);
const TASK_QUEUE_NAME = 'task_global';
const getTaskQueueName = ()=>TASK_QUEUE_NAME;
const GENERATE_QUEUE_NAME = 'generate';
}),
"[project]/src/shared/lib/queue/task-job-harness.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createAddTaskJob",
    ()=>createAddTaskJob,
    "createRescheduleToken",
    ()=>createRescheduleToken,
    "generateTaskJobId",
    ()=>generateTaskJobId,
    "resolveTaskJobDelay",
    ()=>resolveTaskJobDelay
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
const getContentHash = (value)=>{
    return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["createHash"])('md5').update(value).digest('hex').slice(0, 8);
};
const getSequenceSuffix = (data)=>{
    if (!data.sequenceId || data.sequenceIndex === undefined) {
        return '';
    }
    return `_seq_${data.sequenceId}_${data.sequenceIndex}`;
};
const getRescheduleSuffix = (data)=>{
    if (!data.rescheduleToken) {
        return '';
    }
    return `_r${data.rescheduleToken}`;
};
const createRescheduleToken = ()=>{
    const now = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    return `${now}_${rand}`;
};
const generateTaskJobId = (data)=>{
    switch(data.type){
        case 'post':
            {
                const postData = data;
                const hash = getContentHash(postData.subject);
                return `post_${data.accountId}_${hash}${getRescheduleSuffix(postData)}`;
            }
        case 'comment':
            {
                const sequenceSuffix = getSequenceSuffix(data);
                const rescheduleSuffix = getRescheduleSuffix(data);
                return `comment_${data.accountId}_${data.articleId}_${getContentHash(data.content)}${sequenceSuffix}${rescheduleSuffix}`;
            }
        case 'reply':
            {
                const sequenceSuffix = getSequenceSuffix(data);
                const rescheduleSuffix = getRescheduleSuffix(data);
                return `reply_${data.accountId}_${data.articleId}_${data.commentIndex}_${getContentHash(data.content)}${sequenceSuffix}${rescheduleSuffix}`;
            }
        case 'like':
            {
                const hash = getContentHash(`${data.cafeId}_${data.articleId}`);
                return `like_${data.accountId}_${hash}${getRescheduleSuffix(data)}`;
            }
        case 'disable-comment':
            {
                const hash = getContentHash(`${data.cafeId}_${data.articleId}`);
                return `disablecomment_${data.accountId}_${hash}${getRescheduleSuffix(data)}`;
            }
    }
};
const resolveTaskJobDelay = (data, settings, getRandomDelay, delay)=>{
    if (delay !== undefined) {
        return delay;
    }
    if (data.type === 'post') {
        return getRandomDelay(settings.delays.betweenPosts);
    }
    return getRandomDelay(settings.delays.betweenComments);
};
const createAddTaskJob = ({ getTaskQueue, getQueueSettings, getRandomDelay, log = console.log })=>{
    return async (accountId, data, delay)=>{
        const queue = getTaskQueue(accountId);
        const settings = await getQueueSettings();
        const jobDelay = resolveTaskJobDelay(data, settings, getRandomDelay, delay);
        const jobId = generateTaskJobId(data);
        const existingJob = await queue.getJob(jobId);
        if (existingJob) {
            const state = await existingJob.getState();
            if ([
                'waiting',
                'delayed',
                'active'
            ].includes(state)) {
                log(`[QUEUE] 중복 Job 스킵: ${jobId} (상태: ${state})`);
                return null;
            }
        }
        const job = await queue.add(data.type, data, {
            delay: jobDelay,
            jobId
        });
        log(`[QUEUE] Job 추가: ${data.type} (${accountId}), 딜레이: ${Math.round(jobDelay / 1000)}초`);
        return job;
    };
};
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/process [external] (process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("process", () => require("process"));

module.exports = mod;
}),
"[externals]/querystring [external] (querystring, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("querystring", () => require("querystring"));

module.exports = mod;
}),
"[externals]/fs/promises [external] (fs/promises, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs/promises", () => require("fs/promises"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[externals]/node:stream/promises [external] (node:stream/promises, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:stream/promises", () => require("node:stream/promises"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[project]/src/shared/lib/captcha-solver.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "detectCaptcha",
    ()=>detectCaptcha,
    "solveCaptchaOnPage",
    ()=>solveCaptchaOnPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$google$2f$genai$2f$dist$2f$node$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@google/genai/dist/node/index.mjs [app-rsc] (ecmascript)");
;
const CAPTCHA_PROVIDER = process.env.CAPTCHA_PROVIDER || 'gemini';
const CAPTCHA_MODEL = process.env.GEMINI_CAPTCHA_MODEL || 'gemini-3.5-flash';
const MAX_CAPTCHA_ATTEMPTS = 3;
const CAPTCHA_INPUT_DELAY_MS = 200;
const PW_INPUT_DELAY_MS = 150;
const LOGIN_CLICK_WAIT_MS = 3000;
const SELECTORS = {
    captchaType: '#captcha_type',
    captchaImg: '#captchaimg',
    captchaInfo: '#captcha_info',
    captchaInput: 'input#captcha',
    pwInput: 'input#pw',
    loginButton: 'button.btn_login, button#log\\.login'
};
const getGeminiApiKey = ()=>{
    return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || null;
};
let geminiClient = null;
const getGeminiClient = ()=>{
    if (geminiClient) return geminiClient;
    const apiKey = getGeminiApiKey();
    if (!apiKey) throw new Error('GEMINI_API_KEY 없음');
    const keySource = process.env.GOOGLE_API_KEY ? 'GOOGLE_API_KEY' : process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : 'GOOGLE_GENAI_API_KEY';
    console.log(`[CAPTCHA] provider=${CAPTCHA_PROVIDER} model=${CAPTCHA_MODEL} key=${keySource}`);
    geminiClient = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$google$2f$genai$2f$dist$2f$node$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["GoogleGenAI"]({
        apiKey
    });
    return geminiClient;
};
const safeEvaluate = async (page, fn, fallback)=>{
    return page.evaluate(fn).catch(()=>fallback);
};
const detectCaptcha = async (page)=>{
    const captchaType = await safeEvaluate(page, ()=>{
        const el = document.getElementById('captcha_type');
        return el?.value || '';
    }, '');
    if (!captchaType) return {
        detected: false
    };
    const base64 = await safeEvaluate(page, ()=>{
        const img = document.getElementById('captchaimg');
        if (!img?.src) return '';
        const match = img.src.match(/base64,(.+)/);
        return match?.[1] || '';
    }, '');
    if (!base64) return {
        detected: false
    };
    const question = await safeEvaluate(page, ()=>{
        const el = document.getElementById('captcha_info');
        return el?.textContent?.trim() || '';
    }, '');
    return {
        detected: true,
        base64,
        question,
        captchaType
    };
};
const solveWithGemini = async (base64, question)=>{
    const ai = getGeminiClient();
    const startedAt = Date.now();
    const response = await ai.models.generateContent({
        model: CAPTCHA_MODEL,
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: base64
                        }
                    },
                    {
                        text: `이 이미지는 네이버 로그인 캡차로 나오는 가상 영수증(receipt)이다.
영수증에는 상호명, 주소, 전화번호, 품목명, 단가, 수량, 합계 등이 표 형식으로 적혀있다.

단계:
1. 영수증의 모든 텍스트를 머릿속으로 정확히 OCR 한다.
2. 질문을 분해한다. (예: "전화번호의 뒤에서 2번째 숫자" → 전화번호 찾기 → 끝에서 2번째 자릿수 추출)
3. 정답을 결정한다.

질문: "${question}"

출력 규칙(절대 지킬 것):
- 답만 한 줄로 출력. 설명/사고과정/문장 금지.
- 숫자면 숫자만 (콤마, 원, 개 등 단위 제외).
- 도로명/품목명이면 그 단어만.
- 정확히 답을 모르면 가장 가능성 높은 추측 한 가지만.`
                    }
                ]
            }
        ]
    });
    const elapsed = Date.now() - startedAt;
    const answer = response.text?.trim() || '';
    return {
        answer,
        elapsed
    };
};
const solveCaptchaOnPage = async (page, accountId, password)=>{
    for(let attempt = 1; attempt <= MAX_CAPTCHA_ATTEMPTS; attempt++){
        const captcha = await detectCaptcha(page);
        if (!captcha.detected) {
            return {
                solved: true,
                attempts: attempt - 1
            };
        }
        console.log(`[CAPTCHA] ${accountId} 캡차 감지 (시도 ${attempt}/${MAX_CAPTCHA_ATTEMPTS}) — 타입: ${captcha.captchaType}, 질문: ${captcha.question}`);
        try {
            const { answer, elapsed } = await solveWithGemini(captcha.base64, captcha.question);
            if (!answer) {
                console.warn(`[CAPTCHA] ${accountId} AI가 빈 답변 반환 — 재시도`);
                continue;
            }
            console.log(`[CAPTCHA] ${accountId} AI 답: "${answer}" (${elapsed}ms)`);
            await page.fill(SELECTORS.captchaInput, answer);
            await page.waitForTimeout(CAPTCHA_INPUT_DELAY_MS);
            const pwEmpty = await safeEvaluate(page, ()=>document.getElementById('pw')?.value === '', false);
            if (pwEmpty && password) {
                await page.fill(SELECTORS.pwInput, password);
                await page.waitForTimeout(PW_INPUT_DELAY_MS);
            }
            await page.click(SELECTORS.loginButton);
            await page.waitForTimeout(LOGIN_CLICK_WAIT_MS);
            if (!page.url().includes('nidlogin')) {
                console.log(`[CAPTCHA] ${accountId} 캡차 풀이 성공 (${attempt}회 시도)`);
                return {
                    solved: true,
                    attempts: attempt
                };
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`[CAPTCHA] ${accountId} 풀이 에러 (시도 ${attempt}): ${msg}`);
            continue;
        }
    }
    console.log(`[CAPTCHA] ${accountId} ${MAX_CAPTCHA_ATTEMPTS}회 시도 실패`);
    return {
        solved: false,
        attempts: MAX_CAPTCHA_ATTEMPTS,
        error: '캡차 풀이 최대 시도 초과'
    };
};
}),
"[project]/src/shared/lib/multi-session.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "acquireAccountLock",
    ()=>acquireAccountLock,
    "closeAllContexts",
    ()=>closeAllContexts,
    "closeContextForAccount",
    ()=>closeContextForAccount,
    "getBrowser",
    ()=>getBrowser,
    "getContextForAccount",
    ()=>getContextForAccount,
    "getPageForAccount",
    ()=>getPageForAccount,
    "invalidateLoginCache",
    ()=>invalidateLoginCache,
    "isAccountLoggedIn",
    ()=>isAccountLoggedIn,
    "isAccountSessionReserved",
    ()=>isAccountSessionReserved,
    "isLoginRedirect",
    ()=>isLoginRedirect,
    "loadCookiesForAccount",
    ()=>loadCookiesForAccount,
    "loginAccount",
    ()=>loginAccount,
    "releaseAccountLock",
    ()=>releaseAccountLock,
    "releaseAccountSession",
    ()=>releaseAccountSession,
    "reserveAccountSession",
    ()=>reserveAccountSession,
    "saveCookiesForAccount",
    ()=>saveCookiesForAccount,
    "touchAccount",
    ()=>touchAccount,
    "warmupScheduleSessions",
    ()=>warmupScheduleSessions
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$playwright__$5b$external$5d$__$28$playwright$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$playwright$29$__ = __turbopack_context__.i("[externals]/playwright [external] (playwright, esm_import, [project]/node_modules/playwright)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$captcha$2d$solver$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/captcha-solver.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$playwright__$5b$external$5d$__$28$playwright$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$playwright$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$playwright__$5b$external$5d$__$28$playwright$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$playwright$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
const SESSION_DIR = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"])(process.cwd(), '.playwright-session');
const LOGIN_POLL_INTERVAL_MS = 1000;
const DEFAULT_LOGIN_WAIT_MS = 3000;
const SCHEDULE_LOGIN_WAIT_MS = 10 * 60 * 1000;
const SCHEDULE_ACCOUNT_OPEN_INTERVAL_MS = 5 * 1000;
const DEFAULT_SCHEDULE_RESERVATION_TTL_MS = 60 * 60 * 1000;
// HMR에서 상태 유지 (Next.js dev 모듈 재평가 대응)
const g = globalThis;
if (!g.__pwContexts) g.__pwContexts = new Map();
if (!g.__pwAccountLocks) g.__pwAccountLocks = new Map();
if (!g.__pwLockResolvers) g.__pwLockResolvers = new Map();
if (!g.__pwLoginCache) g.__pwLoginCache = new Map();
if (!g.__pwLastUsed) g.__pwLastUsed = new Map();
if (!g.__pwIdleExpiresAt) g.__pwIdleExpiresAt = new Map();
if (!g.__pwReservedSessions) g.__pwReservedSessions = new Map();
const contexts = g.__pwContexts;
const accountLocks = g.__pwAccountLocks;
const lockResolvers = g.__pwLockResolvers;
const loginStatusCache = g.__pwLoginCache;
const lastUsedAt = g.__pwLastUsed;
const idleExpiresAt = g.__pwIdleExpiresAt;
const reservedSessions = g.__pwReservedSessions;
const LOGIN_CACHE_TTL = 30 * 60 * 1000;
const IDLE_TTL_MIN = 10 * 60 * 1000;
const IDLE_TTL_MAX = 15 * 60 * 1000;
const randomIdleTtl = ()=>IDLE_TTL_MIN + Math.floor(Math.random() * (IDLE_TTL_MAX - IDLE_TTL_MIN));
const IDLE_CHECK_INTERVAL = 60 * 1000; // 1분마다 체크
const touchAccount = (accountId)=>{
    const now = Date.now();
    lastUsedAt.set(accountId, now);
    idleExpiresAt.set(accountId, now + randomIdleTtl());
};
const startIdleCleanup = ()=>{
    if (g.__pwIdleTimer) return;
    g.__pwIdleTimer = setInterval(async ()=>{
        const now = Date.now();
        for (const [accountId, lastTime] of lastUsedAt){
            const expiresAt = idleExpiresAt.get(accountId) ?? lastTime + IDLE_TTL_MAX;
            if (now < expiresAt) continue;
            if (accountLocks.has(accountId)) continue; // 작업 중이면 스킵
            if (reservedSessions.get(accountId)?.size) continue; // 예약 세션은 유지
            const ctx = contexts.get(accountId);
            if (!ctx) {
                lastUsedAt.delete(accountId);
                idleExpiresAt.delete(accountId);
                continue;
            }
            try {
                await saveCookiesForAccount(accountId);
                await ctx.close();
                console.log(`[IDLE] ${accountId} context 정리 (${Math.round((now - lastTime) / 1000)}초 idle)`);
            } catch  {
            // 이미 닫혀있을 수 있음
            }
            contexts.delete(accountId);
            loginStatusCache.delete(accountId);
            lastUsedAt.delete(accountId);
            idleExpiresAt.delete(accountId);
        }
    }, IDLE_CHECK_INTERVAL);
};
startIdleCleanup();
const ACCOUNT_LOCK_TIMEOUT_MS = 5 * 60 * 1000;
const acquireAccountLock = async (accountId)=>{
    const deadline = Date.now() + ACCOUNT_LOCK_TIMEOUT_MS;
    while(accountLocks.has(accountId)){
        if (Date.now() > deadline) {
            throw new Error(`[LOCK] ${accountId} 락 대기 타임아웃 (${ACCOUNT_LOCK_TIMEOUT_MS / 1000}초)`);
        }
        console.log(`[LOCK] ${accountId} 락 대기 중...`);
        await Promise.race([
            accountLocks.get(accountId),
            new Promise((r)=>setTimeout(r, 5000))
        ]);
    }
    let resolver;
    const lockPromise = new Promise((resolve)=>{
        resolver = resolve;
    });
    accountLocks.set(accountId, lockPromise);
    lockResolvers.set(accountId, resolver);
    console.log(`[LOCK] ${accountId} 락 획득`);
};
const releaseAccountLock = (accountId)=>{
    const resolver = lockResolvers.get(accountId);
    if (resolver) {
        resolver();
        accountLocks.delete(accountId);
        lockResolvers.delete(accountId);
        console.log(`[LOCK] ${accountId} 락 해제`);
    }
};
const invalidateLoginCache = (accountId)=>{
    loginStatusCache.delete(accountId);
    console.log(`[LOGIN] ${accountId} 캐시 무효화됨`);
};
const reserveAccountSession = (accountId, reservationId)=>{
    const reservations = reservedSessions.get(accountId) ?? new Set();
    reservations.add(reservationId);
    reservedSessions.set(accountId, reservations);
    touchAccount(accountId);
    console.log(`[SESSION] ${accountId} 세션 예약 (${reservations.size}개)`);
};
const releaseAccountSession = (accountId, reservationId)=>{
    const reservations = reservedSessions.get(accountId);
    if (!reservations) return;
    if (reservationId) {
        reservations.delete(reservationId);
    } else {
        reservations.clear();
    }
    if (reservations.size === 0) {
        reservedSessions.delete(accountId);
        console.log(`[SESSION] ${accountId} 세션 예약 해제`);
        return;
    }
    reservedSessions.set(accountId, reservations);
    console.log(`[SESSION] ${accountId} 세션 예약 유지 (${reservations.size}개)`);
};
const isAccountSessionReserved = (accountId)=>{
    return (reservedSessions.get(accountId)?.size ?? 0) > 0;
};
const isLoginRedirect = (url)=>{
    return url.includes('nidlogin.login') || url.includes('nid.naver.com/nidlogin');
};
const getLoginBlockedReason = (url, bodyText = '')=>{
    if (url.includes('/user2/help/idRelease')) {
        return '아이디 보호/해제 페이지로 이동';
    }
    if (url.includes('nid.naver.com') && /아이디.{0,10}보호.{0,10}해제|보호조치.{0,10}해제|휴면.{0,10}해제/.test(bodyText)) {
        return '로그인 후 보호/휴면 해제 필요';
    }
    return null;
};
const getSessionFile = (accountId)=>{
    return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"])(SESSION_DIR, `${accountId}-cookies.json`);
};
const getBrowser = async ()=>{
    if (g.__pwBrowser && g.__pwBrowser.isConnected()) {
        return g.__pwBrowser;
    }
    // 이미 다른 호출이 브라우저 생성 중이면 그 결과를 기다림
    if (g.__pwBrowserLaunching) {
        return g.__pwBrowserLaunching;
    }
    g.__pwBrowserLaunching = (async ()=>{
        if (g.__pwBrowser) {
            console.log('[BROWSER] 브라우저 연결 끊김 - 재시작');
            contexts.clear();
            loginStatusCache.clear();
            lastUsedAt.clear();
            idleExpiresAt.clear();
        }
        const isHeadless = process.env.PLAYWRIGHT_HEADLESS !== 'false';
        console.log(`[BROWSER] 브라우저 시작 (headless: ${isHeadless})`);
        g.__pwBrowser = await __TURBOPACK__imported__module__$5b$externals$5d2f$playwright__$5b$external$5d$__$28$playwright$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$playwright$29$__["chromium"].launch({
            headless: isHeadless,
            slowMo: isHeadless ? 0 : 100
        });
        return g.__pwBrowser;
    })();
    try {
        const browser = await g.__pwBrowserLaunching;
        return browser;
    } finally{
        g.__pwBrowserLaunching = null;
    }
};
const isContextAlive = (ctx)=>{
    try {
        ctx.pages();
        return true;
    } catch  {
        return false;
    }
};
const getContextForAccount = async (accountId)=>{
    touchAccount(accountId);
    const existing = contexts.get(accountId);
    if (existing && isContextAlive(existing)) {
        return existing;
    }
    if (existing) {
        console.log(`[CONTEXT] ${accountId} 컨텍스트 죽음 감지 - 재생성`);
        contexts.delete(accountId);
        loginStatusCache.delete(accountId);
    }
    const b = await getBrowser();
    const useFingerprint = process.env.FINGERPRINT_ENABLED === 'true';
    let contextOptions = {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
    };
    if (useFingerprint) {
        const { getProfileForAccount } = await __turbopack_context__.A("[project]/src/shared/lib/fingerprint/index.ts [app-rsc] (ecmascript, async loader)");
        const profile = getProfileForAccount(accountId);
        contextOptions = {
            userAgent: profile.userAgent,
            viewport: profile.viewport,
            deviceScaleFactor: profile.deviceScaleFactor,
            locale: profile.locale,
            timezoneId: profile.timezoneId,
            colorScheme: profile.colorScheme
        };
    }
    const context = await b.newContext(contextOptions);
    if (useFingerprint) {
        const { getProfileForAccount, applyStealth } = await __turbopack_context__.A("[project]/src/shared/lib/fingerprint/index.ts [app-rsc] (ecmascript, async loader)");
        await applyStealth(context, getProfileForAccount(accountId));
    }
    const cookies = loadCookiesForAccount(accountId);
    if (cookies.length > 0) {
        await context.addCookies(cookies);
    }
    contexts.set(accountId, context);
    return context;
};
const getPageForAccount = async (accountId)=>{
    touchAccount(accountId);
    const ctx = await getContextForAccount(accountId);
    const pages = ctx.pages();
    if (pages.length > 0) {
        const page = pages[0];
        if (!page.isClosed()) return page;
    }
    return ctx.newPage();
};
const saveCookiesForAccount = async (accountId)=>{
    const context = contexts.get(accountId);
    if (!context) return;
    if (!(0, __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["existsSync"])(SESSION_DIR)) {
        (0, __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["mkdirSync"])(SESSION_DIR, {
            recursive: true
        });
    }
    const cookies = await context.cookies();
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["writeFileSync"])(getSessionFile(accountId), JSON.stringify(cookies, null, 2));
};
const loadCookiesForAccount = (accountId)=>{
    const sessionFile = getSessionFile(accountId);
    if (!(0, __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["existsSync"])(sessionFile)) {
        return [];
    }
    try {
        const data = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["readFileSync"])(sessionFile, 'utf-8');
        return JSON.parse(data);
    } catch  {
        return [];
    }
};
const closeContextForAccount = async (accountId)=>{
    const context = contexts.get(accountId);
    if (context) {
        await saveCookiesForAccount(accountId);
        await context.close();
        contexts.delete(accountId);
    }
    loginStatusCache.delete(accountId);
    lastUsedAt.delete(accountId);
    idleExpiresAt.delete(accountId);
};
const closeAllContexts = async ()=>{
    for (const [accountId, context] of contexts){
        await saveCookiesForAccount(accountId);
        await context.close();
    }
    contexts.clear();
    loginStatusCache.clear();
    lastUsedAt.clear();
    idleExpiresAt.clear();
    reservedSessions.clear();
    if (g.__pwBrowser) {
        await g.__pwBrowser.close();
        g.__pwBrowser = null;
    }
    if (g.__pwIdleTimer) {
        clearInterval(g.__pwIdleTimer);
        g.__pwIdleTimer = null;
    }
};
const waitForLoginCompletion = async (page, accountId, options)=>{
    const waitForLoginMs = options?.waitForLoginMs ?? DEFAULT_LOGIN_WAIT_MS;
    const pollIntervalMs = options?.pollIntervalMs ?? LOGIN_POLL_INTERVAL_MS;
    const startedAt = Date.now();
    if (waitForLoginMs > DEFAULT_LOGIN_WAIT_MS) {
        console.log(`[LOGIN] ${accountId} 로그인 완료 대기 중 (${Math.round(waitForLoginMs / 1000)}초, reason: ${options?.reason || 'default'})`);
    }
    while(Date.now() - startedAt <= waitForLoginMs){
        touchAccount(accountId);
        if (!isLoginRedirect(page.url())) {
            return true;
        }
        const remainingTime = waitForLoginMs - (Date.now() - startedAt);
        if (remainingTime <= 0) {
            break;
        }
        await page.waitForTimeout(Math.min(pollIntervalMs, remainingTime));
    }
    return !isLoginRedirect(page.url());
};
const fillLoginInput = async (page, selector, value)=>{
    const input = page.locator(selector);
    await input.click({
        force: true
    });
    await page.keyboard.press('Meta+A');
    await page.keyboard.type(value, {
        delay: 50
    });
};
const submitLoginForm = async (page)=>{
    const loginButton = page.locator('button.btn_login, button#log\\.login').first();
    await loginButton.click({
        force: true
    }).catch(async ()=>{
        await page.evaluate(()=>{
            const button = document.querySelector('button.btn_login, button#log\\.login');
            button?.click();
        });
    });
    await page.waitForTimeout(1000);
    if (isLoginRedirect(page.url())) {
        await page.keyboard.press('Enter').catch(()=>{});
    }
};
const scheduleSessionReservationRelease = (accountId, reservationId, reservationTtlMs)=>{
    const timer = setTimeout(()=>{
        releaseAccountSession(accountId, reservationId);
    }, reservationTtlMs);
    timer.unref?.();
};
const isAccountLoggedIn = async (accountId)=>{
    const cachedTime = loginStatusCache.get(accountId);
    if (cachedTime && Date.now() - cachedTime < LOGIN_CACHE_TTL) {
        console.log(`[LOGIN] ${accountId} 캐시 히트 (${Math.round((Date.now() - cachedTime) / 1000)}초 전 확인)`);
        return true;
    }
    const page = await getPageForAccount(accountId);
    try {
        await page.goto('https://nid.naver.com/nidlogin.login', {
            waitUntil: 'networkidle',
            timeout: 10000
        });
        const url = page.url();
        const bodyText = await page.locator('body').innerText({
            timeout: 3000
        }).catch(()=>'');
        const isLoggedIn = !url.includes('nidlogin.login') && !getLoginBlockedReason(url, bodyText);
        if (isLoggedIn) {
            loginStatusCache.set(accountId, Date.now());
            console.log(`[LOGIN] ${accountId} 로그인 상태 캐시됨`);
        } else {
            loginStatusCache.delete(accountId);
        }
        return isLoggedIn;
    } catch  {
        loginStatusCache.delete(accountId);
        return false;
    }
};
const loginAccount = async (accountId, password, options)=>{
    try {
        const page = await getPageForAccount(accountId);
        const forceFreshLogin = options?.forceFreshLogin ?? false;
        await page.goto('https://nid.naver.com/nidlogin.login', {
            waitUntil: 'domcontentloaded',
            timeout: 45_000
        });
        if (!isLoginRedirect(page.url())) {
            if (forceFreshLogin) {
                console.log(`[LOGIN] ${accountId} 강제 재로그인 시작`);
                await page.goto('https://nid.naver.com/nidlogin.logout', {
                    waitUntil: 'domcontentloaded',
                    timeout: 45_000
                }).catch(()=>{});
                await page.waitForTimeout(1000);
                await page.goto('https://nid.naver.com/nidlogin.login', {
                    waitUntil: 'domcontentloaded',
                    timeout: 45_000
                });
            } else {
                await saveCookiesForAccount(accountId);
                loginStatusCache.set(accountId, Date.now());
                console.log(`[LOGIN] ${accountId} 이미 로그인 상태`);
                return {
                    success: true
                };
            }
        }
        await fillLoginInput(page, 'input#id', accountId);
        await fillLoginInput(page, 'input#pw', password);
        await submitLoginForm(page);
        // 로그인 버튼 클릭 후 3초 대기
        await page.waitForTimeout(3000);
        // 캡차 감지 및 자동 풀이
        if (isLoginRedirect(page.url())) {
            const captchaCheck = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$captcha$2d$solver$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["detectCaptcha"])(page);
            if (captchaCheck.detected) {
                const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
                if (!geminiKey) {
                    return {
                        success: false,
                        error: 'GEMINI_API_KEY 미설정 — 캡차 자동 풀이 불가'
                    };
                }
                const captchaResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$captcha$2d$solver$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["solveCaptchaOnPage"])(page, accountId, password);
                if (!captchaResult.solved) {
                    const manualWaitMs = options?.waitForLoginMs ?? DEFAULT_LOGIN_WAIT_MS;
                    if (manualWaitMs > DEFAULT_LOGIN_WAIT_MS) {
                        console.log(`[LOGIN] ${accountId} 캡차 자동 풀이 실패 - 수동 로그인 완료 대기 (${Math.round(manualWaitMs / 1000)}초)`);
                        const loginCompleted = await waitForLoginCompletion(page, accountId, options);
                        if (loginCompleted) {
                            await saveCookiesForAccount(accountId);
                            loginStatusCache.set(accountId, Date.now());
                            console.log(`[LOGIN] ${accountId} 수동 로그인 완료, 캐시 갱신`);
                            return {
                                success: true
                            };
                        }
                    }
                    return {
                        success: false,
                        error: `캡차 풀이 실패 (${captchaResult.attempts}회 시도): ${captchaResult.error}`
                    };
                }
            }
        }
        // 캡차 풀이 후에도 로그인 미완료 시 대기
        if (isLoginRedirect(page.url())) {
            const loginCompleted = await waitForLoginCompletion(page, accountId, options);
            if (!loginCompleted) {
                return {
                    success: false,
                    error: '로그인 대기 시간 초과. 추가 인증 여부를 확인해주세요.'
                };
            }
        }
        const blockedReason = getLoginBlockedReason(page.url(), await page.locator('body').innerText({
            timeout: 5000
        }).catch(()=>''));
        if (blockedReason) {
            loginStatusCache.delete(accountId);
            return {
                success: false,
                error: blockedReason
            };
        }
        await saveCookiesForAccount(accountId);
        loginStatusCache.set(accountId, Date.now());
        console.log(`[LOGIN] ${accountId} 로그인 완료, 캐시 갱신`);
        return {
            success: true
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        return {
            success: false,
            error: errorMessage
        };
    }
};
const warmupScheduleSessions = async (accounts, options)=>{
    const uniqueAccounts = [];
    const seenAccountIds = new Set();
    for (const account of accounts){
        if (seenAccountIds.has(account.id)) continue;
        seenAccountIds.add(account.id);
        uniqueAccounts.push(account);
    }
    if (uniqueAccounts.length === 0) {
        return {
            success: true,
            warmedAccountIds: []
        };
    }
    const reservationId = options?.reason || `schedule_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const waitBetweenAccountsMs = options?.waitBetweenAccountsMs ?? SCHEDULE_ACCOUNT_OPEN_INTERVAL_MS;
    const loginWaitMs = options?.loginWaitMs ?? SCHEDULE_LOGIN_WAIT_MS;
    const reservationTtlMs = options?.reservationTtlMs ?? DEFAULT_SCHEDULE_RESERVATION_TTL_MS;
    const continueOnFailure = options?.continueOnFailure ?? false;
    const warmedAccountIds = [];
    const failedAccounts = [];
    for(let i = 0; i < uniqueAccounts.length; i++){
        const { id, password } = uniqueAccounts[i];
        reserveAccountSession(id, reservationId);
        await acquireAccountLock(id);
        try {
            console.log(`[SESSION] 스케줄 세션 프리워밍 시작: ${id} (${i + 1}/${uniqueAccounts.length})`);
            const loggedIn = await isAccountLoggedIn(id);
            if (!loggedIn) {
                const loginResult = await loginAccount(id, password, {
                    waitForLoginMs: loginWaitMs,
                    reason: reservationId
                });
                if (!loginResult.success) {
                    releaseAccountSession(id, reservationId);
                    const error = loginResult.error || '로그인 실패';
                    if (continueOnFailure) {
                        failedAccounts.push({
                            accountId: id,
                            error
                        });
                        console.log(`[SESSION] 스케줄 세션 프리워밍 실패 - 계속 진행: ${id} - ${error}`);
                        continue;
                    }
                    for (const warmedAccountId of warmedAccountIds){
                        releaseAccountSession(warmedAccountId, reservationId);
                    }
                    return {
                        success: false,
                        warmedAccountIds,
                        failedAccountId: id,
                        error,
                        failedAccounts
                    };
                }
            }
            warmedAccountIds.push(id);
            scheduleSessionReservationRelease(id, reservationId, reservationTtlMs);
            touchAccount(id);
            console.log(`[SESSION] 스케줄 세션 준비 완료: ${id}`);
        } finally{
            releaseAccountLock(id);
        }
        if (i < uniqueAccounts.length - 1) {
            await new Promise((resolve)=>{
                setTimeout(resolve, waitBetweenAccountsMs);
            });
        }
    }
    return {
        success: failedAccounts.length === 0 || continueOnFailure,
        warmedAccountIds,
        failedAccounts
    };
};
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/shared/types/post-options.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_POST_OPTIONS",
    ()=>DEFAULT_POST_OPTIONS
]);
const DEFAULT_POST_OPTIONS = {
    allowComment: true,
    allowScrap: true,
    allowCopy: false,
    useAutoSource: false,
    useCcl: false,
    cclCommercial: 'disallow',
    cclModify: 'disallow'
};
}),
"[project]/src/shared/types/index.ts [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$types$2f$post$2d$options$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/types/post-options.ts [app-rsc] (ecmascript)");
;
}),
"[project]/src/shared/models/daily-activity.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DailyActivity",
    ()=>DailyActivity,
    "getAccountTodayTotal",
    ()=>getAccountTodayTotal,
    "getActivityRange",
    ()=>getActivityRange,
    "getAllTodayActivities",
    ()=>getAllTodayActivities,
    "getCafeTodayActivities",
    ()=>getCafeTodayActivities,
    "getTodayActivity",
    ()=>getTodayActivity,
    "getTodayString",
    ()=>getTodayString,
    "incrementActivity",
    ()=>incrementActivity
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
;
const DailyActivitySchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    accountId: {
        type: String,
        required: true,
        index: true
    },
    cafeId: {
        type: String,
        required: true,
        index: true
    },
    date: {
        type: String,
        required: true,
        index: true
    },
    posts: {
        type: Number,
        default: 0
    },
    comments: {
        type: Number,
        default: 0
    },
    replies: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    lastActivityAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});
DailyActivitySchema.index({
    accountId: 1,
    cafeId: 1,
    date: 1
}, {
    unique: true
});
const DailyActivity = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].models.DailyActivity || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].model('DailyActivity', DailyActivitySchema);
const getTodayString = ()=>{
    const now = new Date();
    return now.toISOString().split('T')[0]; // "2025-01-12"
};
const incrementActivity = async (accountId, cafeId, type)=>{
    const today = getTodayString();
    try {
        await DailyActivity.findOneAndUpdate({
            accountId,
            cafeId,
            date: today
        }, {
            $inc: {
                [type]: 1
            },
            $set: {
                lastActivityAt: new Date()
            }
        }, {
            upsert: true
        });
        console.log(`[ACTIVITY] ${accountId}@${cafeId} ${type} +1 (${today})`);
    } catch (error) {
        if (error instanceof Error && error.message.includes('E11000')) {
            await DailyActivity.updateOne({
                accountId,
                cafeId,
                date: today
            }, {
                $inc: {
                    [type]: 1
                },
                $set: {
                    lastActivityAt: new Date()
                }
            });
            console.log(`[ACTIVITY] ${accountId}@${cafeId} ${type} +1 (${today}) [재시도 성공]`);
        } else {
            console.error(`[ACTIVITY] 증가 실패:`, error);
        }
    }
};
const getTodayActivity = async (accountId, cafeId)=>{
    const today = getTodayString();
    return DailyActivity.findOne({
        accountId,
        cafeId,
        date: today
    }).lean();
};
const getCafeTodayActivities = async (cafeId)=>{
    const today = getTodayString();
    return DailyActivity.find({
        cafeId,
        date: today
    }).lean();
};
const getAllTodayActivities = async ()=>{
    const today = getTodayString();
    return DailyActivity.find({
        date: today
    }).lean();
};
const getActivityRange = async (accountId, cafeId, startDate, endDate)=>{
    return DailyActivity.find({
        accountId,
        cafeId,
        date: {
            $gte: startDate,
            $lte: endDate
        }
    }).sort({
        date: -1
    }).lean();
};
const getAccountTodayTotal = async (accountId)=>{
    const today = getTodayString();
    const activities = await DailyActivity.find({
        accountId,
        date: today
    }).lean();
    return activities.reduce((acc, act)=>({
            posts: acc.posts + act.posts,
            comments: acc.comments + act.comments,
            replies: acc.replies + act.replies,
            likes: acc.likes + act.likes
        }), {
        posts: 0,
        comments: 0,
        replies: 0,
        likes: 0
    });
};
}),
"[project]/src/shared/lib/naver-cafe-writing/image-uploader.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cleanupTempFiles",
    ()=>cleanupTempFiles,
    "downloadImageToTempFile",
    ()=>downloadImageToTempFile,
    "saveBase64ToTempFile",
    ()=>saveBase64ToTempFile,
    "uploadImages",
    ()=>uploadImages,
    "uploadSingleImage",
    ()=>uploadSingleImage
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$os__$5b$external$5d$__$28$os$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/os [external] (os, cjs)");
;
;
;
// URL에서 확장자 추출 (쿼리스트링 제거)
const getExtensionFromUrl = (url)=>{
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const ext = pathname.split('.').pop()?.toLowerCase();
        return ext && [
            'png',
            'jpg',
            'jpeg',
            'gif',
            'webp'
        ].includes(ext) ? ext : 'png';
    } catch  {
        return 'png';
    }
};
const downloadImageToTempFile = async (imageUrl, index)=>{
    try {
        console.log(`[IMAGE] 이미지 다운로드 중: ${imageUrl}`);
        const response = await fetch(imageUrl, {
            signal: AbortSignal.timeout(20000)
        });
        if (!response.ok) {
            console.error(`[IMAGE] 다운로드 실패: ${response.status}`);
            return null;
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const tempDir = __TURBOPACK__imported__module__$5b$externals$5d2f$os__$5b$external$5d$__$28$os$2c$__cjs$29$__["tmpdir"]();
        const ext = getExtensionFromUrl(imageUrl);
        const fileName = `upload_image_${Date.now()}_${index}.${ext}`;
        const filePath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"](tempDir, fileName);
        __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["writeFileSync"](filePath, buffer);
        console.log(`[IMAGE] 임시 파일 저장: ${filePath} (${Math.round(buffer.length / 1024)}KB)`);
        return filePath;
    } catch (error) {
        console.error(`[IMAGE] 다운로드 오류:`, error);
        return null;
    }
};
const saveBase64ToTempFile = (base64Data, index)=>{
    const tempDir = __TURBOPACK__imported__module__$5b$externals$5d2f$os__$5b$external$5d$__$28$os$2c$__cjs$29$__["tmpdir"]();
    const fileName = `upload_image_${Date.now()}_${index}.png`;
    const filePath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"](tempDir, fileName);
    // Base64 데이터에서 data:image/xxx;base64, 접두사 제거
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Content, 'base64');
    __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["writeFileSync"](filePath, buffer);
    return filePath;
};
const cleanupTempFiles = (filePaths)=>{
    for (const filePath of filePaths){
        try {
            if (__TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["existsSync"](filePath)) {
                __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["unlinkSync"](filePath);
            }
        } catch  {
            console.warn(`[IMAGE] 임시 파일 삭제 실패: ${filePath}`);
        }
    }
};
// 네이버 카페 에디터 이미지 버튼 셀렉터
const IMAGE_BUTTON_SELECTORS = [
    'button.se-image-toolbar-button',
    'button[data-name="image"]',
    '.se-toolbar button[data-module="image"]',
    '.se-toolbar-item-image button',
    'button.se-text-icon-toolbar-image'
];
// 이미지 컴포넌트 셀렉터 (업로드 확인용)
const IMAGE_COMPONENT_SELECTORS = [
    '.se-image-resource',
    '.se-component-image',
    '.se-module-image',
    'img.se-image-resource'
];
// 팝업 닫기 셀렉터
const POPUP_CLOSE_SELECTORS = [
    '.se-popup-close-button',
    '.se-popup-button-cancel',
    'button.se-popup-close',
    '.se-image-uploader-close'
];
// 이미지 업로드 팝업 닫기
const closeImagePopup = async (page)=>{
    // 방법 1: 닫기 버튼 클릭
    for (const selector of POPUP_CLOSE_SELECTORS){
        const closeBtn = await page.$(selector);
        if (closeBtn) {
            try {
                await closeBtn.click();
                console.log(`[IMAGE] 팝업 닫기 버튼 클릭: ${selector}`);
                await page.waitForTimeout(500);
                return;
            } catch  {
            // 클릭 실패 시 다음 방법 시도
            }
        }
    }
    // 방법 2: ESC 키로 팝업 닫기
    const popupDim = await page.$('.se-popup-dim');
    if (popupDim) {
        console.log('[IMAGE] ESC 키로 팝업 닫기 시도');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
    }
    // 방법 3: 에디터 본문 영역 클릭 (팝업 외부 클릭)
    const editorBody = await page.$('.se-component-content');
    if (editorBody) {
        try {
            await editorBody.click({
                force: true
            });
            console.log('[IMAGE] 에디터 본문 클릭으로 팝업 닫기');
            await page.waitForTimeout(500);
        } catch  {
        // 클릭 실패 무시
        }
    }
};
// 팝업이 완전히 닫힐 때까지 대기
const waitForPopupClose = async (page, maxWait = 5000)=>{
    const startTime = Date.now();
    while(Date.now() - startTime < maxWait){
        const popupDim = await page.$('.se-popup-dim');
        if (!popupDim) {
            console.log('[IMAGE] 팝업 닫힘 확인');
            return;
        }
        // 팝업이 아직 있으면 ESC 다시 시도
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
    }
    console.log('[IMAGE] 팝업 닫기 대기 타임아웃 - 강제 진행');
};
const uploadSingleImage = async (page, image)=>{
    return uploadImages(page, [
        image
    ]);
};
// 단일 이미지 업로드 (내부용)
const uploadSingleImageFile = async (page, filePath, index)=>{
    try {
        // 이미지 버튼 찾기
        let imageButton = null;
        for (const selector of IMAGE_BUTTON_SELECTORS){
            imageButton = await page.$(selector);
            if (imageButton) {
                console.log(`[IMAGE] 이미지 버튼 발견: ${selector}`);
                break;
            }
        }
        if (!imageButton) {
            console.log('[IMAGE] 이미지 버튼 찾을 수 없음');
            return false;
        }
        // filechooser 이벤트로 파일 선택
        console.log(`[IMAGE] ${index + 1}번째 이미지 filechooser 대기 중...`);
        const [fileChooser] = await Promise.all([
            page.waitForEvent('filechooser', {
                timeout: 10000
            }),
            imageButton.click()
        ]);
        await fileChooser.setFiles([
            filePath
        ]);
        console.log(`[IMAGE] ${index + 1}번째 파일 설정 완료`);
        // 업로드 완료 대기
        await page.waitForTimeout(3000);
        // 업로드 진행 상태 확인 (최대 10초)
        for(let retry = 0; retry < 10; retry++){
            const uploadProgress = await page.$('.se-upload-progress, .upload-progress, .se-loading');
            if (!uploadProgress) break;
            console.log(`[IMAGE] ${index + 1}번째 업로드 진행 중... (${retry + 1}/10)`);
            await page.waitForTimeout(1000);
        }
        // 팝업 닫기
        await closeImagePopup(page);
        await waitForPopupClose(page);
        // 이미지 업로드 후 다른 팝업(지도 등)이 열릴 수 있으므로 추가로 닫기
        const anyPopupClose = await page.$('.se-popup-close-button');
        if (anyPopupClose) {
            console.log('[IMAGE] 추가 팝업 발견 - 닫기');
            await anyPopupClose.click();
            await page.waitForTimeout(500);
        }
        // ESC로 혹시 남은 팝업 닫기
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        // 에디터 본문 클릭하여 포커스 복귀 (force로 오버레이 무시)
        const editorBody = await page.$('.se-component-content, .se-content');
        if (editorBody) {
            await editorBody.click({
                force: true
            });
            await page.waitForTimeout(500);
        }
        return true;
    } catch (error) {
        console.error(`[IMAGE] ${index + 1}번째 이미지 업로드 오류:`, error);
        return false;
    }
};
const uploadImages = async (page, images)=>{
    if (!images || images.length === 0) return true;
    console.log(`[IMAGE] 이미지 ${images.length}장 업로드 시작 (순차 업로드)`);
    const tempFiles = [];
    let successCount = 0;
    try {
        // 이미지를 임시 파일로 저장 (URL이면 다운로드, base64면 변환)
        for(let i = 0; i < images.length; i++){
            const img = images[i];
            let tempPath = null;
            if (img.startsWith('http')) {
                tempPath = await downloadImageToTempFile(img, i);
            } else {
                tempPath = saveBase64ToTempFile(img, i);
                console.log(`[IMAGE] 임시 파일 생성 (base64): ${tempPath}`);
            }
            if (tempPath) {
                tempFiles.push(tempPath);
            } else {
                console.warn(`[IMAGE] 이미지 ${i + 1} 처리 실패`);
            }
        }
        if (tempFiles.length === 0) {
            console.error('[IMAGE] 처리된 이미지 없음');
            return false;
        }
        // 각 이미지를 순차적으로 업로드
        for(let i = 0; i < tempFiles.length; i++){
            console.log(`[IMAGE] ${i + 1}/${tempFiles.length}번째 이미지 업로드 시작`);
            const success = await uploadSingleImageFile(page, tempFiles[i], i);
            if (success) {
                successCount++;
                console.log(`[IMAGE] ${i + 1}/${tempFiles.length}번째 이미지 업로드 성공`);
            } else {
                console.warn(`[IMAGE] ${i + 1}/${tempFiles.length}번째 이미지 업로드 실패`);
            }
            // 다음 이미지 업로드 전 잠시 대기
            if (i < tempFiles.length - 1) {
                await page.waitForTimeout(1000);
            }
        }
        // 최종 이미지 컴포넌트 확인
        let totalImageCount = 0;
        for (const selector of IMAGE_COMPONENT_SELECTORS){
            const components = await page.$$(selector);
            if (components.length > 0) {
                totalImageCount = components.length;
                console.log(`[IMAGE] 최종 이미지 컴포넌트: ${selector} (${totalImageCount}개)`);
                break;
            }
        }
        console.log(`[IMAGE] 업로드 완료: ${successCount}/${tempFiles.length}장 성공, 에디터 내 ${totalImageCount}개 확인`);
        return successCount > 0;
    } catch (error) {
        console.error('[IMAGE] 이미지 업로드 오류:', error);
        return false;
    } finally{
        cleanupTempFiles(tempFiles);
    }
};
}),
"[project]/src/shared/lib/naver-cafe-writing/post-writer.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "extractArticleIdFromUrl",
    ()=>extractArticleIdFromUrl,
    "findRecentArticleBySubject",
    ()=>findRecentArticleBySubject,
    "writePostWithAccount",
    ()=>writePostWithAccount
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/multi-session.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$types$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/types/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$types$2f$post$2d$options$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/types/post-options.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$daily$2d$activity$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/daily-activity.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$image$2d$uploader$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/naver-cafe-writing/image-uploader.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
// 팝업 닫고 클릭 재시도 헬퍼
const clickWithPopupRetry = async (page, element, maxRetries = 3)=>{
    for(let attempt = 0; attempt < maxRetries; attempt++){
        try {
            await element.click({
                timeout: 5000
            });
            return;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '';
            // 타임아웃 또는 intercepts pointer events 에러인 경우
            if (errorMessage.includes('Timeout') || errorMessage.includes('intercepts pointer')) {
                console.log(`[POST] 클릭 실패 (${attempt + 1}/${maxRetries}) - 팝업 닫기 시도`);
                // 팝업 닫기 버튼 클릭
                const popupClose = await page.$('.se-popup-close-button');
                if (popupClose) {
                    await popupClose.click().catch(()=>{});
                    await page.waitForTimeout(500);
                }
                // ESC 키로 팝업 닫기
                await page.keyboard.press('Escape');
                await page.waitForTimeout(300);
                // 마지막 시도면 force: true로 클릭
                if (attempt === maxRetries - 1) {
                    await element.click({
                        force: true
                    });
                    return;
                }
            } else {
                throw error;
            }
        }
    }
};
// 체크박스 상태 설정 헬퍼
const setCheckbox = async (page, selector, checked)=>{
    const checkbox = await page.$(selector);
    if (!checkbox) {
        console.log(`[DEBUG] 체크박스 ${selector} 찾을 수 없음`);
        return;
    }
    // DOM에서 직접 checked 상태 확인 (커스텀 체크박스 대응)
    const isCurrentlyChecked = await checkbox.evaluate((el)=>el.checked);
    console.log(`[DEBUG] ${selector} 현재: ${isCurrentlyChecked}, 목표: ${checked}`);
    if (isCurrentlyChecked !== checked) {
        // 라벨 클릭 시도 (커스텀 체크박스는 라벨 클릭이 더 안정적)
        const labelSelector = `label[for="${selector.replace('#', '')}"]`;
        const label = await page.$(labelSelector);
        if (label) {
            await label.click();
            console.log(`[DEBUG] ${selector} 라벨 클릭`);
        } else {
            // 라벨 없으면 체크박스 직접 클릭
            await checkbox.click();
            console.log(`[DEBUG] ${selector} 직접 클릭`);
        }
        await page.waitForTimeout(300);
    }
};
// 게시 옵션 적용
const applyPostOptions = async (page, options)=>{
    console.log('[DEBUG] 게시 옵션 적용 중...', options);
    // 설정 영역으로 스크롤
    const settingArea = await page.$('.setting_area');
    if (settingArea) {
        await settingArea.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
    }
    // 댓글 허용
    await setCheckbox(page, '#coment', options.allowComment);
    // 스크랩 허용
    await setCheckbox(page, '#blog_sharing', options.allowScrap);
    // 복사/저장 허용
    await setCheckbox(page, '#copy', options.allowCopy);
    // 자동출처 사용
    await setCheckbox(page, '#automatic_source', options.useAutoSource);
    // CCL 사용
    await setCheckbox(page, '#ccl', options.useCcl);
    // CCL 세부 옵션 (CCL 사용 시에만)
    if (options.useCcl) {
        console.log('[DEBUG] CCL 세부 옵션 설정 시작');
        await page.waitForTimeout(500);
        // 영리적 이용
        const commercialBtn = await page.$('.permission_use .permission_select');
        if (commercialBtn) {
            console.log('[DEBUG] 영리적 이용 버튼 클릭');
            await commercialBtn.scrollIntoViewIfNeeded();
            await commercialBtn.click();
            // 레이어가 나타날 때까지 대기
            try {
                await page.waitForSelector('.allowCommercialUseLayer', {
                    state: 'visible',
                    timeout: 3000
                });
                console.log('[DEBUG] 영리적 이용 레이어 표시됨');
            } catch  {
                console.log('[DEBUG] 영리적 이용 레이어 대기 타임아웃');
            }
            const commercialText = options.cclCommercial === 'allow' ? '허용' : '허용 안 함';
            console.log(`[DEBUG] 영리적 이용 선택: ${commercialText}`);
            const commercialOption = await page.$$(`.allowCommercialUseLayer .layer_button`);
            let commercialFound = false;
            for (const opt of commercialOption){
                const text = await opt.textContent();
                if (text?.trim() === commercialText) {
                    await opt.click();
                    commercialFound = true;
                    console.log(`[DEBUG] 영리적 이용 "${commercialText}" 클릭 완료`);
                    break;
                }
            }
            if (!commercialFound) {
                console.log(`[DEBUG] 영리적 이용 옵션 "${commercialText}" 찾지 못함`);
            }
            await page.waitForTimeout(300);
        } else {
            console.log('[DEBUG] 영리적 이용 버튼 없음');
        }
        // 콘텐츠 변경
        const modifyBtn = await page.$('.change_content .permission_select');
        if (modifyBtn) {
            console.log('[DEBUG] 콘텐츠 변경 버튼 클릭');
            await modifyBtn.scrollIntoViewIfNeeded();
            await modifyBtn.click();
            // 레이어가 나타날 때까지 대기
            try {
                await page.waitForSelector('.allowModifyContentsLayer', {
                    state: 'visible',
                    timeout: 3000
                });
                console.log('[DEBUG] 콘텐츠 변경 레이어 표시됨');
            } catch  {
                console.log('[DEBUG] 콘텐츠 변경 레이어 대기 타임아웃');
            }
            const modifyTextMap = {
                allow: '허용',
                same: '동일조건허용',
                disallow: '허용 안 함'
            };
            const modifyText = modifyTextMap[options.cclModify];
            console.log(`[DEBUG] 콘텐츠 변경 선택: ${modifyText}`);
            const modifyOption = await page.$$(`.allowModifyContentsLayer .layer_button`);
            let modifyFound = false;
            for (const opt of modifyOption){
                const text = await opt.textContent();
                if (text?.trim() === modifyText) {
                    await opt.click();
                    modifyFound = true;
                    console.log(`[DEBUG] 콘텐츠 변경 "${modifyText}" 클릭 완료`);
                    break;
                }
            }
            if (!modifyFound) {
                console.log(`[DEBUG] 콘텐츠 변경 옵션 "${modifyText}" 찾지 못함`);
            }
            await page.waitForTimeout(300);
        } else {
            console.log('[DEBUG] 콘텐츠 변경 버튼 없음');
        }
        console.log('[DEBUG] CCL 세부 옵션 설정 완료');
    }
    console.log('[DEBUG] 게시 옵션 적용 완료');
};
const extractArticleIdFromUrl = (url)=>{
    const decodedCandidates = new Set([
        url
    ]);
    let current = url;
    for(let i = 0; i < 2; i += 1){
        try {
            const next = decodeURIComponent(current);
            if (next === current) {
                break;
            }
            decodedCandidates.add(next);
            current = next;
        } catch  {
            break;
        }
    }
    for (const candidate of decodedCandidates){
        if (/\/articles\/write\b/i.test(candidate)) {
            continue;
        }
        const articleIdMatch = candidate.match(/articleid=(\d+)/i) ?? candidate.match(/\/articles\/(\d+)(?:[/?#]|$)/i);
        if (articleIdMatch) {
            return Number.parseInt(articleIdMatch[1], 10);
        }
    }
    return undefined;
};
const findRecentArticleBySubject = (articles, subject, options)=>{
    const { knownArticleIds = new Set(), publishStartedAt = 0, menuId } = options ?? {};
    const matchingArticles = articles.filter((article)=>article.subject === subject).filter((article)=>menuId == null ? true : article.menuId === menuId).sort((left, right)=>right.writeDateTimestamp - left.writeDateTimestamp);
    const freshMatch = matchingArticles.find((article)=>{
        if (knownArticleIds.has(article.articleId)) {
            return false;
        }
        if (publishStartedAt > 0 && article.writeDateTimestamp < publishStartedAt) {
            return false;
        }
        return true;
    });
    if (freshMatch) {
        return freshMatch;
    }
    return matchingArticles.find((article)=>!knownArticleIds.has(article.articleId)) ?? matchingArticles[0];
};
const writePostWithAccount = async (account, input)=>{
    const { id, password } = account;
    const { cafeId, menuId, subject, content, category, postOptions = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$types$2f$post$2d$options$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DEFAULT_POST_OPTIONS"], images } = input;
    // 계정 락 획득 (동시 접근 방지)
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["acquireAccountLock"])(id);
    try {
        const loginResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["loginAccount"])(id, password, {
            forceFreshLogin: false,
            reason: `post_write:${cafeId}:${menuId}`
        });
        if (!loginResult.success) {
            return {
                success: false,
                writerAccountId: id,
                error: loginResult.error || '로그인 실패'
            };
        }
        const page = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPageForAccount"])(id);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["touchAccount"])(id);
        // 글쓰기 전 카페 둘러보기 (자연스러운 체류 시간 확보)
        try {
            const cafeMainUrl = `https://cafe.naver.com/ca-fe/cafes/${cafeId}`;
            console.log(`[POST] ${id} 카페 메인 방문 중...`);
            await page.goto(cafeMainUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 15000
            });
            await page.waitForTimeout(3000 + Math.floor(Math.random() * 2000));
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["touchAccount"])(id);
            // 글 하나 읽어보기
            const apiUrl = `https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=${cafeId}&search.page=1&search.perPage=10&search.queryType=lastArticle&search.boardtype=L`;
            const articleIds = await page.evaluate(async (url)=>{
                try {
                    const res = await fetch(url, {
                        credentials: 'include',
                        headers: {
                            Accept: 'application/json'
                        },
                        signal: AbortSignal.timeout(10000)
                    });
                    if (!res.ok) return [];
                    const data = await res.json();
                    return (data?.message?.result?.articleList ?? []).map((a)=>a.articleId);
                } catch  {
                    return [];
                }
            }, apiUrl);
            if (articleIds.length > 0) {
                const randomIdx = Math.floor(Math.random() * Math.min(articleIds.length, 5));
                const readArticleUrl = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleIds[randomIdx]}`;
                console.log(`[POST] ${id} 글 읽기 중... (articleId: ${articleIds[randomIdx]})`);
                await page.goto(readArticleUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: 10000
                });
                await page.waitForTimeout(5000 + Math.floor(Math.random() * 5000));
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["touchAccount"])(id);
            }
        } catch  {
            console.log(`[POST] ${id} 카페 둘러보기 중 오류 (무시)`);
        }
        // 글쓰기 페이지로 이동
        const writeUrl = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/write?boardType=L&menuId=${menuId}`;
        const navigateToWritePage = async ()=>{
            await page.goto(writeUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["touchAccount"])(id);
            await page.waitForTimeout(3000);
            return !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isLoginRedirect"])(page.url());
        };
        const isWritePageReady = await navigateToWritePage();
        if (!isWritePageReady) {
            console.log(`[POST] ${id} 세션 만료 감지 - 재로그인 시도`);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["invalidateLoginCache"])(id);
            const reloginResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["loginAccount"])(id, password, {
                forceFreshLogin: false,
                reason: `post_redirect:${cafeId}:${menuId}`
            });
            if (!reloginResult.success) {
                return {
                    success: false,
                    writerAccountId: id,
                    error: `세션 만료 후 재로그인 실패: ${reloginResult.error}`
                };
            }
            const isWritePageReadyAfterRelogin = await navigateToWritePage();
            if (!isWritePageReadyAfterRelogin) {
                return {
                    success: false,
                    writerAccountId: id,
                    error: '재로그인 후에도 글쓰기 페이지가 로그인 페이지로 리다이렉트됨'
                };
            }
        }
        // 새로 만든 카페 등에서 SPA 라우팅이 글쓰기 페이지 대신 기존 글로 되돌아가는 경우가 있어
        // 실제 URL이 write 페이지인지 확인하고 아니면 재시도
        for(let bounceRetry = 0; bounceRetry < 2 && !page.url().includes('/articles/write'); bounceRetry++){
            console.log(`[POST] ${id} 글쓰기 페이지 이탈 감지 (현재: ${page.url()}) - 재시도 ${bounceRetry + 1}/2`);
            await page.waitForTimeout(2000);
            await navigateToWritePage();
        }
        if (!page.url().includes('/articles/write')) {
            return {
                success: false,
                writerAccountId: id,
                error: `글쓰기 페이지 진입 실패 - 현재 URL: ${page.url()}`
            };
        }
        // 스마트 에디터 팝업 닫기 (지도/장소 등)
        const popupCloseButton = await page.$('.se-popup-close-button');
        if (popupCloseButton) {
            console.log(`[POST] ${id} 에디터 팝업 닫기`);
            await popupCloseButton.click();
            await page.waitForTimeout(500);
        }
        console.log(`[POST] ${id} 카테고리 지정: "${category || '없음'}"`);
        // 게시판 선택 (드롭다운 클릭 → 카테고리 선택)
        // 동시 다중 계정 실행 시 에디터 렌더링이 늦어질 수 있어 즉시 조회 대신 대기 후 조회
        const boardSelectButton = await page.waitForSelector('.FormSelectButton button.button', {
            timeout: 8000
        }).catch(()=>null);
        if (boardSelectButton) {
            await boardSelectButton.click();
            await page.waitForTimeout(500);
            if (category) {
                // 특정 카테고리명으로 선택
                const options = await page.$$('ul.option_list li.item button.option');
                console.log(`[DEBUG] 게시판 옵션 ${options.length}개 발견`);
                let found = false;
                for (const option of options){
                    const text = await option.textContent();
                    const trimmedText = text?.trim();
                    console.log(`[DEBUG] 게시판 옵션: "${trimmedText}"`);
                    if (trimmedText && trimmedText.includes(category)) {
                        await option.click();
                        found = true;
                        console.log(`[POST] ${id} 카테고리 "${category}" 선택 성공`);
                        break;
                    }
                }
                if (!found) {
                    // 카테고리를 찾지 못하면 첫 번째 선택
                    console.log(`[POST] ${id} 카테고리 "${category}" 없음 - 첫 번째 게시판 선택`);
                    const firstOption = await page.$('ul.option_list li.item button.option');
                    if (firstOption) {
                        await firstOption.click();
                    }
                }
            } else {
                // 카테고리 미지정 시 첫 번째 게시판 선택
                console.log(`[POST] ${id} 카테고리 미지정 - 첫 번째 게시판 선택`);
                const firstBoardOption = await page.$('ul.option_list li.item button.option');
                if (firstBoardOption) {
                    await firstBoardOption.click();
                }
            }
            await page.waitForTimeout(500);
        } else {
            console.log(`[POST] ${id} 게시판 선택 버튼 없음`);
        }
        // 제목 입력 (.FlexableTextArea textarea.textarea_input)
        let titleInput = await page.$('.FlexableTextArea textarea.textarea_input, textarea.textarea_input');
        if (!titleInput) {
            try {
                titleInput = await page.waitForSelector('.FlexableTextArea textarea.textarea_input, textarea.textarea_input', {
                    timeout: 10000
                });
            } catch  {}
        }
        if (!titleInput) {
            const currentUrl = page.url();
            const redirectHint = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isLoginRedirect"])(currentUrl) ? '현재 로그인 페이지로 이동된 상태' : `현재 URL: ${currentUrl}`;
            return {
                success: false,
                writerAccountId: id,
                error: `제목 입력창을 찾을 수 없습니다. ${redirectHint}`
            };
        }
        await titleInput.click();
        await page.waitForTimeout(300);
        await page.keyboard.type(subject, {
            delay: 100
        }); // 600타/분 속도
        await page.waitForTimeout(500);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["touchAccount"])(id);
        // 본문 입력 (SmartEditor - p.se-text-paragraph 클릭 후 타이핑)
        const contentArea = await page.$('p.se-text-paragraph');
        if (!contentArea) {
            return {
                success: false,
                writerAccountId: id,
                error: '본문 입력창을 찾을 수 없습니다.'
            };
        }
        // 지도/장소 오버레이가 클릭을 가로막는 경우 팝업 닫고 재시도
        await clickWithPopupRetry(page, contentArea);
        await page.waitForTimeout(500);
        // 카테고리 선택 시 자동 채워진 본문 템플릿 삭제 (Cmd+A → Backspace)
        await page.keyboard.press('Meta+A');
        await page.waitForTimeout(300);
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(500);
        // HTML 태그를 plain text로 변환
        const plainContent = content.replace(/<\/p>\s*<p>/gi, '\n') // </p><p> → 줄바꿈
        .replace(/<br\s*\/?>/gi, '\n') // <br> → 줄바꿈
        .replace(/<[^>]*>/g, '') // 나머지 태그 제거
        .trim();
        // 원고가 문장마다 빈 줄로 끊겨 오는 경우가 많아 2~4문장씩 묶어 단락화
        // (단락 사이에만 빈 줄을 두어 너무 좁게 보이는 것을 방지)
        const groupLinesIntoParagraphs = (rawLines)=>{
            const sentences = rawLines.map((l)=>l.trim()).filter(Boolean);
            const grouped = [];
            let i = 0;
            while(i < sentences.length){
                const groupSize = 2 + Math.floor(Math.random() * 3); // 2~4문장
                grouped.push(...sentences.slice(i, i + groupSize));
                i += groupSize;
                if (i < sentences.length) grouped.push('');
            }
            return grouped;
        };
        // SmartEditor는 contenteditable이므로 줄바꿈은 Enter 키로 처리
        const lines = groupLinesIntoParagraphs(plainContent.split('\n'));
        // 이미지 삽입 위치 계산 (단락 구분점 = 빈 줄)
        const paragraphBreaks = [];
        for(let i = 0; i < lines.length; i++){
            if (!lines[i].trim()) {
                paragraphBreaks.push(i);
            }
        }
        // 이미지 삽입 위치 결정 (N장일 때: 중간에 N-1장, 끝에 1장)
        const imageInsertPoints = new Map();
        if (images && images.length > 1 && paragraphBreaks.length > 0) {
            const imgCount = images.length;
            const breakCount = paragraphBreaks.length;
            // 이미지 N-1개를 단락 구분점에 균등 분배
            const interval = Math.max(1, Math.floor(breakCount / (imgCount - 1 || 1)));
            for(let j = 0; j < imgCount - 1; j++){
                const breakIdx = Math.min(j * interval, breakCount - 1);
                const lineIdx = paragraphBreaks[breakIdx];
                imageInsertPoints.set(lineIdx, images[j]);
                console.log(`[POST] 이미지 ${j + 1} 삽입 위치: line ${lineIdx}`);
            }
        }
        // 글 작성 + 이미지 삽입
        let insertedImageCount = 0;
        for(let i = 0; i < lines.length; i++){
            if (lines[i].trim()) {
                await page.keyboard.type(lines[i], {
                    delay: 100
                }); // 600타/분 속도
            }
            if (i < lines.length - 1) {
                await page.keyboard.press('Enter');
            }
            // 단락 구분점에서 이미지 삽입
            if (imageInsertPoints.has(i)) {
                const img = imageInsertPoints.get(i);
                console.log(`[POST] ${id} 이미지 ${insertedImageCount + 1} 삽입 중 (line ${i})`);
                await page.waitForTimeout(500);
                const success = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$image$2d$uploader$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["uploadSingleImage"])(page, img);
                if (success) {
                    insertedImageCount++;
                    console.log(`[POST] ${id} 이미지 ${insertedImageCount} 삽입 완료`);
                }
                await page.waitForTimeout(500);
            }
        }
        await page.waitForTimeout(500);
        // 마지막 이미지는 본문 끝에 삽입
        if (images && images.length > 0) {
            const lastImage = images[images.length - 1];
            console.log(`[POST] ${id} 마지막 이미지 (${images.length}번째) 삽입 중`);
            const success = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$image$2d$uploader$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["uploadSingleImage"])(page, lastImage);
            if (success) {
                console.log(`[POST] ${id} 마지막 이미지 삽입 완료`);
            } else {
                console.warn(`[POST] ${id} 마지막 이미지 삽입 실패`);
            }
            await page.waitForTimeout(1000);
        }
        // 게시 옵션 설정 (체크박스 조작)
        await applyPostOptions(page, postOptions);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["touchAccount"])(id);
        // 등록 버튼 클릭 (a.BaseButton--skinGreen)
        const submitButton = await page.$('a.BaseButton--skinGreen, a.BaseButton');
        if (!submitButton) {
            return {
                success: false,
                writerAccountId: id,
                error: '등록 버튼을 찾을 수 없습니다.'
            };
        }
        // 오버레이가 있을 수 있으니 팝업 닫고 재시도
        await clickWithPopupRetry(page, submitButton);
        // 글 작성 후 URL 변화 대기 (글 상세 페이지로 리다이렉트)
        // 두 가지 URL 패턴: /articles/123 또는 articleid=123
        try {
            await page.waitForURL((url)=>/articles\/\d+/.test(url.href) || /articleid=\d+/i.test(decodeURIComponent(url.href)), {
                timeout: 15000
            });
            console.log('[DEBUG] URL 변화 감지됨');
        } catch  {
            console.log('[DEBUG] URL 변화 없음, 추가 대기...');
            await page.waitForTimeout(3000);
        }
        // 글 작성 후 URL에서 articleId 추출 시도
        const currentUrl = page.url();
        console.log('[DEBUG] 현재 URL:', currentUrl);
        const decodedUrl = decodeURIComponent(decodeURIComponent(currentUrl));
        console.log('[DEBUG] 디코딩된 URL:', decodedUrl);
        const articleId = extractArticleIdFromUrl(currentUrl);
        console.log('[DEBUG] URL에서 추출한 articleId:', articleId);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["saveCookiesForAccount"])(id);
        if (!articleId) {
            return {
                success: false,
                writerAccountId: id,
                error: `글 작성 후 articleId 추출 실패 — URL: ${currentUrl}`,
                articleUrl: currentUrl
            };
        }
        // 활동 기록
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$daily$2d$activity$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["incrementActivity"])(id, cafeId, 'posts');
        // 글 발행 후 눈팅 (자연스러운 체류)
        try {
            console.log(`[POST] ${id} 발행 후 카페 눈팅 시작`);
            const cafeMainUrl = `https://cafe.naver.com/ca-fe/cafes/${cafeId}`;
            await page.goto(cafeMainUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 10000
            });
            await page.waitForTimeout(3000 + Math.floor(Math.random() * 3000));
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["touchAccount"])(id);
            // 랜덤으로 글 하나 더 읽기 (50% 확률)
            if (Math.random() < 0.5) {
                const apiUrl = `https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=${cafeId}&search.page=1&search.perPage=10&search.queryType=lastArticle&search.boardtype=L`;
                const browseIds = await page.evaluate(async (url)=>{
                    try {
                        const res = await fetch(url, {
                            credentials: 'include',
                            headers: {
                                Accept: 'application/json'
                            },
                            signal: AbortSignal.timeout(10000)
                        });
                        if (!res.ok) return [];
                        const data = await res.json();
                        return (data?.message?.result?.articleList ?? []).map((a)=>a.articleId);
                    } catch  {
                        return [];
                    }
                }, apiUrl);
                if (browseIds.length > 0) {
                    const randomIdx = Math.floor(Math.random() * Math.min(browseIds.length, 5));
                    const browseArticleId = browseIds[randomIdx];
                    if (browseArticleId !== articleId) {
                        await page.goto(`https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${browseArticleId}`, {
                            waitUntil: 'domcontentloaded',
                            timeout: 10000
                        });
                        await page.waitForTimeout(3000 + Math.floor(Math.random() * 4000));
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["touchAccount"])(id);
                    }
                }
            }
            console.log(`[POST] ${id} 눈팅 완료`);
        } catch  {
            console.log(`[POST] ${id} 눈팅 중 오류 (무시)`);
        }
        return {
            success: true,
            writerAccountId: id,
            articleId,
            articleUrl: currentUrl
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        return {
            success: false,
            writerAccountId: id,
            error: errorMessage
        };
    } finally{
        // 락 해제
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["releaseAccountLock"])(id);
    }
};
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/shared/lib/naver-cafe-writing/article-modifier.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "modifyArticleWithAccount",
    ()=>modifyArticleWithAccount
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/multi-session.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$image$2d$uploader$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/naver-cafe-writing/image-uploader.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
// 부제 패턴 (숫자. 형식)
const SUBTITLE_PATTERN = /^\d+\.\s*/;
const MODIFY_LOGIN_WAIT_MS = 3 * 60 * 1000;
const EDITOR_READY_SELECTOR = 'p.se-text-paragraph, .FlexableTextArea textarea.textarea_input, .se-component-content';
const TITLE_INPUT_SELECTOR = '.FlexableTextArea textarea.textarea_input, textarea.textarea_input, textarea[placeholder*="제목"], input[placeholder*="제목"]';
const MODIFY_TYPE_DELAY_MS = parseInt(process.env.MODIFY_TYPE_DELAY_MS || '', 10) || 120;
const modifyArticleWithAccount = async (account, input)=>{
    const { id, password } = account;
    const { cafeId, articleId, newTitle, newContent, category, images } = input;
    // 계정 락 획득 (동시 접근 방지)
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["acquireAccountLock"])(id);
    try {
        const loggedIn = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isAccountLoggedIn"])(id);
        if (!loggedIn) {
            const loginResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["loginAccount"])(id, password, {
                waitForLoginMs: MODIFY_LOGIN_WAIT_MS,
                reason: `modify_${articleId}`
            });
            if (!loginResult.success) {
                return {
                    success: false,
                    articleId,
                    modifierAccountId: id,
                    error: loginResult.error || '로그인 실패'
                };
            }
        }
        const page = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPageForAccount"])(id);
        // JS dialog 자동 처리 (네이버 수정 페이지 alert/confirm 대응)
        page.on('dialog', async (dialog)=>{
            try {
                await dialog.accept();
            } catch  {}
        });
        // 글 수정 페이지로 이동
        const modifyUrl = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}/modify`;
        const legacyModifyUrl = `https://cafe.naver.com/ArticleWrite.nhn?m=modify&clubid=${cafeId}&articleid=${articleId}`;
        console.log('[DEBUG] 수정 페이지 이동:', modifyUrl);
        const navigateToModifyPage = async (url = modifyUrl)=>{
            await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 60000
            });
        };
        const recoverModifyLoginRedirect = async (reason)=>{
            console.log(`[MODIFY] ${id} ${reason} - 강제 재로그인 후 수정 페이지 재진입`);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["invalidateLoginCache"])(id);
            const reloginResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["loginAccount"])(id, password, {
                waitForLoginMs: MODIFY_LOGIN_WAIT_MS,
                reason: `modify_redirect_${articleId}`,
                forceFreshLogin: true
            });
            if (!reloginResult.success) {
                return {
                    success: false,
                    articleId,
                    modifierAccountId: id,
                    error: reloginResult.error || '수정 페이지 재로그인 실패'
                };
            }
            await navigateToModifyPage();
            return null;
        };
        await navigateToModifyPage();
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isLoginRedirect"])(page.url())) {
            const recoverResult = await recoverModifyLoginRedirect('수정 페이지 로그인 리다이렉트 감지');
            if (recoverResult) return recoverResult;
        }
        // 에디터 로딩 대기
        try {
            await page.waitForSelector(EDITOR_READY_SELECTOR, {
                timeout: 15000
            });
        } catch  {
            console.log('[DEBUG] 에디터 셀렉터 대기 실패, 스크린샷 촬영');
            await page.screenshot({
                path: '/tmp/modify-debug.png',
                fullPage: true
            });
            console.log('[DEBUG] 현재 URL:', page.url());
            const title = await page.title();
            console.log('[DEBUG] 페이지 제목:', title);
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isLoginRedirect"])(page.url())) {
                const recoverResult = await recoverModifyLoginRedirect('에디터 대기 중 로그인 페이지 전환 감지');
                if (recoverResult) return recoverResult;
                await page.waitForSelector(EDITOR_READY_SELECTOR, {
                    timeout: 15000
                });
            }
            await page.waitForTimeout(5000);
        }
        await page.waitForTimeout(2000);
        // 카테고리 변경 (지정된 경우에만)
        if (category) {
            const boardSelectButton = await page.$('.FormSelectButton button.button');
            if (boardSelectButton) {
                await boardSelectButton.click();
                await page.waitForTimeout(500);
                const options = await page.$$('ul.option_list li.item button.option');
                let found = false;
                for (const option of options){
                    const text = await option.textContent();
                    if (text?.trim() === category) {
                        await option.click();
                        found = true;
                        console.log(`[DEBUG] 카테고리 "${category}"로 변경됨`);
                        break;
                    }
                }
                if (!found) {
                    console.log(`[DEBUG] 카테고리 "${category}" 없음, 기존 카테고리 유지`);
                    // 드롭다운 닫기 (ESC 키)
                    await page.keyboard.press('Escape');
                }
                await page.waitForTimeout(500);
            }
        }
        // 제목 입력창 찾기 및 수정
        let titleInput = await page.$(TITLE_INPUT_SELECTOR);
        if (!titleInput) {
            console.log(`[MODIFY] 제목 입력창 없음 - 구형 수정 URL 재시도 (현재 URL: ${page.url()})`);
            await navigateToModifyPage(legacyModifyUrl);
            await page.waitForTimeout(3000);
            titleInput = await page.$(TITLE_INPUT_SELECTOR);
        }
        if (!titleInput) {
            return {
                success: false,
                articleId,
                modifierAccountId: id,
                error: `제목 입력창을 찾을 수 없습니다. 수정 권한이 없을 수 있습니다. 현재 URL: ${page.url()}`
            };
        }
        // 기존 제목 지우고 새 제목 입력
        await titleInput.click({
            clickCount: 3
        }); // 전체 선택
        await page.waitForTimeout(200);
        await titleInput.fill(newTitle);
        await page.waitForTimeout(500);
        // 본문 입력 영역 찾기
        const contentArea = await page.$('p.se-text-paragraph');
        if (!contentArea) {
            return {
                success: false,
                articleId,
                modifierAccountId: id,
                error: '본문 입력창을 찾을 수 없습니다.'
            };
        }
        // 기존 본문 전체 선택 후 삭제 (macOS: Meta+A, Windows: Control+A)
        await contentArea.click();
        await page.waitForTimeout(300);
        await page.keyboard.press('Meta+A');
        await page.waitForTimeout(200);
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(300);
        // 새 본문 입력 - HTML 태그를 plain text로 변환
        const plainContent = newContent.replace(/<\/p>\s*<p>/gi, '\n') // </p><p> → 줄바꿈
        .replace(/<br\s*\/?>/gi, '\n') // <br> → 줄바꿈
        .replace(/<[^>]*>/g, '') // 나머지 태그 제거
        .trim();
        // 원고가 문장마다 빈 줄로 끊겨 오는 경우가 많아 2~4문장씩 묶어 단락화
        // (부제 줄은 항상 새 단락으로 분리해 이미지 삽입 위치 탐지에 영향 없게 유지)
        const groupLinesIntoParagraphs = (rawLines)=>{
            const items = rawLines.map((l)=>l.trim()).filter(Boolean);
            const grouped = [];
            let i = 0;
            while(i < items.length){
                if (SUBTITLE_PATTERN.test(items[i])) {
                    if (grouped.length > 0 && grouped[grouped.length - 1] !== '') grouped.push('');
                    grouped.push(items[i]);
                    grouped.push('');
                    i++;
                    continue;
                }
                const groupSize = 2 + Math.floor(Math.random() * 3); // 2~4문장
                let taken = 0;
                while(taken < groupSize && i < items.length && !SUBTITLE_PATTERN.test(items[i])){
                    grouped.push(items[i]);
                    i++;
                    taken++;
                }
                if (i < items.length) grouped.push('');
            }
            return grouped;
        };
        const lines = groupLinesIntoParagraphs(plainContent.split('\n'));
        // 부제 위치 찾기 (숫자. 형식)
        const subtitleIndices = [];
        for(let i = 0; i < lines.length; i++){
            if (SUBTITLE_PATTERN.test(lines[i].trim())) {
                subtitleIndices.push(i);
            }
        }
        // 이미지 삽입 위치 결정
        const imageQueue = images ? [
            ...images
        ] : [];
        const hasSubtitles = subtitleIndices.length > 0;
        console.log(`[MODIFY] 부제 ${subtitleIndices.length}개 발견, 이미지 ${imageQueue.length}장`);
        for(let i = 0; i < lines.length; i++){
            if (lines[i].trim()) {
                await page.keyboard.type(lines[i], {
                    delay: MODIFY_TYPE_DELAY_MS
                });
            }
            if (i < lines.length - 1) {
                await page.keyboard.press('Enter');
            }
            // 부제 다음에 이미지 삽입 (이미지가 남아있고, 현재 줄이 부제인 경우)
            if (hasSubtitles && imageQueue.length > 0 && subtitleIndices.includes(i)) {
                await page.waitForTimeout(300);
                await page.keyboard.press('Enter');
                await page.waitForTimeout(500);
                const imageToUpload = imageQueue.shift();
                if (imageToUpload) {
                    console.log(`[MODIFY] 부제 ${i + 1} 아래에 이미지 삽입`);
                    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$image$2d$uploader$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["uploadSingleImage"])(page, imageToUpload);
                    await page.waitForTimeout(500);
                    // 이미지 삽입 후 본문 영역으로 돌아가기
                    const newContentArea = await page.$('p.se-text-paragraph');
                    if (newContentArea) {
                        await newContentArea.click();
                    }
                    await page.keyboard.press('End');
                    await page.keyboard.press('Enter');
                }
            }
        }
        await page.waitForTimeout(500);
        // 남은 이미지는 마지막에 업로드
        if (imageQueue.length > 0) {
            console.log(`[MODIFY] ${id} 남은 이미지 ${imageQueue.length}장 마지막에 업로드`);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(300);
            const uploadSuccess = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$image$2d$uploader$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["uploadImages"])(page, imageQueue);
            if (uploadSuccess) {
                console.log(`[MODIFY] ${id} 이미지 업로드 완료`);
            } else {
                console.warn(`[MODIFY] ${id} 이미지 업로드 실패 - 글 수정은 계속 진행`);
            }
            await page.waitForTimeout(1000);
        }
        // 댓글 허용 토글
        if (input.enableComments !== undefined) {
            try {
                const settingArea = await page.$('.setting_area');
                if (settingArea) {
                    await settingArea.scrollIntoViewIfNeeded();
                    await page.waitForTimeout(300);
                }
                const commentCheckbox = await page.$('#coment');
                if (commentCheckbox) {
                    const isChecked = await commentCheckbox.evaluate((el)=>el.checked);
                    if (isChecked !== input.enableComments) {
                        const label = await page.$('label[for="coment"]');
                        if (label) {
                            await label.click();
                        } else {
                            await commentCheckbox.click();
                        }
                        console.log(`[MODIFY] 댓글 ${input.enableComments ? '허용' : '차단'}으로 변경`);
                        await page.waitForTimeout(300);
                    }
                }
            } catch  {
                console.log('[MODIFY] 댓글 설정 변경 실패 (무시)');
            }
        }
        // 수정 완료 버튼 클릭
        const submitButton = await page.$('a.BaseButton--skinGreen, a.BaseButton');
        if (!submitButton) {
            return {
                success: false,
                articleId,
                modifierAccountId: id,
                error: '수정 완료 버튼을 찾을 수 없습니다.'
            };
        }
        await submitButton.click();
        // 수정 완료 후 글 상세 페이지로 리다이렉트 대기
        try {
            await page.waitForURL(/articles\/\d+/, {
                timeout: 10000
            });
            console.log('[DEBUG] 수정 완료, URL 변화 감지됨');
        } catch  {
            console.log('[DEBUG] URL 변화 없음, 추가 대기...');
            await page.waitForTimeout(3000);
        }
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["saveCookiesForAccount"])(id);
        return {
            success: true,
            articleId,
            modifierAccountId: id
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        return {
            success: false,
            articleId,
            modifierAccountId: id,
            error: errorMessage
        };
    } finally{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["releaseAccountLock"])(id);
    }
};
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/shared/lib/naver-cafe-writing/modify-query-utils.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildBaseFilter",
    ()=>buildBaseFilter,
    "fetchArticlesToModify",
    ()=>fetchArticlesToModify
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/models/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$published$2d$article$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/published-article.ts [app-rsc] (ecmascript)");
;
const buildBaseFilter = (cafeId, daysLimit)=>{
    const baseFilter = {
        cafeId,
        status: 'published'
    };
    if (daysLimit) {
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - daysLimit);
        baseFilter.publishedAt = {
            $gte: limitDate
        };
        console.log(`[MODIFY BATCH] ${daysLimit}일 이내 원고만 조회 (${limitDate.toISOString()} 이후)`);
    }
    return baseFilter;
};
const fetchArticlesToModify = async (sortOrder, limit, baseFilter)=>{
    if (sortOrder === 'random') {
        return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$published$2d$article$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PublishedArticle"].aggregate([
            {
                $match: baseFilter
            },
            {
                $sample: {
                    size: limit
                }
            }
        ]);
    }
    const sortDirection = sortOrder === 'oldest' ? 1 : -1;
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$published$2d$article$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PublishedArticle"].find(baseFilter).sort({
        publishedAt: sortDirection
    }).limit(limit);
};
}),
"[project]/src/shared/lib/naver-cafe-writing/comment-writer-utils.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isNicknameEquivalent",
    ()=>isNicknameEquivalent
]);
const normalizeNicknameForComparison = (value)=>{
    return (value ?? '').replace(/\s+/g, '').trim();
};
const isNicknameEquivalent = (actualNickname, expectedNickname)=>{
    const normalizedActual = normalizeNicknameForComparison(actualNickname);
    const normalizedExpected = normalizeNicknameForComparison(expectedNickname);
    if (!normalizedActual || !normalizedExpected) return false;
    return normalizedActual === normalizedExpected || normalizedActual.includes(normalizedExpected) || normalizedExpected.includes(normalizedActual);
};
}),
"[project]/src/shared/lib/naver-cafe-writing/comment-writer.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "writeCommentWithAccount",
    ()=>writeCommentWithAccount,
    "writeReplyWithAccount",
    ()=>writeReplyWithAccount
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/multi-session.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$daily$2d$activity$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/daily-activity.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$comment$2d$writer$2d$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/naver-cafe-writing/comment-writer-utils.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
const normalizeText = (value)=>{
    return (value ?? '').replace(/\s+/g, ' ').trim();
};
const navigateToArticle = async (page, articleUrl, id, password, logPrefix, options)=>{
    const navigationTimeoutMs = options?.navigationTimeoutMs ?? 0;
    await page.goto(articleUrl, {
        waitUntil: 'domcontentloaded',
        timeout: navigationTimeoutMs
    });
    await page.waitForTimeout(1500);
    const currentUrl = page.url();
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isLoginRedirect"])(currentUrl)) return {
        success: true
    };
    console.log(`[${logPrefix}] ${id} 세션 만료 감지 - 재로그인 시도`);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["invalidateLoginCache"])(id);
    const reloginResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["loginAccount"])(id, password, {
        forceFreshLogin: options?.forceFreshLogin ?? true,
        waitForLoginMs: options?.loginWaitMs,
        reason: `comment_redirect:${id}`
    });
    if (!reloginResult.success) {
        return {
            success: false,
            error: `세션 만료 후 재로그인 실패: ${reloginResult.error}`
        };
    }
    await page.goto(articleUrl, {
        waitUntil: 'domcontentloaded',
        timeout: navigationTimeoutMs
    });
    await page.waitForTimeout(1500);
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isLoginRedirect"])(page.url())) {
        return {
            success: false,
            error: '재로그인 후에도 로그인 페이지로 리다이렉트됨'
        };
    }
    return {
        success: true
    };
};
const checkErrorPopup = async (page)=>{
    const errorPopup = await page.$('.LayerPopup, .popup_layer, [role="alertdialog"]');
    if (!errorPopup) return null;
    const errorText = normalizeText(await errorPopup.textContent());
    if (!errorText) return '댓글/대댓글 처리 중 팝업 발생';
    return errorText.slice(0, 120);
};
const waitForCommentItem = async (root, timeout)=>{
    try {
        await root.waitForSelector('.CommentItem', {
            timeout
        });
        return true;
    } catch  {
        return false;
    }
};
const getCommentRoot = async (page)=>{
    try {
        await page.waitForSelector('iframe#cafe_main', {
            timeout: 20000
        });
    } catch  {
        await waitForCommentItem(page, 5000);
        return page;
    }
    const frameHandle = await page.$('iframe#cafe_main');
    const frame = await frameHandle?.contentFrame();
    if (!frame) {
        await waitForCommentItem(page, 5000);
        return page;
    }
    return frame;
};
const getClosestCommentItem = async (node)=>{
    const handle = await node.evaluateHandle((el)=>el.closest('.CommentItem'));
    const element = handle.asElement();
    return element ? element : null;
};
const findCommentItemById = async (root, commentId)=>{
    const safeId = commentId.replace(/"/g, '\\"');
    const direct = await root.$(`li[id="${safeId}"]`);
    if (direct) return direct;
    const dataId = await root.$(`[data-comment-id="${safeId}"]`);
    if (dataId) {
        const closest = await getClosestCommentItem(dataId);
        if (closest) return closest;
    }
    const likeCid = await root.$(`[data-cid$="-${safeId}"]`);
    if (likeCid) {
        const closest = await getClosestCommentItem(likeCid);
        if (closest) return closest;
    }
    const buttonNode = await root.$(`button#commentItem${safeId}`);
    if (buttonNode) {
        const closest = await getClosestCommentItem(buttonNode);
        if (closest) return closest;
    }
    return null;
};
const getItemText = async (item, selector)=>{
    try {
        return await item.$eval(selector, (el)=>el.textContent || '');
    } catch  {
        return '';
    }
};
const getCommentIdFromItem = async (item)=>{
    const idAttr = await item.getAttribute('id');
    if (idAttr) return idAttr;
    const dataId = await item.getAttribute('data-comment-id');
    if (dataId) return dataId;
    try {
        const buttonId = await item.$eval('button[id^="commentItem"]', (el)=>el.id);
        if (buttonId) return buttonId.replace('commentItem', '');
    } catch  {}
    try {
        const cid = await item.$eval('[data-cid]', (el)=>el.getAttribute('data-cid'));
        if (cid) {
            const parts = cid.split('-');
            return parts[parts.length - 1] || cid;
        }
    } catch  {}
    return undefined;
};
const findWrittenComment = async (root, contentPreview, commenterNickname)=>{
    const commentItems = await root.$$('.CommentItem:not(.CommentItem--reply)');
    let textOnlyMatch = null;
    for (const item of commentItems){
        const commentText = normalizeText(await getItemText(item, '.comment_text_view'));
        if (!commentText.includes(contentPreview)) continue;
        const commentId = await getCommentIdFromItem(item);
        if (commenterNickname) {
            const commentNickname = normalizeText(await getItemText(item, '.comment_nickname'));
            const isNicknameMatch = !commentNickname || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$comment$2d$writer$2d$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isNicknameEquivalent"])(commentNickname, commenterNickname);
            if (!isNicknameMatch) {
                textOnlyMatch ??= {
                    found: true,
                    commentId
                };
                continue;
            }
        }
        return {
            found: true,
            commentId
        };
    }
    if (textOnlyMatch) {
        console.log('[COMMENT] 닉네임 불일치, 내용 매칭으로 댓글 등록 확인');
        return textOnlyMatch;
    }
    return {
        found: false
    };
};
const writeCommentWithAccount = async (account, cafeId, articleId, content, options)=>{
    const { id, password } = account;
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["acquireAccountLock"])(id);
    try {
        const page = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPageForAccount"])(id);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["touchAccount"])(id);
        const articleUrl = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`;
        const navResult = await navigateToArticle(page, articleUrl, id, password, 'COMMENT', options);
        if (!navResult.success) {
            return {
                accountId: id,
                success: false,
                error: navResult.error
            };
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["touchAccount"])(id);
        const notFoundIndicator = await page.$('.error_content, .deleted_article, .no_article');
        if (notFoundIndicator) {
            return {
                accountId: id,
                success: false,
                error: 'ARTICLE_NOT_READY:글이 아직 처리 중이거나 삭제됨'
            };
        }
        const root = await getCommentRoot(page);
        // 대댓글 입력창이 열려있으면 닫기 (취소 버튼 클릭)
        const openReplyCancel = await root.$('.CommentWriter:has(.btn_cancel) a.btn_cancel');
        if (openReplyCancel) {
            console.log(`[COMMENT] ${id} 열린 대댓글 입력창 닫기`);
            await openReplyCancel.click();
            await page.waitForTimeout(500);
        }
        // 댓글 입력창 셀렉터: btn_cancel이 없는 CommentWriter (대댓글 제외)
        const commentInputSelector = '.CommentWriter:not(:has(.btn_cancel)) textarea.comment_inbox_text';
        let commentInput = await root.$(commentInputSelector);
        if (!commentInput) {
            try {
                commentInput = await root.waitForSelector(commentInputSelector, {
                    timeout: 12000
                });
            } catch  {}
        }
        if (!commentInput) {
            console.log(`[COMMENT] ${id} 댓글 입력창 없음 - URL: ${page.url()}`);
            return {
                accountId: id,
                success: false,
                error: 'ARTICLE_NOT_READY:댓글 입력창을 찾을 수 없습니다. 글이 아직 처리 중일 수 있습니다.'
            };
        }
        await commentInput.click();
        await page.waitForTimeout(500);
        const sanitizedContent = content.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim();
        await commentInput.fill(sanitizedContent);
        await page.waitForTimeout(500);
        // 댓글 등록 버튼 셀렉터: btn_cancel이 없는 CommentWriter (대댓글 제외)
        const submitButtonSelector = '.CommentWriter:not(:has(.btn_cancel)) a.btn_register';
        const submitButton = await root.$(submitButtonSelector);
        if (!submitButton) {
            return {
                accountId: id,
                success: false,
                error: '등록 버튼(a.btn_register)을 찾을 수 없습니다.'
            };
        }
        await submitButton.click();
        await page.waitForTimeout(2500);
        const errorMessage = await checkErrorPopup(page);
        if (errorMessage) {
            return {
                accountId: id,
                success: false,
                error: errorMessage
            };
        }
        const contentPreview = normalizeText(sanitizedContent).slice(0, 30);
        const commenterNickname = normalizeText(account.nickname || account.id);
        let found = false;
        let commentId;
        for(let retry = 0; retry < 6; retry++){
            const verifyRoot = await getCommentRoot(page);
            const match = await findWrittenComment(verifyRoot, contentPreview, commenterNickname);
            found = match.found;
            commentId = match.commentId;
            if (found) break;
            if (retry < 5) {
                const waitMs = retry < 2 ? 1000 : 2000;
                console.log(`[COMMENT] ${id} 댓글 확인 재시도 ${retry + 1}/6...`);
                await page.waitForTimeout(waitMs);
            }
        }
        if (!found) {
            console.log(`[COMMENT] ${id} 재로딩 후 댓글 재확인 시도`);
            const reloadResult = await navigateToArticle(page, articleUrl, id, password, 'COMMENT-VERIFY', options);
            if (!reloadResult.success) {
                return {
                    accountId: id,
                    success: false,
                    error: `댓글 검증 재진입 실패: ${reloadResult.error}`
                };
            }
            await page.waitForTimeout(1500);
            for(let retry = 0; retry < 4; retry++){
                const verifyRoot = await getCommentRoot(page);
                const match = await findWrittenComment(verifyRoot, contentPreview, commenterNickname);
                found = match.found;
                commentId = match.commentId;
                if (found) break;
                if (retry < 3) {
                    console.log(`[COMMENT] ${id} 재로딩 검증 재시도 ${retry + 1}/4...`);
                    await page.waitForTimeout(1500);
                }
            }
        }
        if (!found) {
            return {
                accountId: id,
                success: false,
                error: `댓글이 등록되지 않음 (닉네임+내용 매칭 실패)`
            };
        }
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["saveCookiesForAccount"])(id);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$daily$2d$activity$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["incrementActivity"])(id, cafeId, 'comments');
        return {
            accountId: id,
            success: true,
            commentId
        };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류';
        return {
            accountId: id,
            success: false,
            error: errorMsg
        };
    } finally{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["releaseAccountLock"])(id);
    }
};
const writeReplyWithAccount = async (account, cafeId, articleId, content, commentIndex = 0, options)=>{
    const { id, password } = account;
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["acquireAccountLock"])(id);
    try {
        const page = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPageForAccount"])(id);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["touchAccount"])(id);
        const articleUrl = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`;
        const navResult = await navigateToArticle(page, articleUrl, id, password, 'REPLY');
        if (!navResult.success) {
            return {
                accountId: id,
                success: false,
                error: navResult.error
            };
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["touchAccount"])(id);
        await page.waitForTimeout(1500);
        const { parentCommentId, parentComment, parentNickname } = options ?? {};
        const getItemText = async (item, selector)=>{
            try {
                return await item.$eval(selector, (el)=>el.textContent || '');
            } catch  {
                return '';
            }
        };
        const root = await getCommentRoot(page);
        let targetItem = null;
        let targetIndex = -1;
        if (parentCommentId) {
            targetItem = await findCommentItemById(root, parentCommentId);
        }
        if (!targetItem) {
            const commentItems = await root.$$('.CommentItem:not(.CommentItem--reply)');
            if (commentItems.length === 0) {
                console.log(`[REPLY] ${id} 답글쓰기 버튼 없음 - URL: ${page.url()}`);
                return {
                    accountId: id,
                    success: false,
                    error: 'ARTICLE_NOT_READY:답글쓰기 버튼을 찾을 수 없습니다. 댓글이 아직 없을 수 있습니다.'
                };
            }
            console.log(`[REPLY] ${id} 메인 댓글 ${commentItems.length}개 발견, 타겟 인덱스: ${commentIndex}`);
            const targetCommentText = normalizeText(parentComment);
            const targetCommentPreview = targetCommentText ? targetCommentText.slice(0, 40) : '';
            const targetNickname = normalizeText(parentNickname);
            if (!targetCommentPreview && targetNickname && commentIndex >= 0 && commentIndex < commentItems.length) {
                const indexedNickname = normalizeText(await getItemText(commentItems[commentIndex], '.comment_nickname'));
                if (indexedNickname === targetNickname) {
                    targetIndex = commentIndex;
                }
            }
            if (targetIndex < 0 && (targetCommentPreview || targetNickname)) {
                for(let i = 0; i < commentItems.length; i++){
                    const item = commentItems[i];
                    const commentText = normalizeText(await getItemText(item, '.comment_text_view'));
                    const commentNickname = normalizeText(await getItemText(item, '.comment_nickname'));
                    const textMatches = targetCommentPreview ? commentText.includes(targetCommentPreview) : true;
                    const nicknameMatches = targetNickname ? commentNickname === targetNickname : true;
                    if (textMatches && nicknameMatches) {
                        targetIndex = i;
                        break;
                    }
                }
            }
            if (targetIndex < 0) {
                targetIndex = commentIndex;
                if (targetIndex >= commentItems.length) {
                    console.log(`[REPLY] ${id} 대댓글 인덱스 ${targetIndex} → ${commentItems.length - 1}로 조정`);
                    targetIndex = commentItems.length - 1;
                }
            }
            targetItem = commentItems[targetIndex];
        }
        const replyButton = await targetItem?.$('a.comment_info_button');
        if (!replyButton) {
            return {
                accountId: id,
                success: false,
                error: '답글쓰기 버튼을 찾을 수 없습니다.'
            };
        }
        await replyButton.click();
        await page.waitForTimeout(1000);
        const replyInput = await root.$('.CommentWriter:has(.btn_cancel) textarea.comment_inbox_text');
        if (!replyInput) {
            return {
                accountId: id,
                success: false,
                error: 'ARTICLE_NOT_READY:대댓글 입력창을 찾을 수 없습니다.'
            };
        }
        await replyInput.click();
        await page.waitForTimeout(500);
        const sanitizedReplyContent = content.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim();
        await replyInput.fill(sanitizedReplyContent);
        await page.waitForTimeout(500);
        const submitButton = await root.$('.CommentWriter:has(.btn_cancel) a.btn_register');
        if (!submitButton) {
            return {
                accountId: id,
                success: false,
                error: '대댓글 등록 버튼을 찾을 수 없습니다.'
            };
        }
        await submitButton.click();
        await page.waitForTimeout(2000);
        const errorMessage = await checkErrorPopup(page);
        if (errorMessage) {
            return {
                accountId: id,
                success: false,
                error: errorMessage
            };
        }
        const sanitizedPreview = sanitizedReplyContent.slice(0, 20);
        let replyFound = false;
        for(let retry = 0; retry < 4; retry++){
            const verifyRoot = await getCommentRoot(page);
            const replyAreas = await verifyRoot.$$('.comment_area');
            for (const area of replyAreas){
                const text = await area.textContent();
                if (text?.includes(sanitizedPreview)) {
                    replyFound = true;
                    break;
                }
            }
            if (replyFound) break;
            if (retry < 3) {
                console.log(`[REPLY] ${id} 대댓글 확인 재시도 ${retry + 1}/4...`);
                await page.waitForTimeout(2000);
            }
        }
        if (!replyFound) {
            return {
                accountId: id,
                success: false,
                error: '대댓글이 등록되지 않음 (목록에서 확인 불가)'
            };
        }
        if (targetItem) {
            const commentLikeButton = await targetItem.$('a.u_likeit_list_btn._button');
            if (commentLikeButton) {
                const isCommentLiked = await commentLikeButton.evaluate((el)=>el.classList.contains('on') || el.getAttribute('aria-pressed') === 'true');
                if (!isCommentLiked) {
                    await commentLikeButton.click();
                    const indexLabel = targetIndex >= 0 ? ` (index: ${targetIndex})` : '';
                    console.log(`[DEBUG] ${id} 댓글 좋아요 클릭${indexLabel}`);
                    await page.waitForTimeout(500);
                }
            }
        }
        let likeButton = await root.$('a.u_likeit_list_btn._button[data-type="like"]');
        if (!likeButton) {
            likeButton = await page.$('a.u_likeit_list_btn._button[data-type="like"]');
        }
        if (likeButton) {
            const isLiked = await likeButton.evaluate((el)=>el.classList.contains('on') || el.getAttribute('aria-pressed') === 'true');
            if (!isLiked) {
                await likeButton.click();
                console.log(`[DEBUG] ${id} 글 좋아요 클릭`);
                await page.waitForTimeout(500);
            }
        }
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["saveCookiesForAccount"])(id);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$daily$2d$activity$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["incrementActivity"])(id, cafeId, 'replies');
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$daily$2d$activity$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["incrementActivity"])(id, cafeId, 'likes');
        return {
            accountId: id,
            success: true
        };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류';
        return {
            accountId: id,
            success: false,
            error: errorMsg
        };
    } finally{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["releaseAccountLock"])(id);
    }
};
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/shared/lib/naver-cafe-writing/like-writer.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "likeArticleWithAccount",
    ()=>likeArticleWithAccount
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/multi-session.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$daily$2d$activity$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/daily-activity.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
const ensureLoggedIn = async (id, password)=>{
    const loggedIn = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isAccountLoggedIn"])(id);
    if (loggedIn) return {
        success: true
    };
    const loginResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["loginAccount"])(id, password);
    if (!loginResult.success) {
        return {
            success: false,
            error: loginResult.error || '로그인 실패'
        };
    }
    return {
        success: true
    };
};
const navigateToArticle = async (page, articleUrl, id, password)=>{
    await page.goto(articleUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
    });
    const currentUrl = page.url();
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isLoginRedirect"])(currentUrl)) return {
        success: true
    };
    console.log(`[LIKE] ${id} 세션 만료 감지 - 재로그인 시도`);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["invalidateLoginCache"])(id);
    const reloginResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["loginAccount"])(id, password);
    if (!reloginResult.success) {
        return {
            success: false,
            error: `세션 만료 후 재로그인 실패: ${reloginResult.error}`
        };
    }
    await page.goto(articleUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
    });
    return {
        success: true
    };
};
const getCommentRoot = async (page)=>{
    const frameHandle = await page.$('iframe#cafe_main');
    const frame = await frameHandle?.contentFrame();
    if (frame) {
        try {
            await frame.waitForSelector('.article_viewer, .se-viewer', {
                timeout: 5000
            });
            return frame;
        } catch  {
        // iframe 로드 실패 시 page 사용
        }
    }
    return page;
};
const likeArticleWithAccount = async (account, cafeId, articleId)=>{
    const { id, password } = account;
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["acquireAccountLock"])(id);
    try {
        const loginCheck = await ensureLoggedIn(id, password);
        if (!loginCheck.success) {
            return {
                accountId: id,
                success: false,
                error: loginCheck.error
            };
        }
        const page = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPageForAccount"])(id);
        const articleUrl = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`;
        const navResult = await navigateToArticle(page, articleUrl, id, password);
        if (!navResult.success) {
            return {
                accountId: id,
                success: false,
                error: navResult.error
            };
        }
        const notFoundIndicator = await page.$('.error_content, .deleted_article, .no_article');
        if (notFoundIndicator) {
            return {
                accountId: id,
                success: false,
                error: 'ARTICLE_NOT_READY:글이 아직 처리 중이거나 삭제됨'
            };
        }
        await page.waitForTimeout(1500);
        const root = await getCommentRoot(page);
        let articleLiked = false;
        // 글 좋아요 버튼 찾기 (root → page 폴백)
        let likeButton = await root.$('a.u_likeit_list_btn._button[data-type="like"]');
        if (!likeButton) {
            likeButton = await page.$('a.u_likeit_list_btn._button[data-type="like"]');
        }
        if (likeButton) {
            const isLiked = await likeButton.evaluate((el)=>el.classList.contains('on') || el.getAttribute('aria-pressed') === 'true');
            if (!isLiked) {
                await likeButton.click();
                console.log(`[LIKE] ${id} 글 좋아요 클릭 - articleId: ${articleId}`);
                await page.waitForTimeout(500);
                articleLiked = true;
            } else {
                console.log(`[LIKE] ${id} 이미 좋아요 누름 - articleId: ${articleId}`);
                articleLiked = true;
            }
        } else {
            console.log(`[LIKE] ${id} 좋아요 버튼 없음 - articleId: ${articleId}`);
        }
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["saveCookiesForAccount"])(id);
        if (articleLiked) {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$daily$2d$activity$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["incrementActivity"])(id, cafeId, 'likes');
        }
        return {
            accountId: id,
            success: true,
            articleLiked
        };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류';
        return {
            accountId: id,
            success: false,
            error: errorMsg
        };
    } finally{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["releaseAccountLock"])(id);
    }
};
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/shared/lib/naver-cafe-writing/index.ts [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$post$2d$writer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/naver-cafe-writing/post-writer.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$article$2d$modifier$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/naver-cafe-writing/article-modifier.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$modify$2d$query$2d$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/naver-cafe-writing/modify-query-utils.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$comment$2d$writer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/naver-cafe-writing/comment-writer.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$like$2d$writer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/naver-cafe-writing/like-writer.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$post$2d$writer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$article$2d$modifier$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$comment$2d$writer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$like$2d$writer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$post$2d$writer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$article$2d$modifier$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$comment$2d$writer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$like$2d$writer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/shared/api/comment-gen-api.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateAuthorReply",
    ()=>generateAuthorReply,
    "generateComment",
    ()=>generateComment,
    "generateReply",
    ()=>generateReply
]);
const BASE_URL = process.env.COMMENT_GEN_API_URL || 'http://localhost:8000';
const POSITIVE_PERSONA_IDS = [
    'cute_f',
    'warm_f',
    'enthusiast',
    'grateful',
    'supporter'
];
const COMMENT_SAFETY_GUIDE = [
    '',
    '[댓글 말투 지시] 반드시 존댓말만 사용. "~했어", "~같아", "~좋아", "~맞아", "~문제야", "~하자", "~해봐" 같은 반말 종결 금지. "맞아요/저도/오/헐" 시작 반복 금지. 질문형, 경험형, 정보형, 생활잡담형 중 하나로 자연스럽게 작성.'
].join('\n\n');
const withCommentSafetyGuide = (content)=>{
    if (!content) return COMMENT_SAFETY_GUIDE;
    return `${content}\n\n${COMMENT_SAFETY_GUIDE}`;
};
const toNumericPersonaId = (personaId)=>{
    if (!personaId) return undefined;
    const parsed = Number(personaId);
    if (!Number.isInteger(parsed)) return undefined;
    return parsed;
};
const generateComment = async (postContent, personaId, authorName)=>{
    const normalizedPersonaId = toNumericPersonaId(personaId);
    const body = {
        content: withCommentSafetyGuide(postContent) ?? postContent,
        author_name: authorName
    };
    if (normalizedPersonaId !== undefined) body.persona_id = normalizedPersonaId;
    const res = await fetch(`${BASE_URL}/generate/comment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        throw new Error(`댓글 생성 API 오류: ${res.status}`);
    }
    const data = await res.json();
    if (!data.success) {
        throw new Error('댓글 생성 실패');
    }
    return data.comment.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim();
};
const generateReply = async (postContent, parentComment, personaId, authorName, parentAuthor, commenterName)=>{
    const normalizedPersonaId = toNumericPersonaId(personaId);
    const body = {
        parent_comment: parentComment,
        content: withCommentSafetyGuide(postContent),
        author_name: authorName,
        parent_author: parentAuthor,
        commenter_name: commenterName
    };
    if (normalizedPersonaId !== undefined) body.persona_id = normalizedPersonaId;
    const res = await fetch(`${BASE_URL}/generate/recomment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        throw new Error(`대댓글 생성 API 오류: ${res.status}`);
    }
    const data = await res.json();
    if (!data.success) {
        throw new Error('대댓글 생성 실패');
    }
    return data.comment.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim();
};
const generateAuthorReply = async (postContent, parentComment, personaId, parentAuthor, commenterName)=>{
    const authorPersonaId = personaId ?? POSITIVE_PERSONA_IDS[Math.floor(Math.random() * POSITIVE_PERSONA_IDS.length)];
    const normalizedPersonaId = toNumericPersonaId(authorPersonaId);
    const body = {
        parent_comment: parentComment,
        content: withCommentSafetyGuide(postContent),
        parent_author: parentAuthor,
        commenter_name: commenterName
    };
    if (normalizedPersonaId !== undefined) body.persona_id = normalizedPersonaId;
    const res = await fetch(`${BASE_URL}/generate/recomment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        throw new Error(`글쓴이 대댓글 생성 API 오류: ${res.status}`);
    }
    const data = await res.json();
    if (!data.success) {
        throw new Error('글쓴이 대댓글 생성 실패');
    }
    return data.comment.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim();
};
}),
"[project]/src/shared/lib/logger/index.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createLogger",
    ()=>createLogger
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
;
;
const LOG_DIR = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), 'logs');
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};
const MIN_LEVEL = process.env.LOG_LEVEL || 'info';
const ensureLogDir = ()=>{
    if (!__TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].existsSync(LOG_DIR)) {
        __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].mkdirSync(LOG_DIR, {
            recursive: true
        });
    }
};
const getLogFileName = ()=>{
    const now = new Date();
    const date = now.toISOString().slice(0, 10); // YYYY-MM-DD
    return __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(LOG_DIR, `${date}.log`);
};
const formatTimestamp = ()=>{
    const now = new Date();
    return now.toISOString().replace('T', ' ').slice(0, 19);
};
const writeLog = (level, tag, message, meta)=>{
    if (LOG_LEVELS[level] < LOG_LEVELS[MIN_LEVEL]) return;
    const timestamp = formatTimestamp();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    const line = `[${timestamp}] [${level.toUpperCase()}] [${tag}] ${message}${metaStr}\n`;
    // console 출력 (기존 호환)
    const consoleFn = level === 'error' ? console.error : console.log;
    consoleFn(`[${tag}] ${message}${metaStr}`);
    // 파일 저장
    try {
        ensureLogDir();
        __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].appendFileSync(getLogFileName(), line);
    } catch  {}
};
const createLogger = (tag)=>({
        debug: (message, meta)=>writeLog('debug', tag, message, meta),
        info: (message, meta)=>writeLog('info', tag, message, meta),
        warn: (message, meta)=>writeLog('warn', tag, message, meta),
        error: (message, meta)=>writeLog('error', tag, message, meta)
    });
}),
"[project]/src/shared/lib/queue/viral-comment-limits.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MAX_VIRAL_COMMENT_JOBS",
    ()=>MAX_VIRAL_COMMENT_JOBS,
    "MAX_VIRAL_MAIN_COMMENTS",
    ()=>MAX_VIRAL_MAIN_COMMENTS,
    "limitViralCommentItems",
    ()=>limitViralCommentItems
]);
const MAX_VIRAL_MAIN_COMMENTS = 8;
const MAX_VIRAL_COMMENT_JOBS = 20;
const limitViralCommentItems = (comments, maxMainComments = MAX_VIRAL_MAIN_COMMENTS, maxTotalJobs = MAX_VIRAL_COMMENT_JOBS)=>{
    const mainComments = comments.filter((comment)=>comment.type === 'comment').slice(0, maxMainComments);
    const allowedParents = new Set(mainComments.map((comment)=>comment.index));
    const replies = comments.filter((comment)=>comment.type !== 'comment' && comment.parentIndex !== undefined && allowedParents.has(comment.parentIndex));
    const limited = [
        ...mainComments,
        ...replies
    ].slice(0, maxTotalJobs);
    return limited;
};
}),
"[project]/src/shared/lib/queue/handlers/post-handler.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "handlePostJob",
    ()=>handlePostJob
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/lib/queue/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/lib/naver-cafe-writing/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$post$2d$writer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/naver-cafe-writing/post-writer.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$api$2f$comment$2d$gen$2d$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/api/comment-gen-api.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$account$2d$manager$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/account-manager.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$queue$2d$settings$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/queue-settings.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/mongodb.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/models/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$published$2d$article$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/published-article.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$daily$2d$post$2d$count$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/daily-post-count.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$logger$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/logger/index.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$viral$2d$comment$2d$limits$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/queue/viral-comment-limits.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$post$2d$writer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$post$2d$writer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
;
;
;
;
const log = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$logger$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createLogger"])('POST-HANDLER');
const handlePostJob = async (data, ctx)=>{
    const { account, accounts, settings } = ctx;
    console.log(`[WORKER] Post 처리: ${data.keyword || data.subject}`);
    console.log(`[WORKER]   - 카테고리: ${data.category || '없음'}`);
    console.log(`[WORKER]   - 이미지: ${data.images?.length || 0}장`);
    const result = await Promise.race([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$post$2d$writer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["writePostWithAccount"])(account, {
            cafeId: data.cafeId,
            menuId: data.menuId,
            subject: data.subject,
            content: data.content,
            category: data.category,
            postOptions: data.postOptions,
            images: data.images
        }),
        new Promise((_, reject)=>setTimeout(()=>reject(new Error('타임아웃')), settings.timeout))
    ]);
    if (!result.success) {
        log.error('글 작성 실패', {
            keyword: data.keyword,
            accountId: data.accountId,
            cafeId: data.cafeId,
            error: result.error
        });
        throw new Error(result.error || '글 작성 실패');
    }
    if (!result.articleId) {
        log.error('articleId 추출 실패 — 글 작성 실패 처리', {
            keyword: data.keyword,
            accountId: data.accountId,
            cafeId: data.cafeId,
            articleUrl: result.articleUrl
        });
        throw new Error(`articleId 추출 실패 — URL: ${result.articleUrl || 'N/A'}`);
    }
    try {
        if (result.articleId && data.viralComments?.comments.length) {
            await saveArticleOnly(data, result.articleId);
            await addViralCommentJobs(data, result.articleId, accounts);
            log.info('viral 댓글 큐 생성 완료', {
                articleId: result.articleId,
                keyword: data.keyword
            });
        } else if (result.articleId && !data.skipComments) {
            await handlePostSuccess(data, result.articleId, accounts, settings);
        } else if (result.articleId) {
            await saveArticleOnly(data, result.articleId);
        }
    } catch (chainError) {
        log.error('체인 작업 중 오류 (글 발행은 완료됨)', {
            keyword: data.keyword,
            articleId: result.articleId,
            error: chainError instanceof Error ? chainError.message : String(chainError)
        });
    }
    return {
        success: true,
        articleId: result.articleId,
        articleUrl: result.articleUrl
    };
};
const saveArticleOnly = async (postData, articleId)=>{
    const { cafeId, menuId, keyword, subject, content, accountId: writerAccountId } = postData;
    console.log(`[WORKER] 글만 발행 모드: #${articleId} - 원고 저장`);
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
        if (__TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].connection.readyState === 1) {
            const articleUrl = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`;
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$published$2d$article$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PublishedArticle"].create({
                articleId,
                cafeId,
                menuId,
                keyword: keyword || '',
                title: subject,
                content,
                articleUrl,
                writerAccountId,
                status: 'published',
                postType: postData.postType,
                commentCount: 0,
                replyCount: 0
            });
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$daily$2d$post$2d$count$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["incrementTodayPostCount"])(writerAccountId, cafeId);
            console.log(`[WORKER] 원고 저장 완료 (글만 발행): #${articleId}`);
        }
    } catch (dbError) {
        console.error('[WORKER] 원고 저장 실패:', dbError);
    }
};
const FIRST_COMMENT_DELAY = {
    min: 4 * 60 * 1000,
    max: 7 * 60 * 1000
}; // 글 저장 후 첫 댓글까지 4~7분
const BETWEEN_COMMENTS_DELAY = {
    min: 4 * 60 * 1000,
    max: 9 * 60 * 1000
}; // 댓글/대댓글 간 4~9분
const addViralCommentJobs = async (postData, articleId, accounts)=>{
    const { cafeId, keyword, accountId: writerAccountId, userId, viralComments, commenterAccountIds } = postData;
    if (!viralComments || viralComments.comments.length === 0) return;
    const comments = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$viral$2d$comment$2d$limits$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["limitViralCommentItems"])(viralComments.comments);
    // commenterAccountIds가 undefined면 전체 사용, 빈 배열이면 댓글 스킵
    const commenterAccounts = commenterAccountIds === undefined ? accounts.filter((a)=>a.id !== writerAccountId) : accounts.filter((a)=>commenterAccountIds.includes(a.id) && a.id !== writerAccountId);
    if (commenterAccounts.length === 0) {
        console.log('[WORKER] 댓글 계정 없음 - viral 댓글 스킵');
        return;
    }
    const accountNicknameMap = new Map(accounts.map((account)=>[
            account.id,
            account.nickname || account.id
        ]));
    const mainComments = comments.filter((c)=>c.type === 'comment');
    const commentIndexMap = new Map();
    const commentAuthorMap = new Map();
    const commentContentMap = new Map();
    mainComments.forEach((comment, i)=>{
        const commenter = commenterAccounts[i % commenterAccounts.length];
        commentIndexMap.set(comment.index, i);
        commentAuthorMap.set(comment.index, commenter.id);
        commentContentMap.set(comment.index, comment.content);
    });
    const sequenceId = `viral_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    let orderIndex = 0;
    let commentCount = 0;
    let replyCount = 0;
    let cumulativeDelay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$queue$2d$settings$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRandomDelay"])(FIRST_COMMENT_DELAY);
    const lastReplyerByParent = new Map();
    console.log(`[WORKER] viral 댓글/대댓글 ${comments.length}/${viralComments.comments.length}개 Job 추가 시작`);
    for (const item of comments){
        const itemDelay = cumulativeDelay;
        if (item.type === 'comment') {
            const commenterId = commentAuthorMap.get(item.index);
            if (!commenterId) {
                console.warn(`[WORKER] 댓글 작성자 없음: index=${item.index}`);
                continue;
            }
            const commentOrder = commentIndexMap.get(item.index);
            const commentJobData = {
                type: 'comment',
                accountId: commenterId,
                userId,
                cafeId,
                articleId,
                content: item.content,
                commentIndex: commentOrder,
                keyword,
                sequenceId,
                sequenceIndex: orderIndex
            };
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["addTaskJob"])(commenterId, commentJobData, itemDelay);
            console.log(`[WORKER] [${orderIndex + 1}] 댓글 Job: ${commenterId}, 딜레이: ${Math.round(itemDelay / 60000)}분`);
            commentCount++;
            orderIndex++;
            cumulativeDelay += (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$queue$2d$settings$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRandomDelay"])(BETWEEN_COMMENTS_DELAY);
            continue;
        }
        if (item.parentIndex === undefined) {
            console.warn(`[WORKER] 대댓글 부모 없음: type=${item.type}`);
            continue;
        }
        const parentCommentOrder = commentIndexMap.get(item.parentIndex);
        if (parentCommentOrder === undefined) {
            console.warn(`[WORKER] 부모 댓글 없음: index=${item.parentIndex}`);
            continue;
        }
        const parentCommenterId = commentAuthorMap.get(item.parentIndex);
        const lastReplyerId = lastReplyerByParent.get(item.parentIndex);
        let replyerAccountId;
        if (item.type === 'author_reply') {
            replyerAccountId = writerAccountId;
        } else if (item.type === 'commenter_reply') {
            replyerAccountId = parentCommenterId || commenterAccounts[parentCommentOrder % commenterAccounts.length].id;
        } else {
            const excludeIds = new Set();
            if (parentCommenterId) excludeIds.add(parentCommenterId);
            if (lastReplyerId) excludeIds.add(lastReplyerId);
            const availableCommenters = commenterAccounts.filter((a)=>!excludeIds.has(a.id));
            if (availableCommenters.length === 0) {
                const fallbackCommenters = commenterAccounts.filter((a)=>a.id !== lastReplyerId);
                if (fallbackCommenters.length === 0) {
                    replyerAccountId = commenterAccounts[Math.floor(Math.random() * commenterAccounts.length)].id;
                } else {
                    replyerAccountId = fallbackCommenters[Math.floor(Math.random() * fallbackCommenters.length)].id;
                }
            } else {
                replyerAccountId = availableCommenters[Math.floor(Math.random() * availableCommenters.length)].id;
            }
        }
        if (replyerAccountId === lastReplyerId && commenterAccounts.length > 1) {
            const alternativeAccounts = accounts.filter((a)=>a.id !== lastReplyerId);
            if (alternativeAccounts.length > 0) {
                replyerAccountId = alternativeAccounts[Math.floor(Math.random() * alternativeAccounts.length)].id;
            }
        }
        lastReplyerByParent.set(item.parentIndex, replyerAccountId);
        const replyJobData = {
            type: 'reply',
            accountId: replyerAccountId,
            userId,
            cafeId,
            articleId,
            content: item.content,
            commentIndex: parentCommentOrder,
            parentComment: commentContentMap.get(item.parentIndex),
            parentNickname: parentCommenterId ? accountNicknameMap.get(parentCommenterId) : undefined,
            keyword,
            sequenceId,
            sequenceIndex: orderIndex
        };
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["addTaskJob"])(replyerAccountId, replyJobData, itemDelay);
        console.log(`[WORKER] [${orderIndex + 1}] 대댓글 Job (${item.type}): ${replyerAccountId} → 댓글[${parentCommentOrder}], 딜레이: ${Math.round(itemDelay / 60000)}분`);
        replyCount++;
        orderIndex++;
        cumulativeDelay += (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$queue$2d$settings$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRandomDelay"])(BETWEEN_COMMENTS_DELAY);
    }
    console.log(`[WORKER] viral 댓글 ${commentCount}개, 대댓글 ${replyCount}개 Job 추가 완료`);
};
const handlePostSuccess = async (postData, articleId, accounts, settings)=>{
    const { cafeId, menuId, keyword, subject, content, rawContent, accountId: writerAccountId, userId } = postData;
    console.log(`[WORKER] 글 발행 성공: #${articleId} - 체인 작업 시작`);
    // 1. 원고 MongoDB 저장 + 일일 포스트 카운트 증가
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
        console.log(`[WORKER] MongoDB 연결 상태: ${__TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].connection.readyState}`);
        if (__TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].connection.readyState === 1) {
            const articleUrl = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`;
            const created = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$published$2d$article$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PublishedArticle"].create({
                articleId,
                cafeId,
                menuId,
                keyword: keyword || '',
                title: subject,
                content,
                articleUrl,
                writerAccountId,
                status: 'published',
                postType: postData.postType,
                commentCount: 0,
                replyCount: 0,
                comments: []
            });
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$daily$2d$post$2d$count$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["incrementTodayPostCount"])(writerAccountId, cafeId);
            console.log(`[WORKER] 원고 저장 완료: #${articleId}, _id=${created._id}`);
        } else {
            console.log(`[WORKER] MongoDB 미연결 - 원고 저장 스킵: #${articleId}`);
        }
    } catch (dbError) {
        console.error('[WORKER] 원고 저장 실패:', dbError);
    }
    // 2. 댓글 job 추가
    // commenterAccountIds가 undefined면 전체 사용, 빈 배열이면 댓글 스킵
    const commenterAccounts = postData.commenterAccountIds === undefined ? accounts.filter((a)=>a.id !== writerAccountId) : accounts.filter((a)=>postData.commenterAccountIds.includes(a.id) && a.id !== writerAccountId);
    if (commenterAccounts.length === 0) {
        console.log('[WORKER] 댓글 계정 없음 - 스킵');
        return;
    }
    const writerAccount = accounts.find((a)=>a.id === writerAccountId);
    const writerNickname = writerAccount?.nickname || writerAccountId;
    const postContent = rawContent || content;
    const postContext = `${subject}\n\n${postContent}`;
    const commentDelays = new Map();
    const afterPostDelay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$queue$2d$settings$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRandomDelay"])(settings.delays.afterPost);
    const commentBatchId = `batch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const maxCommentsPerAccount = settings.limits?.maxCommentsPerAccount ?? 1;
    const commentCount = commenterAccounts.length;
    console.log(`[WORKER] 댓글 ${commentCount}개 job 추가 예정 (계정당 ${maxCommentsPerAccount}개)`);
    let sequenceOrderIndex = 0;
    const commentAuthors = [];
    const commentContents = [];
    const accountCommentCounts = new Map();
    for(let i = 0; i < commentCount; i++){
        const commenter = commenterAccounts[i % commenterAccounts.length];
        const currentCount = accountCommentCounts.get(commenter.id) ?? 0;
        if (maxCommentsPerAccount > 0 && currentCount >= maxCommentsPerAccount) continue;
        const personaId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$account$2d$manager$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPersonaId"])(commenter);
        accountCommentCounts.set(commenter.id, (accountCommentCounts.get(commenter.id) ?? 0) + 1);
        let commentText;
        try {
            commentText = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$api$2f$comment$2d$gen$2d$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["generateComment"])(postContext, personaId, writerNickname);
        } catch  {
            commentText = '좋은 정보 감사합니다!';
        }
        const baseDelay = commentDelays.get(commenter.id) ?? afterPostDelay;
        const activityDelay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$account$2d$manager$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getNextActiveTime"])(commenter);
        const currentDelay = Math.max(baseDelay, activityDelay);
        const nextDelay = currentDelay + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$queue$2d$settings$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRandomDelay"])(settings.delays.betweenComments);
        commentDelays.set(commenter.id, nextDelay);
        const commentIndex = commentAuthors.length;
        const commentJobData = {
            type: 'comment',
            accountId: commenter.id,
            userId,
            cafeId,
            articleId,
            content: commentText,
            commentIndex,
            sequenceId: commentBatchId,
            sequenceIndex: sequenceOrderIndex
        };
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["addTaskJob"])(commenter.id, commentJobData, currentDelay);
        sequenceOrderIndex++;
        const delayInfo = activityDelay > 0 ? `${Math.round(currentDelay / 1000)}초 (활동시간까지 ${Math.round(activityDelay / 60000)}분)` : `${Math.round(currentDelay / 1000)}초`;
        console.log(`[WORKER] 댓글 job 추가: ${commenter.id}, 딜레이: ${delayInfo}`);
        const commenterNickname = commenter.nickname || commenter.id;
        commentAuthors.push({
            id: commenter.id,
            nickname: commenterNickname
        });
        commentContents.push(commentText);
    }
    // 3. 대댓글 job 추가
    const actualCommentCount = commentAuthors.length;
    if (actualCommentCount === 0) {
        console.log('[WORKER] 댓글이 없어서 대댓글 스킵');
        return;
    }
    const authorReplyCount = actualCommentCount === 1 ? Math.random() < 0.5 ? 0 : 1 : Math.min(Math.floor(Math.random() * 2) + 1, actualCommentCount);
    const remainingComments = actualCommentCount - authorReplyCount;
    const normalReplyCount = remainingComments > 0 ? Math.min(Math.floor(Math.random() * 2) + 1, remainingComments) : 0;
    const totalReplyCount = authorReplyCount + normalReplyCount;
    console.log(`[WORKER] 대댓글 ${totalReplyCount}개 job 추가 예정 (글쓴이: ${authorReplyCount}, 일반: ${normalReplyCount})`);
    const maxCommentDelay = Math.max(...Array.from(commentDelays.values()), afterPostDelay);
    const replyBaseDelay = maxCommentDelay + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$queue$2d$settings$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRandomDelay"])(settings.delays.afterPost);
    const replyDelays = new Map();
    const repliedCommentIndices = new Set();
    // 글쓴이 대댓글
    if (writerAccount && authorReplyCount > 0) {
        const writerPersonaId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$account$2d$manager$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPersonaId"])(writerAccount);
        const writerActivityDelay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$account$2d$manager$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getNextActiveTime"])(writerAccount);
        for(let i = 0; i < authorReplyCount; i++){
            let targetCommentIndex = -1;
            for(let j = 0; j < actualCommentCount; j++){
                const idx = (i + j) % actualCommentCount;
                if (!repliedCommentIndices.has(idx)) {
                    targetCommentIndex = idx;
                    break;
                }
            }
            if (targetCommentIndex === -1) {
                console.log(`[WORKER] 글쓴이 대댓글 ${i} - 대댓글 달 댓글 없어서 스킵`);
                continue;
            }
            repliedCommentIndices.add(targetCommentIndex);
            const targetCommentAuthor = commentAuthors[targetCommentIndex];
            const parentAuthorNickname = targetCommentAuthor?.nickname;
            const parentCommentContent = commentContents[targetCommentIndex] || '댓글 감사합니다';
            let replyText;
            try {
                replyText = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$api$2f$comment$2d$gen$2d$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["generateAuthorReply"])(postContext, parentCommentContent, writerPersonaId, parentAuthorNickname, writerNickname);
            } catch  {
                replyText = '댓글 감사합니다!';
            }
            const baseDelay = replyDelays.get(writerAccountId) ?? replyBaseDelay;
            const currentDelay = Math.max(baseDelay, writerActivityDelay);
            const nextDelay = currentDelay + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$queue$2d$settings$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRandomDelay"])(settings.delays.betweenComments);
            replyDelays.set(writerAccountId, nextDelay);
            const replyJobData = {
                type: 'reply',
                accountId: writerAccountId,
                userId,
                cafeId,
                articleId,
                content: replyText,
                commentIndex: targetCommentIndex,
                parentComment: parentCommentContent,
                parentNickname: parentAuthorNickname,
                sequenceId: commentBatchId,
                sequenceIndex: sequenceOrderIndex
            };
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["addTaskJob"])(writerAccountId, replyJobData, currentDelay);
            sequenceOrderIndex++;
            const delayInfo = writerActivityDelay > 0 ? `${Math.round(currentDelay / 1000)}초 (활동시간까지 ${Math.round(writerActivityDelay / 60000)}분)` : `${Math.round(currentDelay / 1000)}초`;
            console.log(`[WORKER] 글쓴이 대댓글 job 추가: ${writerAccountId} → 댓글[${targetCommentIndex}], 딜레이: ${delayInfo}`);
        }
    }
    // 일반 대댓글
    for(let i = 0; i < normalReplyCount; i++){
        let targetCommentIndex = -1;
        for(let j = 0; j < actualCommentCount; j++){
            const idx = (i + j) % actualCommentCount;
            if (!repliedCommentIndices.has(idx)) {
                targetCommentIndex = idx;
                break;
            }
        }
        if (targetCommentIndex === -1) {
            console.log(`[WORKER] 일반 대댓글 ${i} - 모든 댓글에 대댓글 있어서 스킵`);
            continue;
        }
        repliedCommentIndices.add(targetCommentIndex);
        const targetCommentAuthor = commentAuthors[targetCommentIndex];
        if (!targetCommentAuthor?.id) {
            console.log(`[WORKER] 일반 대댓글 ${i} - 댓글 작성자 정보 없음 (index: ${targetCommentIndex})`);
            continue;
        }
        console.log(`[WORKER] 대댓글 계정 선택: 댓글[${targetCommentIndex}] 작성자=${targetCommentAuthor.id}, 후보=${commenterAccounts.map((a)=>a.id).join(',')}`);
        const availableReplyers = commenterAccounts.filter((a)=>a.id !== targetCommentAuthor.id);
        if (availableReplyers.length === 0) {
            console.log(`[WORKER] 일반 대댓글 ${i} - 사용 가능한 계정 없어서 스킵 (댓글 작성자: ${targetCommentAuthor.id})`);
            continue;
        }
        const replyer = availableReplyers[i % availableReplyers.length];
        const replyerPersonaId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$account$2d$manager$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPersonaId"])(replyer);
        const replyerNickname = replyer.nickname || replyer.id;
        const parentCommentContent = commentContents[targetCommentIndex] || '좋은 정보네요';
        let replyText;
        try {
            replyText = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$api$2f$comment$2d$gen$2d$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["generateReply"])(postContext, parentCommentContent, replyerPersonaId, writerNickname, targetCommentAuthor.nickname, replyerNickname);
        } catch  {
            replyText = '저도 그렇게 생각해요!';
        }
        const baseDelay = replyDelays.get(replyer.id) ?? replyBaseDelay;
        const replyerActivityDelay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$account$2d$manager$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getNextActiveTime"])(replyer);
        const currentDelay = Math.max(baseDelay, replyerActivityDelay);
        const nextDelay = currentDelay + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$queue$2d$settings$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRandomDelay"])(settings.delays.betweenComments);
        replyDelays.set(replyer.id, nextDelay);
        const replyJobData = {
            type: 'reply',
            accountId: replyer.id,
            userId,
            cafeId,
            articleId,
            content: replyText,
            commentIndex: targetCommentIndex,
            parentComment: parentCommentContent,
            parentNickname: targetCommentAuthor.nickname,
            sequenceId: commentBatchId,
            sequenceIndex: sequenceOrderIndex
        };
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["addTaskJob"])(replyer.id, replyJobData, currentDelay);
        sequenceOrderIndex++;
        const delayInfo = replyerActivityDelay > 0 ? `${Math.round(currentDelay / 1000)}초 (활동시간까지 ${Math.round(replyerActivityDelay / 60000)}분)` : `${Math.round(currentDelay / 1000)}초`;
        console.log(`[WORKER] 일반 대댓글 job 추가: ${replyer.id} → 댓글[${targetCommentIndex}], 딜레이: ${delayInfo}`);
    }
    console.log(`[WORKER] 체인 작업 완료: 댓글 ${actualCommentCount}개, 대댓글 ${totalReplyCount}개 job 추가됨`);
};
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/shared/lib/queue/sequence-harness.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createSequenceController",
    ()=>createSequenceController
]);
const DEFAULT_SEQUENCE_TTL_SEC = 24 * 60 * 60;
const DEFAULT_SEQUENCE_POLL_MS = 2000;
const DEFAULT_SEQUENCE_WAIT_LIMIT_MS = 30 * 1000;
const DEFAULT_SEQUENCE_STALL_MS = 2 * 60 * 1000;
const getSequenceKey = (sequenceId)=>`comment_sequence:${sequenceId}`;
const getSequenceTimeKey = (sequenceId)=>`comment_sequence:${sequenceId}:ts`;
const createSequenceController = ({ getRedisConnection, sleep, now, ttlSec = DEFAULT_SEQUENCE_TTL_SEC, pollMs = DEFAULT_SEQUENCE_POLL_MS, waitLimitMs = DEFAULT_SEQUENCE_WAIT_LIMIT_MS, stallMs = DEFAULT_SEQUENCE_STALL_MS, log = console.log })=>{
    const waitForSequenceTurn = async (sequenceId, sequenceIndex, maxWaitMs = waitLimitMs)=>{
        const redis = getRedisConnection();
        const key = getSequenceKey(sequenceId);
        const timeKey = getSequenceTimeKey(sequenceId);
        const initialized = await redis.set(key, '0', 'EX', ttlSec, 'NX');
        if (initialized === 'OK') {
            await redis.set(timeKey, now().toString(), 'EX', ttlSec);
        }
        const startedAt = now();
        let logged = false;
        while(true){
            const raw = await redis.get(key);
            const current = raw ? Number.parseInt(raw, 10) : 0;
            if (current === sequenceIndex) {
                if (logged) {
                    log(`[QUEUE] 순서 시작: ${sequenceId} -> ${sequenceIndex}`);
                }
                await redis.set(timeKey, now().toString(), 'EX', ttlSec);
                await redis.expire(key, ttlSec);
                return 'ready';
            }
            if (current > sequenceIndex) {
                log(`[QUEUE] 순서 스킵: ${sequenceId} 현재=${current}, 대상=${sequenceIndex}`);
                return 'skipped';
            }
            const lastTs = await redis.get(timeKey);
            if (lastTs) {
                const stalledMs = now() - Number.parseInt(lastTs, 10);
                if (stalledMs > stallMs) {
                    log(`[QUEUE] 시퀀스 스톨 감지 (${Math.round(stalledMs / 1000)}초 정체) - 강제 진행: ${sequenceId} ${current} → ${sequenceIndex}`);
                    await redis.set(key, sequenceIndex.toString(), 'EX', ttlSec);
                    await redis.set(timeKey, now().toString(), 'EX', ttlSec);
                    return 'ready';
                }
            }
            if (!logged) {
                log(`[QUEUE] 순서 대기: ${sequenceId} 현재=${current}, 대상=${sequenceIndex}`);
                logged = true;
            }
            if (now() - startedAt >= maxWaitMs) {
                return 'pending';
            }
            await sleep(pollMs);
        }
    };
    const advanceSequence = async (sequenceId)=>{
        const redis = getRedisConnection();
        const key = getSequenceKey(sequenceId);
        const timeKey = getSequenceTimeKey(sequenceId);
        await redis.multi().incr(key).expire(key, ttlSec).set(timeKey, now().toString(), 'EX', ttlSec).exec();
    };
    return {
        advanceSequence,
        waitForSequenceTurn
    };
};
}),
"[project]/src/shared/lib/queue/sequence.ts [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "advanceSequence",
    ()=>advanceSequence,
    "waitForSequenceTurn",
    ()=>waitForSequenceTurn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$redis$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/redis.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$sequence$2d$harness$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/queue/sequence-harness.ts [app-rsc] (ecmascript)");
;
;
const sleep = (ms)=>{
    return new Promise((resolve)=>setTimeout(resolve, ms));
};
const sequenceController = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$sequence$2d$harness$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createSequenceController"])({
    getRedisConnection: ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$redis$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRedisConnection"])(),
    log: (message)=>console.log(message),
    now: ()=>Date.now(),
    sleep
});
const waitForSequenceTurn = sequenceController.waitForSequenceTurn;
const advanceSequence = sequenceController.advanceSequence;
;
}),
"[project]/src/shared/lib/queue/handlers/comment-handler.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "handleCommentJob",
    ()=>handleCommentJob
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/lib/queue/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$task$2d$job$2d$harness$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/queue/task-job-harness.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$sequence$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/lib/queue/sequence.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/lib/naver-cafe-writing/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$comment$2d$writer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/naver-cafe-writing/comment-writer.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/models/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$published$2d$article$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/published-article.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/multi-session.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$redis$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/redis.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$logger$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/logger/index.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$comment$2d$writer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$comment$2d$writer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
;
const log = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$logger$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createLogger"])('COMMENT');
const WRITE_LOCK_TTL = 600; // 10분
const SEQUENCE_WAIT_RETRY_MS = 10 * 1000;
const ARTICLE_LOOKUP_RETRY_MS = 2 * 60 * 1000;
const ARTICLE_NOT_READY_RETRY_MS = 5 * 60 * 1000;
const WRITE_LOCK_RETRY_MS = 60 * 1000;
const WRITE_FAIL_RETRY_MS = 60 * 1000;
const MAX_TRANSIENT_RETRY = 3;
const acquireWriteLock = async (cafeId, articleId, accountId, content)=>{
    const redis = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$redis$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRedisConnection"])();
    const contentKey = content.slice(0, 30).replace(/\s+/g, '');
    const lockKey = `write_lock:comment:${cafeId}:${articleId}:${accountId}:${contentKey}`;
    const result = await redis.set(lockKey, '1', 'EX', WRITE_LOCK_TTL, 'NX');
    return result === 'OK';
};
const handleCommentJob = async (data, ctx)=>{
    const { account, settings } = ctx;
    const hasSequence = Boolean(data.sequenceId && data.sequenceIndex !== undefined);
    if (hasSequence) {
        const turn = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$sequence$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["waitForSequenceTurn"])(data.sequenceId, data.sequenceIndex);
        if (turn === 'skipped') {
            return {
                success: true
            };
        }
        if (turn === 'pending') {
            const retryDelay = SEQUENCE_WAIT_RETRY_MS;
            console.log(`[WORKER] 순서 대기 - ${retryDelay / 1000}초 뒤 재스케줄: ${data.sequenceId}#${data.sequenceIndex}`);
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["addTaskJob"])(data.accountId, {
                ...data,
                rescheduleToken: `seqwait_${Date.now().toString(36)}`
            }, retryDelay);
            return {
                success: false,
                error: '순서 대기 - 재스케줄됨',
                willRetry: true
            };
        }
    }
    const advanceIfNeeded = async ()=>{
        if (hasSequence) {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$sequence$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["advanceSequence"])(data.sequenceId);
        }
    };
    const rescheduleCurrentTurn = async (delayMs, retryCount = data._retryCount ?? 0)=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["addTaskJob"])(data.accountId, {
            ...data,
            _retryCount: retryCount + 1,
            rescheduleToken: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$task$2d$job$2d$harness$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createRescheduleToken"])()
        }, delayMs);
    };
    // articleId가 0이고 keyword가 있으면 DB에서 조회 (viral batch)
    let articleId = data.articleId;
    if (articleId === 0 && data.keyword) {
        const keyword = data.keyword.trim();
        console.log(`[WORKER] 글 조회 시도: cafeId=${data.cafeId}, keyword="${keyword}"`);
        const foundId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$published$2d$article$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getArticleIdByKeyword"])(data.cafeId, keyword);
        if (!foundId) {
            const retryCount = data._retryCount ?? 0;
            if (retryCount >= MAX_TRANSIENT_RETRY) {
                console.error(`[WORKER] 글 조회 실패 (최대 재시도 초과): ${keyword}`);
                await advanceIfNeeded();
                return {
                    success: false,
                    error: '글 조회 실패 - 최대 재시도 초과'
                };
            }
            console.log(`[WORKER] 글 미발행 - 2분 뒤 현재 순서 재시도 (${retryCount + 1}/${MAX_TRANSIENT_RETRY}): ${keyword}`);
            await rescheduleCurrentTurn(ARTICLE_LOOKUP_RETRY_MS, retryCount);
            return {
                success: false,
                error: '글 미발행 - 재스케줄됨',
                willRetry: true
            };
        }
        articleId = foundId;
        console.log(`[WORKER] 글 조회 성공: articleId=${articleId}`);
    }
    if (articleId === 0) {
        console.error(`[WORKER] articleId가 0 - keyword 없음, 댓글 스킵`);
        await advanceIfNeeded();
        return {
            success: false,
            error: 'articleId가 0이고 keyword도 없음'
        };
    }
    // 중복 체크: 이미 이 계정으로 댓글 달았으면 스킵
    const alreadyCommented = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$published$2d$article$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasCommented"])(data.cafeId, articleId, account.id, 'comment');
    if (alreadyCommented) {
        console.log(`[WORKER] 중복 댓글 스킵: ${account.id} → #${articleId}`);
        await advanceIfNeeded();
        return {
            success: true
        };
    }
    // Redis 락: 동일 댓글 동시 실행 방지 (stalled job 재실행 / retry 중복 차단)
    const lockAcquired = await acquireWriteLock(data.cafeId, articleId, account.id, data.content);
    if (!lockAcquired) {
        const retryCount = data._retryCount ?? 0;
        console.log(`[WORKER] 댓글 작성 락 중복 - 재시도 예정: ${account.id} → #${articleId}`);
        if (retryCount >= MAX_TRANSIENT_RETRY) {
            await advanceIfNeeded();
            return {
                success: false,
                error: '댓글 작성 락 중복 - 재시도 초과'
            };
        }
        await rescheduleCurrentTurn(WRITE_LOCK_RETRY_MS, retryCount);
        return {
            success: false,
            error: '댓글 작성 락 중복 - BullMQ retry 대기'
        };
    }
    log.info('댓글 작성 시도', {
        accountId: account.id,
        articleId,
        cafeId: data.cafeId,
        keyword: data.keyword
    });
    const result = await Promise.race([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$comment$2d$writer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["writeCommentWithAccount"])(account, data.cafeId, articleId, data.content),
        new Promise((_, reject)=>setTimeout(()=>reject(new Error('타임아웃')), settings.timeout))
    ]);
    // ARTICLE_NOT_READY 에러: 5분 뒤 재시도 (시퀀스 없이)
    if (!result.success && result.error?.startsWith('ARTICLE_NOT_READY:')) {
        const retryCount = data._retryCount ?? 0;
        if (retryCount >= MAX_TRANSIENT_RETRY) {
            log.warn('글 미준비 재시도 초과 — 현재 순서 포기', {
                accountId: account.id,
                articleId,
                error: result.error
            });
            await advanceIfNeeded();
            return {
                success: false,
                error: result.error
            };
        }
        log.warn('글 미준비 — 5분 뒤 재시도', {
            accountId: account.id,
            articleId,
            error: result.error
        });
        await rescheduleCurrentTurn(ARTICLE_NOT_READY_RETRY_MS, retryCount);
        return {
            success: false,
            error: result.error,
            willRetry: true
        };
    }
    if (!result.success) {
        const retryCount = data._retryCount ?? 0;
        log.error('댓글 작성 실패 — 1분 뒤 재시도', {
            accountId: account.id,
            articleId,
            error: result.error
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["invalidateLoginCache"])(account.id);
        if (retryCount >= MAX_TRANSIENT_RETRY) {
            await advanceIfNeeded();
            return {
                success: false,
                error: result.error || '댓글 작성 실패'
            };
        }
        await rescheduleCurrentTurn(WRITE_FAIL_RETRY_MS, retryCount);
        return {
            success: false,
            error: result.error || '댓글 작성 실패',
            willRetry: true
        };
    }
    log.info('댓글 작성 성공', {
        accountId: account.id,
        articleId,
        commentId: result.commentId
    });
    // DB에 댓글 기록 저장
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$published$2d$article$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["addCommentToArticle"])(data.cafeId, articleId, {
            accountId: account.id,
            nickname: account.nickname || account.id,
            content: data.content,
            type: 'comment',
            commentId: result.commentId,
            commentIndex: data.commentIndex,
            sequenceId: data.sequenceId
        });
    } catch (dbErr) {
        log.error('댓글 DB 저장 실패', {
            accountId: account.id,
            articleId,
            error: String(dbErr)
        });
    }
    await advanceIfNeeded();
    return {
        success: true
    };
};
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/shared/lib/queue/handlers/reply-handler.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "handleReplyJob",
    ()=>handleReplyJob
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/lib/queue/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$task$2d$job$2d$harness$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/queue/task-job-harness.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$sequence$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/lib/queue/sequence.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/lib/naver-cafe-writing/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$comment$2d$writer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/naver-cafe-writing/comment-writer.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/models/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$published$2d$article$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/published-article.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/multi-session.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$redis$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/redis.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$logger$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/logger/index.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$comment$2d$writer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$comment$2d$writer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
;
const log = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$logger$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createLogger"])('REPLY');
const WRITE_LOCK_TTL = 600;
const SEQUENCE_WAIT_RETRY_MS = 10 * 1000;
const ARTICLE_NOT_READY_RETRY_MS = 5 * 60 * 1000;
const WRITE_FAIL_RETRY_MS = 60 * 1000;
const MAX_ARTICLE_RETRY = 3;
const MAX_WRITE_RETRY = 3;
const CONTENT_PREVIEW_LENGTH = 30;
const PARENT_MATCH_PREVIEW_LENGTH = 40;
const acquireWriteLock = async (cafeId, articleId, accountId, content)=>{
    const redis = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$redis$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRedisConnection"])();
    const contentKey = content.slice(0, CONTENT_PREVIEW_LENGTH).replace(/\s+/g, '');
    const lockKey = `write_lock:reply:${cafeId}:${articleId}:${accountId}:${contentKey}`;
    const result = await redis.set(lockKey, '1', 'EX', WRITE_LOCK_TTL, 'NX');
    return result === 'OK';
};
const normalizeText = (value)=>(value ?? '').replace(/\s+/g, ' ').trim();
const findParentCommentId = async (data, articleId)=>{
    const comments = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$published$2d$article$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getArticleComments"])(data.cafeId, articleId);
    const mainComments = comments.filter((c)=>c.type === 'comment');
    // 1차: sequenceId + commentIndex 매칭
    if (data.sequenceId && data.commentIndex !== undefined) {
        const match = mainComments.find((c)=>c.sequenceId === data.sequenceId && c.commentIndex === data.commentIndex);
        if (match?.commentId) return match.commentId;
    }
    // 2차: commentIndex만으로 매칭
    if (data.commentIndex !== undefined) {
        const match = mainComments.find((c)=>c.commentIndex === data.commentIndex);
        if (match?.commentId) return match.commentId;
    }
    // 3차: 내용 + 닉네임 텍스트 매칭
    if (data.parentComment) {
        const targetPreview = normalizeText(data.parentComment).slice(0, PARENT_MATCH_PREVIEW_LENGTH);
        const targetNickname = normalizeText(data.parentNickname);
        const match = mainComments.find((c)=>{
            const contentMatch = normalizeText(c.content).includes(targetPreview);
            const nicknameMatch = targetNickname ? normalizeText(c.nickname) === targetNickname : true;
            return contentMatch && nicknameMatch;
        });
        if (match?.commentId) return match.commentId;
    }
    return undefined;
};
const handleReplyJob = async (data, ctx)=>{
    const { account, settings } = ctx;
    const hasSequence = Boolean(data.sequenceId && data.sequenceIndex !== undefined);
    if (hasSequence) {
        const turn = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$sequence$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["waitForSequenceTurn"])(data.sequenceId, data.sequenceIndex);
        if (turn === 'skipped') return {
            success: true
        };
        if (turn === 'pending') {
            log.info('순서 대기 — 재스케줄', {
                sequenceId: data.sequenceId,
                index: data.sequenceIndex
            });
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["addTaskJob"])(data.accountId, {
                ...data,
                rescheduleToken: `seqwait_${Date.now().toString(36)}`
            }, SEQUENCE_WAIT_RETRY_MS);
            return {
                success: false,
                error: '순서 대기 - 재스케줄됨',
                willRetry: true
            };
        }
    }
    const advanceIfNeeded = async ()=>{
        if (hasSequence) await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$sequence$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["advanceSequence"])(data.sequenceId);
    };
    const rescheduleCurrentTurn = async (delayMs, retryCount = data._retryCount ?? 0)=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["addTaskJob"])(data.accountId, {
            ...data,
            _retryCount: retryCount + 1,
            rescheduleToken: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$task$2d$job$2d$harness$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createRescheduleToken"])()
        }, delayMs);
    };
    // articleId 해소
    let articleId = data.articleId;
    if (articleId === 0 && !data.keyword) {
        log.warn('articleId=0 + keyword 없음 — 스킵', {
            accountId: account.id
        });
        await advanceIfNeeded();
        return {
            success: false,
            error: 'articleId=0 + keyword 없음'
        };
    }
    if (articleId === 0 && data.keyword) {
        const retryCount = data._retryCount;
        if (retryCount && retryCount >= MAX_ARTICLE_RETRY) {
            log.warn('글 미발행 재시도 초과 — 포기', {
                accountId: account.id,
                keyword: data.keyword
            });
            await advanceIfNeeded();
            return {
                success: false,
                error: `글 미발행 재시도 ${MAX_ARTICLE_RETRY}회 초과`
            };
        }
        const foundId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$published$2d$article$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getArticleIdByKeyword"])(data.cafeId, data.keyword);
        if (!foundId) {
            log.info('글 미발행 — 재시도 예약', {
                keyword: data.keyword,
                retry: (retryCount || 0) + 1
            });
            await rescheduleCurrentTurn(ARTICLE_NOT_READY_RETRY_MS, retryCount || 0);
            return {
                success: false,
                error: '글 미발행 - 재스케줄됨',
                willRetry: true
            };
        }
        articleId = foundId;
    }
    // 부모 댓글 ID 조회
    let { parentCommentId } = data;
    if (!parentCommentId) {
        try {
            parentCommentId = await findParentCommentId(data, articleId);
        } catch (error) {
            log.error('부모 댓글 ID 조회 실패', {
                accountId: account.id,
                articleId,
                error: String(error)
            });
        }
    }
    // 쓰기 락
    const lockAcquired = await acquireWriteLock(data.cafeId, articleId, account.id, data.content);
    if (!lockAcquired) {
        const retryCount = data._retryCount ?? 0;
        log.info('대댓글 작성 락 중복', {
            accountId: account.id,
            articleId
        });
        if (retryCount >= MAX_WRITE_RETRY) {
            await advanceIfNeeded();
            return {
                success: false,
                error: '대댓글 작성 락 중복 - 재시도 초과'
            };
        }
        await rescheduleCurrentTurn(WRITE_FAIL_RETRY_MS, retryCount);
        return {
            success: false,
            error: '대댓글 작성 락 중복 - BullMQ retry 대기'
        };
    }
    log.info('대댓글 작성 시도', {
        accountId: account.id,
        articleId,
        cafeId: data.cafeId,
        commentIndex: data.commentIndex
    });
    const result = await Promise.race([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$comment$2d$writer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["writeReplyWithAccount"])(account, data.cafeId, articleId, data.content, data.commentIndex, {
            parentCommentId,
            parentComment: data.parentComment,
            parentNickname: data.parentNickname
        }),
        new Promise((_, reject)=>setTimeout(()=>reject(new Error('타임아웃')), settings.timeout))
    ]);
    // 실패 처리
    if (!result.success) {
        const isArticleNotReady = result.error?.startsWith('ARTICLE_NOT_READY:');
        const retryDelay = isArticleNotReady ? ARTICLE_NOT_READY_RETRY_MS : WRITE_FAIL_RETRY_MS;
        const level = isArticleNotReady ? 'warn' : 'error';
        const retryCount = data._retryCount ?? 0;
        log[level]('대댓글 작성 실패 — 재시도', {
            accountId: account.id,
            articleId,
            error: result.error,
            delayMs: retryDelay
        });
        if (!isArticleNotReady) (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["invalidateLoginCache"])(account.id);
        if (retryCount >= MAX_WRITE_RETRY) {
            await advanceIfNeeded();
            return {
                success: false,
                error: result.error || '대댓글 작성 실패'
            };
        }
        await rescheduleCurrentTurn(retryDelay, retryCount);
        return {
            success: false,
            error: result.error || '대댓글 작성 실패',
            willRetry: true
        };
    }
    log.info('대댓글 작성 성공', {
        accountId: account.id,
        articleId,
        commentIndex: data.commentIndex
    });
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$published$2d$article$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["addCommentToArticle"])(data.cafeId, articleId, {
            accountId: account.id,
            nickname: account.nickname || account.id,
            content: data.content,
            type: 'reply',
            parentIndex: data.commentIndex
        });
    } catch (dbErr) {
        log.error('대댓글 DB 저장 실패', {
            accountId: account.id,
            articleId,
            error: String(dbErr)
        });
    }
    await advanceIfNeeded();
    return {
        success: true
    };
};
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/shared/lib/queue/handlers/like-handler.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "handleLikeJob",
    ()=>handleLikeJob
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/lib/naver-cafe-writing/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$like$2d$writer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/naver-cafe-writing/like-writer.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$like$2d$writer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$like$2d$writer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
const handleLikeJob = async (data, ctx)=>{
    const { account, settings } = ctx;
    const result = await Promise.race([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$like$2d$writer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["likeArticleWithAccount"])(account, data.cafeId, data.articleId),
        new Promise((_, reject)=>setTimeout(()=>reject(new Error('타임아웃')), settings.timeout))
    ]);
    // ARTICLE_NOT_READY: 5분 뒤 재시도 없이 실패 처리 (좋아요는 부가적 작업)
    if (!result.success && result.error?.startsWith('ARTICLE_NOT_READY:')) {
        console.log(`[WORKER] 좋아요 실패 (글 미준비): ${data.articleId}`);
        return {
            success: false,
            error: result.error
        };
    }
    if (!result.success) {
        throw new Error(result.error || '좋아요 실패');
    }
    return {
        success: true
    };
};
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/shared/lib/queue/handlers/disable-comment-handler.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "handleDisableCommentJob",
    ()=>handleDisableCommentJob
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/multi-session.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
const handleDisableCommentJob = async (data, ctx)=>{
    const { account } = ctx;
    const { cafeId, articleId } = data;
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["acquireAccountLock"])(account.id);
    try {
        const loggedIn = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isAccountLoggedIn"])(account.id);
        if (!loggedIn) {
            const r = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["loginAccount"])(account.id, account.password);
            if (!r.success) {
                return {
                    success: false,
                    error: `로그인 실패: ${r.error}`
                };
            }
        }
        const page = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPageForAccount"])(account.id);
        const modifyUrl = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}/modify`;
        await page.goto(modifyUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });
        try {
            await page.waitForSelector('#coment', {
                timeout: 15000
            });
        } catch  {
            await page.waitForTimeout(5000);
        }
        await page.waitForTimeout(2000);
        const cb = await page.$('#coment');
        if (!cb) {
            return {
                success: false,
                error: '댓글 체크박스 없음'
            };
        }
        const isChecked = await cb.evaluate((el)=>el.checked);
        if (!isChecked) {
            console.log(`[DISABLE-COMMENT] #${articleId} 이미 차단 상태`);
            return {
                success: true,
                articleId
            };
        }
        const label = await page.$('label[for="coment"]');
        if (label) await label.click();
        else await cb.click();
        await page.waitForTimeout(500);
        const submitBtn = await page.$('a.BaseButton--skinGreen, a.BaseButton');
        if (!submitBtn) {
            return {
                success: false,
                error: '수정 버튼 없음'
            };
        }
        await submitBtn.click();
        try {
            await page.waitForURL(/articles\/\d+/, {
                timeout: 10000
            });
        } catch  {
            await page.waitForTimeout(3000);
        }
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["saveCookiesForAccount"])(account.id);
        console.log(`[DISABLE-COMMENT] #${articleId} 댓글 차단 완료`);
        return {
            success: true,
            articleId
        };
    } catch (error) {
        const msg = error instanceof Error ? error.message : '알 수 없는 오류';
        return {
            success: false,
            error: msg
        };
    } finally{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["releaseAccountLock"])(account.id);
    }
};
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/shared/lib/queue/workers.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "closeAllWorkers",
    ()=>closeAllWorkers,
    "createGenerateWorker",
    ()=>createGenerateWorker,
    "createTaskWorker",
    ()=>createTaskWorker,
    "processTaskJob",
    ()=>processTaskJob,
    "startAllTaskWorkers",
    ()=>startAllTaskWorkers
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bullmq$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/bullmq/dist/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bullmq$2f$dist$2f$esm$2f$classes$2f$worker$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bullmq/dist/esm/classes/worker.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$redis$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/redis.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$types$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/queue/types.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/lib/queue/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$task$2d$job$2d$harness$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/queue/task-job-harness.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$accounts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/config/accounts.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$account$2d$manager$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/account-manager.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/multi-session.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$queue$2d$settings$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/queue-settings.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$handlers$2f$post$2d$handler$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/queue/handlers/post-handler.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$handlers$2f$comment$2d$handler$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/queue/handlers/comment-handler.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$handlers$2f$reply$2d$handler$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/queue/handlers/reply-handler.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$handlers$2f$like$2d$handler$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/queue/handlers/like-handler.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$handlers$2f$disable$2d$comment$2d$handler$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/queue/handlers/disable-comment-handler.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$handlers$2f$post$2d$handler$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$handlers$2f$comment$2d$handler$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$handlers$2f$reply$2d$handler$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$handlers$2f$like$2d$handler$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$handlers$2f$disable$2d$comment$2d$handler$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$handlers$2f$post$2d$handler$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$handlers$2f$comment$2d$handler$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$handlers$2f$reply$2d$handler$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$handlers$2f$like$2d$handler$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$handlers$2f$disable$2d$comment$2d$handler$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
;
;
;
;
;
;
;
let taskWorker = globalThis.__taskWorker ?? null;
let generateWorker = globalThis.__generateWorker ?? null;
const WORKER_LOCK_DURATION = 10 * 60 * 1000;
const WORKER_LOCK_RENEW_TIME = 30 * 1000;
const WORKER_STALLED_INTERVAL = 2 * 60 * 1000;
const WORKER_MAX_STALLED_COUNT = 3;
const TASK_WORKER_CONCURRENCY = Math.max(1, Number(process.env.TASK_WORKER_CONCURRENCY || '1'));
const syncAccountSessionReservation = async (accountId)=>{
    const { waiting, delayed = 0, active } = await __turbopack_context__.A("[project]/src/shared/lib/queue/index.ts [app-rsc] (ecmascript, async loader)").then(({ getQueueStatus })=>getQueueStatus(accountId));
    if (waiting + delayed + active > 0) {
        console.log(`[SESSION] ${accountId} 예약 세션 유지 (waiting=${waiting}, delayed=${delayed}, active=${active})`);
        return;
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["saveCookiesForAccount"])(accountId);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["releaseAccountSession"])(accountId);
};
const processTaskJob = async (job)=>{
    const { data } = job;
    const settings = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$queue$2d$settings$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getQueueSettings"])();
    console.log(`[WORKER] 처리 시작: ${data.type} (${data.accountId})`);
    let accounts = [];
    let account;
    if (data.userId) {
        accounts = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$accounts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getAllAccounts"])(data.userId);
        account = accounts.find((a)=>a.id === data.accountId);
    }
    if (!account) {
        account = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$accounts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getAccountById"])(data.accountId) ?? undefined;
        if (account) {
            accounts = [
                account,
                ...accounts.filter((a)=>a.id !== account?.id)
            ];
        }
    }
    if (!account) {
        return {
            success: false,
            error: `계정 없음: ${data.accountId}`
        };
    }
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$account$2d$manager$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isAccountActive"])(account)) {
        const nextActiveDelay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$account$2d$manager$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getNextActiveTime"])(account);
        console.log(`[WORKER] 비활동 시간 - ${Math.round(nextActiveDelay / 60000)}분 뒤 재스케줄: ${data.accountId}`);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["addTaskJob"])(data.accountId, {
            ...data,
            rescheduleToken: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$task$2d$job$2d$harness$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createRescheduleToken"])()
        }, nextActiveDelay);
        return {
            success: false,
            error: '비활동 시간대 - 재스케줄됨',
            willRetry: true
        };
    }
    const loggedIn = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isAccountLoggedIn"])(account.id);
    if (!loggedIn) {
        console.log(`[WORKER] 로그인 필요 — 로그인 시도: ${account.id}`);
        const loginResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["loginAccount"])(account.id, account.password);
        if (!loginResult.success) {
            throw new Error(`로그인 실패: ${loginResult.error}`);
        }
        console.log(`[WORKER] 로그인 완료: ${account.id}`);
    }
    switch(data.type){
        case 'post':
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$handlers$2f$post$2d$handler$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["handlePostJob"])(data, {
                account,
                accounts,
                settings
            });
        case 'comment':
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$handlers$2f$comment$2d$handler$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["handleCommentJob"])(data, {
                account,
                settings
            });
        case 'reply':
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$handlers$2f$reply$2d$handler$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["handleReplyJob"])(data, {
                account,
                settings
            });
        case 'like':
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$handlers$2f$like$2d$handler$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["handleLikeJob"])(data, {
                account,
                settings
            });
        case 'disable-comment':
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$handlers$2f$disable$2d$comment$2d$handler$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["handleDisableCommentJob"])(data, {
                account
            });
        default:
            throw new Error('알 수 없는 작업 타입');
    }
};
const createTaskWorker = ()=>{
    const queueName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$types$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getTaskQueueName"])();
    if (taskWorker) {
        return taskWorker;
    }
    const worker = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bullmq$2f$dist$2f$esm$2f$classes$2f$worker$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Worker"](queueName, processTaskJob, {
        connection: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$redis$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRedisConnection"])(),
        concurrency: TASK_WORKER_CONCURRENCY,
        lockDuration: WORKER_LOCK_DURATION,
        lockRenewTime: WORKER_LOCK_RENEW_TIME,
        stalledInterval: WORKER_STALLED_INTERVAL,
        maxStalledCount: WORKER_MAX_STALLED_COUNT
    });
    worker.on('completed', (job, result)=>{
        console.log(`[WORKER] 완료: ${job.name} (${job.data.accountId})`, result.success ? '성공' : '실패');
        syncAccountSessionReservation(job.data.accountId).catch((e)=>console.error(`[WORKER] 세션 동기화 에러 (완료): ${job.data.accountId}`, e));
    });
    worker.on('failed', (job, err)=>{
        const accountId = job?.data.accountId ?? 'unknown';
        console.error(`[WORKER] 실패: ${job?.name} (${accountId})`, err.message);
        syncAccountSessionReservation(accountId).catch((e)=>console.error(`[WORKER] 세션 동기화 에러 (실패): ${accountId}`, e));
    });
    taskWorker = worker;
    globalThis.__taskWorker = worker;
    console.log(`[WORKER] 글로벌 Task 워커 생성: ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$types$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["TASK_QUEUE_NAME"]} (concurrency=${TASK_WORKER_CONCURRENCY})`);
    return worker;
};
const createGenerateWorker = (processGenerate)=>{
    if (generateWorker) {
        return generateWorker;
    }
    generateWorker = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bullmq$2f$dist$2f$esm$2f$classes$2f$worker$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Worker"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$types$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["GENERATE_QUEUE_NAME"], processGenerate, {
        connection: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$redis$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRedisConnection"])(),
        concurrency: 3,
        lockDuration: WORKER_LOCK_DURATION,
        lockRenewTime: WORKER_LOCK_RENEW_TIME,
        stalledInterval: WORKER_STALLED_INTERVAL,
        maxStalledCount: WORKER_MAX_STALLED_COUNT
    });
    globalThis.__generateWorker = generateWorker;
    generateWorker.on('completed', (job, result)=>{
        console.log(`[WORKER] Generate 완료: ${job.data.keyword}`, result.success ? '성공' : '실패');
    });
    generateWorker.on('failed', (job, err)=>{
        console.error(`[WORKER] Generate 실패: ${job?.data.keyword}`, err.message);
    });
    console.log('[WORKER] Generate 워커 생성');
    return generateWorker;
};
const closeAllWorkers = async ()=>{
    if (taskWorker) {
        await taskWorker.close();
        taskWorker = null;
        globalThis.__taskWorker = null;
        console.log('[WORKER] 글로벌 Task 워커 종료');
    }
    if (generateWorker) {
        await generateWorker.close();
        generateWorker = null;
        globalThis.__generateWorker = null;
        console.log('[WORKER] Generate 워커 종료');
    }
};
const startAllTaskWorkers = async ()=>{
    const accounts = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$accounts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getAllAccounts"])();
    createTaskWorker();
    console.log(`[WORKER] 글로벌 워커 시작됨 (${accounts.length}개 계정 대상)`);
};
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/shared/lib/queue/index.ts [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "addGenerateJob",
    ()=>addGenerateJob,
    "addTaskJob",
    ()=>addTaskJob,
    "closeAllQueues",
    ()=>closeAllQueues,
    "getActiveQueueIds",
    ()=>getActiveQueueIds,
    "getGenerateQueue",
    ()=>getGenerateQueue,
    "getQueueStatus",
    ()=>getQueueStatus,
    "getTaskQueue",
    ()=>getTaskQueue
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bullmq$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/bullmq/dist/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bullmq$2f$dist$2f$esm$2f$classes$2f$queue$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bullmq/dist/esm/classes/queue.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$redis$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/redis.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$types$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/queue/types.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$queue$2d$settings$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/queue-settings.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$task$2d$job$2d$harness$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/queue/task-job-harness.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$workers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/queue/workers.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$workers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$workers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
let taskQueue = null;
let generateQueue = null;
const getTaskQueue = (accountId)=>{
    void accountId;
    const queueName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$types$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getTaskQueueName"])();
    if (!taskQueue) {
        taskQueue = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bullmq$2f$dist$2f$esm$2f$classes$2f$queue$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Queue"](queueName, {
            connection: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$redis$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRedisConnection"])(),
            defaultJobOptions: {
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: 5000
                },
                removeOnComplete: 100,
                removeOnFail: 50
            }
        });
        console.log(`[QUEUE] 글로벌 Task 큐 생성: ${queueName}`);
    }
    return taskQueue;
};
const getGenerateQueue = ()=>{
    if (!generateQueue) {
        generateQueue = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bullmq$2f$dist$2f$esm$2f$classes$2f$queue$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Queue"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$types$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["GENERATE_QUEUE_NAME"], {
            connection: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$redis$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRedisConnection"])(),
            defaultJobOptions: {
                attempts: 2,
                backoff: {
                    type: 'fixed',
                    delay: 3000
                },
                removeOnComplete: 100,
                removeOnFail: 50
            }
        });
        console.log(`[QUEUE] Generate 큐 생성`);
    }
    return generateQueue;
};
const addTaskJob = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$task$2d$job$2d$harness$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createAddTaskJob"])({
    getQueueSettings: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$queue$2d$settings$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getQueueSettings"],
    getRandomDelay: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$queue$2d$settings$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRandomDelay"],
    getTaskQueue,
    log: (message)=>console.log(message)
});
const addGenerateJob = async (data)=>{
    const queue = getGenerateQueue();
    const job = await queue.add('generate', data, {
        jobId: `generate_${data.keyword}_${Date.now()}`
    });
    console.log(`[QUEUE] Generate Job 추가: ${data.keyword}`);
    return job;
};
const closeAllQueues = async ()=>{
    if (taskQueue) {
        await taskQueue.close();
        taskQueue = null;
        console.log(`[QUEUE] 글로벌 Task 큐 종료`);
    }
    if (generateQueue) {
        await generateQueue.close();
        generateQueue = null;
        console.log(`[QUEUE] Generate 큐 종료`);
    }
};
const getQueueStatus = async (accountId)=>{
    const queue = getTaskQueue(accountId);
    const [waitingJobs, activeJobs, completedJobs, failedJobs, delayedJobs] = await Promise.all([
        queue.getWaiting(0, 10000),
        queue.getActive(0, 10000),
        queue.getCompleted(0, 10000),
        queue.getFailed(0, 10000),
        queue.getDelayed(0, 10000)
    ]);
    const countByAccount = (jobs)=>jobs.filter((job)=>job.data.accountId === accountId).length;
    return {
        waiting: countByAccount(waitingJobs),
        active: countByAccount(activeJobs),
        completed: countByAccount(completedJobs),
        failed: countByAccount(failedJobs),
        delayed: countByAccount(delayedJobs)
    };
};
const getActiveQueueIds = ()=>{
    return taskQueue ? [
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$types$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getTaskQueueName"])()
    ] : [];
};
;
;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/features/manual-post/manual-publish-job.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

/* __next_internal_action_entry_do_not_use__ [{"60c300f20129bc5fd4bedd69e374c9fcfdafb3ef47":"runManualPublish"},"",""] */ __turbopack_context__.s([
    "runManualPublish",
    ()=>runManualPublish
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$accounts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/config/accounts.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$cafe$2d$account$2d$policy$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/config/cafe-account-policy.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$cafes$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/config/cafes.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/mongodb.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$queue$2d$settings$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/queue-settings.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$account$2d$manager$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/account-manager.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/lib/queue/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$workers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/queue/workers.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$workers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$workers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
;
;
const runManualPublish = async (input, onProgress)=>{
    const { manuscripts, cafeId: inputCafeId, postOptions } = input;
    console.log('[MANUAL] runManualPublish 시작');
    console.log('[MANUAL] 원고 수:', manuscripts.length);
    const accounts = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$accounts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getAllAccounts"])();
    if (accounts.length === 0) {
        return {
            success: false,
            totalManuscripts: manuscripts.length,
            completed: 0,
            failed: manuscripts.length,
            results: manuscripts.map((m)=>({
                    folderName: m.folderName,
                    title: m.title,
                    success: false,
                    error: '등록된 계정 없음'
                }))
        };
    }
    const cafe = inputCafeId ? await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$cafes$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCafeById"])(inputCafeId) : await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$cafes$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getDefaultCafe"])();
    if (!cafe) {
        return {
            success: false,
            totalManuscripts: manuscripts.length,
            completed: 0,
            failed: manuscripts.length,
            results: manuscripts.map((m)=>({
                    folderName: m.folderName,
                    title: m.title,
                    success: false,
                    error: '카페 정보 없음'
                }))
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
    const settings = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$queue$2d$settings$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getQueueSettings"])();
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$workers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["startAllTaskWorkers"])();
    const writerAccounts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$cafe$2d$account$2d$policy$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCafeWriterAccounts"])(accounts, cafe.cafeId);
    if (writerAccounts.length === 0) {
        return {
            success: false,
            totalManuscripts: manuscripts.length,
            completed: 0,
            failed: manuscripts.length,
            results: manuscripts.map((m)=>({
                    folderName: m.folderName,
                    title: m.title,
                    success: false,
                    error: `글쓰기 가능한 계정 없음 (${cafe.name})`
                }))
        };
    }
    const results = [];
    let completed = 0;
    let failed = 0;
    let globalDelay = 0;
    let lastWriterId = null;
    for(let i = 0; i < manuscripts.length; i++){
        const manuscript = manuscripts[i];
        onProgress?.({
            currentKeyword: manuscript.title,
            keywordIndex: i,
            totalKeywords: manuscripts.length,
            phase: 'post',
            message: `[${i + 1}/${manuscripts.length}] ${manuscript.folderName} 발행 준비 중...`
        });
        try {
            const activeWriterAccounts = writerAccounts.filter((a)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$account$2d$manager$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isAccountActive"])(a));
            if (activeWriterAccounts.length === 0) {
                throw new Error('활동 가능한 계정 없음');
            }
            // 라운드 로빈 + 랜덤: 마지막 글쓴이 제외하고 선택
            let writerAccount;
            if (activeWriterAccounts.length === 1) {
                writerAccount = activeWriterAccounts[0];
            } else {
                const availableWriters = lastWriterId ? activeWriterAccounts.filter((a)=>a.id !== lastWriterId) : activeWriterAccounts;
                const baseIndex = i % availableWriters.length;
                const randomOffset = Math.floor(Math.random() * Math.min(2, availableWriters.length));
                const writerIndex = (baseIndex + randomOffset) % availableWriters.length;
                writerAccount = availableWriters[writerIndex];
            }
            lastWriterId = writerAccount.id;
            let menuId = cafe.menuId;
            if (manuscript.category && cafe.categoryMenuIds) {
                const mappedMenuId = cafe.categoryMenuIds[manuscript.category];
                if (mappedMenuId) {
                    menuId = mappedMenuId;
                }
            }
            const writerActivityDelay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$account$2d$manager$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getNextActiveTime"])(writerAccount);
            const postDelay = Math.max(globalDelay, writerActivityDelay);
            const postJobData = {
                type: 'post',
                accountId: writerAccount.id,
                cafeId: cafe.cafeId,
                menuId,
                subject: manuscript.title,
                content: manuscript.htmlContent,
                rawContent: manuscript.body,
                category: manuscript.category,
                keyword: manuscript.folderName,
                postOptions,
                skipComments: true,
                images: manuscript.images.length > 0 ? manuscript.images : undefined
            };
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["addTaskJob"])(writerAccount.id, postJobData, postDelay);
            console.log(`[MANUAL] 글 발행 Job 추가: ${manuscript.folderName}`);
            console.log(`[MANUAL]   - 제목: ${manuscript.title}`);
            console.log(`[MANUAL]   - 이미지: ${manuscript.images.length}장`);
            console.log(`[MANUAL]   - 딜레이: ${Math.round(postDelay / 1000)}초`);
            globalDelay = postDelay + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$queue$2d$settings$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRandomDelay"])(settings.delays.betweenPosts);
            results.push({
                folderName: manuscript.folderName,
                title: manuscript.title,
                success: true
            });
            completed++;
            onProgress?.({
                currentKeyword: manuscript.title,
                keywordIndex: i,
                totalKeywords: manuscripts.length,
                phase: 'waiting',
                message: `[${i + 1}/${manuscripts.length}] ${manuscript.folderName} Job 추가 완료`
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            console.error(`[MANUAL] ${manuscript.folderName} 처리 실패:`, errorMessage);
            results.push({
                folderName: manuscript.folderName,
                title: manuscript.title,
                success: false,
                error: errorMessage
            });
            failed++;
        }
    }
    return {
        success: failed === 0,
        totalManuscripts: manuscripts.length,
        completed,
        failed,
        results
    };
};
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    runManualPublish
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(runManualPublish, "60c300f20129bc5fd4bedd69e374c9fcfdafb3ef47", null);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/features/manual-post/manual-modify-job.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

/* __next_internal_action_entry_do_not_use__ [{"70322369c3e4d16dccdf8534b3307aa5773b9f9140":"runManualModify"},"",""] */ __turbopack_context__.s([
    "runManualModify",
    ()=>runManualModify
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/multi-session.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$accounts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/config/accounts.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$cafes$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/config/cafes.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/mongodb.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/models/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$batch$2d$job$2d$log$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/batch-job-log.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$modified$2d$article$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/modified-article.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$published$2d$article$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/published-article.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/lib/naver-cafe-writing/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$modify$2d$query$2d$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/naver-cafe-writing/modify-query-utils.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$article$2d$modifier$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/naver-cafe-writing/article-modifier.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$article$2d$modifier$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$article$2d$modifier$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
;
;
;
const sleep = (ms)=>new Promise((resolve)=>setTimeout(resolve, ms));
const runManualModify = async (input, options = {}, onProgress)=>{
    const { manuscripts, cafeId: inputCafeId, daysLimit, sortOrder = 'oldest' } = input;
    const delayBetweenArticles = options.delayBetweenArticles ?? 30000;
    console.log('[MANUAL MODIFY] 시작');
    console.log('[MANUAL MODIFY] 원고 수:', manuscripts.length);
    if (manuscripts.length === 0) {
        return {
            success: false,
            totalManuscripts: 0,
            completed: 0,
            failed: 0,
            results: []
        };
    }
    const accounts = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$accounts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getAllAccounts"])();
    if (accounts.length === 0) {
        return {
            success: false,
            totalManuscripts: manuscripts.length,
            completed: 0,
            failed: manuscripts.length,
            results: manuscripts.map((m)=>({
                    folderName: m.folderName,
                    originalArticleId: 0,
                    newTitle: m.title,
                    success: false,
                    error: '등록된 계정 없음'
                }))
        };
    }
    const cafe = inputCafeId ? await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$cafes$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCafeById"])(inputCafeId) : await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$cafes$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getDefaultCafe"])();
    if (!cafe) {
        return {
            success: false,
            totalManuscripts: manuscripts.length,
            completed: 0,
            failed: manuscripts.length,
            results: manuscripts.map((m)=>({
                    folderName: m.folderName,
                    originalArticleId: 0,
                    newTitle: m.title,
                    success: false,
                    error: '카페 정보 없음'
                }))
        };
    }
    const { cafeId } = cafe;
    console.log(`[MANUAL MODIFY] 카페: ${cafe.name} (${cafeId})`);
    try {
        console.log('[MANUAL MODIFY] MongoDB 연결 시도...');
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
        if (__TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].connection.readyState !== 1) {
            console.log('[MANUAL MODIFY] MongoDB 연결 실패');
            return {
                success: false,
                totalManuscripts: manuscripts.length,
                completed: 0,
                failed: manuscripts.length,
                results: manuscripts.map((m)=>({
                        folderName: m.folderName,
                        originalArticleId: 0,
                        newTitle: m.title,
                        success: false,
                        error: 'MongoDB 연결 실패'
                    }))
            };
        }
        console.log('[MANUAL MODIFY] MongoDB 연결 성공');
    } catch (dbError) {
        console.error('[MANUAL MODIFY] MongoDB 연결 실패:', dbError);
        return {
            success: false,
            totalManuscripts: manuscripts.length,
            completed: 0,
            failed: manuscripts.length,
            results: manuscripts.map((m)=>({
                    folderName: m.folderName,
                    originalArticleId: 0,
                    newTitle: m.title,
                    success: false,
                    error: 'MongoDB 연결 실패'
                }))
        };
    }
    // 수정 대상 글 조회 (원고 개수만큼)
    const limit = manuscripts.length;
    const baseFilter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$modify$2d$query$2d$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["buildBaseFilter"])(cafeId, daysLimit);
    const articlesToModify = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$modify$2d$query$2d$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["fetchArticlesToModify"])(sortOrder, limit, baseFilter);
    if (articlesToModify.length === 0) {
        return {
            success: true,
            totalManuscripts: manuscripts.length,
            completed: 0,
            failed: 0,
            results: manuscripts.map((m)=>({
                    folderName: m.folderName,
                    originalArticleId: 0,
                    newTitle: m.title,
                    success: false,
                    error: '수정 가능한 발행원고 없음'
                }))
        };
    }
    // 실제 수정할 개수 (원고 수와 발행원고 수 중 작은 값)
    const actualCount = Math.min(manuscripts.length, articlesToModify.length);
    // 배치 작업 로그 생성
    const jobLog = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$batch$2d$job$2d$log$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["BatchJobLog"].create({
        jobType: 'modify',
        cafeId,
        keywords: manuscripts.slice(0, actualCount).map((m)=>m.folderName),
        totalKeywords: actualCount,
        results: [],
        status: 'running',
        startedAt: new Date()
    });
    const results = [];
    let completed = 0;
    let failed = 0;
    try {
        for(let i = 0; i < actualCount; i++){
            const manuscript = manuscripts[i];
            const article = articlesToModify[i];
            const { articleId, writerAccountId, commentCount, replyCount } = article;
            const writerAccount = accounts.find((a)=>a.id === writerAccountId);
            if (!writerAccount) {
                results.push({
                    folderName: manuscript.folderName,
                    originalArticleId: articleId,
                    newTitle: manuscript.title,
                    success: false,
                    error: `작성자 계정(${writerAccountId}) 없음`
                });
                failed++;
                jobLog.results.push({
                    keyword: manuscript.folderName,
                    articleId,
                    success: false,
                    commentCount,
                    replyCount,
                    error: `작성자 계정(${writerAccountId}) 없음`
                });
                await jobLog.save();
                continue;
            }
            try {
                onProgress?.({
                    currentKeyword: manuscript.title,
                    keywordIndex: i,
                    totalKeywords: actualCount,
                    phase: 'post',
                    message: `[${i + 1}/${actualCount}] "${manuscript.folderName}" - 수정 중...`
                });
                // 글 수정 (AI 생성 없이 원고 내용 그대로 사용)
                const modifyResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$writing$2f$article$2d$modifier$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["modifyArticleWithAccount"])(writerAccount, {
                    cafeId,
                    articleId,
                    newTitle: manuscript.title,
                    newContent: manuscript.htmlContent,
                    category: manuscript.category,
                    images: manuscript.images.length > 0 ? manuscript.images : undefined
                });
                if (!modifyResult.success) {
                    results.push({
                        folderName: manuscript.folderName,
                        originalArticleId: articleId,
                        newTitle: manuscript.title,
                        success: false,
                        error: modifyResult.error || '글 수정 실패'
                    });
                    failed++;
                    jobLog.results.push({
                        keyword: manuscript.folderName,
                        articleId,
                        success: false,
                        commentCount,
                        replyCount,
                        error: modifyResult.error || '글 수정 실패'
                    });
                    await jobLog.save();
                    continue;
                }
                // ModifiedArticle 저장
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$modified$2d$article$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ModifiedArticle"].create({
                    originalArticleId: article._id,
                    articleId,
                    cafeId,
                    keyword: manuscript.folderName,
                    newTitle: manuscript.title,
                    newContent: manuscript.htmlContent,
                    modifiedAt: new Date(),
                    modifiedBy: writerAccountId
                });
                // PublishedArticle 삭제
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$published$2d$article$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PublishedArticle"].deleteOne({
                    _id: article._id
                });
                results.push({
                    folderName: manuscript.folderName,
                    originalArticleId: articleId,
                    newTitle: manuscript.title,
                    success: true
                });
                completed++;
                jobLog.results.push({
                    keyword: manuscript.folderName,
                    articleId,
                    success: true,
                    commentCount,
                    replyCount
                });
                jobLog.completed = completed;
                await jobLog.save();
                console.log(`[MANUAL MODIFY] 수정 완료: ${manuscript.folderName} (articleId: ${articleId})`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
                results.push({
                    folderName: manuscript.folderName,
                    originalArticleId: articleId,
                    newTitle: manuscript.title,
                    success: false,
                    error: errorMessage
                });
                failed++;
                jobLog.results.push({
                    keyword: manuscript.folderName,
                    articleId,
                    success: false,
                    commentCount,
                    replyCount,
                    error: errorMessage
                });
                jobLog.failed = failed;
                await jobLog.save();
            }
            // 다음 글 전 대기
            if (i < actualCount - 1) {
                onProgress?.({
                    currentKeyword: manuscript.title,
                    keywordIndex: i,
                    totalKeywords: actualCount,
                    phase: 'waiting',
                    message: `다음 글 수정 전 대기 중... (${delayBetweenArticles / 1000}초)`
                });
                await sleep(delayBetweenArticles);
            }
        }
        jobLog.status = failed === 0 ? 'completed' : 'failed';
        jobLog.finishedAt = new Date();
        await jobLog.save();
        return {
            success: failed === 0,
            totalManuscripts: actualCount,
            completed,
            failed,
            results,
            jobLogId: jobLog._id.toString()
        };
    } catch  {
        jobLog.status = 'failed';
        jobLog.finishedAt = new Date();
        await jobLog.save();
        return {
            success: false,
            totalManuscripts: actualCount,
            completed,
            failed: actualCount - completed,
            results,
            jobLogId: jobLog._id.toString()
        };
    } finally{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["closeAllContexts"])();
    }
};
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    runManualModify
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(runManualModify, "70322369c3e4d16dccdf8534b3307aa5773b9f9140", null);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/features/manual-post/manual-actions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

/* __next_internal_action_entry_do_not_use__ [{"402e666dbb52813b850b5ce71fdfff645f884c3913":"runManualModifyAction","40d3bec0fced50d202d7a9856a430232a2ff5ae58f":"runManualPublishAction"},"",""] */ __turbopack_context__.s([
    "runManualModifyAction",
    ()=>runManualModifyAction,
    "runManualPublishAction",
    ()=>runManualPublishAction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$manual$2d$post$2f$manual$2d$publish$2d$job$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/manual-post/manual-publish-job.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$manual$2d$post$2f$manual$2d$modify$2d$job$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/manual-post/manual-modify-job.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$manual$2d$post$2f$manual$2d$publish$2d$job$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$manual$2d$post$2f$manual$2d$modify$2d$job$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$manual$2d$post$2f$manual$2d$publish$2d$job$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$manual$2d$post$2f$manual$2d$modify$2d$job$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
const runManualPublishAction = async (input)=>{
    return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$manual$2d$post$2f$manual$2d$publish$2d$job$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["runManualPublish"])(input);
};
const runManualModifyAction = async (input)=>{
    return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$manual$2d$post$2f$manual$2d$modify$2d$job$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["runManualModify"])(input);
};
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    runManualPublishAction,
    runManualModifyAction
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(runManualPublishAction, "40d3bec0fced50d202d7a9856a430232a2ff5ae58f", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(runManualModifyAction, "402e666dbb52813b850b5ce71fdfff645f884c3913", null);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/entities/cafe/api/index.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"00fcebe0d8b7ffd728da7115f7c761568114a4b2b3":"getCafesAction","4009a1e3dbf6091e134a941e0c8adcbfc1871364bc":"deleteCafeAction","40ed987cf3d3f3b7d4ca548f0dfd303323fdba6f9d":"addCafeAction","6019eac69fa3c97398d544c6be4f36c6a1efee3656":"updateCafeAction"},"",""] */ __turbopack_context__.s([
    "addCafeAction",
    ()=>addCafeAction,
    "deleteCafeAction",
    ()=>deleteCafeAction,
    "getCafesAction",
    ()=>getCafesAction,
    "updateCafeAction",
    ()=>updateCafeAction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/mongodb.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/models/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$cafe$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/cafe.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/config/user.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
const getCafesAction = async ()=>{
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
    } catch (err) {
        console.error('[CAFE-ACTION] connectDB 에러:', err);
        return [];
    }
    const userId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCurrentUserId"])();
    console.log('[CAFE-ACTION] getCafesAction 호출, userId:', userId);
    const dbCafes = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$cafe$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Cafe"].find({
        userId,
        isActive: true
    }).sort({
        isDefault: -1,
        createdAt: 1
    }).lean();
    console.log('[CAFE-ACTION] DB 카페 수:', dbCafes.length);
    return dbCafes.map((c)=>{
        const categoryMenuIds = c.categoryMenuIds instanceof Map ? Object.fromEntries(c.categoryMenuIds) : c.categoryMenuIds;
        const categoryAliases = c.categoryAliases instanceof Map ? Object.fromEntries(c.categoryAliases) : c.categoryAliases;
        return {
            cafeId: c.cafeId,
            cafeUrl: c.cafeUrl,
            menuId: c.menuId,
            name: c.name,
            categories: c.categories,
            categoryMenuIds,
            categoryAliases,
            isDefault: c.isDefault,
            fromConfig: false
        };
    });
};
const addCafeAction = async (input)=>{
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
    const userId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCurrentUserId"])();
    const existing = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$cafe$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Cafe"].findOne({
        userId,
        cafeId: input.cafeId
    });
    if (existing) {
        return {
            success: false,
            error: '이미 존재하는 카페입니다'
        };
    }
    if (input.isDefault) {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$cafe$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Cafe"].updateMany({
            userId
        }, {
            $set: {
                isDefault: false
            }
        });
    }
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$cafe$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Cafe"].create({
        userId,
        cafeId: input.cafeId,
        cafeUrl: input.cafeUrl,
        menuId: input.menuId,
        name: input.name,
        categories: input.categories ?? [],
        categoryMenuIds: input.categoryMenuIds,
        categoryAliases: input.categoryAliases,
        isDefault: input.isDefault ?? false
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/accounts');
    return {
        success: true
    };
};
const updateCafeAction = async (cafeId, input)=>{
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
    const userId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCurrentUserId"])();
    if (input.isDefault) {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$cafe$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Cafe"].updateMany({
            userId
        }, {
            $set: {
                isDefault: false
            }
        });
    }
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$cafe$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Cafe"].findOneAndUpdate({
        userId,
        cafeId
    }, {
        $set: input
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/accounts');
    return {
        success: true
    };
};
const deleteCafeAction = async (cafeId)=>{
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
    const userId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCurrentUserId"])();
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$cafe$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Cafe"].findOneAndUpdate({
        userId,
        cafeId
    }, {
        $set: {
            isActive: false
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/accounts');
    return {
        success: true
    };
};
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    getCafesAction,
    addCafeAction,
    updateCafeAction,
    deleteCafeAction
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getCafesAction, "00fcebe0d8b7ffd728da7115f7c761568114a4b2b3", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(addCafeAction, "40ed987cf3d3f3b7d4ca548f0dfd303323fdba6f9d", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateCafeAction, "6019eac69fa3c97398d544c6be4f36c6a1efee3656", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(deleteCafeAction, "4009a1e3dbf6091e134a941e0c8adcbfc1871364bc", null);
}),
"[project]/src/entities/account/api/index.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"0008b6ff334c2072c6e4f6eab76e5c765bc6e7a5a3":"getAccountsAction","40112886834403b0d60339316abc3811a0e1c28215":"addAccountAction","40f13d619b94d316db07baca3ebbec099a328eccec":"deleteAccountAction","60ac46c34504d930dd29493dcba1f6ab19c19486f6":"updateAccountAction"},"",""] */ __turbopack_context__.s([
    "addAccountAction",
    ()=>addAccountAction,
    "deleteAccountAction",
    ()=>deleteAccountAction,
    "getAccountsAction",
    ()=>getAccountsAction,
    "updateAccountAction",
    ()=>updateAccountAction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/mongodb.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/models/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$account$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/account.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/config/user.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
const getAccountsAction = async ()=>{
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
    const userId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCurrentUserId"])();
    console.log('[ACCOUNT-ACTION] getAccountsAction 호출, userId:', userId);
    const dbAccounts = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$account$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Account"].find({
        userId,
        isActive: true
    }).sort({
        isMain: -1,
        createdAt: 1
    }).lean();
    console.log('[ACCOUNT-ACTION] DB 계정 수:', dbAccounts.length);
    return dbAccounts.map((a)=>({
            id: a.accountId,
            hasPassword: !!a.password,
            nickname: a.nickname,
            isMain: a.isMain,
            activityHours: a.activityHours,
            restDays: a.restDays,
            dailyPostLimit: a.dailyPostLimit,
            personaId: a.personaId,
            campaignTag: a.campaignTag,
            excludeFromAutoComment: a.excludeFromAutoComment,
            fromConfig: false
        }));
};
const addAccountAction = async (input)=>{
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
    const userId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCurrentUserId"])();
    const existing = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$account$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Account"].findOne({
        userId,
        accountId: input.accountId
    });
    if (existing) {
        return {
            success: false,
            error: '이미 존재하는 계정입니다'
        };
    }
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$account$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Account"].create({
        userId,
        accountId: input.accountId,
        password: input.password,
        nickname: input.nickname,
        isMain: input.isMain ?? false,
        activityHours: input.activityHours,
        restDays: input.restDays,
        dailyPostLimit: input.dailyPostLimit,
        personaId: input.personaId,
        campaignTag: input.campaignTag,
        excludeFromAutoComment: input.excludeFromAutoComment ?? false
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/accounts');
    return {
        success: true
    };
};
const updateAccountAction = async (accountId, input)=>{
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
    const userId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCurrentUserId"])();
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$account$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Account"].findOneAndUpdate({
        userId,
        accountId
    }, {
        $set: input
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/accounts');
    return {
        success: true
    };
};
const deleteAccountAction = async (accountId)=>{
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
        const userId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCurrentUserId"])();
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$account$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Account"].findOneAndUpdate({
            userId,
            accountId
        }, {
            $set: {
                isActive: false
            }
        }, {
            new: true
        });
        if (!result) {
            console.error(`[DELETE] 계정 찾기 실패: ${accountId}`);
            return {
                success: false,
                error: '계정을 찾을 수 없습니다'
            };
        }
        console.log(`[DELETE] 계정 삭제 완료: ${accountId}`);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/accounts');
        return {
            success: true
        };
    } catch (error) {
        console.error(`[DELETE] 에러:`, error);
        return {
            success: false,
            error: '삭제 중 오류 발생'
        };
    }
};
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    getAccountsAction,
    addAccountAction,
    updateAccountAction,
    deleteAccountAction
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getAccountsAction, "0008b6ff334c2072c6e4f6eab76e5c765bc6e7a5a3", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(addAccountAction, "40112886834403b0d60339316abc3811a0e1c28215", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateAccountAction, "60ac46c34504d930dd29493dcba1f6ab19c19486f6", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(deleteAccountAction, "40f13d619b94d316db07baca3ebbec099a328eccec", null);
}),
"[project]/.next-internal/server/app/viral/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/features/auth/actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/features/manual-post/manual-actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE2 => \"[project]/src/entities/cafe/api/index.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE3 => \"[project]/src/entities/account/api/index.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/auth/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$manual$2d$post$2f$manual$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/manual-post/manual-actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$cafe$2f$api$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/entities/cafe/api/index.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$account$2f$api$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/entities/account/api/index.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$manual$2d$post$2f$manual$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$manual$2d$post$2f$manual$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/.next-internal/server/app/viral/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/features/auth/actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/features/manual-post/manual-actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE2 => \"[project]/src/entities/cafe/api/index.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE3 => \"[project]/src/entities/account/api/index.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "0008b6ff334c2072c6e4f6eab76e5c765bc6e7a5a3",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$account$2f$api$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getAccountsAction"],
    "00ab089168221bbcc44bae95d2a2913f08e616e2c2",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCurrentUser"],
    "00ba43b06b44b5ff61002c5831f0aac3fa1d4ed9c2",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["logout"],
    "00fcebe0d8b7ffd728da7115f7c761568114a4b2b3",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$cafe$2f$api$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCafesAction"],
    "402e666dbb52813b850b5ce71fdfff645f884c3913",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$manual$2d$post$2f$manual$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["runManualModifyAction"],
    "40d3bec0fced50d202d7a9856a430232a2ff5ae58f",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$manual$2d$post$2f$manual$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["runManualPublishAction"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$viral$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$features$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$features$2f$manual$2d$post$2f$manual$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$src$2f$entities$2f$cafe$2f$api$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE3__$3d3e$__$225b$project$5d2f$src$2f$entities$2f$account$2f$api$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/viral/page/actions.js { ACTIONS_MODULE0 => "[project]/src/features/auth/actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/features/manual-post/manual-actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE2 => "[project]/src/entities/cafe/api/index.ts [app-rsc] (ecmascript)", ACTIONS_MODULE3 => "[project]/src/entities/account/api/index.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/auth/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$manual$2d$post$2f$manual$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/manual-post/manual-actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$cafe$2f$api$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/entities/cafe/api/index.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$account$2f$api$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/entities/account/api/index.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$viral$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$features$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$features$2f$manual$2d$post$2f$manual$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$src$2f$entities$2f$cafe$2f$api$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE3__$3d3e$__$225b$project$5d2f$src$2f$entities$2f$account$2f$api$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$manual$2d$post$2f$manual$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$viral$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$features$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$features$2f$manual$2d$post$2f$manual$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$src$2f$entities$2f$cafe$2f$api$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE3__$3d3e$__$225b$project$5d2f$src$2f$entities$2f$account$2f$api$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$manual$2d$post$2f$manual$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__73ae6f4c._.js.map