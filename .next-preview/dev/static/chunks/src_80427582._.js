(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/shared/ui/index.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AnimatedButton",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$animated$2d$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatedButton"],
    "AnimatedCard",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$animated$2d$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatedCard"],
    "AnimatedListItem",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$animated$2d$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatedListItem"],
    "AnimatedTabs",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$animated$2d$tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatedTabs"],
    "Button",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"],
    "Checkbox",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$checkbox$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Checkbox"],
    "ConfirmModal",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$confirm$2d$modal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ConfirmModal"],
    "ExecuteConfirmModal",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$confirm$2d$modal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExecuteConfirmModal"],
    "FadeIn",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$page$2d$transition$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FadeIn"],
    "HelpAccordion",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$help$2d$accordion$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HelpAccordion"],
    "LoadingDots",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$loading$2d$dots$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LoadingDots"],
    "PageTransition",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$page$2d$transition$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PageTransition"],
    "Select",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Select"],
    "SlideUp",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$page$2d$transition$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SlideUp"],
    "StaggerContainer",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$page$2d$transition$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StaggerContainer"],
    "StaggerItem",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$page$2d$transition$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StaggerItem"],
    "ThemeToggle",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$theme$2d$toggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ThemeToggle"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/ui/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/ui/select.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$checkbox$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/ui/checkbox.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$help$2d$accordion$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/ui/help-accordion.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$animated$2d$tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/ui/animated-tabs.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$animated$2d$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/ui/animated-card.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$animated$2d$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/ui/animated-button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$loading$2d$dots$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/ui/loading-dots.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$theme$2d$toggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/ui/theme-toggle.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$page$2d$transition$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/ui/page-transition.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$confirm$2d$modal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/ui/confirm-modal.tsx [app-client] (ecmascript)");
}),
"[project]/src/features/auto-comment/batch/data:68b425 [app-client] (ecmascript) <text/javascript>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getCafeCreateFormDataAction",
    ()=>$$RSC_SERVER_ACTION_0
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
/* __next_internal_action_entry_do_not_use__ [{"00c05fe0e84d594ae50c5952e87c51a1b1233b0713":"getCafeCreateFormDataAction"},"src/features/auto-comment/batch/cafe-create-actions.ts",""] */ "use turbopack no side effects";
;
const $$RSC_SERVER_ACTION_0 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("00c05fe0e84d594ae50c5952e87c51a1b1233b0713", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "getCafeCreateFormDataAction");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
 //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vY2FmZS1jcmVhdGUtYWN0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHNlcnZlcic7XG5cbi8qKlxuICog7Lm07Y6YIFwi6rCc7ISkKOyDneyEsSlcIiDquLDriqXsnZggVUkg7KeE7J6F7KCQLiDsi6TsoJwg7J6Q64+Z7ZmUIOuhnOyngeydgCDsoITrtoBcbiAqIHNoYXJlZC9saWIvbmF2ZXItY2FmZS1jcmVhdGlvbiDsl5Ag7J6I6rOgLCDsl6zquLDshJzripQg66Gc6re47J24IOycoOyggCDsu6jthY3siqTtirjrpbwg67aZ7Jes7IScXG4gKiBTZXJ2ZXIgQWN0aW9uIO2Yle2DnOuhnOunjCDqsJDsi7zri6Qg4oCUIOuhnOyngeydhCDsnbQg7YyM7J287JeQIOyDiOuhnCDsk7Dsp4Ag66eQIOqygy5cbiAqL1xuaW1wb3J0IHsgcmV2YWxpZGF0ZVBhdGggfSBmcm9tICduZXh0L2NhY2hlJztcbmltcG9ydCB7IGNvbm5lY3REQiB9IGZyb20gJ0Avc2hhcmVkL2xpYi9tb25nb2RiJztcbmltcG9ydCB7IEFjY291bnQgfSBmcm9tICdAL3NoYXJlZC9tb2RlbHMvYWNjb3VudCc7XG5pbXBvcnQgeyBnZXRDdXJyZW50VXNlcklkIH0gZnJvbSAnQC9zaGFyZWQvY29uZmlnL3VzZXInO1xuaW1wb3J0IHtcbiAgY3JlYXRlTmF2ZXJDYWZlLFxuICByZWdpc3RlckNyZWF0ZWRDYWZlSW5EYixcbiAgZ2V0QXZhaWxhYmxlT3duZXJBY2NvdW50cyxcbiAgQ0FGRV9UT1BJQ19QUkVTRVRTLFxuICB0eXBlIENyZWF0ZUNhZmVJbnB1dCxcbn0gZnJvbSAnQC9zaGFyZWQvbGliL25hdmVyLWNhZmUtY3JlYXRpb24nO1xuaW1wb3J0IHsgc3luY0NhZmVUb09wZXJhdGlvbnNTaGVldCB9IGZyb20gJ0Avc2hhcmVkL2xpYi9uYXZlci1jYWZlLWNyZWF0aW9uL3NoZWV0LXN5bmMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIENhZmVDcmVhdGVPd25lck9wdGlvbiB7XG4gIGFjY291bnRJZDogc3RyaW5nO1xuICBuaWNrbmFtZTogc3RyaW5nO1xuICByb2xlPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENhZmVDcmVhdGVGb3JtRGF0YSB7XG4gIG93bmVyczogQ2FmZUNyZWF0ZU93bmVyT3B0aW9uW107XG4gIHByZXNldHM6IHR5cGVvZiBDQUZFX1RPUElDX1BSRVNFVFM7XG59XG5cbi8qKiBVSSDtj7zsnYQg7LGE7Jqw64qUIOuNsCDtlYTsmpTtlZwg642w7J207YSwOiDslYTsp4Eg7Lm07Y6YIOyXhuuKlCDqs4TsoJUg66qp66GdICsg7Lm07YWM6rOg66asIO2UhOumrOyFiyAqL1xuZXhwb3J0IGNvbnN0IGdldENhZmVDcmVhdGVGb3JtRGF0YUFjdGlvbiA9IGFzeW5jICgpOiBQcm9taXNlPENhZmVDcmVhdGVGb3JtRGF0YT4gPT4ge1xuICBhd2FpdCBjb25uZWN0REIoKTtcbiAgY29uc3QgdXNlcklkID0gYXdhaXQgZ2V0Q3VycmVudFVzZXJJZCgpO1xuICBjb25zdCBvd25lcnMgPSBhd2FpdCBnZXRBdmFpbGFibGVPd25lckFjY291bnRzKHVzZXJJZCk7XG4gIHJldHVybiB7IG93bmVycywgcHJlc2V0czogQ0FGRV9UT1BJQ19QUkVTRVRTIH07XG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIENhZmVDcmVhdGVJbnB1dCB7XG4gIG93bmVyQWNjb3VudElkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgc2x1Zzogc3RyaW5nO1xuICBwcmVzZXRLZXk6IHN0cmluZztcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbiAga2V5d29yZHM6IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENhZmVDcmVhdGVBY3Rpb25SZXN1bHQge1xuICBzdWNjZXNzOiBib29sZWFuO1xuICBjYWZlVXJsPzogc3RyaW5nO1xuICBjYWZlSWQ/OiBzdHJpbmc7XG4gIGVycm9yPzogc3RyaW5nO1xuICBzaGVldFN5bmNlZD86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVDYWZlQWN0aW9uID0gYXN5bmMgKGlucHV0OiBDYWZlQ3JlYXRlSW5wdXQpOiBQcm9taXNlPENhZmVDcmVhdGVBY3Rpb25SZXN1bHQ+ID0+IHtcbiAgYXdhaXQgY29ubmVjdERCKCk7XG5cbiAgY29uc3QgcHJlc2V0ID0gQ0FGRV9UT1BJQ19QUkVTRVRTLmZpbmQoKHApID0+IHAua2V5ID09PSBpbnB1dC5wcmVzZXRLZXkpO1xuICBpZiAoIXByZXNldCkge1xuICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ+yVjCDsiJgg7JeG64qUIOy5tO2FjOqzoOumrCDtlITrpqzshYs6ICcgKyBpbnB1dC5wcmVzZXRLZXkgfTtcbiAgfVxuXG4gIGNvbnN0IGFjY291bnQgPSBhd2FpdCBBY2NvdW50LmZpbmRPbmUoeyBhY2NvdW50SWQ6IGlucHV0Lm93bmVyQWNjb3VudElkIH0pLmxlYW4oKTtcbiAgaWYgKCFhY2NvdW50KSB7XG4gICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAn6rOE7KCV7J2EIOywvuydhCDsiJgg7JeG7J2MOiAnICsgaW5wdXQub3duZXJBY2NvdW50SWQgfTtcbiAgfVxuXG4gIGNvbnN0IGNyZWF0ZUlucHV0OiBDcmVhdGVDYWZlSW5wdXQgPSB7XG4gICAgbmFtZTogaW5wdXQubmFtZSxcbiAgICBzbHVnOiBpbnB1dC5zbHVnLFxuICAgIGNhdGVnb3J5TWFqb3I6IHByZXNldC5jYXRlZ29yeU1ham9yLFxuICAgIGNhdGVnb3J5TWlub3I6IHByZXNldC5jYXRlZ29yeU1pbm9yLFxuICAgIGRlc2NyaXB0aW9uOiBpbnB1dC5kZXNjcmlwdGlvbixcbiAgICBrZXl3b3JkczogaW5wdXQua2V5d29yZHMsXG4gIH07XG5cbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY3JlYXRlTmF2ZXJDYWZlKGlucHV0Lm93bmVyQWNjb3VudElkLCBhY2NvdW50LnBhc3N3b3JkLCBjcmVhdGVJbnB1dCwge1xuICAgIGRyeVJ1bjogZmFsc2UsXG4gIH0pO1xuXG4gIGlmICghcmVzdWx0LnN1Y2Nlc3MgfHwgIXJlc3VsdC5jYWZlSWQgfHwgIXJlc3VsdC5jYWZlVXJsKSB7XG4gICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiByZXN1bHQuZXJyb3IgfHwgJ+y5tO2OmCDsg53shLEg7Iuk7YyoJyB9O1xuICB9XG5cbiAgY29uc3QgdXNlcklkID0gYXdhaXQgZ2V0Q3VycmVudFVzZXJJZCgpO1xuICBhd2FpdCByZWdpc3RlckNyZWF0ZWRDYWZlSW5EYihcbiAgICB1c2VySWQsXG4gICAgeyBjYWZlSWQ6IHJlc3VsdC5jYWZlSWQsIGNhZmVVcmw6IHJlc3VsdC5jYWZlVXJsLCBuYW1lOiByZXN1bHQubmFtZSB8fCBpbnB1dC5uYW1lIH0sXG4gICAgeyBvd25lckFjY291bnRJZDogaW5wdXQub3duZXJBY2NvdW50SWQgfSxcbiAgKTtcblxuICBjb25zdCBzaGVldFJlc3VsdCA9IGF3YWl0IHN5bmNDYWZlVG9PcGVyYXRpb25zU2hlZXQoe1xuICAgIGNhdGVnb3J5OiBwcmVzZXQuc2hlZXRDYXRlZ29yeSxcbiAgICBuYW1lOiByZXN1bHQubmFtZSB8fCBpbnB1dC5uYW1lLFxuICAgIGNhZmVJZDogcmVzdWx0LmNhZmVJZCxcbiAgICBzbHVnOiBpbnB1dC5zbHVnLFxuICAgIG93bmVyQWNjb3VudElkOiBpbnB1dC5vd25lckFjY291bnRJZCxcbiAgICBvd25lck5pY2tuYW1lOiBhY2NvdW50Lm5pY2tuYW1lIHx8IGlucHV0Lm93bmVyQWNjb3VudElkLFxuICAgIG1lbWJlckNvdW50OiAxLFxuICB9KTtcblxuICByZXZhbGlkYXRlUGF0aCgnL2NhZmUtY3JlYXRlJyk7XG4gIHJldmFsaWRhdGVQYXRoKCcvYWNjb3VudHMnKTtcblxuICByZXR1cm4ge1xuICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgY2FmZVVybDogcmVzdWx0LmNhZmVVcmwsXG4gICAgY2FmZUlkOiByZXN1bHQuY2FmZUlkLFxuICAgIHNoZWV0U3luY2VkOiBzaGVldFJlc3VsdC5jYWZlSW5mb0FkZGVkLFxuICB9O1xufTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoic1VBZ0NhLHdNQUFBIn0=
}),
"[project]/src/features/auto-comment/batch/data:0f032d [app-client] (ecmascript) <text/javascript>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createCafeAction",
    ()=>$$RSC_SERVER_ACTION_1
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
/* __next_internal_action_entry_do_not_use__ [{"40feef0a3060b2edc0cc032cab855d0dd0a49e112f":"createCafeAction"},"src/features/auto-comment/batch/cafe-create-actions.ts",""] */ "use turbopack no side effects";
;
const $$RSC_SERVER_ACTION_1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("40feef0a3060b2edc0cc032cab855d0dd0a49e112f", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "createCafeAction");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
 //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vY2FmZS1jcmVhdGUtYWN0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHNlcnZlcic7XG5cbi8qKlxuICog7Lm07Y6YIFwi6rCc7ISkKOyDneyEsSlcIiDquLDriqXsnZggVUkg7KeE7J6F7KCQLiDsi6TsoJwg7J6Q64+Z7ZmUIOuhnOyngeydgCDsoITrtoBcbiAqIHNoYXJlZC9saWIvbmF2ZXItY2FmZS1jcmVhdGlvbiDsl5Ag7J6I6rOgLCDsl6zquLDshJzripQg66Gc6re47J24IOycoOyggCDsu6jthY3siqTtirjrpbwg67aZ7Jes7IScXG4gKiBTZXJ2ZXIgQWN0aW9uIO2Yle2DnOuhnOunjCDqsJDsi7zri6Qg4oCUIOuhnOyngeydhCDsnbQg7YyM7J287JeQIOyDiOuhnCDsk7Dsp4Ag66eQIOqygy5cbiAqL1xuaW1wb3J0IHsgcmV2YWxpZGF0ZVBhdGggfSBmcm9tICduZXh0L2NhY2hlJztcbmltcG9ydCB7IGNvbm5lY3REQiB9IGZyb20gJ0Avc2hhcmVkL2xpYi9tb25nb2RiJztcbmltcG9ydCB7IEFjY291bnQgfSBmcm9tICdAL3NoYXJlZC9tb2RlbHMvYWNjb3VudCc7XG5pbXBvcnQgeyBnZXRDdXJyZW50VXNlcklkIH0gZnJvbSAnQC9zaGFyZWQvY29uZmlnL3VzZXInO1xuaW1wb3J0IHtcbiAgY3JlYXRlTmF2ZXJDYWZlLFxuICByZWdpc3RlckNyZWF0ZWRDYWZlSW5EYixcbiAgZ2V0QXZhaWxhYmxlT3duZXJBY2NvdW50cyxcbiAgQ0FGRV9UT1BJQ19QUkVTRVRTLFxuICB0eXBlIENyZWF0ZUNhZmVJbnB1dCxcbn0gZnJvbSAnQC9zaGFyZWQvbGliL25hdmVyLWNhZmUtY3JlYXRpb24nO1xuaW1wb3J0IHsgc3luY0NhZmVUb09wZXJhdGlvbnNTaGVldCB9IGZyb20gJ0Avc2hhcmVkL2xpYi9uYXZlci1jYWZlLWNyZWF0aW9uL3NoZWV0LXN5bmMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIENhZmVDcmVhdGVPd25lck9wdGlvbiB7XG4gIGFjY291bnRJZDogc3RyaW5nO1xuICBuaWNrbmFtZTogc3RyaW5nO1xuICByb2xlPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENhZmVDcmVhdGVGb3JtRGF0YSB7XG4gIG93bmVyczogQ2FmZUNyZWF0ZU93bmVyT3B0aW9uW107XG4gIHByZXNldHM6IHR5cGVvZiBDQUZFX1RPUElDX1BSRVNFVFM7XG59XG5cbi8qKiBVSSDtj7zsnYQg7LGE7Jqw64qUIOuNsCDtlYTsmpTtlZwg642w7J207YSwOiDslYTsp4Eg7Lm07Y6YIOyXhuuKlCDqs4TsoJUg66qp66GdICsg7Lm07YWM6rOg66asIO2UhOumrOyFiyAqL1xuZXhwb3J0IGNvbnN0IGdldENhZmVDcmVhdGVGb3JtRGF0YUFjdGlvbiA9IGFzeW5jICgpOiBQcm9taXNlPENhZmVDcmVhdGVGb3JtRGF0YT4gPT4ge1xuICBhd2FpdCBjb25uZWN0REIoKTtcbiAgY29uc3QgdXNlcklkID0gYXdhaXQgZ2V0Q3VycmVudFVzZXJJZCgpO1xuICBjb25zdCBvd25lcnMgPSBhd2FpdCBnZXRBdmFpbGFibGVPd25lckFjY291bnRzKHVzZXJJZCk7XG4gIHJldHVybiB7IG93bmVycywgcHJlc2V0czogQ0FGRV9UT1BJQ19QUkVTRVRTIH07XG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIENhZmVDcmVhdGVJbnB1dCB7XG4gIG93bmVyQWNjb3VudElkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgc2x1Zzogc3RyaW5nO1xuICBwcmVzZXRLZXk6IHN0cmluZztcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbiAga2V5d29yZHM6IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENhZmVDcmVhdGVBY3Rpb25SZXN1bHQge1xuICBzdWNjZXNzOiBib29sZWFuO1xuICBjYWZlVXJsPzogc3RyaW5nO1xuICBjYWZlSWQ/OiBzdHJpbmc7XG4gIGVycm9yPzogc3RyaW5nO1xuICBzaGVldFN5bmNlZD86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVDYWZlQWN0aW9uID0gYXN5bmMgKGlucHV0OiBDYWZlQ3JlYXRlSW5wdXQpOiBQcm9taXNlPENhZmVDcmVhdGVBY3Rpb25SZXN1bHQ+ID0+IHtcbiAgYXdhaXQgY29ubmVjdERCKCk7XG5cbiAgY29uc3QgcHJlc2V0ID0gQ0FGRV9UT1BJQ19QUkVTRVRTLmZpbmQoKHApID0+IHAua2V5ID09PSBpbnB1dC5wcmVzZXRLZXkpO1xuICBpZiAoIXByZXNldCkge1xuICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ+yVjCDsiJgg7JeG64qUIOy5tO2FjOqzoOumrCDtlITrpqzshYs6ICcgKyBpbnB1dC5wcmVzZXRLZXkgfTtcbiAgfVxuXG4gIGNvbnN0IGFjY291bnQgPSBhd2FpdCBBY2NvdW50LmZpbmRPbmUoeyBhY2NvdW50SWQ6IGlucHV0Lm93bmVyQWNjb3VudElkIH0pLmxlYW4oKTtcbiAgaWYgKCFhY2NvdW50KSB7XG4gICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAn6rOE7KCV7J2EIOywvuydhCDsiJgg7JeG7J2MOiAnICsgaW5wdXQub3duZXJBY2NvdW50SWQgfTtcbiAgfVxuXG4gIGNvbnN0IGNyZWF0ZUlucHV0OiBDcmVhdGVDYWZlSW5wdXQgPSB7XG4gICAgbmFtZTogaW5wdXQubmFtZSxcbiAgICBzbHVnOiBpbnB1dC5zbHVnLFxuICAgIGNhdGVnb3J5TWFqb3I6IHByZXNldC5jYXRlZ29yeU1ham9yLFxuICAgIGNhdGVnb3J5TWlub3I6IHByZXNldC5jYXRlZ29yeU1pbm9yLFxuICAgIGRlc2NyaXB0aW9uOiBpbnB1dC5kZXNjcmlwdGlvbixcbiAgICBrZXl3b3JkczogaW5wdXQua2V5d29yZHMsXG4gIH07XG5cbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY3JlYXRlTmF2ZXJDYWZlKGlucHV0Lm93bmVyQWNjb3VudElkLCBhY2NvdW50LnBhc3N3b3JkLCBjcmVhdGVJbnB1dCwge1xuICAgIGRyeVJ1bjogZmFsc2UsXG4gIH0pO1xuXG4gIGlmICghcmVzdWx0LnN1Y2Nlc3MgfHwgIXJlc3VsdC5jYWZlSWQgfHwgIXJlc3VsdC5jYWZlVXJsKSB7XG4gICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiByZXN1bHQuZXJyb3IgfHwgJ+y5tO2OmCDsg53shLEg7Iuk7YyoJyB9O1xuICB9XG5cbiAgY29uc3QgdXNlcklkID0gYXdhaXQgZ2V0Q3VycmVudFVzZXJJZCgpO1xuICBhd2FpdCByZWdpc3RlckNyZWF0ZWRDYWZlSW5EYihcbiAgICB1c2VySWQsXG4gICAgeyBjYWZlSWQ6IHJlc3VsdC5jYWZlSWQsIGNhZmVVcmw6IHJlc3VsdC5jYWZlVXJsLCBuYW1lOiByZXN1bHQubmFtZSB8fCBpbnB1dC5uYW1lIH0sXG4gICAgeyBvd25lckFjY291bnRJZDogaW5wdXQub3duZXJBY2NvdW50SWQgfSxcbiAgKTtcblxuICBjb25zdCBzaGVldFJlc3VsdCA9IGF3YWl0IHN5bmNDYWZlVG9PcGVyYXRpb25zU2hlZXQoe1xuICAgIGNhdGVnb3J5OiBwcmVzZXQuc2hlZXRDYXRlZ29yeSxcbiAgICBuYW1lOiByZXN1bHQubmFtZSB8fCBpbnB1dC5uYW1lLFxuICAgIGNhZmVJZDogcmVzdWx0LmNhZmVJZCxcbiAgICBzbHVnOiBpbnB1dC5zbHVnLFxuICAgIG93bmVyQWNjb3VudElkOiBpbnB1dC5vd25lckFjY291bnRJZCxcbiAgICBvd25lck5pY2tuYW1lOiBhY2NvdW50Lm5pY2tuYW1lIHx8IGlucHV0Lm93bmVyQWNjb3VudElkLFxuICAgIG1lbWJlckNvdW50OiAxLFxuICB9KTtcblxuICByZXZhbGlkYXRlUGF0aCgnL2NhZmUtY3JlYXRlJyk7XG4gIHJldmFsaWRhdGVQYXRoKCcvYWNjb3VudHMnKTtcblxuICByZXR1cm4ge1xuICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgY2FmZVVybDogcmVzdWx0LmNhZmVVcmwsXG4gICAgY2FmZUlkOiByZXN1bHQuY2FmZUlkLFxuICAgIHNoZWV0U3luY2VkOiBzaGVldFJlc3VsdC5jYWZlSW5mb0FkZGVkLFxuICB9O1xufTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiMlRBd0RhLDZMQUFBIn0=
}),
"[project]/src/app/cafe-create/cafe-create-ui.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CafeCreateUI",
    ()=>CafeCreateUI
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/cn.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/ui/index.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$batch$2f$data$3a$68b425__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/src/features/auto-comment/batch/data:68b425 [app-client] (ecmascript) <text/javascript>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$batch$2f$data$3a$0f032d__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/src/features/auto-comment/batch/data:0f032d [app-client] (ecmascript) <text/javascript>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
const CafeCreateUI = ()=>{
    _s();
    const [isPending, startTransition] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransition"])();
    const [owners, setOwners] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [presets, setPresets] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [ownerAccountId, setOwnerAccountId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [presetKey, setPresetKey] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [name, setName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [slug, setSlug] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [description, setDescription] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [keywordsText, setKeywordsText] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [result, setResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CafeCreateUI.useEffect": ()=>{
            const loadData = {
                "CafeCreateUI.useEffect.loadData": async ()=>{
                    const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$batch$2f$data$3a$68b425__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["getCafeCreateFormDataAction"])();
                    setOwners(data.owners);
                    setPresets(data.presets);
                    setOwnerAccountId(data.owners[0]?.accountId ?? '');
                    setPresetKey(data.presets[0]?.key ?? '');
                }
            }["CafeCreateUI.useEffect.loadData"];
            loadData();
        }
    }["CafeCreateUI.useEffect"], []);
    const canSubmit = ownerAccountId.trim() !== '' && presetKey.trim() !== '' && name.trim() !== '' && slug.trim() !== '' && description.trim() !== '';
    const handleSubmit = ()=>{
        if (!canSubmit) return;
        startTransition(async ()=>{
            setResult(null);
            const keywords = keywordsText.split(',').map((k)=>k.trim()).filter(Boolean);
            const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$batch$2f$data$3a$0f032d__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["createCafeAction"])({
                ownerAccountId,
                name: name.trim(),
                slug: slug.trim(),
                presetKey,
                description: description.trim(),
                keywords
            });
            setResult(res);
            if (res.success) {
                const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$batch$2f$data$3a$68b425__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["getCafeCreateFormDataAction"])();
                setOwners(data.owners);
                setPresets(data.presets);
                setOwnerAccountId(data.owners[0]?.accountId ?? '');
                setPresetKey(data.presets[0]?.key ?? '');
                setName('');
                setSlug('');
                setDescription('');
                setKeywordsText('');
            }
        });
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('space-y-6'),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('space-y-4'),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-xs font-medium text-(--ink-muted) mb-2 block'),
                                children: [
                                    "소유 계정 (",
                                    owners.length,
                                    "개 사용 가능)"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                                lineNumber: 82,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: ownerAccountId,
                                onChange: (e)=>setOwnerAccountId(e.target.value),
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-full px-4 py-2 rounded-xl border border-(--border) bg-(--surface) text-sm text-(--ink)'),
                                children: [
                                    owners.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "사용 가능한 계정 없음"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                                        lineNumber: 92,
                                        columnNumber: 37
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    owners.map((owner)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: owner.accountId,
                                            children: [
                                                owner.nickname,
                                                " (",
                                                owner.accountId,
                                                ") ",
                                                owner.role ? `- ${owner.role}` : ''
                                            ]
                                        }, owner.accountId, true, {
                                            fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                                            lineNumber: 94,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                                lineNumber: 85,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                        lineNumber: 81,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-xs font-medium text-(--ink-muted) mb-2 block'),
                                children: "카테고리"
                            }, void 0, false, {
                                fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                                lineNumber: 102,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: presetKey,
                                onChange: (e)=>setPresetKey(e.target.value),
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-full px-4 py-2 rounded-xl border border-(--border) bg-(--surface) text-sm text-(--ink)'),
                                children: presets.map((preset)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: preset.key,
                                        children: preset.label
                                    }, preset.key, false, {
                                        fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                                        lineNumber: 113,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)))
                            }, void 0, false, {
                                fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                                lineNumber: 105,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                        lineNumber: 101,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-xs font-medium text-(--ink-muted) mb-2 block'),
                                children: "카페이름"
                            }, void 0, false, {
                                fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                                lineNumber: 121,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                value: name,
                                onChange: (e)=>setName(e.target.value),
                                placeholder: "예: 생활 살림노트",
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-full px-4 py-2 rounded-xl border border-(--border) bg-(--surface) text-sm text-(--ink)')
                            }, void 0, false, {
                                fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                                lineNumber: 124,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                        lineNumber: 120,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-xs font-medium text-(--ink-muted) mb-2 block'),
                                children: "카페주소 (cafe.naver.com/뒤에 붙는 영문 주소)"
                            }, void 0, false, {
                                fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                                lineNumber: 135,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                value: slug,
                                onChange: (e)=>setSlug(e.target.value.replace(/[^a-zA-Z0-9]/g, '')),
                                placeholder: "예: livingnote702",
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-full px-4 py-2 rounded-xl border border-(--border) bg-(--surface) text-sm text-(--ink)')
                            }, void 0, false, {
                                fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                                lineNumber: 138,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                        lineNumber: 134,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-xs font-medium text-(--ink-muted) mb-2 block'),
                                children: "카페 설명 (100자 이내)"
                            }, void 0, false, {
                                fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                                lineNumber: 149,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                value: description,
                                onChange: (e)=>setDescription(e.target.value.slice(0, 100)),
                                rows: 3,
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-full px-4 py-2 rounded-xl border border-(--border) bg-(--surface) text-sm text-(--ink)')
                            }, void 0, false, {
                                fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                                lineNumber: 152,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-xs text-(--ink-muted) mt-1'),
                                children: [
                                    description.length,
                                    "/100"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                                lineNumber: 160,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                        lineNumber: 148,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-xs font-medium text-(--ink-muted) mb-2 block'),
                                children: "카페 검색어 (쉼표로 구분, 최대 10개)"
                            }, void 0, false, {
                                fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                                lineNumber: 164,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                value: keywordsText,
                                onChange: (e)=>setKeywordsText(e.target.value),
                                placeholder: "예: 생활, 살림, 살림정보",
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-full px-4 py-2 rounded-xl border border-(--border) bg-(--surface) text-sm text-(--ink)')
                            }, void 0, false, {
                                fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                                lineNumber: 167,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                        lineNumber: 163,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                lineNumber: 80,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                variant: "teal",
                size: "lg",
                fullWidth: true,
                isLoading: isPending,
                disabled: !canSubmit,
                onClick: handleSubmit,
                children: "카페 개설 실행 (실제로 생성됨)"
            }, void 0, false, {
                fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                lineNumber: 178,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            result && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('rounded-2xl border px-4 py-4', result.success ? 'border-(--success) bg-(--success-soft)' : 'border-(--danger) bg-(--danger-soft)'),
                children: result.success ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('space-y-1'),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('font-semibold text-(--success)'),
                            children: "카페 개설 완료"
                        }, void 0, false, {
                            fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                            lineNumber: 200,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-sm text-(--ink)'),
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: result.cafeUrl,
                                target: "_blank",
                                rel: "noreferrer",
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('underline'),
                                children: result.cafeUrl
                            }, void 0, false, {
                                fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                                lineNumber: 202,
                                columnNumber: 17
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                            lineNumber: 201,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-xs text-(--ink-muted)'),
                            children: [
                                "cafeId: ",
                                result.cafeId,
                                " · 시트 동기화: ",
                                result.sheetSynced ? '완료' : '실패(수동 확인 필요)'
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                            lineNumber: 211,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                    lineNumber: 199,
                    columnNumber: 13
                }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-sm text-(--danger)'),
                    children: result.error
                }, void 0, false, {
                    fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                    lineNumber: 216,
                    columnNumber: 13
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
                lineNumber: 190,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/cafe-create/cafe-create-ui.tsx",
        lineNumber: 79,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(CafeCreateUI, "D9ZOOjZkJSk4wU3Jgxp/eiJ9YSU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransition"]
    ];
});
_c = CafeCreateUI;
var _c;
__turbopack_context__.k.register(_c, "CafeCreateUI");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/entities/account/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

