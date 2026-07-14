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
"[project]/.next-internal/server/app/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/features/auth/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/auth/actions.ts [app-rsc] (ecmascript)");
;
}),
"[project]/.next-internal/server/app/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/features/auth/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "00ab089168221bbcc44bae95d2a2913f08e616e2c2",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCurrentUser"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$features$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/page/actions.js { ACTIONS_MODULE0 => "[project]/src/features/auth/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/auth/actions.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__febc8341._.js.map