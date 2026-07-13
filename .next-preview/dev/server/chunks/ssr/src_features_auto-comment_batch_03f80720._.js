module.exports = [
"[project]/src/features/auto-comment/batch/keyword-utils.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// 키워드:카테고리 형식 파싱 (공백 허용: "키워드 : 카테고리" 또는 "키워드:카테고리")
__turbopack_context__.s([
    "parseKeywordWithCategory",
    ()=>parseKeywordWithCategory
]);
const parseKeywordWithCategory = (input)=>{
    const lastColonIndex = input.lastIndexOf(':');
    if (lastColonIndex === -1) {
        return {
            keyword: input.trim()
        };
    }
    const keyword = input.slice(0, lastColonIndex).trim();
    const category = input.slice(lastColonIndex + 1).trim();
    // 카테고리가 비어있으면 전체를 키워드로 취급
    if (!category) {
        return {
            keyword: input.trim()
        };
    }
    return {
        keyword,
        category
    };
};
}),
"[project]/src/features/auto-comment/batch/batch-queue.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "addBatchToQueue",
    ()=>addBatchToQueue,
    "getBatchQueueStatus",
    ()=>getBatchQueueStatus,
    "stopBatchQueue",
    ()=>stopBatchQueue
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$accounts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/config/accounts.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$cafe$2d$account$2d$policy$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/config/cafe-account-policy.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/lib/queue/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$workers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/queue/workers.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$queue$2d$settings$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/models/queue-settings.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$api$2f$content$2d$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/api/content-api.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cafe$2d$content$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/cafe-content.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/multi-session.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$account$2d$manager$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/account-manager.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$batch$2f$keyword$2d$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/auto-comment/batch/keyword-utils.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$batch$2f$batch$2d$helpers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/auto-comment/batch/batch-helpers.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$workers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$batch$2f$batch$2d$helpers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$workers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$batch$2f$batch$2d$helpers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
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
const POST_ONLY_RESERVATION_BUFFER_MS = 20 * 60 * 1000;
const COMMENT_RESERVATION_BUFFER_MS = 90 * 60 * 1000;
const mergeAccounts = (...accountGroups)=>{
    const mergedAccounts = [];
    const seenAccountIds = new Set();
    accountGroups.forEach((accounts)=>{
        accounts.forEach((account)=>{
            if (seenAccountIds.has(account.id)) return;
            seenAccountIds.add(account.id);
            mergedAccounts.push(account);
        });
    });
    return mergedAccounts;
};
const getScheduledAccounts = (accounts, keywordCount, includeCommenters)=>{
    if (includeCommenters) {
        return accounts;
    }
    const scheduledAccounts = [];
    const seenAccountIds = new Set();
    for(let i = 0; i < keywordCount; i++){
        const account = accounts[i % accounts.length];
        if (!account || seenAccountIds.has(account.id)) continue;
        seenAccountIds.add(account.id);
        scheduledAccounts.push(account);
    }
    return scheduledAccounts;
};
const estimateReservationTtlMs = (accounts, keywordCount, includeCommenters, settings)=>{
    const accountDelays = new Map();
    let maxScheduledDelay = 0;
    for(let i = 0; i < keywordCount; i++){
        const writerAccount = accounts[i % accounts.length];
        if (!writerAccount) continue;
        const currentAccountDelay = accountDelays.get(writerAccount.id) ?? 0;
        const activityDelay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$account$2d$manager$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getNextActiveTime"])(writerAccount);
        const totalDelay = Math.max(currentAccountDelay, activityDelay);
        maxScheduledDelay = Math.max(maxScheduledDelay, totalDelay);
        accountDelays.set(writerAccount.id, totalDelay + settings.delays.betweenPosts.max);
    }
    const chainBufferMs = includeCommenters ? Math.max(COMMENT_RESERVATION_BUFFER_MS, settings.delays.afterPost.max + settings.delays.betweenComments.max * Math.max(accounts.length, 1) * 3) : POST_ONLY_RESERVATION_BUFFER_MS;
    return maxScheduledDelay + chainBufferMs;
};
const addBatchToQueue = async (input)=>{
    const { service, keywords, ref, cafeId: inputCafeId, postOptions, skipComments, contentPrompt, contentModel, attachImages, postsPerDay } = input;
    const postsPerDayDelayMs = postsPerDay && postsPerDay > 0 ? Math.floor(24 * 60 * 60 * 1000 / postsPerDay) : undefined;
    const trimmedPrompt = contentPrompt?.trim() || '';
    const hasCustomPrompt = Boolean(trimmedPrompt);
    const ctx = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$batch$2f$batch$2d$helpers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["initBatchContext"])(inputCafeId, 2);
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$batch$2f$batch$2d$helpers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isBatchContextError"])(ctx)) {
        return {
            success: false,
            jobsAdded: 0,
            message: ctx.error
        };
    }
    const { accounts, cafe, settings } = ctx;
    const writerAccounts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$cafe$2d$account$2d$policy$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCafeWriterAccounts"])(accounts, cafe.cafeId);
    const commenterAccounts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$cafe$2d$account$2d$policy$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCafeCommenterAccounts"])(accounts, cafe.cafeId);
    if (writerAccounts.length === 0) {
        return {
            success: false,
            jobsAdded: 0,
            message: `글쓰기 가능한 계정이 없습니다 (${cafe.name})`
        };
    }
    const reservationAccounts = skipComments ? writerAccounts : mergeAccounts(writerAccounts, commenterAccounts);
    const scheduledAccounts = getScheduledAccounts(reservationAccounts, keywords.length, !skipComments);
    const reservationTtlMs = estimateReservationTtlMs(reservationAccounts, keywords.length, !skipComments, settings);
    const warmupResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$multi$2d$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["warmupScheduleSessions"])(scheduledAccounts, {
        reason: `batch_queue_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        reservationTtlMs
    });
    if (!warmupResult.success) {
        return {
            success: false,
            jobsAdded: 0,
            message: `세션 프리워밍 실패: ${warmupResult.failedAccountId || 'unknown'} - ${warmupResult.error || '로그인 실패'}`
        };
    }
    let jobsAdded = 0;
    const accountDelays = new Map();
    for(let i = 0; i < keywords.length; i++){
        const keywordInput = keywords[i];
        const { keyword, category } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$batch$2f$keyword$2d$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parseKeywordWithCategory"])(keywordInput);
        const keywordLabel = category ? `${keyword}:${category}` : keyword;
        const writerAccount = writerAccounts[i % writerAccounts.length];
        const commenterAccountIds = skipComments ? undefined : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$cafe$2d$account$2d$policy$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCafeCommenterAccounts"])(accounts, cafe.cafeId, writerAccount.id).map(({ id })=>id);
        try {
            const personaId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$account$2d$manager$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPersonaId"])(writerAccount);
            console.log(`[QUEUE-BATCH] 계정 정보:`, JSON.stringify({
                id: writerAccount.id,
                personaId: writerAccount.personaId
            }));
            console.log(`[QUEUE-BATCH] getPersonaId 반환값: ${personaId}`);
            // 이미지 3장 먼저 확보 → 그 다음 본문 작성 (S3 큐레이션 뱅크 우선, 없으면 AI 생성)
            let images = [];
            if (attachImages) {
                const imageResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$api$2f$content$2d$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["generateImages"])({
                    keyword,
                    count: 3
                });
                images = imageResult.images || [];
                console.log(`[QUEUE-BATCH] 이미지 ${images.length}장 확보: ${keywordLabel}`);
            }
            let generatedContent = '';
            if (hasCustomPrompt) {
                const prompt = `키워드: ${keyword}${category ? `\n카테고리: ${category}` : ''}\n\n${trimmedPrompt}`;
                console.log(`[QUEUE-BATCH] 커스텀 프롬프트로 콘텐츠 생성 중: ${keywordLabel}`);
                const generated = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$api$2f$content$2d$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["generateContentWithPrompt"])({
                    prompt,
                    model: contentModel
                });
                generatedContent = generated.content || generated.comment || '';
            } else {
                console.log(`[QUEUE-BATCH] 테테 원고 생성 중: ${keywordLabel}${personaId ? ` (persona: ${personaId})` : ''}`);
                const generated = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$api$2f$content$2d$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["generateTeteContent"])({
                    keyword: keywordLabel,
                    ref
                });
                generatedContent = generated.content;
            }
            if (!generatedContent) {
                console.error(`[QUEUE-BATCH] 콘텐츠 생성 실패: ${keywordLabel}`);
                continue;
            }
            const { title, htmlContent } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cafe$2d$content$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["buildCafePostContent"])(generatedContent, keywordLabel);
            const jobData = {
                type: 'post',
                accountId: writerAccount.id,
                cafeId: cafe.cafeId,
                menuId: cafe.menuId,
                subject: title,
                content: htmlContent,
                category,
                postOptions,
                keyword: keywordLabel,
                service,
                rawContent: generatedContent,
                skipComments,
                commenterAccountIds,
                images: images.length > 0 ? images : undefined
            };
            const currentAccountDelay = accountDelays.get(writerAccount.id) ?? 0;
            const activityDelay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$account$2d$manager$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getNextActiveTime"])(writerAccount);
            const totalDelay = Math.max(currentAccountDelay, activityDelay);
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["addTaskJob"])(writerAccount.id, jobData, totalDelay);
            jobsAdded++;
            const randomDelay = postsPerDayDelayMs ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$models$2f$queue$2d$settings$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRandomDelay"])(settings.delays.betweenPosts);
            accountDelays.set(writerAccount.id, totalDelay + randomDelay);
            const delayInfo = activityDelay > 0 ? `${Math.round(totalDelay / 1000)}초 (활동시간까지 ${Math.round(activityDelay / 60000)}분)` : `${Math.round(totalDelay / 1000)}초`;
            console.log(`[QUEUE-BATCH] Job 추가: ${keywordLabel} → ${writerAccount.id}, 딜레이: ${delayInfo}`);
        } catch (error) {
            console.error(`[QUEUE-BATCH] 에러: ${keywordLabel}`, error);
        }
    }
    return {
        success: jobsAdded > 0,
        jobsAdded,
        message: `${jobsAdded}개 작업이 큐에 추가됨 (${scheduledAccounts.length}개 계정 세션 준비 완료)`
    };
};
const getBatchQueueStatus = async ()=>{
    const accounts = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$config$2f$accounts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getAllAccounts"])();
    const statuses = {};
    for (const account of accounts){
        statuses[account.id] = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getQueueStatus"])(account.id);
    }
    return statuses;
};
const stopBatchQueue = async ()=>{
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$workers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["closeAllWorkers"])();
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$queue$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["closeAllQueues"])();
    console.log('[QUEUE-BATCH] 모든 큐/워커 종료');
};
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=src_features_auto-comment_batch_03f80720._.js.map