// Model (Types)
__turbopack_context__.s([]);
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/entities/cafe/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

// Model (Types)
__turbopack_context__.s([]);
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/shared/types/post-options.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/shared/types/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$types$2f$post$2d$options$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/types/post-options.ts [app-client] (ecmascript)");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/entities/post-options/model/store/index.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "allowCommentAtom",
    ()=>allowCommentAtom,
    "allowScrapAtom",
    ()=>allowScrapAtom,
    "postOptionsAtom",
    ()=>postOptionsAtom,
    "resetPostOptionsAtom",
    ()=>resetPostOptionsAtom
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$vanilla$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jotai/esm/vanilla.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$types$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/types/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$types$2f$post$2d$options$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/types/post-options.ts [app-client] (ecmascript)");
'use client';
;
;
const postOptionsAtom = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$vanilla$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["atom"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$types$2f$post$2d$options$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_POST_OPTIONS"]);
const allowCommentAtom = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$vanilla$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["atom"])((get)=>get(postOptionsAtom).allowComment, (get, set, value)=>set(postOptionsAtom, {
        ...get(postOptionsAtom),
        allowComment: value
    }));
const allowScrapAtom = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$vanilla$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["atom"])((get)=>get(postOptionsAtom).allowScrap, (get, set, value)=>set(postOptionsAtom, {
        ...get(postOptionsAtom),
        allowScrap: value
    }));
