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
    "getRecentPublishedArticles",
    ()=>getRecentPublishedArticles,
    "getRecentWriters",
    ()=>getRecentWriters,
    "hasCommented",
    ()=>hasCommented,
    "removeCommentFromArticle",
    ()=>removeCommentFromArticle,
    "updateArticleExposure",
    ()=>updateArticleExposure
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
    },
    exposureStatus: {
        type: String,
        enum: [
            '노출',
            '미노출',
            '확인실패'
        ]
    },
    exposureRank: {
        type: Number
    },
    exposureFoundLink: {
        type: String
    },
    exposureCheckedAt: {
        type: Date
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
const removeCommentFromArticle = async (cafeId, articleId, commentId)=>{
    const result = await PublishedArticle.updateOne({
        cafeId,
        articleId,
        'comments.commentId': commentId
    }, {
        $pull: {
            comments: {
                commentId
            }
        },
        $inc: {
            commentCount: -1
        }
    });
    return result.modifiedCount > 0;
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
const updateArticleExposure = async (cafeId, articleId, result)=>{
    const updated = await PublishedArticle.findOneAndUpdate({
        cafeId,
        articleId
    }, {
        $set: {
            exposureStatus: result.status,
            exposureRank: result.rank,
            exposureFoundLink: result.foundLink,
            exposureCheckedAt: new Date()
        }
    });
    return !!updated;
};
const getRecentPublishedArticles = async (cafeId, limit = 30)=>{
    return PublishedArticle.find({
        cafeId,
        status: {
            $in: [
                'published',
                'modified'
            ]
        }
    }).sort({
        publishedAt: -1
    }).limit(limit);
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
            'modify',
            'rewrite'
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
const ManualCommentDeleteResultSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    index: {
        type: Number,
        required: true
    },
    commentId: {
        type: String,
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
    deletedAt: {
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
    deleteExisting: {
        type: Boolean,
        default: false
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
    deleteResults: {
        type: [
            ManualCommentDeleteResultSchema
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
"[externals]/child_process [external] (child_process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("child_process", () => require("child_process"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/os [external] (os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

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
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

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
"[externals]/net [external] (net, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("net", () => require("net"));

module.exports = mod;
}),
"[externals]/tls [external] (tls, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("tls", () => require("tls"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

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
"[project]/src/shared/lib/naver-cafe-creation/presets.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * 카페 개설 카테고리 프리셋 — 순수 데이터만 있는 파일.
 *
 * 이 파일은 UI(client component)에서도 바로 import 하므로 Playwright/멀티세션 등
 * Node 전용 코드를 절대 import 하면 안 된다. `index.ts` 는 multi-session.ts(playwright-core)를
 * 물고 있어서 client component가 그쪽에서 프리셋을 가져오면 Next 빌드가
 * "playwright-core를 브라우저 번들에 넣으려 한다"고 깨진다 — 실제로 겪은 버그.
 *
 * 대분류→소분류는 대분류를 먼저 골라야 소분류 목록이 열려서 전체 조합을 미리
 * 긁어올 수 없다. 실제로 써본(2026-07) 조합만 프리셋으로 고정해둠 — 새 카테고리가
 * 필요하면 카페 만들기 폼에서 직접 열어서 정확한 문구를 확인하고 여기에 추가할 것.
 */ __turbopack_context__.s([
    "CAFE_TOPIC_PRESETS",
    ()=>CAFE_TOPIC_PRESETS
]);
const CAFE_TOPIC_PRESETS = [
    {
        key: 'health-care',
        sheetCategory: '건강',
        categoryMajor: '건강/다이어트',
        categoryMinor: '건강관리/건강식품',
        label: '건강 - 건강관리/건강식품'
    },
    {
        key: 'health-general',
        sheetCategory: '건강',
        categoryMajor: '건강/다이어트',
        categoryMinor: '건강/다이어트일반',
        label: '건강 - 건강/다이어트일반'
    },
    {
        key: 'living-house',
        sheetCategory: '생활',
        categoryMajor: '생활',
        categoryMinor: '주거살림',
        label: '생활 - 주거살림'
    },
    {
        key: 'living-info',
        sheetCategory: '생활',
        categoryMajor: '생활',
        categoryMinor: '생활정보',
        label: '생활 - 생활정보'
    },
    {
        key: 'daily-social',
        sheetCategory: '일상',
        categoryMajor: '친목/모임',
        categoryMinor: '친목/모임일반',
        label: '일상 - 친목/모임일반'
    },
    {
        key: 'family-parenting',
        sheetCategory: '육아',
        categoryMajor: '가족/육아',
        categoryMinor: '가족/육아일반',
        label: '육아 - 가족/육아일반'
    }
];
}),
"[project]/src/shared/lib/naver-cafe-creation/index.ts [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "addCafeSearchKeywords",
    ()=>addCafeSearchKeywords,
    "agreeToCafePolicy",
    ()=>agreeToCafePolicy,
    "createNaverCafe",
    ()=>createNaverCafe,
    "extractCafeIdFromPage",
    ()=>extractCafeIdFromPage,
    "fillCafeDescription",
    ()=>fillCafeDescription,
    "fillCafeIdentity",
    ()=>fillCafeIdentity,
    "getAvailableOwnerAccounts",
    ()=>getAvailableOwnerAccounts,
    "refreshCafeCreateCaptcha",
    ()=>refreshCafeCreateCaptcha,
    "registerCreatedCafeInDb",
    ()=>registerCreatedCafeInDb,
    "selectCafeTopic",
    ()=>selectCafeTopic,
    "setCafeVisibilityDefaults",
    ()=>setCafeVisibilityDefaults,
    "solveCafeCreateCaptcha",
    ()=>solveCafeCreateCaptcha,
    "submitCafeCreateForm",
    ()=>submitCafeCreateForm
]);
/**
 * 네이버 카페 "개설(생성)" 자동화.
 *
 * 카페 "가입"과는 완전히 다른 기능이다 — 기존 카페에 가입하는 로직은
 * `naver-cafe-membership/index.ts` 와 `features/auto-comment/batch/cafe-join.ts` 를 참고할 것.
 * 이 모듈은 계정으로 로그인한 뒤 https://section.cafe.naver.com/ca-fe/home/create 폼을 채워
 * 실제로 새 카페를 만드는 흐름만 담당한다.
 *
 * 카페 만들기 폼의 보안절차는 로그인 캡차(영수증형 텍스트질문, captcha-solver.ts)와는
 * 완전히 다른 그림문자형 캡차(`.SectionCreateCafeCaptcha`, nhncaptchav4.gif)라
 * 기존 캡차 solver를 재사용할 수 없어서 이 안에서 따로 푼다.
 *
 * 새 카페를 만들 때는 항상 이 모듈의 `createNaverCafe()` 를 통해서 만들 것 —
 * 폼 셀렉터를 다시 조사하거나 캡차 로직을 새로 짜지 말 것.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$google$2f$genai$2f$dist$2f$node$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@google/genai/dist/node/index.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/multi-session.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$cafe$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/cafe.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$account$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/account.ts [app-rsc] (ecmascript)");
// 프리셋은 순수 데이터라 별도 파일(presets.ts)에 있음 — client component에서 바로 import 해도
// Playwright 같은 Node 전용 코드가 딸려오지 않게 하기 위함. 여기서는 서버 쪽 편의를 위해 재수출만 한다.
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$creation$2f$presets$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/naver-cafe-creation/presets.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
const CREATE_CAFE_URL = 'https://section.cafe.naver.com/ca-fe/home/create';
const CAPTCHA_MODEL = process.env.GEMINI_CAPTCHA_MODEL || 'gemini-3.5-flash';
let cafeCreateCaptchaClient = null;
const getCafeCreateCaptchaClient = ()=>{
    if (cafeCreateCaptchaClient) return cafeCreateCaptchaClient;
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY 없음');
    cafeCreateCaptchaClient = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$google$2f$genai$2f$dist$2f$node$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["GoogleGenAI"]({
        apiKey
    });
    return cafeCreateCaptchaClient;
};
const CAPTCHA_REJECTED_PATTERN = /보안문자를 입력해주세요|보안문자가 일치하지|보안문자를 다시|보안문자를 정확히/;
const solveCafeCreateCaptcha = async (page)=>{
    const container = page.locator('.SectionCreateCafeCaptcha').first();
    const image = container.locator('img').first();
    const input = container.locator('input.input_txt').first();
    const visible = await image.isVisible({
        timeout: 2000
    }).catch(()=>false);
    if (!visible) return {
        solved: true
    };
    const shot = await image.screenshot({
        type: 'png'
    }).catch(()=>null);
    if (!shot) return {
        solved: false,
        error: '캡차 이미지 스크린샷 실패'
    };
    const ai = getCafeCreateCaptchaClient();
    const response = await ai.models.generateContent({
        model: CAPTCHA_MODEL,
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            mimeType: 'image/png',
                            data: shot.toString('base64')
                        }
                    },
                    {
                        text: [
                            '이미지에 보이는 네이버 카페 만들기 보안문자(그림문자)를 정확히 읽어라.',
                            '문자는 배경 사진 위에 겹쳐진 왜곡된 영문/숫자다.',
                            'I와 1, O와 0, B와 8, S와 5, Z와 2를 조심해서 구분한다.',
                            '출력은 한 줄, 설명 없이 문자만.',
                            '공백, 따옴표, 문장부호는 쓰지 않는다.'
                        ].join('\n')
                    }
                ]
            }
        ]
    });
    const answer = (response.text || '').replace(/[^0-9A-Za-z]/g, '').trim();
    if (!answer) return {
        solved: false,
        error: 'AI가 빈 답변 반환'
    };
    await input.fill(answer);
    return {
        solved: true
    };
};
const refreshCafeCreateCaptcha = async (page)=>{
    await page.locator('.SectionCreateCafeCaptcha .captcha_btn.btn_re').first().click().catch(()=>{});
    await page.waitForTimeout(1500);
};
const fillCafeIdentity = async (page, name, slug)=>{
    await page.locator('input[placeholder="카페 이름을 입력해주세요"]').fill(name);
    await page.locator('input[placeholder="카페 주소를 입력해주세요"]').fill(slug);
    await page.waitForTimeout(500);
    const confirmedName = await page.locator('input[placeholder="카페 이름을 입력해주세요"]').inputValue();
    const confirmedSlug = await page.locator('input[placeholder="카페 주소를 입력해주세요"]').inputValue();
    return {
        name: confirmedName,
        slug: confirmedSlug
    };
};
const setCafeVisibilityDefaults = async (page)=>{
    await page.locator('#publicCafe').check({
        force: true
    }).catch(()=>{});
    await page.locator('#useNick').check({
        force: true
    }).catch(()=>{});
};
const selectCafeTopic = async (page, categoryMajor, categoryMinor)=>{
    await page.locator('button:has-text("대분류 선택")').first().click();
    await page.waitForTimeout(500);
    const majorOption = page.locator(`.option:has-text("${categoryMajor}")`).first();
    const majorSelected = await majorOption.click().then(()=>true).catch(()=>false);
    await page.waitForTimeout(800);
    const minorTriggerButton = page.locator('button:has-text("소분류 선택")').first();
    await minorTriggerButton.click();
    await page.waitForTimeout(500);
    const allOptions = page.locator('.option');
    const count = await allOptions.count();
    let minorSelected = false;
    for(let i = 0; i < count; i += 1){
        const opt = allOptions.nth(i);
        if (!await opt.isVisible().catch(()=>false)) continue;
        const text = (await opt.textContent())?.trim() || '';
        if (text.replace('선택됨', '') === categoryMinor) {
            await opt.click();
            minorSelected = true;
            break;
        }
    }
    await page.waitForTimeout(500);
    // 소분류 선택 후 드롭다운이 안 닫혀있으면(옵션이 여전히 보이면) 트리거 버튼을 다시 눌러 접는다
    for(let attempt = 0; attempt < 3; attempt += 1){
        const stillOpen = await allOptions.first().isVisible({
            timeout: 500
        }).catch(()=>false);
        if (!stillOpen) break;
        await minorTriggerButton.click({
            force: true
        }).catch(()=>{});
        await page.waitForTimeout(400);
    }
    return {
        majorSelected,
        minorSelected
    };
};
const fillCafeDescription = async (page, description)=>{
    await page.locator('textarea[placeholder="카페 설명을 입력해주세요."]').fill(description.slice(0, 100));
};
const addCafeSearchKeywords = async (page, keywords)=>{
    const input = page.locator('input[placeholder="검색어를 입력해주세요"]');
    for (const keyword of keywords.slice(0, 10)){
        await input.fill(keyword);
        await page.locator('button.btn_srch:has-text("등록")').first().click();
        await page.waitForTimeout(400);
    }
};
const agreeToCafePolicy = async (page)=>{
    await page.locator('#chk_ok_privacy').check({
        force: true
    }).catch(async ()=>{
        await page.locator('#chk_ok_privacy').click({
            force: true
        }).catch(()=>{});
    });
};
const submitCafeCreateForm = async (page, slug, options = {})=>{
    const { captchaAttempts = 4 } = options;
    const expectedUrl = `https://cafe.naver.com/${slug}`;
    let resultText = '';
    for(let captchaAttempt = 1; captchaAttempt <= captchaAttempts; captchaAttempt += 1){
        const captchaResult = await solveCafeCreateCaptcha(page);
        if (!captchaResult.solved) {
            return {
                success: false,
                resultText: captchaResult.error || '캡차 풀이 실패'
            };
        }
        await page.locator('a.BaseButton--green:has-text("만들기")').last().click();
        let captchaRejected = false;
        for(let attempt = 0; attempt < 6; attempt += 1){
            await page.waitForTimeout(1500);
            resultText = await page.locator('body').innerText({
                timeout: 5000
            }).catch(()=>'');
            if (resultText.includes('카페가 개설되었어요')) {
                return {
                    success: true,
                    resultText,
                    cafeUrl: page.url()
                };
            }
            if (CAPTCHA_REJECTED_PATTERN.test(resultText)) {
                captchaRejected = true;
                break;
            }
            // 리다이렉트가 성공 팝업보다 늦게 뜨는 경우 대비: URL이 이미 새 카페면 한 번 더 텍스트를 다시 읽어본다
            if (page.url().startsWith(expectedUrl)) {
                await page.waitForTimeout(1000);
                resultText = await page.locator('body').innerText({
                    timeout: 5000
                }).catch(()=>'');
                const looksLikeCafeHome = resultText.includes('카페정보') && resultText.includes('매니저');
                if (looksLikeCafeHome) {
                    return {
                        success: true,
                        resultText,
                        cafeUrl: page.url()
                    };
                }
            }
        }
        if (!captchaRejected) {
            return {
                success: false,
                resultText
            };
        }
        if (captchaAttempt < captchaAttempts) {
            await refreshCafeCreateCaptcha(page);
        }
    }
    return {
        success: false,
        resultText: resultText || '캡차 재시도 초과'
    };
};
const extractCafeIdFromPage = async (page)=>{
    for(let attempt = 0; attempt < 3; attempt += 1){
        for (const frame of page.frames()){
            const match = frame.url().match(/clubid=(\d+)/i);
            if (match?.[1]) return match[1];
        }
        await page.waitForTimeout(1000);
    }
    return undefined;
};
const createNaverCafe = async (accountId, password, input, options = {})=>{
    const dryRun = options.dryRun ?? false;
    try {
        const loggedIn = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isAccountLoggedIn"])(accountId);
        if (!loggedIn) {
            const loginResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["loginAccount"])(accountId, password);
            if (!loginResult.success) {
                return {
                    success: false,
                    dryRun,
                    error: '로그인 실패: ' + loginResult.error
                };
            }
        }
        const page = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPageForAccount"])(accountId);
        await page.goto(CREATE_CAFE_URL, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        await page.waitForTimeout(2000);
        await fillCafeIdentity(page, input.name, input.slug);
        await setCafeVisibilityDefaults(page);
        await selectCafeTopic(page, input.categoryMajor, input.categoryMinor);
        await fillCafeDescription(page, input.description);
        if (input.keywords?.length) {
            await addCafeSearchKeywords(page, input.keywords);
        }
        if (dryRun) {
            // 드라이런은 제출을 안 하므로 캡차 정답 여부를 검증할 방법이 없다 — 폼이 여기까지
            // 정상적으로 채워지는지만 확인하고 캡차는 한 번만 채워본다.
            const captchaResult = await solveCafeCreateCaptcha(page);
            if (!captchaResult.solved) {
                return {
                    success: false,
                    dryRun,
                    error: captchaResult.error || '캡차 풀이 실패'
                };
            }
            await agreeToCafePolicy(page);
            return {
                success: true,
                dryRun,
                name: input.name
            };
        }
        await agreeToCafePolicy(page);
        const submitResult = await submitCafeCreateForm(page, input.slug);
        if (!submitResult.success) {
            return {
                success: false,
                dryRun,
                error: 'CAFE_CREATE_FAILED: ' + submitResult.resultText.slice(0, 200)
            };
        }
        const cafeId = await extractCafeIdFromPage(page);
        return {
            success: true,
            dryRun,
            cafeUrl: submitResult.cafeUrl,
            cafeId,
            name: input.name
        };
    } catch (error) {
        return {
            success: false,
            dryRun,
            error: error instanceof Error ? error.message : '알 수 없는 오류'
        };
    }
};
const registerCreatedCafeInDb = async (userId, cafe, options = {})=>{
    const menuId = options.menuId ?? '1';
    const categories = options.categories ?? [
        '자유게시판'
    ];
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$cafe$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Cafe"].findOneAndUpdate({
        userId,
        cafeId: cafe.cafeId
    }, {
        $set: {
            cafeUrl: cafe.cafeUrl,
            name: cafe.name,
            menuId,
            categories,
            categoryMenuIds: options.categoryMenuIds ?? {
                [categories[0]]: menuId
            },
            categoryAliases: options.categoryAliases,
            commentableMenuIds: options.commentableMenuIds ?? [
                Number(menuId)
            ],
            ownerAccountId: options.ownerAccountId,
            isActive: true
        },
        $setOnInsert: {
            isDefault: false
        }
    }, {
        upsert: true
    });
};
const getAvailableOwnerAccounts = async (userId)=>{
    const [accounts, ownedAccountIds] = await Promise.all([
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$account$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Account"].find({
            userId,
            isActive: true
        }).select('accountId nickname role').lean(),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$cafe$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Cafe"].find({
            userId,
            isActive: true,
            ownerAccountId: {
                $ne: null
            }
        }).distinct('ownerAccountId')
    ]);
    const owned = new Set(ownedAccountIds);
    return accounts.filter((a)=>!owned.has(a.accountId)).map((a)=>({
            accountId: a.accountId,
            nickname: a.nickname || a.accountId,
            role: a.role
        }));
};
;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[externals]/http2 [external] (http2, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http2", () => require("http2"));

module.exports = mod;
}),
"[project]/src/shared/lib/naver-cafe-creation/sheet-sync.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "syncCafeToOperationsSheet",
    ()=>syncCafeToOperationsSheet
]);
/**
 * 카페 개설 결과를 "21lab 카페 운영 현황" 구글시트에 실시간 기록.
 *
 * DB(CafeConfig)와 별개로 사람이 보는 운영 시트가 따로 있고, 지금까지는
 * 카페를 만들 때마다 수동으로 시트에 적어왔다. createNaverCafe() 로 카페를
 * 만들 때마다 이 함수를 호출해서 시트가 항상 실제 상태를 반영하게 유지한다.
 *
 * 구글 자격증명(GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY)이 보통
 * `.env` 에 있고 `.env.local` 에는 없어서, 이 모듈은 두 파일을 모두 로드한다 —
 * 스크립트가 `--env-file=.env.local` 로만 실행돼도 깨지지 않게 하기 위함.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/dotenv/lib/main.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$googleapis$2f$build$2f$src$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/googleapis/build/src/index.js [app-rsc] (ecmascript)");
;
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].config({
    path: '.env'
});
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].config({
    path: '.env.local'
});
;
const OPERATIONS_SHEET_ID = '1JMNXyIaTR55aX4SRcD4Kp09W-WNjqMwMi0Xt2TV7ZYw';
const CAFE_INFO_TAB = '카페정보 및 링크';
const CAFE_ACCOUNT_TAB = '카페계정정보';
let sheetsClient = null;
const getSheetsClient = ()=>{
    if (sheetsClient) return sheetsClient;
    const auth = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$googleapis$2f$build$2f$src$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["google"].auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        scopes: [
            'https://www.googleapis.com/auth/spreadsheets'
        ]
    });
    sheetsClient = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$googleapis$2f$build$2f$src$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["google"].sheets({
        version: 'v4',
        auth
    });
    return sheetsClient;
};
/** "카페정보 및 링크" 탭 맨 끝에 새 카페 한 줄 추가. 기존 행과 동일하게 PC/모바일 링크는 HYPERLINK 수식으로 넣는다 */ const appendCafeInfoRow = async (record)=>{
    const sheets = getSheetsClient();
    const pcUrl = `https://cafe.naver.com/${record.slug}`;
    const mobileUrl = `https://m.cafe.naver.com/${record.slug}`;
    await sheets.spreadsheets.values.append({
        spreadsheetId: OPERATIONS_SHEET_ID,
        range: `${CAFE_INFO_TAB}!A:N`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [
                [
                    record.category,
                    record.name,
                    record.cafeId,
                    record.slug,
                    `=HYPERLINK("${pcUrl}","PC")`,
                    `=HYPERLINK("${mobileUrl}","모바일")`,
                    record.ownerAccountId,
                    record.ownerNickname,
                    record.memberCount,
                    '',
                    '',
                    '',
                    record.status ?? '신규개설',
                    record.memo ?? ''
                ]
            ]
        }
    });
};
/**
 * "카페계정정보" 탭에서 소유 계정 행을 찾아 소유카페 칸을 채운다.
 * 계정이 시트에 아직 없으면(=DB엔 있는데 시트엔 누락된 경우) 조용히 건너뛴다 —
 * 이 함수는 계정을 새로 추가하는 용도가 아니라 기존 행을 갱신하는 용도라서다.
 */ const markAccountAsOwner = async (accountId, cafeName)=>{
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: OPERATIONS_SHEET_ID,
        range: `${CAFE_ACCOUNT_TAB}!A:M`
    });
    const rows = res.data.values || [];
    const rowIndex = rows.findIndex((row)=>row[0] === accountId);
    if (rowIndex <= 0) return false; // 헤더(0)거나 못 찾음
    const sheetRowNumber = rowIndex + 1; // 1-based
    await sheets.spreadsheets.values.update({
        spreadsheetId: OPERATIONS_SHEET_ID,
        range: `${CAFE_ACCOUNT_TAB}!G${sheetRowNumber}:M${sheetRowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [
                [
                    cafeName,
                    '',
                    '',
                    '',
                    '',
                    '',
                    '카페장 계정'
                ]
            ]
        }
    });
    return true;
};
const syncCafeToOperationsSheet = async (record)=>{
    try {
        await appendCafeInfoRow(record);
        const ownerMarked = await markAccountAsOwner(record.ownerAccountId, record.name);
        return {
            cafeInfoAdded: true,
            ownerMarked
        };
    } catch (error) {
        return {
            cafeInfoAdded: false,
            ownerMarked: false,
            error: error instanceof Error ? error.message : '알 수 없는 오류'
        };
    }
};
}),
"[project]/src/features/auto-comment/batch/cafe-create-actions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

/* __next_internal_action_entry_do_not_use__ [{"00dfef021cb274a6ae09663ab7dae79dbbd902e226":"getCafeCreateFormDataAction","40b390caaac13f98e5f76b988f3b7f4b43938c5f50":"createCafeAction"},"",""] */ __turbopack_context__.s([
    "createCafeAction",
    ()=>createCafeAction,
    "getCafeCreateFormDataAction",
    ()=>getCafeCreateFormDataAction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
/**
 * 카페 "개설(생성)" 기능의 UI 진입점. 실제 자동화 로직은 전부
 * shared/lib/naver-cafe-creation 에 있고, 여기서는 로그인 유저 컨텍스트를 붙여서
 * Server Action 형태로만 감싼다 — 로직을 이 파일에 새로 쓰지 말 것.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/mongodb.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$account$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/account.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/config/user.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$creation$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/lib/naver-cafe-creation/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$creation$2f$presets$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/naver-cafe-creation/presets.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$creation$2f$sheet$2d$sync$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/naver-cafe-creation/sheet-sync.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$creation$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$creation$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
;
const getCafeCreateFormDataAction = async ()=>{
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
    const userId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCurrentUserId"])();
    const owners = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$creation$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getAvailableOwnerAccounts"])(userId);
    return {
        owners,
        presets: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$creation$2f$presets$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["CAFE_TOPIC_PRESETS"]
    };
};
const createCafeAction = async (input)=>{
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["connectDB"])();
    const preset = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$creation$2f$presets$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["CAFE_TOPIC_PRESETS"].find((p)=>p.key === input.presetKey);
    if (!preset) {
        return {
            success: false,
            error: '알 수 없는 카테고리 프리셋: ' + input.presetKey
        };
    }
    const account = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$account$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Account"].findOne({
        accountId: input.ownerAccountId
    }).lean();
    if (!account) {
        return {
            success: false,
            error: '계정을 찾을 수 없음: ' + input.ownerAccountId
        };
    }
    const createInput = {
        name: input.name,
        slug: input.slug,
        categoryMajor: preset.categoryMajor,
        categoryMinor: preset.categoryMinor,
        description: input.description,
        keywords: input.keywords
    };
    const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$creation$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createNaverCafe"])(input.ownerAccountId, account.password, createInput, {
        dryRun: false
    });
    if (!result.success || !result.cafeId || !result.cafeUrl) {
        return {
            success: false,
            error: result.error || '카페 생성 실패'
        };
    }
    const userId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$user$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCurrentUserId"])();
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$creation$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["registerCreatedCafeInDb"])(userId, {
        cafeId: result.cafeId,
        cafeUrl: result.cafeUrl,
        name: result.name || input.name
    }, {
        ownerAccountId: input.ownerAccountId
    });
    const sheetResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$naver$2d$cafe$2d$creation$2f$sheet$2d$sync$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["syncCafeToOperationsSheet"])({
        category: preset.sheetCategory,
        name: result.name || input.name,
        cafeId: result.cafeId,
        slug: input.slug,
        ownerAccountId: input.ownerAccountId,
        ownerNickname: account.nickname || input.ownerAccountId,
        memberCount: 1
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/cafe-create');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/accounts');
    return {
        success: true,
        cafeUrl: result.cafeUrl,
        cafeId: result.cafeId,
        sheetSynced: sheetResult.cafeInfoAdded
    };
};
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    getCafeCreateFormDataAction,
    createCafeAction
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getCafeCreateFormDataAction, "00dfef021cb274a6ae09663ab7dae79dbbd902e226", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createCafeAction, "40b390caaac13f98e5f76b988f3b7f4b43938c5f50", null);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/.next-internal/server/app/cafe-create/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/features/auth/actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/features/auto-comment/batch/cafe-create-actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/auth/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$batch$2f$cafe$2d$create$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/auto-comment/batch/cafe-create-actions.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$batch$2f$cafe$2d$create$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$batch$2f$cafe$2d$create$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/.next-internal/server/app/cafe-create/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/features/auth/actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/features/auto-comment/batch/cafe-create-actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "00ab089168221bbcc44bae95d2a2913f08e616e2c2",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCurrentUser"],
    "00ba43b06b44b5ff61002c5831f0aac3fa1d4ed9c2",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["logout"],
    "00dfef021cb274a6ae09663ab7dae79dbbd902e226",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$batch$2f$cafe$2d$create$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCafeCreateFormDataAction"],
    "40b390caaac13f98e5f76b988f3b7f4b43938c5f50",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$batch$2f$cafe$2d$create$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createCafeAction"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$cafe$2d$create$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$features$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$batch$2f$cafe$2d$create$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/cafe-create/page/actions.js { ACTIONS_MODULE0 => "[project]/src/features/auth/actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/features/auto-comment/batch/cafe-create-actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/auth/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$batch$2f$cafe$2d$create$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/auto-comment/batch/cafe-create-actions.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$cafe$2d$create$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$features$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$batch$2f$cafe$2d$create$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$batch$2f$cafe$2d$create$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$cafe$2d$create$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$features$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$batch$2f$cafe$2d$create$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$batch$2f$cafe$2d$create$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__78a3f04d._.js.map