const resetPostOptionsAtom = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$vanilla$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["atom"])(null, (_get, set)=>{
    set(postOptionsAtom, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$types$2f$post$2d$options$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_POST_OPTIONS"]);
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/entities/post-options/model/types/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$types$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/types/index.ts [app-client] (ecmascript) <locals>");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/entities/post-options/model/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$post$2d$options$2f$model$2f$store$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/entities/post-options/model/store/index.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$post$2d$options$2f$model$2f$types$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/entities/post-options/model/types/index.ts [app-client] (ecmascript) <locals>");
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/entities/post-options/ui/post-options-ui/index.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PostOptionsUI",
    ()=>PostOptionsUI
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/cn.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/ui/index.ts [app-client] (ecmascript)");
'use client';
;
;
;
const PostOptionsUI = ({ options, onChange })=>{
    const handleChange = (key, value)=>{
        onChange({
            ...options,
            [key]: value
        });
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('space-y-4'),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('space-y-3'),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Checkbox"], {
                    label: "댓글 허용",
                    checked: options.allowComment,
                    onChange: (e)=>handleChange('allowComment', e.target.checked)
                }, void 0, false, {
                    fileName: "[project]/src/entities/post-options/ui/post-options-ui/index.tsx",
                    lineNumber: 20,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Checkbox"], {
                    label: "스크랩 허용",
                    checked: options.allowScrap,
                    onChange: (e)=>handleChange('allowScrap', e.target.checked)
                }, void 0, false, {
                    fileName: "[project]/src/entities/post-options/ui/post-options-ui/index.tsx",
                    lineNumber: 26,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Checkbox"], {
                    label: "복사/저장 허용",
                    checked: options.allowCopy,
                    onChange: (e)=>handleChange('allowCopy', e.target.checked)
                }, void 0, false, {
                    fileName: "[project]/src/entities/post-options/ui/post-options-ui/index.tsx",
                    lineNumber: 32,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Checkbox"], {
                    label: "자동출처 사용",
                    checked: options.useAutoSource,
                    onChange: (e)=>handleChange('useAutoSource', e.target.checked)
                }, void 0, false, {
                    fileName: "[project]/src/entities/post-options/ui/post-options-ui/index.tsx",
                    lineNumber: 38,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('space-y-3'),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Checkbox"], {
                            label: "CCL 사용",
                            checked: options.useCcl,
                            onChange: (e)=>handleChange('useCcl', e.target.checked)
                        }, void 0, false, {
                            fileName: "[project]/src/entities/post-options/ui/post-options-ui/index.tsx",
                            lineNumber: 45,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        options.useCcl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('ml-8 space-y-3 p-4 rounded-xl bg-surface-muted'),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex items-center justify-between gap-4'),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-sm text-ink-muted'),
                                            children: "영리적 이용"
                                        }, void 0, false, {
                                            fileName: "[project]/src/entities/post-options/ui/post-options-ui/index.tsx",
                                            lineNumber: 54,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Select"], {
                                            value: options.cclCommercial,
                                            onChange: (e)=>handleChange('cclCommercial', e.target.value),
                                            options: [
                                                {
                                                    value: 'allow',
                                                    label: '허용'
                                                },
                                                {
                                                    value: 'disallow',
                                                    label: '허용 안 함'
                                                }
                                            ],
                                            fullWidth: false,
                                            className: "w-32"
                                        }, void 0, false, {
                                            fileName: "[project]/src/entities/post-options/ui/post-options-ui/index.tsx",
                                            lineNumber: 55,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/entities/post-options/ui/post-options-ui/index.tsx",
                                    lineNumber: 53,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex items-center justify-between gap-4'),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-sm text-ink-muted'),
                                            children: "콘텐츠 변경"
                                        }, void 0, false, {
                                            fileName: "[project]/src/entities/post-options/ui/post-options-ui/index.tsx",
                                            lineNumber: 68,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Select"], {
                                            value: options.cclModify,
                                            onChange: (e)=>handleChange('cclModify', e.target.value),
                                            options: [
                                                {
                                                    value: 'allow',
                                                    label: '허용'
                                                },
                                                {
                                                    value: 'same',
                                                    label: '동일조건허용'
                                                },
                                                {
                                                    value: 'disallow',
                                                    label: '허용 안 함'
                                                }
                                            ],
                                            fullWidth: false,
                                            className: "w-32"
                                        }, void 0, false, {
                                            fileName: "[project]/src/entities/post-options/ui/post-options-ui/index.tsx",
                                            lineNumber: 69,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/entities/post-options/ui/post-options-ui/index.tsx",
                                    lineNumber: 67,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/entities/post-options/ui/post-options-ui/index.tsx",
                            lineNumber: 52,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/entities/post-options/ui/post-options-ui/index.tsx",
                    lineNumber: 44,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/src/entities/post-options/ui/post-options-ui/index.tsx",
            lineNumber: 19,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/entities/post-options/ui/post-options-ui/index.tsx",
        lineNumber: 18,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_c = PostOptionsUI;
var _c;
__turbopack_context__.k.register(_c, "PostOptionsUI");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/entities/post-options/ui/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$post$2d$options$2f$ui$2f$post$2d$options$2d$ui$2f$index$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/entities/post-options/ui/post-options-ui/index.tsx [app-client] (ecmascript)");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/entities/post-options/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$post$2d$options$2f$model$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/entities/post-options/model/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$post$2d$options$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/entities/post-options/ui/index.ts [app-client] (ecmascript) <locals>");
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/entities/queue/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

// Model (Types)
__turbopack_context__.s([]);
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/entities/store/post-options-atom.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$post$2d$options$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/entities/post-options/index.ts [app-client] (ecmascript) <locals>");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/entities/store/cafe-atom.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cafesAtom",
    ()=>cafesAtom,
    "cafesInitializedAtom",
    ()=>cafesInitializedAtom,
    "cafesLoadingAtom",
    ()=>cafesLoadingAtom,
    "resetCafesAtom",
    ()=>resetCafesAtom,
    "selectedCafeAtom",
    ()=>selectedCafeAtom,
    "selectedCafeIdAtom",
    ()=>selectedCafeIdAtom
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$vanilla$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jotai/esm/vanilla.mjs [app-client] (ecmascript)");
'use client';
;
const cafesAtom = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$vanilla$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["atom"])([]);
const selectedCafeIdAtom = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$vanilla$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["atom"])('');
const cafesLoadingAtom = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$vanilla$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["atom"])(false);
const cafesInitializedAtom = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$vanilla$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["atom"])(false);
const selectedCafeAtom = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$vanilla$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["atom"])((get)=>{
    const cafes = get(cafesAtom);
    const selectedId = get(selectedCafeIdAtom);
    return cafes.find((c)=>c.cafeId === selectedId) || null;
});
const resetCafesAtom = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$vanilla$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["atom"])(null, (_get, set)=>{
    set(cafesAtom, []);
    set(selectedCafeIdAtom, '');
    set(cafesLoadingAtom, false);
    set(cafesInitializedAtom, false);
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/entities/store/post-draft-atom.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "postKeywordsTextAtom",
    ()=>postKeywordsTextAtom,
    "postRefAtom",
    ()=>postRefAtom
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$vanilla$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jotai/esm/vanilla.mjs [app-client] (ecmascript)");
'use client';
;
const postKeywordsTextAtom = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$vanilla$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["atom"])('');
const postRefAtom = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$vanilla$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["atom"])('');
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/entities/store/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$store$2f$post$2d$options$2d$atom$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/entities/store/post-options-atom.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$store$2f$cafe$2d$atom$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/entities/store/cafe-atom.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$store$2f$post$2d$draft$2d$atom$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/entities/store/post-draft-atom.ts [app-client] (ecmascript)");
;
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/entities/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$account$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/entities/account/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$cafe$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/entities/cafe/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$post$2d$options$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/entities/post-options/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$queue$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/entities/queue/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$store$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/entities/store/index.ts [app-client] (ecmascript) <locals>");
;
;
;
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/entities/store/index.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "allowCommentAtom",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$post$2d$options$2f$model$2f$store$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["allowCommentAtom"],
    "allowScrapAtom",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$post$2d$options$2f$model$2f$store$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["allowScrapAtom"],
    "cafesAtom",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$store$2f$cafe$2d$atom$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cafesAtom"],
    "cafesInitializedAtom",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$store$2f$cafe$2d$atom$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cafesInitializedAtom"],
    "cafesLoadingAtom",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$store$2f$cafe$2d$atom$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cafesLoadingAtom"],
    "postKeywordsTextAtom",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$store$2f$post$2d$draft$2d$atom$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["postKeywordsTextAtom"],
    "postOptionsAtom",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$post$2d$options$2f$model$2f$store$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["postOptionsAtom"],
    "postRefAtom",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$store$2f$post$2d$draft$2d$atom$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["postRefAtom"],
    "resetCafesAtom",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$store$2f$cafe$2d$atom$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resetCafesAtom"],
    "resetPostOptionsAtom",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$post$2d$options$2f$model$2f$store$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resetPostOptionsAtom"],
    "selectedCafeAtom",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$store$2f$cafe$2d$atom$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectedCafeAtom"],
    "selectedCafeIdAtom",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$store$2f$cafe$2d$atom$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectedCafeIdAtom"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$store$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/entities/store/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$post$2d$options$2f$model$2f$store$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/entities/post-options/model/store/index.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$store$2f$cafe$2d$atom$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/entities/store/cafe-atom.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$store$2f$post$2d$draft$2d$atom$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/entities/store/post-draft-atom.ts [app-client] (ecmascript)");
}),
"[project]/src/features/auth/data:eda33e [app-client] (ecmascript) <text/javascript>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "logout",
    ()=>$$RSC_SERVER_ACTION_1
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
/* __next_internal_action_entry_do_not_use__ [{"00f822b6752b1a41b9fa3cfa584d6ad9417168a414":"logout"},"src/features/auth/actions.ts",""] */ "use turbopack no side effects";
;
const $$RSC_SERVER_ACTION_1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("00f822b6752b1a41b9fa3cfa584d6ad9417168a414", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "logout");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
 //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vYWN0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHNlcnZlcic7XG5cbmltcG9ydCB7IGNvbm5lY3REQiB9IGZyb20gJ0Avc2hhcmVkL2xpYi9tb25nb2RiJztcbmltcG9ydCB7IFVzZXIgfSBmcm9tICdAL3NoYXJlZC9tb2RlbHMnO1xuaW1wb3J0IHsgc2V0Q3VycmVudFVzZXJJZCwgZ2V0Q3VycmVudFVzZXJJZCB9IGZyb20gJ0Avc2hhcmVkL2NvbmZpZy91c2VyJztcbmltcG9ydCB7IGhhc2hQYXNzd29yZCwgaXNIYXNoZWRQYXNzd29yZCwgdmVyaWZ5UGFzc3dvcmQgfSBmcm9tICdAL3NoYXJlZC9saWIvcGFzc3dvcmQnO1xuXG5leHBvcnQgaW50ZXJmYWNlIExvZ2luUmVzdWx0IHtcbiAgc3VjY2VzczogYm9vbGVhbjtcbiAgZXJyb3I/OiBzdHJpbmc7XG4gIHVzZXI/OiB7XG4gICAgdXNlcklkOiBzdHJpbmc7XG4gICAgbG9naW5JZDogc3RyaW5nO1xuICAgIGRpc3BsYXlOYW1lOiBzdHJpbmc7XG4gIH07XG59XG5cbmV4cG9ydCBjb25zdCBsb2dpbiA9IGFzeW5jIChsb2dpbklkOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPExvZ2luUmVzdWx0PiA9PiB7XG4gIHRyeSB7XG4gICAgYXdhaXQgY29ubmVjdERCKCk7XG5cbiAgICBjb25zdCB1c2VyID0gYXdhaXQgVXNlci5maW5kT25lKHsgbG9naW5JZCwgaXNBY3RpdmU6IHRydWUgfSk7XG5cbiAgICBpZiAoIXVzZXIpIHtcbiAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ+yhtOyerO2VmOyngCDslYrripQg7JWE7J2065SUJyB9O1xuICAgIH1cblxuICAgIGNvbnN0IHBhc3N3b3JkTWF0Y2hlcyA9IGlzSGFzaGVkUGFzc3dvcmQodXNlci5wYXNzd29yZClcbiAgICAgID8gdmVyaWZ5UGFzc3dvcmQocGFzc3dvcmQsIHVzZXIucGFzc3dvcmQpXG4gICAgICA6IHVzZXIucGFzc3dvcmQgPT09IHBhc3N3b3JkO1xuXG4gICAgaWYgKCFwYXNzd29yZE1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ+u5hOuwgOuyiO2YuCDrtojsnbzsuZgnIH07XG4gICAgfVxuXG4gICAgaWYgKCFpc0hhc2hlZFBhc3N3b3JkKHVzZXIucGFzc3dvcmQpKSB7XG4gICAgICB1c2VyLnBhc3N3b3JkID0gaGFzaFBhc3N3b3JkKHBhc3N3b3JkKTtcbiAgICAgIGF3YWl0IHVzZXIuc2F2ZSgpO1xuICAgIH1cblxuICAgIGF3YWl0IHNldEN1cnJlbnRVc2VySWQodXNlci51c2VySWQpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICB1c2VyOiB7XG4gICAgICAgIHVzZXJJZDogdXNlci51c2VySWQsXG4gICAgICAgIGxvZ2luSWQ6IHVzZXIubG9naW5JZCxcbiAgICAgICAgZGlzcGxheU5hbWU6IHVzZXIuZGlzcGxheU5hbWUsXG4gICAgICB9LFxuICAgIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignW0FVVEhdIOuhnOq3uOyduCDsi6TtjKg6JywgZXJyb3IpO1xuICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ+uhnOq3uOyduCDsspjrpqwg7KSRIOyYpOulmCDrsJzsg50nIH07XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBsb2dvdXQgPSBhc3luYyAoKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gIGF3YWl0IHNldEN1cnJlbnRVc2VySWQoJycpO1xufTtcblxuZXhwb3J0IGNvbnN0IGdldEN1cnJlbnRVc2VyID0gYXN5bmMgKCkgPT4ge1xuICB0cnkge1xuICAgIGF3YWl0IGNvbm5lY3REQigpO1xuICAgIGNvbnN0IHVzZXJJZCA9IGF3YWl0IGdldEN1cnJlbnRVc2VySWQoKTtcblxuICAgIGlmICghdXNlcklkIHx8IHVzZXJJZCA9PT0gJ2RlZmF1bHQtdXNlcicpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBVc2VyLmZpbmRPbmUoeyB1c2VySWQsIGlzQWN0aXZlOiB0cnVlIH0pLmxlYW4oKTtcblxuICAgIGlmICghdXNlcikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVzZXJJZDogdXNlci51c2VySWQsXG4gICAgICBsb2dpbklkOiB1c2VyLmxvZ2luSWQsXG4gICAgICBkaXNwbGF5TmFtZTogdXNlci5kaXNwbGF5TmFtZSxcbiAgICB9O1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IHJlZ2lzdGVyID0gYXN5bmMgKFxuICBsb2dpbklkOiBzdHJpbmcsXG4gIHBhc3N3b3JkOiBzdHJpbmcsXG4gIGRpc3BsYXlOYW1lOiBzdHJpbmdcbik6IFByb21pc2U8TG9naW5SZXN1bHQ+ID0+IHtcbiAgdHJ5IHtcbiAgICBhd2FpdCBjb25uZWN0REIoKTtcblxuICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgVXNlci5maW5kT25lKHsgbG9naW5JZCB9KTtcbiAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ+ydtOuvuCDsobTsnqztlZjripQg7JWE7J2065SUJyB9O1xuICAgIH1cblxuICAgIGNvbnN0IHVzZXJJZCA9IGB1c2VyLSR7RGF0ZS5ub3coKX1gO1xuXG4gICAgYXdhaXQgVXNlci5jcmVhdGUoe1xuICAgICAgdXNlcklkLFxuICAgICAgbG9naW5JZCxcbiAgICAgIHBhc3N3b3JkOiBoYXNoUGFzc3dvcmQocGFzc3dvcmQpLFxuICAgICAgZGlzcGxheU5hbWUsXG4gICAgfSk7XG5cbiAgICBhd2FpdCBzZXRDdXJyZW50VXNlcklkKHVzZXJJZCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIHVzZXI6IHsgdXNlcklkLCBsb2dpbklkLCBkaXNwbGF5TmFtZSB9LFxuICAgIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignW0FVVEhdIO2ajOybkOqwgOyehSDsi6TtjKg6JywgZXJyb3IpO1xuICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ+2ajOybkOqwgOyehSDsspjrpqwg7KSRIOyYpOulmCDrsJzsg50nIH07XG4gIH1cbn07XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6InVSQXdEYSxtTEFBQSJ9
}),
"[project]/src/widgets/page-layout/ui/app-header.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AppHeader",
    ()=>AppHeader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jotai/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/entities/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$store$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/entities/store/index.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/features/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auth$2f$data$3a$eda33e__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/src/features/auth/data:eda33e [app-client] (ecmascript) <text/javascript>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/cn.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/ui/index.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$store$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/store/index.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
;
;
// 주요 메뉴
const MAIN_NAV = [
    {
        href: '/viral',
        label: '바이럴'
    },
    {
        href: '/manual-post',
        label: '수동'
    },
    {
        href: '/publish',
        label: '분리'
    },
    {
        href: '/comment-jobs',
        label: '댓글작업'
    },
    {
        href: '/queue',
        label: '큐'
    }
];
// 부가 메뉴
const SUB_NAV = [
    {
        href: '/nickname-change',
        label: '닉네임'
    },
    {
        href: '/accounts',
        label: '계정'
    },
    {
        href: '/cafe-join',
        label: '카페가입'
    },
    {
        href: '/settings',
        label: '설정'
    }
];
const AppHeader = ()=>{
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAtom"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$store$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["userAtom"]);
    const [isLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAtom"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$store$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["userLoadingAtom"]);
    const [, setIsInitialized] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAtom"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$store$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["userInitializedAtom"]);
    const [, resetCafes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAtom"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$store$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resetCafesAtom"]);
    const [isDropdownOpen, setIsDropdownOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const dropdownRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const dropdownId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AppHeader.useEffect": ()=>{
            const handleClickOutside = {
                "AppHeader.useEffect.handleClickOutside": (event)=>{
                    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                        setIsDropdownOpen(false);
                    }
                }
            }["AppHeader.useEffect.handleClickOutside"];
            const handleEscape = {
                "AppHeader.useEffect.handleEscape": (event)=>{
                    if (event.key === 'Escape') {
                        setIsDropdownOpen(false);
                    }
                }
            }["AppHeader.useEffect.handleEscape"];
            if (isDropdownOpen) {
                document.addEventListener('mousedown', handleClickOutside);
                document.addEventListener('keydown', handleEscape);
            }
            return ({
                "AppHeader.useEffect": ()=>{
                    document.removeEventListener('mousedown', handleClickOutside);
                    document.removeEventListener('keydown', handleEscape);
                }
            })["AppHeader.useEffect"];
        }
    }["AppHeader.useEffect"], [
        isDropdownOpen
    ]);
    const handleLogout = async ()=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auth$2f$data$3a$eda33e__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["logout"])();
        setUser(null);
        setIsInitialized(false);
        resetCafes();
        setIsDropdownOpen(false);
        router.push('/login');
        router.refresh();
    };
    const NavLink = ({ href, label, layoutId })=>{
        const isActive = pathname === href;
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            href: href,
            "aria-current": isActive ? 'page' : undefined,
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('relative inline-flex min-h-9 items-center rounded-md px-2.5 py-1.5 text-sm font-medium', 'transition-colors duration-200', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--info) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)', isActive ? 'text-(--background)' : 'text-(--ink-muted) hover:text-(--ink)'),
            children: [
                isActive && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                    layoutId: layoutId,
                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('absolute inset-0 bg-(--accent) rounded-md'),
                    transition: {
                        type: 'tween',
                        duration: 0.2,
                        ease: 'easeOut'
                    }
                }, void 0, false, {
                    fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                    lineNumber: 96,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "relative z-10",
                    children: label
                }, void 0, false, {
                    fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                    lineNumber: 102,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
            lineNumber: 85,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0));
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('sticky top-0 z-50 bg-(--surface)/95 backdrop-blur-xl', 'border-b border-(--border-light)'),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('mx-auto max-w-6xl px-4 py-2.5 lg:px-6'),
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/",
                        "aria-label": "Viro 홈",
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex min-h-10 shrink-0 items-center gap-2 rounded-lg', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--info) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)'),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-sm font-bold text-background'),
                                children: "V"
                            }, void 0, false, {
                                fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                lineNumber: 124,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('font-semibold text-(--ink)'),
                                children: "Viro"
                            }, void 0, false, {
                                fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                lineNumber: 131,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                        lineNumber: 116,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex min-w-0 items-center gap-2'),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto pb-1 pr-1', '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                                        "aria-label": "주요 메뉴",
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex min-w-max items-center gap-0.5'),
                                        children: MAIN_NAV.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NavLink, {
                                                ...item,
                                                layoutId: "mainNav"
                                            }, item.href, false, {
                                                fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                                lineNumber: 143,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)))
                                    }, void 0, false, {
                                        fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                        lineNumber: 141,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('mx-2 h-4 w-px shrink-0 bg-(--border)')
                                    }, void 0, false, {
                                        fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                        lineNumber: 147,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                                        "aria-label": "관리 메뉴",
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex min-w-max items-center gap-0.5'),
                                        children: SUB_NAV.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NavLink, {
                                                ...item,
                                                layoutId: "subNav"
                                            }, item.href, false, {
                                                fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                                lineNumber: 151,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)))
                                    }, void 0, false, {
                                        fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                        lineNumber: 149,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                lineNumber: 135,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex shrink-0 items-center gap-1'),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ThemeToggle"], {}, void 0, false, {
                                        fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                        lineNumber: 157,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('relative min-w-[100px] flex justify-end'),
                                        ref: dropdownRef,
                                        children: isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('h-8')
                                        }, void 0, false, {
                                            fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                            lineNumber: 160,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)) : user ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Fragment, {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    onClick: ()=>setIsDropdownOpen(!isDropdownOpen),
                                                    "aria-expanded": isDropdownOpen,
                                                    "aria-haspopup": "menu",
                                                    "aria-controls": isDropdownOpen ? dropdownId : undefined,
                                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex min-h-10 max-w-[160px] items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium', 'text-(--ink-muted) hover:bg-(--surface-muted) hover:text-(--ink)', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--info) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)', isDropdownOpen && 'bg-(--surface-muted) text-(--ink)'),
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('truncate'),
                                                            children: user.displayName
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                                            lineNumber: 176,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                            "aria-hidden": "true",
                                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('h-3.5 w-3.5 transition-transform duration-200', isDropdownOpen && 'rotate-180'),
                                                            fill: "none",
                                                            viewBox: "0 0 24 24",
                                                            stroke: "currentColor",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                strokeLinecap: "round",
                                                                strokeLinejoin: "round",
                                                                strokeWidth: 2,
                                                                d: "M19 9l-7 7-7-7"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                                                lineNumber: 187,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                                            lineNumber: 177,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                                    lineNumber: 163,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                                                    children: isDropdownOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                                        id: dropdownId,
                                                        role: "menu",
                                                        "aria-label": "사용자 메뉴",
                                                        initial: {
                                                            opacity: 0,
                                                            y: -8,
                                                            scale: 0.96
                                                        },
                                                        animate: {
                                                            opacity: 1,
                                                            y: 0,
                                                            scale: 1
                                                        },
                                                        exit: {
                                                            opacity: 0,
                                                            y: -8,
                                                            scale: 0.96
                                                        },
                                                        transition: {
                                                            duration: 0.15,
                                                            ease: 'easeOut'
                                                        },
                                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('absolute right-0 top-full z-50 mt-1.5 min-w-[180px]', 'rounded-lg border border-(--border) bg-(--surface) py-1 shadow-lg'),
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('border-b border-(--border-light) px-3 py-2'),
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-sm font-medium text-(--ink)'),
                                                                        children: user.displayName
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                                                        lineNumber: 207,
                                                                        columnNumber: 29
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('mt-0.5 text-xs text-(--ink-muted)'),
                                                                        children: user.userId
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                                                        lineNumber: 208,
                                                                        columnNumber: 29
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                                                lineNumber: 206,
                                                                columnNumber: 27
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('py-1'),
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                                        href: "/settings",
                                                                        role: "menuitem",
                                                                        onClick: ()=>setIsDropdownOpen(false),
                                                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex min-h-9 items-center gap-2 px-3 py-2 text-sm', 'text-(--ink-muted) hover:bg-(--surface-muted) hover:text-(--ink)', 'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--info)'),
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                                "aria-hidden": "true",
                                                                                className: "w-4 h-4",
                                                                                fill: "none",
                                                                                viewBox: "0 0 24 24",
                                                                                stroke: "currentColor",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                                        strokeLinecap: "round",
                                                                                        strokeLinejoin: "round",
                                                                                        strokeWidth: 1.5,
                                                                                        d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                                                                        lineNumber: 223,
                                                                                        columnNumber: 33
                                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                                        strokeLinecap: "round",
                                                                                        strokeLinejoin: "round",
                                                                                        strokeWidth: 1.5,
                                                                                        d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                                                                        lineNumber: 224,
                                                                                        columnNumber: 33
                                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                                                                lineNumber: 222,
                                                                                columnNumber: 31
                                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                                            "설정"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                                                        lineNumber: 212,
                                                                        columnNumber: 29
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                                        href: "/accounts",
                                                                        role: "menuitem",
                                                                        onClick: ()=>setIsDropdownOpen(false),
                                                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex min-h-9 items-center gap-2 px-3 py-2 text-sm', 'text-(--ink-muted) hover:bg-(--surface-muted) hover:text-(--ink)', 'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--info)'),
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                                "aria-hidden": "true",
                                                                                className: "w-4 h-4",
                                                                                fill: "none",
                                                                                viewBox: "0 0 24 24",
                                                                                stroke: "currentColor",
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                                    strokeLinecap: "round",
                                                                                    strokeLinejoin: "round",
                                                                                    strokeWidth: 1.5,
                                                                                    d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                                                                    lineNumber: 239,
                                                                                    columnNumber: 33
                                                                                }, ("TURBOPACK compile-time value", void 0))
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                                                                lineNumber: 238,
                                                                                columnNumber: 31
                                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                                            "계정 관리"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                                                        lineNumber: 228,
                                                                        columnNumber: 29
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                                                lineNumber: 211,
                                                                columnNumber: 27
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('border-t border-(--border-light) pt-1'),
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    type: "button",
                                                                    role: "menuitem",
                                                                    onClick: handleLogout,
                                                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex min-h-9 w-full items-center gap-2 px-3 py-2 text-sm', 'text-red-500 transition-colors duration-150 hover:bg-red-50 dark:hover:bg-red-950/30', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--info)'),
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                            "aria-hidden": "true",
                                                                            className: "w-4 h-4",
                                                                            fill: "none",
                                                                            viewBox: "0 0 24 24",
                                                                            stroke: "currentColor",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                                strokeLinecap: "round",
                                                                                strokeLinejoin: "round",
                                                                                strokeWidth: 1.5,
                                                                                d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                                                                lineNumber: 257,
                                                                                columnNumber: 33
                                                                            }, ("TURBOPACK compile-time value", void 0))
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                                                            lineNumber: 256,
                                                                            columnNumber: 31
                                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                                        "로그아웃"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                                                    lineNumber: 246,
                                                                    columnNumber: 29
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                                                lineNumber: 245,
                                                                columnNumber: 27
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                                        lineNumber: 193,
                                                        columnNumber: 25
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                                    lineNumber: 191,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                            lineNumber: 162,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            href: "/login",
                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('inline-flex min-h-10 items-center rounded-md px-2.5 py-1.5 text-sm font-medium', 'transition-all duration-200 ease-out', 'text-(--ink-muted) hover:bg-(--surface-muted) hover:text-(--ink)', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--info) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)'),
                                            children: "로그인"
                                        }, void 0, false, {
                                            fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                            lineNumber: 267,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                        lineNumber: 158,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                                lineNumber: 156,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                        lineNumber: 134,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
                lineNumber: 115,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
            lineNumber: 114,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/widgets/page-layout/ui/app-header.tsx",
        lineNumber: 108,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(AppHeader, "e6VWT1Ytsn8frVY8iLHIRzyfif0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAtom"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAtom"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAtom"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAtom"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"]
    ];
});
_c = AppHeader;
var _c;
__turbopack_context__.k.register(_c, "AppHeader");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_80427582._.js.map