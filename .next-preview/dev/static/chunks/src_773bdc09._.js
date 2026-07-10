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
"[project]/src/features/accounts/actions.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

// Re-export from entities for backward compatibility
__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$account$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/entities/account/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$cafe$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/entities/cafe/index.ts [app-client] (ecmascript) <locals>");
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/entities/cafe/api/data:4f4b56 [app-client] (ecmascript) <text/javascript>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getCafesAction",
    ()=>$$RSC_SERVER_ACTION_0
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
/* __next_internal_action_entry_do_not_use__ [{"00fcebe0d8b7ffd728da7115f7c761568114a4b2b3":"getCafesAction"},"src/entities/cafe/api/index.ts",""] */ "use turbopack no side effects";
;
const $$RSC_SERVER_ACTION_0 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("00fcebe0d8b7ffd728da7115f7c761568114a4b2b3", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "getCafesAction");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
 //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzZXJ2ZXInO1xuXG5pbXBvcnQgeyBjb25uZWN0REIgfSBmcm9tICdAL3NoYXJlZC9saWIvbW9uZ29kYic7XG5pbXBvcnQgeyBDYWZlIH0gZnJvbSAnQC9zaGFyZWQvbW9kZWxzJztcbmltcG9ydCB7IGdldEN1cnJlbnRVc2VySWQgfSBmcm9tICdAL3NoYXJlZC9jb25maWcvdXNlcic7XG5pbXBvcnQgeyByZXZhbGlkYXRlUGF0aCB9IGZyb20gJ25leHQvY2FjaGUnO1xuaW1wb3J0IHR5cGUgeyBDYWZlRGF0YSwgQ2FmZUlucHV0IH0gZnJvbSAnLi4vbW9kZWwnO1xuXG5leHBvcnQgY29uc3QgZ2V0Q2FmZXNBY3Rpb24gPSBhc3luYyAoKTogUHJvbWlzZTxDYWZlRGF0YVtdPiA9PiB7XG4gIHRyeSB7XG4gICAgYXdhaXQgY29ubmVjdERCKCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1tDQUZFLUFDVElPTl0gY29ubmVjdERCIOyXkOufrDonLCBlcnIpO1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGNvbnN0IHVzZXJJZCA9IGF3YWl0IGdldEN1cnJlbnRVc2VySWQoKTtcbiAgY29uc29sZS5sb2coJ1tDQUZFLUFDVElPTl0gZ2V0Q2FmZXNBY3Rpb24g7Zi47LacLCB1c2VySWQ6JywgdXNlcklkKTtcblxuICBjb25zdCBkYkNhZmVzID0gYXdhaXQgQ2FmZS5maW5kKHsgdXNlcklkLCBpc0FjdGl2ZTogdHJ1ZSB9KS5zb3J0KHsgaXNEZWZhdWx0OiAtMSwgY3JlYXRlZEF0OiAxIH0pLmxlYW4oKTtcbiAgY29uc29sZS5sb2coJ1tDQUZFLUFDVElPTl0gREIg7Lm07Y6YIOyImDonLCBkYkNhZmVzLmxlbmd0aCk7XG5cbiAgcmV0dXJuIGRiQ2FmZXMubWFwKChjKSA9PiB7XG4gICAgY29uc3QgY2F0ZWdvcnlNZW51SWRzID0gYy5jYXRlZ29yeU1lbnVJZHMgaW5zdGFuY2VvZiBNYXBcbiAgICAgID8gT2JqZWN0LmZyb21FbnRyaWVzKGMuY2F0ZWdvcnlNZW51SWRzKVxuICAgICAgOiBjLmNhdGVnb3J5TWVudUlkcztcbiAgICBjb25zdCBjYXRlZ29yeUFsaWFzZXMgPSBjLmNhdGVnb3J5QWxpYXNlcyBpbnN0YW5jZW9mIE1hcFxuICAgICAgPyBPYmplY3QuZnJvbUVudHJpZXMoYy5jYXRlZ29yeUFsaWFzZXMpXG4gICAgICA6IGMuY2F0ZWdvcnlBbGlhc2VzO1xuICAgIHJldHVybiB7XG4gICAgICBjYWZlSWQ6IGMuY2FmZUlkLFxuICAgICAgY2FmZVVybDogYy5jYWZlVXJsLFxuICAgICAgbWVudUlkOiBjLm1lbnVJZCxcbiAgICAgIG5hbWU6IGMubmFtZSxcbiAgICAgIGNhdGVnb3JpZXM6IGMuY2F0ZWdvcmllcyxcbiAgICAgIGNhdGVnb3J5TWVudUlkcyxcbiAgICAgIGNhdGVnb3J5QWxpYXNlcyxcbiAgICAgIGlzRGVmYXVsdDogYy5pc0RlZmF1bHQsXG4gICAgICBmcm9tQ29uZmlnOiBmYWxzZSxcbiAgICB9O1xuICB9KTtcbn07XG5cbmV4cG9ydCBjb25zdCBhZGRDYWZlQWN0aW9uID0gYXN5bmMgKGlucHV0OiBDYWZlSW5wdXQpID0+IHtcbiAgYXdhaXQgY29ubmVjdERCKCk7XG4gIGNvbnN0IHVzZXJJZCA9IGF3YWl0IGdldEN1cnJlbnRVc2VySWQoKTtcblxuICBjb25zdCBleGlzdGluZyA9IGF3YWl0IENhZmUuZmluZE9uZSh7IHVzZXJJZCwgY2FmZUlkOiBpbnB1dC5jYWZlSWQgfSk7XG4gIGlmIChleGlzdGluZykge1xuICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ+ydtOuvuCDsobTsnqztlZjripQg7Lm07Y6Y7J6F64uI64ukJyB9O1xuICB9XG5cbiAgaWYgKGlucHV0LmlzRGVmYXVsdCkge1xuICAgIGF3YWl0IENhZmUudXBkYXRlTWFueSh7IHVzZXJJZCB9LCB7ICRzZXQ6IHsgaXNEZWZhdWx0OiBmYWxzZSB9IH0pO1xuICB9XG5cbiAgYXdhaXQgQ2FmZS5jcmVhdGUoe1xuICAgIHVzZXJJZCxcbiAgICBjYWZlSWQ6IGlucHV0LmNhZmVJZCxcbiAgICBjYWZlVXJsOiBpbnB1dC5jYWZlVXJsLFxuICAgIG1lbnVJZDogaW5wdXQubWVudUlkLFxuICAgIG5hbWU6IGlucHV0Lm5hbWUsXG4gICAgY2F0ZWdvcmllczogaW5wdXQuY2F0ZWdvcmllcyA/PyBbXSxcbiAgICBjYXRlZ29yeU1lbnVJZHM6IGlucHV0LmNhdGVnb3J5TWVudUlkcyxcbiAgICBjYXRlZ29yeUFsaWFzZXM6IGlucHV0LmNhdGVnb3J5QWxpYXNlcyxcbiAgICBpc0RlZmF1bHQ6IGlucHV0LmlzRGVmYXVsdCA/PyBmYWxzZSxcbiAgfSk7XG5cbiAgcmV2YWxpZGF0ZVBhdGgoJy9hY2NvdW50cycpO1xuICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XG59O1xuXG5leHBvcnQgY29uc3QgdXBkYXRlQ2FmZUFjdGlvbiA9IGFzeW5jIChjYWZlSWQ6IHN0cmluZywgaW5wdXQ6IFBhcnRpYWw8Q2FmZUlucHV0PikgPT4ge1xuICBhd2FpdCBjb25uZWN0REIoKTtcbiAgY29uc3QgdXNlcklkID0gYXdhaXQgZ2V0Q3VycmVudFVzZXJJZCgpO1xuXG4gIGlmIChpbnB1dC5pc0RlZmF1bHQpIHtcbiAgICBhd2FpdCBDYWZlLnVwZGF0ZU1hbnkoeyB1c2VySWQgfSwgeyAkc2V0OiB7IGlzRGVmYXVsdDogZmFsc2UgfSB9KTtcbiAgfVxuXG4gIGF3YWl0IENhZmUuZmluZE9uZUFuZFVwZGF0ZShcbiAgICB7IHVzZXJJZCwgY2FmZUlkIH0sXG4gICAgeyAkc2V0OiBpbnB1dCB9XG4gICk7XG5cbiAgcmV2YWxpZGF0ZVBhdGgoJy9hY2NvdW50cycpO1xuICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XG59O1xuXG5leHBvcnQgY29uc3QgZGVsZXRlQ2FmZUFjdGlvbiA9IGFzeW5jIChjYWZlSWQ6IHN0cmluZykgPT4ge1xuICBhd2FpdCBjb25uZWN0REIoKTtcbiAgY29uc3QgdXNlcklkID0gYXdhaXQgZ2V0Q3VycmVudFVzZXJJZCgpO1xuXG4gIGF3YWl0IENhZmUuZmluZE9uZUFuZFVwZGF0ZShcbiAgICB7IHVzZXJJZCwgY2FmZUlkIH0sXG4gICAgeyAkc2V0OiB7IGlzQWN0aXZlOiBmYWxzZSB9IH1cbiAgKTtcblxuICByZXZhbGlkYXRlUGF0aCgnL2FjY291bnRzJyk7XG4gIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUgfTtcbn07XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6ImlTQVFhLDJMQUFBIn0=
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
"[project]/src/entities/post-options/ui/index.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PostOptionsUI",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$post$2d$options$2f$ui$2f$post$2d$options$2d$ui$2f$index$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PostOptionsUI"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$post$2d$options$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/entities/post-options/ui/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$post$2d$options$2f$ui$2f$post$2d$options$2d$ui$2f$index$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/entities/post-options/ui/post-options-ui/index.tsx [app-client] (ecmascript)");
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
"[project]/src/features/auto-comment/publish/data:7cc243 [app-client] (ecmascript) <text/javascript>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "runPostOnlyAction",
    ()=>$$RSC_SERVER_ACTION_0
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
/* __next_internal_action_entry_do_not_use__ [{"4067d70e0e817250b99ba89f6b1a397f49877d243d":"runPostOnlyAction"},"src/features/auto-comment/publish/queue-actions.ts",""] */ "use turbopack no side effects";
;
const $$RSC_SERVER_ACTION_0 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("4067d70e0e817250b99ba89f6b1a397f49877d243d", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "runPostOnlyAction");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
 //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vcXVldWUtYWN0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHNlcnZlcic7XG5cbmltcG9ydCB0eXBlIHsgUG9zdE9ubHlJbnB1dCB9IGZyb20gJy4vdHlwZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFF1ZXVlQmF0Y2hSZXN1bHQge1xuICBzdWNjZXNzOiBib29sZWFuO1xuICBqb2JzQWRkZWQ6IG51bWJlcjtcbiAgbWVzc2FnZTogc3RyaW5nO1xufVxuXG5leHBvcnQgdHlwZSBRdWV1ZVN0YXR1c1Jlc3VsdCA9IFJlY29yZDxzdHJpbmcsIHsgd2FpdGluZzogbnVtYmVyOyBhY3RpdmU6IG51bWJlcjsgY29tcGxldGVkOiBudW1iZXI7IGZhaWxlZDogbnVtYmVyIH0+O1xuXG4vLyDquIDrp4wg67Cc7ZaJICjtgZAg6riw67CYKSAtIFJlZGlzIO2VhOyalFxuZXhwb3J0IGNvbnN0IHJ1blBvc3RPbmx5QWN0aW9uID0gYXN5bmMgKFxuICBpbnB1dDogUG9zdE9ubHlJbnB1dFxuKTogUHJvbWlzZTxRdWV1ZUJhdGNoUmVzdWx0PiA9PiB7XG4gIGNvbnN0IHsga2V5d29yZHMsIHJlZiwgY2FmZUlkLCBwb3N0T3B0aW9ucyB9ID0gaW5wdXQ7XG5cbiAgY29uc29sZS5sb2coJ1tQT1NULU9OTFldIO2BkCDstpTqsIAg7Iuc7J6ROicsIGtleXdvcmRzLmxlbmd0aCwgJ+qwnCDtgqTsm4zrk5wnKTtcblxuICB0cnkge1xuICAgIGNvbnN0IHsgYWRkQmF0Y2hUb1F1ZXVlIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2JhdGNoL2JhdGNoLXF1ZXVlJyk7XG4gICAgcmV0dXJuIGFkZEJhdGNoVG9RdWV1ZSh7XG4gICAgICBzZXJ2aWNlOiAn7J2867CYJyxcbiAgICAgIGtleXdvcmRzLFxuICAgICAgcmVmLFxuICAgICAgY2FmZUlkLFxuICAgICAgcG9zdE9wdGlvbnMsXG4gICAgICBza2lwQ29tbWVudHM6IHRydWUsIC8vIOq4gOunjCDrsJztlokgKOuMk+q4gC/rjIDrjJPquIAg7Iqk7YK1KVxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1tQT1NULU9OTFldIFJlZGlzIOyXsOqysCDsi6TtjKg6JywgZXJyb3IpO1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGpvYnNBZGRlZDogMCxcbiAgICAgIG1lc3NhZ2U6ICdSZWRpcyDsl7DqsrAg7Iuk7YyoIC0gUmVkaXMg7ISc67KE6rCAIOyLpO2WiSDspJHsnbjsp4Ag7ZmV7J247ZW07KO87IS47JqUJyxcbiAgICB9O1xuICB9XG59O1xuXG4vLyDtgZAg7IOB7YOcIOyhsO2ajCAtIFJlZGlzIO2VhOyalFxuZXhwb3J0IGNvbnN0IGdldFBvc3RRdWV1ZVN0YXR1c0FjdGlvbiA9IGFzeW5jICgpOiBQcm9taXNlPFF1ZXVlU3RhdHVzUmVzdWx0PiA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBnZXRCYXRjaFF1ZXVlU3RhdHVzIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2JhdGNoL2JhdGNoLXF1ZXVlJyk7XG4gICAgcmV0dXJuIGF3YWl0IGdldEJhdGNoUXVldWVTdGF0dXMoKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdbUE9TVC1PTkxZIFFVRVVFIFNUQVRVU10gUmVkaXMg7Jew6rKwIOyLpO2MqDonLCBlcnJvcik7XG4gICAgcmV0dXJuIHt9O1xuICB9XG59O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJ3VEFhYSw4TEFBQSJ9
}),
"[project]/src/features/auto-comment/publish/data:9d906b [app-client] (ecmascript) <text/javascript>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getPostQueueStatusAction",
    ()=>$$RSC_SERVER_ACTION_1
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
/* __next_internal_action_entry_do_not_use__ [{"00220d5d66515dc1daef9f190d034d9daf34ec7eb2":"getPostQueueStatusAction"},"src/features/auto-comment/publish/queue-actions.ts",""] */ "use turbopack no side effects";
;
const $$RSC_SERVER_ACTION_1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("00220d5d66515dc1daef9f190d034d9daf34ec7eb2", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "getPostQueueStatusAction");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
 //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vcXVldWUtYWN0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHNlcnZlcic7XG5cbmltcG9ydCB0eXBlIHsgUG9zdE9ubHlJbnB1dCB9IGZyb20gJy4vdHlwZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFF1ZXVlQmF0Y2hSZXN1bHQge1xuICBzdWNjZXNzOiBib29sZWFuO1xuICBqb2JzQWRkZWQ6IG51bWJlcjtcbiAgbWVzc2FnZTogc3RyaW5nO1xufVxuXG5leHBvcnQgdHlwZSBRdWV1ZVN0YXR1c1Jlc3VsdCA9IFJlY29yZDxzdHJpbmcsIHsgd2FpdGluZzogbnVtYmVyOyBhY3RpdmU6IG51bWJlcjsgY29tcGxldGVkOiBudW1iZXI7IGZhaWxlZDogbnVtYmVyIH0+O1xuXG4vLyDquIDrp4wg67Cc7ZaJICjtgZAg6riw67CYKSAtIFJlZGlzIO2VhOyalFxuZXhwb3J0IGNvbnN0IHJ1blBvc3RPbmx5QWN0aW9uID0gYXN5bmMgKFxuICBpbnB1dDogUG9zdE9ubHlJbnB1dFxuKTogUHJvbWlzZTxRdWV1ZUJhdGNoUmVzdWx0PiA9PiB7XG4gIGNvbnN0IHsga2V5d29yZHMsIHJlZiwgY2FmZUlkLCBwb3N0T3B0aW9ucyB9ID0gaW5wdXQ7XG5cbiAgY29uc29sZS5sb2coJ1tQT1NULU9OTFldIO2BkCDstpTqsIAg7Iuc7J6ROicsIGtleXdvcmRzLmxlbmd0aCwgJ+qwnCDtgqTsm4zrk5wnKTtcblxuICB0cnkge1xuICAgIGNvbnN0IHsgYWRkQmF0Y2hUb1F1ZXVlIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2JhdGNoL2JhdGNoLXF1ZXVlJyk7XG4gICAgcmV0dXJuIGFkZEJhdGNoVG9RdWV1ZSh7XG4gICAgICBzZXJ2aWNlOiAn7J2867CYJyxcbiAgICAgIGtleXdvcmRzLFxuICAgICAgcmVmLFxuICAgICAgY2FmZUlkLFxuICAgICAgcG9zdE9wdGlvbnMsXG4gICAgICBza2lwQ29tbWVudHM6IHRydWUsIC8vIOq4gOunjCDrsJztlokgKOuMk+q4gC/rjIDrjJPquIAg7Iqk7YK1KVxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1tQT1NULU9OTFldIFJlZGlzIOyXsOqysCDsi6TtjKg6JywgZXJyb3IpO1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGpvYnNBZGRlZDogMCxcbiAgICAgIG1lc3NhZ2U6ICdSZWRpcyDsl7DqsrAg7Iuk7YyoIC0gUmVkaXMg7ISc67KE6rCAIOyLpO2WiSDspJHsnbjsp4Ag7ZmV7J247ZW07KO87IS47JqUJyxcbiAgICB9O1xuICB9XG59O1xuXG4vLyDtgZAg7IOB7YOcIOyhsO2ajCAtIFJlZGlzIO2VhOyalFxuZXhwb3J0IGNvbnN0IGdldFBvc3RRdWV1ZVN0YXR1c0FjdGlvbiA9IGFzeW5jICgpOiBQcm9taXNlPFF1ZXVlU3RhdHVzUmVzdWx0PiA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBnZXRCYXRjaFF1ZXVlU3RhdHVzIH0gPSBhd2FpdCBpbXBvcnQoJy4uL2JhdGNoL2JhdGNoLXF1ZXVlJyk7XG4gICAgcmV0dXJuIGF3YWl0IGdldEJhdGNoUXVldWVTdGF0dXMoKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdbUE9TVC1PTkxZIFFVRVVFIFNUQVRVU10gUmVkaXMg7Jew6rKwIOyLpO2MqDonLCBlcnJvcik7XG4gICAgcmV0dXJuIHt9O1xuICB9XG59O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiIrVEF5Q2EscU1BQUEifQ==
}),
"[project]/src/features/auto-comment/publish/post-only-ui.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PostOnlyUI",
    ()=>PostOnlyUI
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jotai/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/cn.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/ui/index.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.mjs [app-client] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.mjs [app-client] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$accounts$2f$actions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/features/accounts/actions.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$cafe$2f$api$2f$data$3a$4f4b56__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/src/entities/cafe/api/data:4f4b56 [app-client] (ecmascript) <text/javascript>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$post$2d$options$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/entities/post-options/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$post$2d$options$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/entities/post-options/ui/index.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/entities/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$store$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/entities/store/index.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$publish$2f$data$3a$7cc243__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/src/features/auto-comment/publish/data:7cc243 [app-client] (ecmascript) <text/javascript>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$publish$2f$data$3a$9d906b__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/src/features/auto-comment/publish/data:9d906b [app-client] (ecmascript) <text/javascript>");
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
;
const isQueueSettled = (status)=>{
    if (!status) return false;
    const accounts = Object.values(status);
    if (accounts.length === 0) return false;
    const hasSeenWork = accounts.some((s)=>s.waiting + s.active + s.completed + s.failed > 0);
    return hasSeenWork && accounts.every((s)=>s.waiting + s.active === 0);
};
const PostOnlyUI = ()=>{
    _s();
    const [isPending, startTransition] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransition"])();
    const [cafes, setCafes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAtom"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$store$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cafesAtom"]);
    const [selectedCafeId, setSelectedCafeId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAtom"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$store$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectedCafeIdAtom"]);
    const [cafesInitialized, setCafesInitialized] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAtom"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$store$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cafesInitializedAtom"]);
    const selectedCafe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAtom"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$store$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectedCafeAtom"])[0];
    const [keywordsText, setKeywordsText] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAtom"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$store$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["postKeywordsTextAtom"]);
    const [ref, setRef] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAtom"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$store$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["postRefAtom"]);
    const [postOptions, setPostOptions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAtom"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$store$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["postOptionsAtom"]);
    const [showAdvanced, setShowAdvanced] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [result, setResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [queueStatus, setQueueStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isPolling, setIsPolling] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const keywordCount = keywordsText.split('\n').map((k)=>k.trim()).filter((k)=>k.length > 0).length;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PostOnlyUI.useEffect": ()=>{
            if (cafesInitialized) return;
            const loadCafes = {
                "PostOnlyUI.useEffect.loadCafes": async ()=>{
                    const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$cafe$2f$api$2f$data$3a$4f4b56__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["getCafesAction"])();
                    setCafes(data);
                    const defaultCafe = data.find({
                        "PostOnlyUI.useEffect.loadCafes": (c)=>c.isDefault
                    }["PostOnlyUI.useEffect.loadCafes"]) || data[0];
                    if (defaultCafe) setSelectedCafeId(defaultCafe.cafeId);
                    setCafesInitialized(true);
                }
            }["PostOnlyUI.useEffect.loadCafes"];
            loadCafes();
        }
    }["PostOnlyUI.useEffect"], [
        cafesInitialized,
        setCafes,
        setSelectedCafeId,
        setCafesInitialized
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PostOnlyUI.useEffect": ()=>{
            if (!isPolling) return;
            const poll = {
                "PostOnlyUI.useEffect.poll": async ()=>{
                    const status = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$publish$2f$data$3a$9d906b__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["getPostQueueStatusAction"])();
                    setQueueStatus(status);
                    if (isQueueSettled(status)) {
                        setIsPolling(false);
                    }
                }
            }["PostOnlyUI.useEffect.poll"];
            poll();
            const interval = setInterval(poll, 3000);
            return ({
                "PostOnlyUI.useEffect": ()=>clearInterval(interval)
            })["PostOnlyUI.useEffect"];
        }
    }["PostOnlyUI.useEffect"], [
        isPolling
    ]);
    const inputClassName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-full rounded-xl border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--ink)', 'placeholder:text-(--ink-tertiary) transition-all', 'focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/10');
    const labelClassName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-sm font-medium text-(--ink)');
    const handleSubmit = ()=>{
        const keywords = keywordsText.split('\n').map((k)=>k.trim()).filter((k)=>k.length > 0);
        if (keywords.length === 0) return;
        startTransition(async ()=>{
            setResult(null);
            const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$publish$2f$data$3a$7cc243__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["runPostOnlyAction"])({
                keywords,
                ref: ref || undefined,
                cafeId: selectedCafeId || undefined,
                postOptions
            });
            setResult(res);
            if (res.success) {
                setIsPolling(true);
            }
        });
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('space-y-6'),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('space-y-3'),
                children: [
                    cafesInitialized && cafes.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('rounded-xl border border-(--border-light) bg-(--surface-muted) p-4 text-sm text-(--ink-muted)'),
                        children: "등록된 카페가 없습니다. 카페 관리 화면에서 먼저 카페를 등록해주세요."
                    }, void 0, false, {
                        fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                        lineNumber: 114,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Select"], {
                        label: "카페 선택",
                        value: selectedCafeId,
                        onChange: (e)=>setSelectedCafeId(e.target.value),
                        options: cafes.map((cafe)=>({
                                value: cafe.cafeId,
                                label: `${cafe.name}${cafe.isDefault ? ' (기본)' : ''}`
                            })),
                        helperText: selectedCafe && `카테고리: ${selectedCafe.categories.join(', ')}`
                    }, void 0, false, {
                        fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                        lineNumber: 118,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('space-y-2'),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex items-center justify-between'),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: labelClassName,
                                        children: "키워드 목록"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                                        lineNumber: 132,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    keywordCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-xs text-(--ink-muted)'),
                                        children: [
                                            keywordCount,
                                            "개"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                                        lineNumber: 134,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                                lineNumber: 131,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                placeholder: `키워드 목록 (한 줄에 하나씩)\n카테고리 지정: 키워드:카테고리\n예:\n제주도 맛집\n서울 카페:일상`,
                                value: keywordsText,
                                onChange: (e)=>setKeywordsText(e.target.value),
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(inputClassName, 'min-h-28 resize-none'),
                                rows: 4
                            }, void 0, false, {
                                fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                                lineNumber: 137,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                        lineNumber: 130,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('space-y-2'),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: labelClassName,
                                children: "참고 URL (선택)"
                            }, void 0, false, {
                                fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                                lineNumber: 147,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                placeholder: "참고 URL",
                                value: ref,
                                onChange: (e)=>setRef(e.target.value),
                                className: inputClassName
                            }, void 0, false, {
                                fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                                lineNumber: 148,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                        lineNumber: 146,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('rounded-xl border border-(--border-light) bg-(--surface-muted) overflow-hidden'),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>setShowAdvanced((prev)=>!prev),
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-(--ink)', 'hover:bg-(--surface) transition-colors'),
                                children: [
                                    "고급 옵션",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-4 h-4 text-(--ink-muted) transition-transform', showAdvanced && 'rotate-180')
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                                        lineNumber: 167,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                                lineNumber: 158,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            showAdvanced && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('px-4 pb-4'),
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$post$2d$options$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PostOptionsUI"], {
                                    options: postOptions,
                                    onChange: setPostOptions
                                }, void 0, false, {
                                    fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                                    lineNumber: 173,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                                lineNumber: 172,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                        lineNumber: 157,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                lineNumber: 112,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                onClick: handleSubmit,
                disabled: !keywordsText.trim(),
                isLoading: isPending,
                size: "lg",
                fullWidth: true,
                children: "글만 발행"
            }, void 0, false, {
                fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                lineNumber: 179,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            result && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('rounded-2xl border p-5', result.success ? 'border-(--success)/30 bg-(--success-soft)' : 'border-(--danger)/30 bg-(--danger-soft)'),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex items-center justify-between mb-3'),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('font-semibold', result.success ? 'text-(--success)' : 'text-(--danger)'),
                                children: result.success ? '큐에 추가됨' : '실패'
                            }, void 0, false, {
                                fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                                lineNumber: 199,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-sm text-(--ink-muted)'),
                                children: [
                                    result.jobsAdded,
                                    "개 작업"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                                lineNumber: 207,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                        lineNumber: 198,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-sm text-(--ink-muted)'),
                        children: result.message
                    }, void 0, false, {
                        fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                        lineNumber: 211,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    queueStatus && Object.keys(queueStatus).length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('mt-4 space-y-3'),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex items-center justify-between'),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-sm font-medium text-(--ink)'),
                                        children: "진행 상황"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                                        lineNumber: 216,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    isPolling ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                        variant: "secondary",
                                        size: "xs",
                                        onClick: ()=>setIsPolling(false),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-3.5 h-3.5 animate-spin')
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                                                lineNumber: 223,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            "폴링 중지"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                                        lineNumber: 218,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-xs text-(--success) font-medium'),
                                        children: "완료"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                                        lineNumber: 227,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                                lineNumber: 215,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            Object.entries(queueStatus).map(([accountId, status])=>{
                                const total = status.waiting + status.active + status.completed + status.failed;
                                if (total === 0) return null;
                                const progress = total > 0 ? (status.completed + status.failed) / total * 100 : 0;
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('rounded-xl bg-(--surface) p-3 border border-(--border-light)'),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex items-center justify-between text-xs mb-2'),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('font-medium text-(--ink)'),
                                                    children: accountId
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                                                    lineNumber: 237,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-(--ink-muted)'),
                                                    children: [
                                                        status.completed,
                                                        "/",
                                                        total,
                                                        " 완료",
                                                        status.failed > 0 && ` (${status.failed} 실패)`
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                                                    lineNumber: 238,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                                            lineNumber: 236,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('h-1.5 rounded-full bg-(--surface-muted) overflow-hidden'),
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('h-full bg-(--accent) transition-all'),
                                                style: {
                                                    width: `${progress}%`
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                                                lineNumber: 244,
                                                columnNumber: 23
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                                            lineNumber: 243,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        status.active > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-xs text-(--accent) mt-2'),
                                            children: [
                                                status.active,
                                                "개 처리 중..."
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                                            lineNumber: 250,
                                            columnNumber: 23
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, accountId, true, {
                                    fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                                    lineNumber: 235,
                                    columnNumber: 19
                                }, ("TURBOPACK compile-time value", void 0));
                            })
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                        lineNumber: 214,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
                lineNumber: 190,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/features/auto-comment/publish/post-only-ui.tsx",
        lineNumber: 111,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(PostOnlyUI, "ospA2yfbKDo0eYTbuVDQZnIfJUA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransition"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAtom"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAtom"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAtom"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAtom"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAtom"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAtom"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jotai$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAtom"]
    ];
});
_c = PostOnlyUI;
var _c;
__turbopack_context__.k.register(_c, "PostOnlyUI");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/features/auto-comment/publish/data:803d61 [app-client] (ecmascript) <text/javascript>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "runAutoCommentAction",
    ()=>$$RSC_SERVER_ACTION_1
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
/* __next_internal_action_entry_do_not_use__ [{"606855e91d1c001013e53e8b4d79c05dd94c2606b2":"runAutoCommentAction"},"src/features/auto-comment/publish/actions.ts",""] */ "use turbopack no side effects";
;
const $$RSC_SERVER_ACTION_1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("606855e91d1c001013e53e8b4d79c05dd94c2606b2", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "runAutoCommentAction");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
 //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vYWN0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHNlcnZlcic7XG5cbmltcG9ydCBtb25nb29zZSBmcm9tICdtb25nb29zZSc7XG5pbXBvcnQgeyBnZXRBbGxBY2NvdW50cyB9IGZyb20gJ0Avc2hhcmVkL2NvbmZpZy9hY2NvdW50cyc7XG5pbXBvcnQgeyBjb25uZWN0REIgfSBmcm9tICdAL3NoYXJlZC9saWIvbW9uZ29kYic7XG5pbXBvcnQgeyBQdWJsaXNoZWRBcnRpY2xlIH0gZnJvbSAnQC9zaGFyZWQvbW9kZWxzJztcbmltcG9ydCB7IGdlbmVyYXRlQ29tbWVudCwgZ2VuZXJhdGVSZXBseSB9IGZyb20gJ0Avc2hhcmVkL2FwaS9jb21tZW50LWdlbi1hcGknO1xuaW1wb3J0IHsgYWRkVGFza0pvYiB9IGZyb20gJ0Avc2hhcmVkL2xpYi9xdWV1ZSc7XG5pbXBvcnQgeyBzdGFydEFsbFRhc2tXb3JrZXJzIH0gZnJvbSAnQC9zaGFyZWQvbGliL3F1ZXVlL3dvcmtlcnMnO1xuaW1wb3J0IHsgZ2V0UXVldWVTZXR0aW5ncywgZ2V0UmFuZG9tRGVsYXkgfSBmcm9tICdAL3NoYXJlZC9tb2RlbHMvcXVldWUtc2V0dGluZ3MnO1xuaW1wb3J0IHsgZ2V0UGVyc29uYUlkLCBnZXROZXh0QWN0aXZlVGltZSB9IGZyb20gJ0Avc2hhcmVkL2xpYi9hY2NvdW50LW1hbmFnZXInO1xuaW1wb3J0IHR5cGUgeyBDb21tZW50Sm9iRGF0YSwgUmVwbHlKb2JEYXRhIH0gZnJvbSAnQC9zaGFyZWQvbGliL3F1ZXVlL3R5cGVzJztcbmltcG9ydCB0eXBlIHtcbiAgQ29tbWVudE9ubHlGaWx0ZXIsXG4gIENvbW1lbnRUYXJnZXRBcnRpY2xlLFxuICBDb21tZW50T25seVJlc3VsdCxcbn0gZnJvbSAnLi90eXBlcyc7XG5cbi8vIO2VhO2EsOungeuQnCDrsJztlonsm5Dqs6Ag7KGw7ZqMXG5leHBvcnQgY29uc3QgZmV0Y2hGaWx0ZXJlZEFydGljbGVzID0gYXN5bmMgKFxuICBmaWx0ZXI6IENvbW1lbnRPbmx5RmlsdGVyXG4pOiBQcm9taXNlPENvbW1lbnRUYXJnZXRBcnRpY2xlW10+ID0+IHtcbiAgY29uc3QgeyBjYWZlSWQsIG1pbkRheXNPbGQsIG1heENvbW1lbnRzLCBhcnRpY2xlQ291bnQgfSA9IGZpbHRlcjtcblxuICBjb25zb2xlLmxvZygnW0NPTU1FTlQtT05MWV0g7ZWE7YSw66eBIOyhsO2ajDonLCBmaWx0ZXIpO1xuXG4gIHRyeSB7XG4gICAgYXdhaXQgY29ubmVjdERCKCk7XG5cbiAgICBpZiAobW9uZ29vc2UuY29ubmVjdGlvbi5yZWFkeVN0YXRlICE9PSAxKSB7XG4gICAgICBjb25zb2xlLmxvZygnW0NPTU1FTlQtT05MWV0gTW9uZ29EQiDsl7DqsrAg7Iuk7YyoJyk7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgY29uc3QgY3V0b2ZmRGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgY3V0b2ZmRGF0ZS5zZXREYXRlKGN1dG9mZkRhdGUuZ2V0RGF0ZSgpIC0gbWluRGF5c09sZCk7XG5cbiAgICBjb25zdCBhcnRpY2xlcyA9IGF3YWl0IFB1Ymxpc2hlZEFydGljbGUuZmluZCh7XG4gICAgICBjYWZlSWQsXG4gICAgICBzdGF0dXM6ICdwdWJsaXNoZWQnLFxuICAgICAgcHVibGlzaGVkQXQ6IHsgJGx0ZTogY3V0b2ZmRGF0ZSB9LFxuICAgICAgY29tbWVudENvdW50OiB7ICRsdGU6IG1heENvbW1lbnRzIH0sXG4gICAgfSlcbiAgICAgIC5zb3J0KHsgcHVibGlzaGVkQXQ6IDEgfSkgLy8g7Jik656Y65CcIOyInFxuICAgICAgLmxpbWl0KGFydGljbGVDb3VudCAqIDMpIC8vIOyXrOycoOyeiOqyjCDqsIDsoLjsmYDshJwg656c642kIOyEoO2DnVxuICAgICAgLmxlYW4oKTtcblxuICAgIC8vIOuenOuNpCDshZTtlIwg7ZuEIGFydGljbGVDb3VudOqwnCDshKDtg51cbiAgICBjb25zdCBzaHVmZmxlZCA9IGFydGljbGVzLnNvcnQoKCkgPT4gTWF0aC5yYW5kb20oKSAtIDAuNSk7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSBzaHVmZmxlZC5zbGljZSgwLCBhcnRpY2xlQ291bnQpO1xuXG4gICAgcmV0dXJuIHNlbGVjdGVkLm1hcCgoYSkgPT4gKHtcbiAgICAgIGFydGljbGVJZDogYS5hcnRpY2xlSWQsXG4gICAgICBjYWZlSWQ6IGEuY2FmZUlkLFxuICAgICAga2V5d29yZDogYS5rZXl3b3JkLFxuICAgICAgdGl0bGU6IGEudGl0bGUsXG4gICAgICBwdWJsaXNoZWRBdDogYS5wdWJsaXNoZWRBdCxcbiAgICAgIGNvbW1lbnRDb3VudDogYS5jb21tZW50Q291bnQsXG4gICAgICB3cml0ZXJBY2NvdW50SWQ6IGEud3JpdGVyQWNjb3VudElkLFxuICAgIH0pKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdbQ09NTUVOVC1PTkxZXSDsobDtmowg7Jik66WYOicsIGVycm9yKTtcbiAgICByZXR1cm4gW107XG4gIH1cbn07XG5cbi8vIOyekOuPmSDrjJPquIAg64us6riwICjtgZAg6riw67CYKVxuLy8gTuydvCDsnbTrgrQg6riAIOykkSDrnpzrjaQg7KCI67CYLCDquIDri7kgM34xNeqwnCwg64yA64yT6riAIDUwJSAvIOuMk+q4gCA1MCVcbmV4cG9ydCBjb25zdCBydW5BdXRvQ29tbWVudEFjdGlvbiA9IGFzeW5jIChcbiAgY2FmZUlkOiBzdHJpbmcsXG4gIGRheXNMaW1pdDogbnVtYmVyID0gM1xuKTogUHJvbWlzZTxDb21tZW50T25seVJlc3VsdD4gPT4ge1xuICBjb25zb2xlLmxvZygnW0FVVE8tQ09NTUVOVF0g7Iuc7J6RIC0gY2FmZUlkOicsIGNhZmVJZCwgJ2RheXNMaW1pdDonLCBkYXlzTGltaXQpO1xuXG4gIGNvbnN0IGFjY291bnRzID0gYXdhaXQgZ2V0QWxsQWNjb3VudHMoKTtcbiAgaWYgKGFjY291bnRzLmxlbmd0aCA8IDIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICB0b3RhbEFydGljbGVzOiAwLFxuICAgICAgY29tcGxldGVkOiAwLFxuICAgICAgZmFpbGVkOiAwLFxuICAgICAgcmVzdWx0czogW10sXG4gICAgICBtZXNzYWdlOiAn6rOE7KCV7J20IDLqsJwg7J207IOBIO2VhOyalO2VtCcsXG4gICAgfTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgYXdhaXQgY29ubmVjdERCKCk7XG5cbiAgICBpZiAobW9uZ29vc2UuY29ubmVjdGlvbi5yZWFkeVN0YXRlICE9PSAxKSB7XG4gICAgICBjb25zb2xlLmxvZygnW0FVVE8tQ09NTUVOVF0gTW9uZ29EQiDsl7DqsrAg7Iuk7YyoJyk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgdG90YWxBcnRpY2xlczogMCxcbiAgICAgICAgY29tcGxldGVkOiAwLFxuICAgICAgICBmYWlsZWQ6IDAsXG4gICAgICAgIHJlc3VsdHM6IFtdLFxuICAgICAgICBtZXNzYWdlOiAnTW9uZ29EQiDsl7DqsrAg7Iuk7YyoJyxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3Qgc2V0dGluZ3MgPSBhd2FpdCBnZXRRdWV1ZVNldHRpbmdzKCk7XG5cbiAgICAvLyDsm4zsu6Qg7Iuc7J6RXG4gICAgYXdhaXQgc3RhcnRBbGxUYXNrV29ya2VycygpO1xuXG4gICAgLy8gTuydvCDsnbTrgrQg6riAIOyhsO2ajFxuICAgIGNvbnN0IGN1dG9mZkRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIGN1dG9mZkRhdGUuc2V0RGF0ZShjdXRvZmZEYXRlLmdldERhdGUoKSAtIGRheXNMaW1pdCk7XG5cbiAgICBjb25zdCBhbGxBcnRpY2xlcyA9IGF3YWl0IFB1Ymxpc2hlZEFydGljbGUuZmluZCh7XG4gICAgICBjYWZlSWQsXG4gICAgICBzdGF0dXM6ICdwdWJsaXNoZWQnLFxuICAgICAgcHVibGlzaGVkQXQ6IHsgJGd0ZTogY3V0b2ZmRGF0ZSB9LFxuICAgIH0pLmxlYW4oKTtcblxuICAgIGNvbnNvbGUubG9nKGBbQVVUTy1DT01NRU5UXSAke2RheXNMaW1pdH3snbwg7J2064K0IOq4gCDstJ0gJHthbGxBcnRpY2xlcy5sZW5ndGh96rCcYCk7XG5cbiAgICBpZiAoYWxsQXJ0aWNsZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICB0b3RhbEFydGljbGVzOiAwLFxuICAgICAgICBjb21wbGV0ZWQ6IDAsXG4gICAgICAgIGZhaWxlZDogMCxcbiAgICAgICAgcmVzdWx0czogW10sXG4gICAgICAgIG1lc3NhZ2U6ICfrjIDsg4Eg6riA7J20IOyXhuydjCcsXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIOuenOuNpOycvOuhnCDsoIjrsJgg7ISg7YOdXG4gICAgY29uc3Qgc2h1ZmZsZWQgPSBhbGxBcnRpY2xlcy5zb3J0KCgpID0+IE1hdGgucmFuZG9tKCkgLSAwLjUpO1xuICAgIGNvbnN0IGhhbGZDb3VudCA9IE1hdGgubWF4KDEsIE1hdGguY2VpbChhbGxBcnRpY2xlcy5sZW5ndGggLyAyKSk7XG4gICAgY29uc3Qgc2VsZWN0ZWRBcnRpY2xlcyA9IHNodWZmbGVkLnNsaWNlKDAsIGhhbGZDb3VudCk7XG5cbiAgICBjb25zb2xlLmxvZyhgW0FVVE8tQ09NTUVOVF0g656c642kICR7c2VsZWN0ZWRBcnRpY2xlcy5sZW5ndGh96rCcIOyEoO2DnWApO1xuXG4gICAgbGV0IGpvYnNBZGRlZCA9IDA7XG5cbiAgICAvLyDqs4TsoJXrs4Qg65Sc66CI7J20IOy2lOyggVxuICAgIGNvbnN0IGFjY291bnREZWxheXM6IE1hcDxzdHJpbmcsIG51bWJlcj4gPSBuZXcgTWFwKCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdGVkQXJ0aWNsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGFydGljbGUgPSBzZWxlY3RlZEFydGljbGVzW2ldO1xuICAgICAgY29uc3QgeyBhcnRpY2xlSWQsIGtleXdvcmQsIHdyaXRlckFjY291bnRJZCB9ID0gYXJ0aWNsZTtcblxuICAgICAgY29uc29sZS5sb2coYFtBVVRPLUNPTU1FTlRdICR7aSArIDF9LyR7c2VsZWN0ZWRBcnRpY2xlcy5sZW5ndGh9OiAjJHthcnRpY2xlSWR9IFwiJHtrZXl3b3JkfVwiYCk7XG5cbiAgICAgIC8vIOq4gOyTtOydtCDsoJzsmbjtlZwg6rOE7KCVICjruYTtmZzrj5kg6rOE7KCV64+EIO2PrO2VqCwgZGVsYXnroZwg7LKY66asKVxuICAgICAgY29uc3Qgb3RoZXJBY2NvdW50cyA9IGFjY291bnRzLmZpbHRlcigoYSkgPT4gYS5pZCAhPT0gd3JpdGVyQWNjb3VudElkKTtcbiAgICAgIGlmIChvdGhlckFjY291bnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgW0FVVE8tQ09NTUVOVF0gIyR7YXJ0aWNsZUlkfSAtIOyCrOyaqSDqsIDriqXtlZwg6rOE7KCVIOyXhuydjCwg7Iqk7YK1YCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyDquIDsk7TsnbQg6rOE7KCVIOygleuztCAo64uJ64Sk7J6EIOyghOuLrOyaqSlcbiAgICAgIGNvbnN0IHdyaXRlckFjY291bnQgPSBhY2NvdW50cy5maW5kKChhKSA9PiBhLmlkID09PSB3cml0ZXJBY2NvdW50SWQpO1xuICAgICAgY29uc3Qgd3JpdGVyTmlja25hbWUgPSB3cml0ZXJBY2NvdW50Py5uaWNrbmFtZSB8fCB3cml0ZXJBY2NvdW50SWQ7XG5cbiAgICAgIC8vIOq4gOuLuSAzfjE16rCcIOyekeyEsVxuICAgICAgY29uc3QgdG90YWxDb3VudCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEzKSArIDM7IC8vIDN+MTVcbiAgICAgIC8vIDUwJSDrjIDrjJPquIAsIDUwJSDrjJPquIBcbiAgICAgIGNvbnN0IHJlcGx5Q291bnQgPSBNYXRoLnJvdW5kKHRvdGFsQ291bnQgKiAwLjUpO1xuICAgICAgY29uc3QgY29tbWVudENvdW50ID0gdG90YWxDb3VudCAtIHJlcGx5Q291bnQ7XG5cbiAgICAgIGNvbnNvbGUubG9nKGBbQVVUTy1DT01NRU5UXSAjJHthcnRpY2xlSWR9IC0g64yT6riAICR7Y29tbWVudENvdW50feqwnCwg64yA64yT6riAICR7cmVwbHlDb3VudH3qsJwgam9iIOy2lOqwgGApO1xuXG4gICAgICBjb25zdCBjb21tZW50QmF0Y2hJZCA9IGBiYXRjaF8ke0RhdGUubm93KCkudG9TdHJpbmcoMzYpfV8ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIsIDgpfWA7XG4gICAgICAvLyDsnbQg6riA7J2YIOuMk+q4gCDsnpHshLHsnpAg7LaU7KCBIOy0iOq4sO2ZlCAo64uJ64Sk7J6EIO2PrO2VqClcbiAgICAgIGNvbnN0IGFydGljbGVDb21tZW50QXV0aG9yczogQXJyYXk8eyBpZDogc3RyaW5nOyBuaWNrbmFtZTogc3RyaW5nIH0+ID0gW107XG5cbiAgICAgIC8vIOuMk+q4gCBqb2Ig7LaU6rCAICgzMCUpXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNvbW1lbnRDb3VudDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGNvbW1lbnRlciA9IG90aGVyQWNjb3VudHNbaiAlIG90aGVyQWNjb3VudHMubGVuZ3RoXTtcbiAgICAgICAgY29uc3QgcGVyc29uYUlkID0gZ2V0UGVyc29uYUlkKGNvbW1lbnRlcik7XG5cbiAgICAgICAgbGV0IGNvbW1lbnRUZXh0OiBzdHJpbmc7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29tbWVudFRleHQgPSBhd2FpdCBnZW5lcmF0ZUNvbW1lbnQoa2V5d29yZCwgcGVyc29uYUlkLCB3cml0ZXJOaWNrbmFtZSk7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgIGNvbW1lbnRUZXh0ID0gJ+yii+ydgCDsoJXrs7Qg6rCQ7IKs7ZWp64uI64ukISc7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDtmZzrj5nsi5zqsITquYzsp4Ag64yA6riwIOyLnOqwhCDqs4TsgrBcbiAgICAgICAgY29uc3QgYmFzZURlbGF5ID0gYWNjb3VudERlbGF5cy5nZXQoY29tbWVudGVyLmlkKSA/PyAwO1xuICAgICAgICBjb25zdCBhY3Rpdml0eURlbGF5ID0gZ2V0TmV4dEFjdGl2ZVRpbWUoY29tbWVudGVyKTtcbiAgICAgICAgY29uc3QgY3VycmVudERlbGF5ID0gTWF0aC5tYXgoYmFzZURlbGF5LCBhY3Rpdml0eURlbGF5KTtcbiAgICAgICAgY29uc3QgbmV4dERlbGF5ID0gY3VycmVudERlbGF5ICsgZ2V0UmFuZG9tRGVsYXkoc2V0dGluZ3MuZGVsYXlzLmJldHdlZW5Db21tZW50cyk7XG4gICAgICAgIGFjY291bnREZWxheXMuc2V0KGNvbW1lbnRlci5pZCwgbmV4dERlbGF5KTtcblxuICAgICAgICBjb25zdCBjb21tZW50SW5kZXggPSBhcnRpY2xlQ29tbWVudEF1dGhvcnMubGVuZ3RoO1xuICAgICAgICBjb25zdCBjb21tZW50Sm9iRGF0YTogQ29tbWVudEpvYkRhdGEgPSB7XG4gICAgICAgICAgdHlwZTogJ2NvbW1lbnQnLFxuICAgICAgICAgIGFjY291bnRJZDogY29tbWVudGVyLmlkLFxuICAgICAgICAgIGNhZmVJZCxcbiAgICAgICAgICBhcnRpY2xlSWQsXG4gICAgICAgICAgY29udGVudDogY29tbWVudFRleHQsXG4gICAgICAgICAgY29tbWVudEluZGV4LFxuICAgICAgICAgIHNlcXVlbmNlSWQ6IGNvbW1lbnRCYXRjaElkLFxuICAgICAgICB9O1xuXG4gICAgICAgIGF3YWl0IGFkZFRhc2tKb2IoY29tbWVudGVyLmlkLCBjb21tZW50Sm9iRGF0YSwgY3VycmVudERlbGF5KTtcbiAgICAgICAgam9ic0FkZGVkKys7XG5cbiAgICAgICAgLy8g64yT6riAIOyekeyEseyekCDquLDroZ0gKOuLieuEpOyehCDtj6ztlagpXG4gICAgICAgIGNvbnN0IGNvbW1lbnRlck5pY2tuYW1lID0gY29tbWVudGVyLm5pY2tuYW1lIHx8IGNvbW1lbnRlci5pZDtcbiAgICAgICAgYXJ0aWNsZUNvbW1lbnRBdXRob3JzLnB1c2goeyBpZDogY29tbWVudGVyLmlkLCBuaWNrbmFtZTogY29tbWVudGVyTmlja25hbWUgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIOuMgOuMk+q4gCBqb2Ig7LaU6rCAICg1MCUpXG4gICAgICAvLyDrjJPquIDsnbQg64Gd64KcIO2bhCDrjIDrjJPquIAg7Iuc7J6RXG4gICAgICBjb25zdCBtYXhDb21tZW50RGVsYXkgPSBNYXRoLm1heCguLi5BcnJheS5mcm9tKGFjY291bnREZWxheXMudmFsdWVzKCkpLCAwKTtcbiAgICAgIGNvbnN0IHJlcGx5QmFzZURlbGF5ID0gbWF4Q29tbWVudERlbGF5ICsgZ2V0UmFuZG9tRGVsYXkoc2V0dGluZ3MuZGVsYXlzLmFmdGVyUG9zdCk7XG5cbiAgICAgIC8vIOyDiOuhnCDri6gg64yT6riA7JeQ66eMIOuMgOuMk+q4gCDri6zquLAgKOq4sOyhtCDrjJPquIAg7KCc7Jm4IC0g7J6R7ISx7J6QIOygleuztCDsl4bsnYwpXG4gICAgICBjb25zdCBhdmFpbGFibGVDb21tZW50Q291bnQgPSBhcnRpY2xlQ29tbWVudEF1dGhvcnMubGVuZ3RoO1xuICAgICAgaWYgKGF2YWlsYWJsZUNvbW1lbnRDb3VudCA9PT0gMCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgW0FVVE8tQ09NTUVOVF0gIyR7YXJ0aWNsZUlkfSAtIOuMgOuMk+q4gCDri6wg64yT6riAIOyXhuydjCwg7Iqk7YK1YCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHJlcGx5Q291bnQ7IGorKykge1xuICAgICAgICAvLyDrjIDrjJPquIAg7YOA6rKfOiDsg4jroZwg64uoIOuMk+q4gCDspJHsl5DshJzrp4wg7ISg7YOdXG4gICAgICAgIGNvbnN0IHRhcmdldENvbW1lbnRJbmRleCA9IGogJSBhdmFpbGFibGVDb21tZW50Q291bnQ7XG4gICAgICAgIGNvbnN0IHRhcmdldENvbW1lbnRBdXRob3IgPSBhcnRpY2xlQ29tbWVudEF1dGhvcnNbdGFyZ2V0Q29tbWVudEluZGV4XTtcblxuICAgICAgICBpZiAoIXRhcmdldENvbW1lbnRBdXRob3IpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgW0FVVE8tQ09NTUVOVF0gIyR7YXJ0aWNsZUlkfSDrjIDrjJPquIAgJHtqfSAtIOuMk+q4gCDsnpHshLHsnpAg7KCV67O0IOyXhuydjCwg7Iqk7YK1YCk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYXJlbnRBdXRob3JOaWNrbmFtZSA9IHRhcmdldENvbW1lbnRBdXRob3Iubmlja25hbWU7XG5cbiAgICAgICAgLy8g7J6Q6riwIOuMk+q4gOyXkCDrjIDrjJPquIAg64us7KeAIOyViuuPhOuhnSDri6Trpbgg6rOE7KCVIOyEoO2DnVxuICAgICAgICAvLyDrjJPquIAg7J6R7ISx7J6Q66W8IOygnOyZuO2VnCDqs4TsoJUg66qp66Gd7JeQ7IScIOyEoO2DnVxuICAgICAgICBjb25zdCBhdmFpbGFibGVSZXBseWVycyA9IG90aGVyQWNjb3VudHMuZmlsdGVyKChhKSA9PiBhLmlkICE9PSB0YXJnZXRDb21tZW50QXV0aG9yLmlkKTtcblxuICAgICAgICBpZiAoYXZhaWxhYmxlUmVwbHllcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYFtBVVRPLUNPTU1FTlRdICMke2FydGljbGVJZH0g64yA64yT6riAICR7an0gLSDsnpDquLAg64yT6riAIOuwqeyngOuhnCDsiqTtgrUgKOuMk+q4gOyekeyEseyekDogJHt0YXJnZXRDb21tZW50QXV0aG9yLmlkfSlgKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlcGx5ZXIgPSBhdmFpbGFibGVSZXBseWVyc1tqICUgYXZhaWxhYmxlUmVwbHllcnMubGVuZ3RoXTtcblxuICAgICAgICBjb25zdCByZXBseWVyUGVyc29uYUlkID0gZ2V0UGVyc29uYUlkKHJlcGx5ZXIpO1xuICAgICAgICBjb25zdCByZXBseWVyTmlja25hbWUgPSByZXBseWVyLm5pY2tuYW1lIHx8IHJlcGx5ZXIuaWQ7XG5cbiAgICAgICAgbGV0IHJlcGx5VGV4dDogc3RyaW5nO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIOq4gOyTtOydtCDri4nrhKTsnoQgKyDsm5DrjJPquIAg7J6R7ISx7J6QIOuLieuEpOyehCArIOuMgOuMk+q4gCDsnpHshLHsnpAg64uJ64Sk7J6EIOyghOuLrFxuICAgICAgICAgIHJlcGx5VGV4dCA9IGF3YWl0IGdlbmVyYXRlUmVwbHkoa2V5d29yZCwgJ+yii+ydgCDsoJXrs7TrhKTsmpQnLCByZXBseWVyUGVyc29uYUlkLCB3cml0ZXJOaWNrbmFtZSwgcGFyZW50QXV0aG9yTmlja25hbWUsIHJlcGx5ZXJOaWNrbmFtZSk7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgIHJlcGx5VGV4dCA9ICfsoIDrj4Qg6re466CH6rKMIOyDneqwge2VtOyalCEnO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g7Zmc64+Z7Iuc6rCE6rmM7KeAIOuMgOq4sCDsi5zqsIQg6rOE7IKwXG4gICAgICAgIGNvbnN0IGJhc2VEZWxheSA9IGFjY291bnREZWxheXMuZ2V0KHJlcGx5ZXIuaWQpID8/IHJlcGx5QmFzZURlbGF5O1xuICAgICAgICBjb25zdCByZXBseWVyQWN0aXZpdHlEZWxheSA9IGdldE5leHRBY3RpdmVUaW1lKHJlcGx5ZXIpO1xuICAgICAgICBjb25zdCBjdXJyZW50RGVsYXkgPSBNYXRoLm1heChiYXNlRGVsYXksIHJlcGx5ZXJBY3Rpdml0eURlbGF5KTtcbiAgICAgICAgY29uc3QgbmV4dERlbGF5ID0gY3VycmVudERlbGF5ICsgZ2V0UmFuZG9tRGVsYXkoc2V0dGluZ3MuZGVsYXlzLmJldHdlZW5Db21tZW50cyk7XG4gICAgICAgIGFjY291bnREZWxheXMuc2V0KHJlcGx5ZXIuaWQsIG5leHREZWxheSk7XG5cbiAgICAgICAgY29uc3QgcmVwbHlKb2JEYXRhOiBSZXBseUpvYkRhdGEgPSB7XG4gICAgICAgICAgdHlwZTogJ3JlcGx5JyxcbiAgICAgICAgICBhY2NvdW50SWQ6IHJlcGx5ZXIuaWQsXG4gICAgICAgICAgY2FmZUlkLFxuICAgICAgICAgIGFydGljbGVJZCxcbiAgICAgICAgICBjb250ZW50OiByZXBseVRleHQsXG4gICAgICAgICAgY29tbWVudEluZGV4OiB0YXJnZXRDb21tZW50SW5kZXgsXG4gICAgICAgICAgcGFyZW50Tmlja25hbWU6IHBhcmVudEF1dGhvck5pY2tuYW1lLFxuICAgICAgICAgIHNlcXVlbmNlSWQ6IGNvbW1lbnRCYXRjaElkLFxuICAgICAgICB9O1xuXG4gICAgICAgIGF3YWl0IGFkZFRhc2tKb2IocmVwbHllci5pZCwgcmVwbHlKb2JEYXRhLCBjdXJyZW50RGVsYXkpO1xuICAgICAgICBqb2JzQWRkZWQrKztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2Vzczogam9ic0FkZGVkID4gMCxcbiAgICAgIHRvdGFsQXJ0aWNsZXM6IHNlbGVjdGVkQXJ0aWNsZXMubGVuZ3RoLFxuICAgICAgY29tcGxldGVkOiBqb2JzQWRkZWQsXG4gICAgICBmYWlsZWQ6IDAsXG4gICAgICByZXN1bHRzOiBbXSxcbiAgICAgIG1lc3NhZ2U6IGAke2pvYnNBZGRlZH3qsJwgam9i7J20IO2BkOyXkCDstpTqsIDrkKggKCR7c2VsZWN0ZWRBcnRpY2xlcy5sZW5ndGh96rCcIOq4gCDrjIDsg4EpYCxcbiAgICB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ+yVjCDsiJgg7JeG64qUIOyYpOulmCc7XG4gICAgY29uc29sZS5lcnJvcignW0FVVE8tQ09NTUVOVF0g7JeQ65+sOicsIGVycm9yTWVzc2FnZSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgdG90YWxBcnRpY2xlczogMCxcbiAgICAgIGNvbXBsZXRlZDogMCxcbiAgICAgIGZhaWxlZDogMCxcbiAgICAgIHJlc3VsdHM6IFtdLFxuICAgICAgbWVzc2FnZTogZXJyb3JNZXNzYWdlLFxuICAgIH07XG4gIH1cbn07XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6InFUQW9FYSxpTUFBQSJ9
}),
"[project]/src/features/auto-comment/publish/comment-only-ui.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CommentOnlyUI",
    ()=>CommentOnlyUI
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/cn.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/ui/index.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-check.mjs [app-client] (ecmascript) <export default as CheckCircle2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-x.mjs [app-client] (ecmascript) <export default as XCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.mjs [app-client] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$accounts$2f$actions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/features/accounts/actions.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$cafe$2f$api$2f$data$3a$4f4b56__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/src/entities/cafe/api/data:4f4b56 [app-client] (ecmascript) <text/javascript>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$publish$2f$data$3a$803d61__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/src/features/auto-comment/publish/data:803d61 [app-client] (ecmascript) <text/javascript>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
const CommentOnlyUI = ()=>{
    _s();
    const [isPending, startTransition] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransition"])();
    const [cafes, setCafes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [cafesLoaded, setCafesLoaded] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [selectedCafeId, setSelectedCafeId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CommentOnlyUI.useEffect": ()=>{
            const loadCafes = {
                "CommentOnlyUI.useEffect.loadCafes": async ()=>{
                    const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$cafe$2f$api$2f$data$3a$4f4b56__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["getCafesAction"])();
                    setCafes(data);
                    const defaultCafe = data.find({
                        "CommentOnlyUI.useEffect.loadCafes": (c)=>c.isDefault
                    }["CommentOnlyUI.useEffect.loadCafes"]) || data[0];
                    if (defaultCafe) setSelectedCafeId(defaultCafe.cafeId);
                    setCafesLoaded(true);
                }
            }["CommentOnlyUI.useEffect.loadCafes"];
            loadCafes();
        }
    }["CommentOnlyUI.useEffect"], []);
    const [daysLimit, setDaysLimit] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(3);
    const [result, setResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [phase, setPhase] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('ready');
    const safeDaysLimit = daysLimit || 1;
    const inputClassName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-full rounded-xl border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--ink)', 'placeholder:text-(--ink-tertiary) transition-all', 'focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/10');
    const labelClassName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-sm font-medium text-(--ink)');
    const handleExecute = ()=>{
        startTransition(async ()=>{
            setResult(null);
            setPhase('running');
            const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$publish$2f$data$3a$803d61__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["runAutoCommentAction"])(selectedCafeId, safeDaysLimit);
            setResult(res);
            setPhase('done');
        });
    };
    const handleReset = ()=>{
        setResult(null);
        setPhase('ready');
    };
    const handleDaysLimitChange = (value)=>{
        const cleaned = value.replace(/\D/g, '');
        if (cleaned === '') {
            setDaysLimit('');
            return;
        }
        setDaysLimit(Math.min(30, Number(cleaned)));
    };
    const handleDaysLimitBlur = ()=>{
        if (daysLimit === '' || daysLimit < 1) {
            setDaysLimit(1);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('space-y-6'),
        children: [
            phase === 'ready' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('space-y-4'),
                children: [
                    cafesLoaded && cafes.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('rounded-xl border border-(--border-light) bg-(--surface-muted) p-4 text-sm text-(--ink-muted)'),
                        children: "등록된 카페가 없습니다. 카페 관리 화면에서 먼저 카페를 등록해주세요."
                    }, void 0, false, {
                        fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                        lineNumber: 82,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Select"], {
                        label: "카페 선택",
                        value: selectedCafeId,
                        onChange: (e)=>setSelectedCafeId(e.target.value),
                        options: cafes.map((cafe)=>({
                                value: cafe.cafeId,
                                label: `${cafe.name}${cafe.isDefault ? ' (기본)' : ''}`
                            }))
                    }, void 0, false, {
                        fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                        lineNumber: 86,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('space-y-2'),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: labelClassName,
                                children: "기간 설정 (일)"
                            }, void 0, false, {
                                fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                                lineNumber: 98,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                inputMode: "numeric",
                                value: daysLimit,
                                onFocus: (e)=>e.target.select(),
                                onChange: (event)=>handleDaysLimitChange(event.target.value),
                                onBlur: handleDaysLimitBlur,
                                className: inputClassName
                            }, void 0, false, {
                                fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                                lineNumber: 99,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                        lineNumber: 97,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('rounded-xl border border-(--info)/20 bg-(--info-soft) p-4 space-y-2'),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-sm font-semibold text-(--info)'),
                                children: "자동 선택 기준"
                            }, void 0, false, {
                                fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                                lineNumber: 111,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-xs text-(--info)/80 space-y-1'),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        children: [
                                            "• 최근 ",
                                            safeDaysLimit,
                                            "일 이내 글 중 랜덤 절반 선택"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                                        lineNumber: 113,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        children: "• 글당 3~15개 작성"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                                        lineNumber: 114,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        children: "• 대댓글 50% / 댓글 50%"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                                        lineNumber: 115,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                                lineNumber: 112,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                        lineNumber: 110,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                lineNumber: 80,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            phase === 'ready' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                onClick: handleExecute,
                disabled: isPending || !selectedCafeId,
                size: "lg",
                fullWidth: true,
                children: "댓글 자동 달기"
            }, void 0, false, {
                fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                lineNumber: 122,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            phase === 'running' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('rounded-2xl border border-(--border-light) bg-(--surface) p-8 text-center'),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-8 h-8 text-(--accent) animate-spin mx-auto mb-4')
                    }, void 0, false, {
                        fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                        lineNumber: 134,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-sm font-medium text-(--ink)'),
                        children: "댓글 작성 중..."
                    }, void 0, false, {
                        fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                        lineNumber: 135,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-xs text-(--ink-muted) mt-1'),
                        children: "각 글에 댓글/대댓글을 달고 있습니다"
                    }, void 0, false, {
                        fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                        lineNumber: 136,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                lineNumber: 133,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            phase === 'done' && result && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('rounded-2xl border p-5', result.success ? 'border-(--success)/30 bg-(--success-soft)' : 'border-(--danger)/30 bg-(--danger-soft)'),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex items-center justify-between mb-3'),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('font-semibold', result.success ? 'text-(--success)' : 'text-(--danger)'),
                                        children: result.success ? '완료!' : '일부 실패'
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                                        lineNumber: 153,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-sm text-(--ink-muted)'),
                                        children: [
                                            result.completed,
                                            "/",
                                            result.totalArticles,
                                            " 글 처리"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                                        lineNumber: 161,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                                lineNumber: 152,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex gap-4 mb-4 text-xs text-(--ink-muted) bg-(--surface)/50 rounded-lg px-4 py-2'),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            "총 ",
                                            result.results.reduce((sum, r)=>sum + r.commentsAdded, 0),
                                            "개 작성"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                                        lineNumber: 167,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            "성공 ",
                                            result.completed,
                                            "개"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                                        lineNumber: 168,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            "실패 ",
                                            result.failed,
                                            "개"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                                        lineNumber: 169,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                                lineNumber: 166,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('space-y-2 max-h-52 overflow-y-auto'),
                                children: result.results.map((r, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('rounded-xl border border-(--border-light) bg-(--surface) px-4 py-3'),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex items-center gap-2'),
                                                children: [
                                                    r.success ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__["CheckCircle2"], {
                                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-4 h-4 text-(--success) shrink-0')
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                                                        lineNumber: 182,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__["XCircle"], {
                                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-4 h-4 text-(--danger) shrink-0')
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                                                        lineNumber: 184,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                        href: `https://cafe.naver.com/ca-fe/cafes/${selectedCafeId}/articles/${r.articleId}`,
                                                        target: "_blank",
                                                        rel: "noopener noreferrer",
                                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-xs text-(--accent) hover:underline'),
                                                        children: [
                                                            "#",
                                                            r.articleId,
                                                            " ↗"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                                                        lineNumber: 186,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('font-medium text-sm text-(--ink) flex-1'),
                                                        children: r.keyword
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                                                        lineNumber: 194,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    r.success && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-xs text-(--success)'),
                                                        children: [
                                                            "+",
                                                            r.commentsAdded,
                                                            "개"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                                                        lineNumber: 198,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                                                lineNumber: 180,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            r.error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-xs text-(--danger) mt-1'),
                                                children: r.error
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                                                lineNumber: 204,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, i, true, {
                                        fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                                        lineNumber: 174,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)))
                            }, void 0, false, {
                                fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                                lineNumber: 172,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                        lineNumber: 144,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                        variant: "secondary",
                        size: "lg",
                        fullWidth: true,
                        onClick: handleReset,
                        children: "새로 시작"
                    }, void 0, false, {
                        fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                        lineNumber: 211,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
                lineNumber: 143,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/features/auto-comment/publish/comment-only-ui.tsx",
        lineNumber: 78,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(CommentOnlyUI, "y5jOsliIxk+K9N4F0QsYMuEptjU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransition"]
    ];
});
_c = CommentOnlyUI;
var _c;
__turbopack_context__.k.register(_c, "CommentOnlyUI");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/features/auto-comment/publish/data:5a1623 [app-client] (ecmascript) <text/javascript>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "runManuscriptUploadAction",
    ()=>$$RSC_SERVER_ACTION_0
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
/* __next_internal_action_entry_do_not_use__ [{"40fd828fd50916c9ce4dc1a3325b7e3b6b048b80da":"runManuscriptUploadAction"},"src/features/auto-comment/publish/manuscript-actions.ts",""] */ "use turbopack no side effects";
;
const $$RSC_SERVER_ACTION_0 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("40fd828fd50916c9ce4dc1a3325b7e3b6b048b80da", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "runManuscriptUploadAction");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
 //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vbWFudXNjcmlwdC1hY3Rpb25zLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc2VydmVyJztcblxuaW1wb3J0IHsgZ2V0QWxsQWNjb3VudHMgfSBmcm9tICdAL3NoYXJlZC9jb25maWcvYWNjb3VudHMnO1xuaW1wb3J0IHsgZ2V0Q2FmZVdyaXRlckFjY291bnRzIH0gZnJvbSAnQC9zaGFyZWQvY29uZmlnL2NhZmUtYWNjb3VudC1wb2xpY3knO1xuaW1wb3J0IHsgZ2V0Q2FmZUJ5SWQsIGdldERlZmF1bHRDYWZlIH0gZnJvbSAnQC9zaGFyZWQvY29uZmlnL2NhZmVzJztcbmltcG9ydCB7IGNvbm5lY3REQiB9IGZyb20gJ0Avc2hhcmVkL2xpYi9tb25nb2RiJztcbmltcG9ydCB7IGFkZFRhc2tKb2IgfSBmcm9tICdAL3NoYXJlZC9saWIvcXVldWUnO1xuaW1wb3J0IHsgZ2V0UmFuZG9tRGVsYXkgfSBmcm9tICdAL3NoYXJlZC9tb2RlbHMvcXVldWUtc2V0dGluZ3MnO1xuaW1wb3J0IHsgZ2V0UmVtYWluaW5nUG9zdHNUb2RheSwgUHVibGlzaGVkQXJ0aWNsZSwgTW9kaWZpZWRBcnRpY2xlIH0gZnJvbSAnQC9zaGFyZWQvbW9kZWxzJztcbmltcG9ydCB7IGJ1aWxkQ2FmZVBvc3RDb250ZW50RnJvbU1hbnVzY3JpcHQgfSBmcm9tICdAL3NoYXJlZC9saWIvY2FmZS1jb250ZW50JztcbmltcG9ydCB7IGlzQWNjb3VudEFjdGl2ZSB9IGZyb20gJ0Avc2hhcmVkL2xpYi9hY2NvdW50LW1hbmFnZXInO1xuaW1wb3J0IHsgUG9zdEpvYkRhdGEgfSBmcm9tICdAL3NoYXJlZC9saWIvcXVldWUvdHlwZXMnO1xuaW1wb3J0IHsgbW9kaWZ5QXJ0aWNsZVdpdGhBY2NvdW50IH0gZnJvbSAnQC9zaGFyZWQvbGliL25hdmVyLWNhZmUtd3JpdGluZyc7XG5pbXBvcnQgeyBidWlsZEJhc2VGaWx0ZXIsIGZldGNoQXJ0aWNsZXNUb01vZGlmeSB9IGZyb20gJ0Avc2hhcmVkL2xpYi9uYXZlci1jYWZlLXdyaXRpbmcnO1xuaW1wb3J0IHsgaW5pdEJhdGNoQ29udGV4dCwgaXNCYXRjaENvbnRleHRFcnJvciB9IGZyb20gJy4uL2JhdGNoL2JhdGNoLWhlbHBlcnMnO1xuaW1wb3J0IHR5cGUge1xuICBNYW51c2NyaXB0VXBsb2FkSW5wdXQsXG4gIE1hbnVzY3JpcHRVcGxvYWRSZXN1bHQsXG4gIE1hbnVzY3JpcHRNb2RpZnlJbnB1dCxcbiAgTWFudXNjcmlwdE1vZGlmeVJlc3VsdCxcbiAgTWFudXNjcmlwdE1vZGlmeUFydGljbGVSZXN1bHQsXG59IGZyb20gJy4vdHlwZXMnO1xuXG5leHBvcnQgY29uc3QgcnVuTWFudXNjcmlwdFVwbG9hZEFjdGlvbiA9IGFzeW5jIChcbiAgaW5wdXQ6IE1hbnVzY3JpcHRVcGxvYWRJbnB1dFxuKTogUHJvbWlzZTxNYW51c2NyaXB0VXBsb2FkUmVzdWx0PiA9PiB7XG4gIGNvbnN0IHsgbWFudXNjcmlwdHMsIGNhZmVJZDogaW5wdXRDYWZlSWQsIHBvc3RPcHRpb25zIH0gPSBpbnB1dDtcblxuICBjb25zb2xlLmxvZygnW01BTlVTQ1JJUFRdIOyXheuhnOuTnCDsi5zsnpE6JywgbWFudXNjcmlwdHMubGVuZ3RoLCAn6rCcIOybkOqzoCcpO1xuXG4gIGNvbnN0IGN0eCA9IGF3YWl0IGluaXRCYXRjaENvbnRleHQoaW5wdXRDYWZlSWQsIDEpO1xuICBpZiAoaXNCYXRjaENvbnRleHRFcnJvcihjdHgpKSB7XG4gICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGpvYnNBZGRlZDogMCwgbWVzc2FnZTogY3R4LmVycm9yIH07XG4gIH1cblxuICBjb25zdCB7IGFjY291bnRzLCBjYWZlLCBzZXR0aW5ncyB9ID0gY3R4O1xuICBjb25zdCB3cml0ZXJBY2NvdW50cyA9IGdldENhZmVXcml0ZXJBY2NvdW50cyhhY2NvdW50cywgY2FmZS5jYWZlSWQpO1xuXG4gIGlmICh3cml0ZXJBY2NvdW50cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBqb2JzQWRkZWQ6IDAsXG4gICAgICBtZXNzYWdlOiBg6riA7JOw6riwIOqwgOuKpe2VnCDqs4TsoJXsnbQg7JeG7Iq164uI64ukICgke2NhZmUubmFtZX0pYCxcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgZW5hYmxlRGFpbHlQb3N0TGltaXQgPSBzZXR0aW5ncy5saW1pdHM/LmVuYWJsZURhaWx5UG9zdExpbWl0ID8/IHRydWU7XG5cbiAgbGV0IGpvYnNBZGRlZCA9IDA7XG4gIGxldCBza2lwcGVkID0gMDtcbiAgbGV0IGdsb2JhbERlbGF5ID0gMDtcblxuICBjb25zdCBhY2NvdW50UmVtYWluaW5nUG9zdHM6IE1hcDxzdHJpbmcsIG51bWJlcj4gPSBuZXcgTWFwKCk7XG4gIGlmIChlbmFibGVEYWlseVBvc3RMaW1pdCkge1xuICAgIGZvciAoY29uc3QgYWNjb3VudCBvZiB3cml0ZXJBY2NvdW50cykge1xuICAgICAgY29uc3QgcmVtYWluaW5nID0gYXdhaXQgZ2V0UmVtYWluaW5nUG9zdHNUb2RheShhY2NvdW50LmlkLCBjYWZlLmNhZmVJZCwgYWNjb3VudC5kYWlseVBvc3RMaW1pdCk7XG4gICAgICBhY2NvdW50UmVtYWluaW5nUG9zdHMuc2V0KGFjY291bnQuaWQsIHJlbWFpbmluZyk7XG4gICAgfVxuICB9XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYW51c2NyaXB0cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG1hbnVzY3JpcHQgPSBtYW51c2NyaXB0c1tpXTtcbiAgICBjb25zdCB3cml0ZXJBY2NvdW50ID0gd3JpdGVyQWNjb3VudHNbaSAlIHdyaXRlckFjY291bnRzLmxlbmd0aF07XG5cbiAgICBpZiAoIWlzQWNjb3VudEFjdGl2ZSh3cml0ZXJBY2NvdW50KSkge1xuICAgICAgY29uc29sZS5sb2coYFtNQU5VU0NSSVBUXSAke3dyaXRlckFjY291bnQuaWR9IOu5hO2ZnOuPmSDsi5zqsITrjIAgLSDsiqTtgrVgKTtcbiAgICAgIHNraXBwZWQrKztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChlbmFibGVEYWlseVBvc3RMaW1pdCkge1xuICAgICAgY29uc3QgcmVtYWluaW5nID0gYWNjb3VudFJlbWFpbmluZ1Bvc3RzLmdldCh3cml0ZXJBY2NvdW50LmlkKSA/PyAwO1xuICAgICAgaWYgKHJlbWFpbmluZyA8PSAwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbTUFOVVNDUklQVF0gJHt3cml0ZXJBY2NvdW50LmlkfSDsnbzsnbwg7Y+s7Iqk7Yq4IOygnO2VnCDrj4Tri6wgLSDsiqTtgrVgKTtcbiAgICAgICAgc2tpcHBlZCsrO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZW5hYmxlRGFpbHlQb3N0TGltaXQpIHtcbiAgICAgIGNvbnN0IHJlbWFpbmluZyA9IGFjY291bnRSZW1haW5pbmdQb3N0cy5nZXQod3JpdGVyQWNjb3VudC5pZCkgPz8gMDtcbiAgICAgIGFjY291bnRSZW1haW5pbmdQb3N0cy5zZXQod3JpdGVyQWNjb3VudC5pZCwgcmVtYWluaW5nIC0gMSk7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGxldCBtZW51SWQgPSBjYWZlLm1lbnVJZDtcbiAgICAgIGlmIChtYW51c2NyaXB0LmNhdGVnb3J5ICYmIGNhZmUuY2F0ZWdvcnlNZW51SWRzKSB7XG4gICAgICAgIGNvbnN0IG1hcHBlZE1lbnVJZCA9IGNhZmUuY2F0ZWdvcnlNZW51SWRzW21hbnVzY3JpcHQuY2F0ZWdvcnldO1xuICAgICAgICBpZiAobWFwcGVkTWVudUlkKSB7XG4gICAgICAgICAgbWVudUlkID0gbWFwcGVkTWVudUlkO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHsgdGl0bGUsIGh0bWxDb250ZW50IH0gPSBidWlsZENhZmVQb3N0Q29udGVudEZyb21NYW51c2NyaXB0KFxuICAgICAgICBtYW51c2NyaXB0LmNvbnRlbnQsXG4gICAgICAgIG1hbnVzY3JpcHQubmFtZSxcbiAgICAgICAgbWFudXNjcmlwdC5pbWFnZXNcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IGpvYkRhdGE6IFBvc3RKb2JEYXRhID0ge1xuICAgICAgICB0eXBlOiAncG9zdCcsXG4gICAgICAgIGFjY291bnRJZDogd3JpdGVyQWNjb3VudC5pZCxcbiAgICAgICAgY2FmZUlkOiBjYWZlLmNhZmVJZCxcbiAgICAgICAgbWVudUlkLFxuICAgICAgICBzdWJqZWN0OiB0aXRsZSxcbiAgICAgICAgY29udGVudDogaHRtbENvbnRlbnQsXG4gICAgICAgIHBvc3RPcHRpb25zLFxuICAgICAgICBrZXl3b3JkOiBtYW51c2NyaXB0Lm5hbWUsXG4gICAgICAgIHNlcnZpY2U6ICfsm5Dqs6Dsl4XroZzrk5wnLFxuICAgICAgICByYXdDb250ZW50OiBtYW51c2NyaXB0LmNvbnRlbnQsXG4gICAgICAgIHNraXBDb21tZW50czogdHJ1ZSxcbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IGFkZFRhc2tKb2Iod3JpdGVyQWNjb3VudC5pZCwgam9iRGF0YSwgZ2xvYmFsRGVsYXkpO1xuICAgICAgam9ic0FkZGVkKys7XG5cbiAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBgW01BTlVTQ1JJUFRdIEpvYiDstpTqsIA6ICR7bWFudXNjcmlwdC5uYW1lfSAoJHttYW51c2NyaXB0LmNhdGVnb3J5IHx8ICfrr7jsp4DsoJUnfSkg4oaSICR7d3JpdGVyQWNjb3VudC5pZH0sIOuUnOugiOydtDogJHtNYXRoLnJvdW5kKGdsb2JhbERlbGF5IC8gMTAwMCl97LSIYFxuICAgICAgKTtcblxuICAgICAgY29uc3QgcmFuZG9tRGVsYXkgPSBnZXRSYW5kb21EZWxheShzZXR0aW5ncy5kZWxheXMuYmV0d2VlblBvc3RzKTtcbiAgICAgIGdsb2JhbERlbGF5ICs9IHJhbmRvbURlbGF5O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBbTUFOVVNDUklQVF0g7JeQ65+sOiAke21hbnVzY3JpcHQubmFtZX1gLCBlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgc2tpcE1zZyA9IHNraXBwZWQgPiAwID8gYCwgJHtza2lwcGVkfeqwnCDsiqTtgrUgKOygnO2VnC/ruYTtmZzrj5kpYCA6ICcnO1xuICByZXR1cm4ge1xuICAgIHN1Y2Nlc3M6IGpvYnNBZGRlZCA+IDAsXG4gICAgam9ic0FkZGVkLFxuICAgIG1lc3NhZ2U6IGAke2pvYnNBZGRlZH3qsJwg7JuQ6rOg6rCAIO2BkOyXkCDstpTqsIDrkKggKCR7d3JpdGVyQWNjb3VudHMubGVuZ3RofeqwnCDquIDsk7DquLAg6rOE7KCVIOyymOumrCkke3NraXBNc2d9YCxcbiAgfTtcbn07XG5cbmV4cG9ydCBjb25zdCBydW5NYW51c2NyaXB0TW9kaWZ5QWN0aW9uID0gYXN5bmMgKFxuICBpbnB1dDogTWFudXNjcmlwdE1vZGlmeUlucHV0XG4pOiBQcm9taXNlPE1hbnVzY3JpcHRNb2RpZnlSZXN1bHQ+ID0+IHtcbiAgY29uc3QgeyBtYW51c2NyaXB0cywgY2FmZUlkOiBpbnB1dENhZmVJZCwgc29ydE9yZGVyID0gJ29sZGVzdCcsIGRheXNMaW1pdCB9ID0gaW5wdXQ7XG5cbiAgY29uc29sZS5sb2coJ1tNQU5VU0NSSVBUIE1PRElGWV0g7IiY7KCVIOyLnOyekTonLCBtYW51c2NyaXB0cy5sZW5ndGgsICfqsJwg7JuQ6rOgJyk7XG5cbiAgY29uc3QgYWNjb3VudHMgPSBhd2FpdCBnZXRBbGxBY2NvdW50cygpO1xuICBpZiAoYWNjb3VudHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgdG90YWxBcnRpY2xlczogMCxcbiAgICAgIGNvbXBsZXRlZDogMCxcbiAgICAgIGZhaWxlZDogMCxcbiAgICAgIHJlc3VsdHM6IFtdLFxuICAgICAgbWVzc2FnZTogJ+qzhOygleydtCDtlYTsmpTtlanri4jri6QnLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBjYWZlID0gaW5wdXRDYWZlSWQgPyBhd2FpdCBnZXRDYWZlQnlJZChpbnB1dENhZmVJZCkgOiBhd2FpdCBnZXREZWZhdWx0Q2FmZSgpO1xuICBpZiAoIWNhZmUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICB0b3RhbEFydGljbGVzOiAwLFxuICAgICAgY29tcGxldGVkOiAwLFxuICAgICAgZmFpbGVkOiAwLFxuICAgICAgcmVzdWx0czogW10sXG4gICAgICBtZXNzYWdlOiAn7Lm07Y6Y66W8IOywvuydhCDsiJgg7JeG7Iq164uI64ukJyxcbiAgICB9O1xuICB9XG5cbiAgYXdhaXQgY29ubmVjdERCKCk7XG5cbiAgY29uc3QgYmFzZUZpbHRlciA9IGJ1aWxkQmFzZUZpbHRlcihjYWZlLmNhZmVJZCwgZGF5c0xpbWl0KTtcbiAgY29uc3QgYXJ0aWNsZXNUb01vZGlmeSA9IGF3YWl0IGZldGNoQXJ0aWNsZXNUb01vZGlmeShzb3J0T3JkZXIsIG1hbnVzY3JpcHRzLmxlbmd0aCwgYmFzZUZpbHRlcik7XG5cbiAgaWYgKGFydGljbGVzVG9Nb2RpZnkubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgdG90YWxBcnRpY2xlczogMCxcbiAgICAgIGNvbXBsZXRlZDogMCxcbiAgICAgIGZhaWxlZDogMCxcbiAgICAgIHJlc3VsdHM6IFtdLFxuICAgICAgbWVzc2FnZTogJ+yImOyglSDqsIDriqXtlZwg6riA7J20IOyXhuyKteuLiOuLpCAo67Cc7ZaJ65CcIOq4gOydtCDsl4bqsbDrgpgg7J2066+4IOyImOygleuQqCknLFxuICAgIH07XG4gIH1cblxuICBjb25zb2xlLmxvZyhgW01BTlVTQ1JJUFQgTU9ESUZZXSDsiJjsoJUg64yA7IOBOiAke2FydGljbGVzVG9Nb2RpZnkubGVuZ3RofeqwnCDquIBgKTtcblxuICBjb25zdCByZXN1bHRzOiBNYW51c2NyaXB0TW9kaWZ5QXJ0aWNsZVJlc3VsdFtdID0gW107XG4gIGxldCBjb21wbGV0ZWQgPSAwO1xuICBsZXQgZmFpbGVkID0gMDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGFydGljbGVzVG9Nb2RpZnkubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBhcnRpY2xlID0gYXJ0aWNsZXNUb01vZGlmeVtpXTtcbiAgICBjb25zdCBtYW51c2NyaXB0ID0gbWFudXNjcmlwdHNbaV07XG4gICAgY29uc3QgeyBhcnRpY2xlSWQsIHdyaXRlckFjY291bnRJZCwga2V5d29yZCB9ID0gYXJ0aWNsZTtcbiAgICBjb25zdCB3cml0ZXJBY2NvdW50ID0gYWNjb3VudHMuZmluZCgoYSkgPT4gYS5pZCA9PT0gd3JpdGVyQWNjb3VudElkKTtcblxuICAgIGlmICghd3JpdGVyQWNjb3VudCkge1xuICAgICAgY29uc29sZS5sb2coYFtNQU5VU0NSSVBUIE1PRElGWV0g7J6R7ISx7J6QIOqzhOyglSgke3dyaXRlckFjY291bnRJZH0pIOyXhuydjCAtIOyKpO2CtWApO1xuICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgYXJ0aWNsZUlkLFxuICAgICAgICBrZXl3b3JkLFxuICAgICAgICBtYW51c2NyaXB0TmFtZTogbWFudXNjcmlwdC5uYW1lLFxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IGDsnpHshLHsnpAg6rOE7KCVKCR7d3JpdGVyQWNjb3VudElkfSkg7JeG7J2MYCxcbiAgICAgIH0pO1xuICAgICAgZmFpbGVkKys7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgeyB0aXRsZTogbmV3VGl0bGUsIGh0bWxDb250ZW50OiBuZXdDb250ZW50IH0gPSBidWlsZENhZmVQb3N0Q29udGVudEZyb21NYW51c2NyaXB0KFxuICAgICAgICBtYW51c2NyaXB0LmNvbnRlbnQsXG4gICAgICAgIG1hbnVzY3JpcHQubmFtZSxcbiAgICAgICAgbWFudXNjcmlwdC5pbWFnZXNcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IG1vZGlmeVJlc3VsdCA9IGF3YWl0IG1vZGlmeUFydGljbGVXaXRoQWNjb3VudCh3cml0ZXJBY2NvdW50LCB7XG4gICAgICAgIGNhZmVJZDogY2FmZS5jYWZlSWQsXG4gICAgICAgIGFydGljbGVJZCxcbiAgICAgICAgbmV3VGl0bGUsXG4gICAgICAgIG5ld0NvbnRlbnQsXG4gICAgICAgIGNhdGVnb3J5OiBtYW51c2NyaXB0LmNhdGVnb3J5LFxuICAgICAgfSk7XG5cbiAgICAgIGlmICghbW9kaWZ5UmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICBhcnRpY2xlSWQsXG4gICAgICAgICAga2V5d29yZCxcbiAgICAgICAgICBtYW51c2NyaXB0TmFtZTogbWFudXNjcmlwdC5uYW1lLFxuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIGVycm9yOiBtb2RpZnlSZXN1bHQuZXJyb3IgfHwgJ+yImOyglSDsi6TtjKgnLFxuICAgICAgICB9KTtcbiAgICAgICAgZmFpbGVkKys7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCBNb2RpZmllZEFydGljbGUuY3JlYXRlKHtcbiAgICAgICAgb3JpZ2luYWxBcnRpY2xlSWQ6IGFydGljbGUuX2lkLFxuICAgICAgICBhcnRpY2xlSWQsXG4gICAgICAgIGNhZmVJZDogY2FmZS5jYWZlSWQsXG4gICAgICAgIGtleXdvcmQ6IG1hbnVzY3JpcHQubmFtZSxcbiAgICAgICAgbmV3VGl0bGUsXG4gICAgICAgIG5ld0NvbnRlbnQsXG4gICAgICAgIG1vZGlmaWVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgIG1vZGlmaWVkQnk6IHdyaXRlckFjY291bnRJZCxcbiAgICAgIH0pO1xuXG4gICAgICBhd2FpdCBQdWJsaXNoZWRBcnRpY2xlLmRlbGV0ZU9uZSh7IF9pZDogYXJ0aWNsZS5faWQgfSk7XG5cbiAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgIGFydGljbGVJZCxcbiAgICAgICAga2V5d29yZCxcbiAgICAgICAgbWFudXNjcmlwdE5hbWU6IG1hbnVzY3JpcHQubmFtZSxcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIH0pO1xuICAgICAgY29tcGxldGVkKys7XG5cbiAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBgW01BTlVTQ1JJUFQgTU9ESUZZXSDsiJjsoJUg7JmE66OMOiAke21hbnVzY3JpcHQubmFtZX0g4oaSICR7YXJ0aWNsZUlkfSAoJHtpICsgMX0vJHthcnRpY2xlc1RvTW9kaWZ5Lmxlbmd0aH0pYFxuICAgICAgKTtcblxuICAgICAgaWYgKGkgPCBhcnRpY2xlc1RvTW9kaWZ5Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1tNQU5VU0NSSVBUIE1PRElGWV0g64uk7J2MIOq4gCDsiJjsoJUg7KCEIDMw7LSIIOuMgOq4sC4uLicpO1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCAzMDAwMCkpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICfslYwg7IiYIOyXhuuKlCDsmKTrpZgnO1xuICAgICAgY29uc29sZS5lcnJvcihgW01BTlVTQ1JJUFQgTU9ESUZZXSDsl5Drn6w6ICR7bWFudXNjcmlwdC5uYW1lfWAsIGVycm9yKTtcbiAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgIGFydGljbGVJZCxcbiAgICAgICAga2V5d29yZCxcbiAgICAgICAgbWFudXNjcmlwdE5hbWU6IG1hbnVzY3JpcHQubmFtZSxcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiBlcnJvck1lc3NhZ2UsXG4gICAgICB9KTtcbiAgICAgIGZhaWxlZCsrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc3VjY2VzczogZmFpbGVkID09PSAwLFxuICAgIHRvdGFsQXJ0aWNsZXM6IGFydGljbGVzVG9Nb2RpZnkubGVuZ3RoLFxuICAgIGNvbXBsZXRlZCxcbiAgICBmYWlsZWQsXG4gICAgcmVzdWx0cyxcbiAgICBtZXNzYWdlOiBgJHtjb21wbGV0ZWR96rCcIOyImOyglSDsmYTro4wsICR7ZmFpbGVkfeqwnCDsi6TtjKhgLFxuICB9O1xufTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoicVVBdUJhLHNNQUFBIn0=
}),
"[project]/src/features/auto-comment/publish/data:a57ae3 [app-client] (ecmascript) <text/javascript>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "runManuscriptModifyAction",
    ()=>$$RSC_SERVER_ACTION_1
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
/* __next_internal_action_entry_do_not_use__ [{"4004a238121d140fff6a1b2e3b2178649c3be98edc":"runManuscriptModifyAction"},"src/features/auto-comment/publish/manuscript-actions.ts",""] */ "use turbopack no side effects";
;
const $$RSC_SERVER_ACTION_1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("4004a238121d140fff6a1b2e3b2178649c3be98edc", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "runManuscriptModifyAction");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
 //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vbWFudXNjcmlwdC1hY3Rpb25zLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc2VydmVyJztcblxuaW1wb3J0IHsgZ2V0QWxsQWNjb3VudHMgfSBmcm9tICdAL3NoYXJlZC9jb25maWcvYWNjb3VudHMnO1xuaW1wb3J0IHsgZ2V0Q2FmZVdyaXRlckFjY291bnRzIH0gZnJvbSAnQC9zaGFyZWQvY29uZmlnL2NhZmUtYWNjb3VudC1wb2xpY3knO1xuaW1wb3J0IHsgZ2V0Q2FmZUJ5SWQsIGdldERlZmF1bHRDYWZlIH0gZnJvbSAnQC9zaGFyZWQvY29uZmlnL2NhZmVzJztcbmltcG9ydCB7IGNvbm5lY3REQiB9IGZyb20gJ0Avc2hhcmVkL2xpYi9tb25nb2RiJztcbmltcG9ydCB7IGFkZFRhc2tKb2IgfSBmcm9tICdAL3NoYXJlZC9saWIvcXVldWUnO1xuaW1wb3J0IHsgZ2V0UmFuZG9tRGVsYXkgfSBmcm9tICdAL3NoYXJlZC9tb2RlbHMvcXVldWUtc2V0dGluZ3MnO1xuaW1wb3J0IHsgZ2V0UmVtYWluaW5nUG9zdHNUb2RheSwgUHVibGlzaGVkQXJ0aWNsZSwgTW9kaWZpZWRBcnRpY2xlIH0gZnJvbSAnQC9zaGFyZWQvbW9kZWxzJztcbmltcG9ydCB7IGJ1aWxkQ2FmZVBvc3RDb250ZW50RnJvbU1hbnVzY3JpcHQgfSBmcm9tICdAL3NoYXJlZC9saWIvY2FmZS1jb250ZW50JztcbmltcG9ydCB7IGlzQWNjb3VudEFjdGl2ZSB9IGZyb20gJ0Avc2hhcmVkL2xpYi9hY2NvdW50LW1hbmFnZXInO1xuaW1wb3J0IHsgUG9zdEpvYkRhdGEgfSBmcm9tICdAL3NoYXJlZC9saWIvcXVldWUvdHlwZXMnO1xuaW1wb3J0IHsgbW9kaWZ5QXJ0aWNsZVdpdGhBY2NvdW50IH0gZnJvbSAnQC9zaGFyZWQvbGliL25hdmVyLWNhZmUtd3JpdGluZyc7XG5pbXBvcnQgeyBidWlsZEJhc2VGaWx0ZXIsIGZldGNoQXJ0aWNsZXNUb01vZGlmeSB9IGZyb20gJ0Avc2hhcmVkL2xpYi9uYXZlci1jYWZlLXdyaXRpbmcnO1xuaW1wb3J0IHsgaW5pdEJhdGNoQ29udGV4dCwgaXNCYXRjaENvbnRleHRFcnJvciB9IGZyb20gJy4uL2JhdGNoL2JhdGNoLWhlbHBlcnMnO1xuaW1wb3J0IHR5cGUge1xuICBNYW51c2NyaXB0VXBsb2FkSW5wdXQsXG4gIE1hbnVzY3JpcHRVcGxvYWRSZXN1bHQsXG4gIE1hbnVzY3JpcHRNb2RpZnlJbnB1dCxcbiAgTWFudXNjcmlwdE1vZGlmeVJlc3VsdCxcbiAgTWFudXNjcmlwdE1vZGlmeUFydGljbGVSZXN1bHQsXG59IGZyb20gJy4vdHlwZXMnO1xuXG5leHBvcnQgY29uc3QgcnVuTWFudXNjcmlwdFVwbG9hZEFjdGlvbiA9IGFzeW5jIChcbiAgaW5wdXQ6IE1hbnVzY3JpcHRVcGxvYWRJbnB1dFxuKTogUHJvbWlzZTxNYW51c2NyaXB0VXBsb2FkUmVzdWx0PiA9PiB7XG4gIGNvbnN0IHsgbWFudXNjcmlwdHMsIGNhZmVJZDogaW5wdXRDYWZlSWQsIHBvc3RPcHRpb25zIH0gPSBpbnB1dDtcblxuICBjb25zb2xlLmxvZygnW01BTlVTQ1JJUFRdIOyXheuhnOuTnCDsi5zsnpE6JywgbWFudXNjcmlwdHMubGVuZ3RoLCAn6rCcIOybkOqzoCcpO1xuXG4gIGNvbnN0IGN0eCA9IGF3YWl0IGluaXRCYXRjaENvbnRleHQoaW5wdXRDYWZlSWQsIDEpO1xuICBpZiAoaXNCYXRjaENvbnRleHRFcnJvcihjdHgpKSB7XG4gICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGpvYnNBZGRlZDogMCwgbWVzc2FnZTogY3R4LmVycm9yIH07XG4gIH1cblxuICBjb25zdCB7IGFjY291bnRzLCBjYWZlLCBzZXR0aW5ncyB9ID0gY3R4O1xuICBjb25zdCB3cml0ZXJBY2NvdW50cyA9IGdldENhZmVXcml0ZXJBY2NvdW50cyhhY2NvdW50cywgY2FmZS5jYWZlSWQpO1xuXG4gIGlmICh3cml0ZXJBY2NvdW50cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBqb2JzQWRkZWQ6IDAsXG4gICAgICBtZXNzYWdlOiBg6riA7JOw6riwIOqwgOuKpe2VnCDqs4TsoJXsnbQg7JeG7Iq164uI64ukICgke2NhZmUubmFtZX0pYCxcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgZW5hYmxlRGFpbHlQb3N0TGltaXQgPSBzZXR0aW5ncy5saW1pdHM/LmVuYWJsZURhaWx5UG9zdExpbWl0ID8/IHRydWU7XG5cbiAgbGV0IGpvYnNBZGRlZCA9IDA7XG4gIGxldCBza2lwcGVkID0gMDtcbiAgbGV0IGdsb2JhbERlbGF5ID0gMDtcblxuICBjb25zdCBhY2NvdW50UmVtYWluaW5nUG9zdHM6IE1hcDxzdHJpbmcsIG51bWJlcj4gPSBuZXcgTWFwKCk7XG4gIGlmIChlbmFibGVEYWlseVBvc3RMaW1pdCkge1xuICAgIGZvciAoY29uc3QgYWNjb3VudCBvZiB3cml0ZXJBY2NvdW50cykge1xuICAgICAgY29uc3QgcmVtYWluaW5nID0gYXdhaXQgZ2V0UmVtYWluaW5nUG9zdHNUb2RheShhY2NvdW50LmlkLCBjYWZlLmNhZmVJZCwgYWNjb3VudC5kYWlseVBvc3RMaW1pdCk7XG4gICAgICBhY2NvdW50UmVtYWluaW5nUG9zdHMuc2V0KGFjY291bnQuaWQsIHJlbWFpbmluZyk7XG4gICAgfVxuICB9XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYW51c2NyaXB0cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG1hbnVzY3JpcHQgPSBtYW51c2NyaXB0c1tpXTtcbiAgICBjb25zdCB3cml0ZXJBY2NvdW50ID0gd3JpdGVyQWNjb3VudHNbaSAlIHdyaXRlckFjY291bnRzLmxlbmd0aF07XG5cbiAgICBpZiAoIWlzQWNjb3VudEFjdGl2ZSh3cml0ZXJBY2NvdW50KSkge1xuICAgICAgY29uc29sZS5sb2coYFtNQU5VU0NSSVBUXSAke3dyaXRlckFjY291bnQuaWR9IOu5hO2ZnOuPmSDsi5zqsITrjIAgLSDsiqTtgrVgKTtcbiAgICAgIHNraXBwZWQrKztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChlbmFibGVEYWlseVBvc3RMaW1pdCkge1xuICAgICAgY29uc3QgcmVtYWluaW5nID0gYWNjb3VudFJlbWFpbmluZ1Bvc3RzLmdldCh3cml0ZXJBY2NvdW50LmlkKSA/PyAwO1xuICAgICAgaWYgKHJlbWFpbmluZyA8PSAwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbTUFOVVNDUklQVF0gJHt3cml0ZXJBY2NvdW50LmlkfSDsnbzsnbwg7Y+s7Iqk7Yq4IOygnO2VnCDrj4Tri6wgLSDsiqTtgrVgKTtcbiAgICAgICAgc2tpcHBlZCsrO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZW5hYmxlRGFpbHlQb3N0TGltaXQpIHtcbiAgICAgIGNvbnN0IHJlbWFpbmluZyA9IGFjY291bnRSZW1haW5pbmdQb3N0cy5nZXQod3JpdGVyQWNjb3VudC5pZCkgPz8gMDtcbiAgICAgIGFjY291bnRSZW1haW5pbmdQb3N0cy5zZXQod3JpdGVyQWNjb3VudC5pZCwgcmVtYWluaW5nIC0gMSk7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGxldCBtZW51SWQgPSBjYWZlLm1lbnVJZDtcbiAgICAgIGlmIChtYW51c2NyaXB0LmNhdGVnb3J5ICYmIGNhZmUuY2F0ZWdvcnlNZW51SWRzKSB7XG4gICAgICAgIGNvbnN0IG1hcHBlZE1lbnVJZCA9IGNhZmUuY2F0ZWdvcnlNZW51SWRzW21hbnVzY3JpcHQuY2F0ZWdvcnldO1xuICAgICAgICBpZiAobWFwcGVkTWVudUlkKSB7XG4gICAgICAgICAgbWVudUlkID0gbWFwcGVkTWVudUlkO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHsgdGl0bGUsIGh0bWxDb250ZW50IH0gPSBidWlsZENhZmVQb3N0Q29udGVudEZyb21NYW51c2NyaXB0KFxuICAgICAgICBtYW51c2NyaXB0LmNvbnRlbnQsXG4gICAgICAgIG1hbnVzY3JpcHQubmFtZSxcbiAgICAgICAgbWFudXNjcmlwdC5pbWFnZXNcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IGpvYkRhdGE6IFBvc3RKb2JEYXRhID0ge1xuICAgICAgICB0eXBlOiAncG9zdCcsXG4gICAgICAgIGFjY291bnRJZDogd3JpdGVyQWNjb3VudC5pZCxcbiAgICAgICAgY2FmZUlkOiBjYWZlLmNhZmVJZCxcbiAgICAgICAgbWVudUlkLFxuICAgICAgICBzdWJqZWN0OiB0aXRsZSxcbiAgICAgICAgY29udGVudDogaHRtbENvbnRlbnQsXG4gICAgICAgIHBvc3RPcHRpb25zLFxuICAgICAgICBrZXl3b3JkOiBtYW51c2NyaXB0Lm5hbWUsXG4gICAgICAgIHNlcnZpY2U6ICfsm5Dqs6Dsl4XroZzrk5wnLFxuICAgICAgICByYXdDb250ZW50OiBtYW51c2NyaXB0LmNvbnRlbnQsXG4gICAgICAgIHNraXBDb21tZW50czogdHJ1ZSxcbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IGFkZFRhc2tKb2Iod3JpdGVyQWNjb3VudC5pZCwgam9iRGF0YSwgZ2xvYmFsRGVsYXkpO1xuICAgICAgam9ic0FkZGVkKys7XG5cbiAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBgW01BTlVTQ1JJUFRdIEpvYiDstpTqsIA6ICR7bWFudXNjcmlwdC5uYW1lfSAoJHttYW51c2NyaXB0LmNhdGVnb3J5IHx8ICfrr7jsp4DsoJUnfSkg4oaSICR7d3JpdGVyQWNjb3VudC5pZH0sIOuUnOugiOydtDogJHtNYXRoLnJvdW5kKGdsb2JhbERlbGF5IC8gMTAwMCl97LSIYFxuICAgICAgKTtcblxuICAgICAgY29uc3QgcmFuZG9tRGVsYXkgPSBnZXRSYW5kb21EZWxheShzZXR0aW5ncy5kZWxheXMuYmV0d2VlblBvc3RzKTtcbiAgICAgIGdsb2JhbERlbGF5ICs9IHJhbmRvbURlbGF5O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBbTUFOVVNDUklQVF0g7JeQ65+sOiAke21hbnVzY3JpcHQubmFtZX1gLCBlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgc2tpcE1zZyA9IHNraXBwZWQgPiAwID8gYCwgJHtza2lwcGVkfeqwnCDsiqTtgrUgKOygnO2VnC/ruYTtmZzrj5kpYCA6ICcnO1xuICByZXR1cm4ge1xuICAgIHN1Y2Nlc3M6IGpvYnNBZGRlZCA+IDAsXG4gICAgam9ic0FkZGVkLFxuICAgIG1lc3NhZ2U6IGAke2pvYnNBZGRlZH3qsJwg7JuQ6rOg6rCAIO2BkOyXkCDstpTqsIDrkKggKCR7d3JpdGVyQWNjb3VudHMubGVuZ3RofeqwnCDquIDsk7DquLAg6rOE7KCVIOyymOumrCkke3NraXBNc2d9YCxcbiAgfTtcbn07XG5cbmV4cG9ydCBjb25zdCBydW5NYW51c2NyaXB0TW9kaWZ5QWN0aW9uID0gYXN5bmMgKFxuICBpbnB1dDogTWFudXNjcmlwdE1vZGlmeUlucHV0XG4pOiBQcm9taXNlPE1hbnVzY3JpcHRNb2RpZnlSZXN1bHQ+ID0+IHtcbiAgY29uc3QgeyBtYW51c2NyaXB0cywgY2FmZUlkOiBpbnB1dENhZmVJZCwgc29ydE9yZGVyID0gJ29sZGVzdCcsIGRheXNMaW1pdCB9ID0gaW5wdXQ7XG5cbiAgY29uc29sZS5sb2coJ1tNQU5VU0NSSVBUIE1PRElGWV0g7IiY7KCVIOyLnOyekTonLCBtYW51c2NyaXB0cy5sZW5ndGgsICfqsJwg7JuQ6rOgJyk7XG5cbiAgY29uc3QgYWNjb3VudHMgPSBhd2FpdCBnZXRBbGxBY2NvdW50cygpO1xuICBpZiAoYWNjb3VudHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgdG90YWxBcnRpY2xlczogMCxcbiAgICAgIGNvbXBsZXRlZDogMCxcbiAgICAgIGZhaWxlZDogMCxcbiAgICAgIHJlc3VsdHM6IFtdLFxuICAgICAgbWVzc2FnZTogJ+qzhOygleydtCDtlYTsmpTtlanri4jri6QnLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBjYWZlID0gaW5wdXRDYWZlSWQgPyBhd2FpdCBnZXRDYWZlQnlJZChpbnB1dENhZmVJZCkgOiBhd2FpdCBnZXREZWZhdWx0Q2FmZSgpO1xuICBpZiAoIWNhZmUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICB0b3RhbEFydGljbGVzOiAwLFxuICAgICAgY29tcGxldGVkOiAwLFxuICAgICAgZmFpbGVkOiAwLFxuICAgICAgcmVzdWx0czogW10sXG4gICAgICBtZXNzYWdlOiAn7Lm07Y6Y66W8IOywvuydhCDsiJgg7JeG7Iq164uI64ukJyxcbiAgICB9O1xuICB9XG5cbiAgYXdhaXQgY29ubmVjdERCKCk7XG5cbiAgY29uc3QgYmFzZUZpbHRlciA9IGJ1aWxkQmFzZUZpbHRlcihjYWZlLmNhZmVJZCwgZGF5c0xpbWl0KTtcbiAgY29uc3QgYXJ0aWNsZXNUb01vZGlmeSA9IGF3YWl0IGZldGNoQXJ0aWNsZXNUb01vZGlmeShzb3J0T3JkZXIsIG1hbnVzY3JpcHRzLmxlbmd0aCwgYmFzZUZpbHRlcik7XG5cbiAgaWYgKGFydGljbGVzVG9Nb2RpZnkubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgdG90YWxBcnRpY2xlczogMCxcbiAgICAgIGNvbXBsZXRlZDogMCxcbiAgICAgIGZhaWxlZDogMCxcbiAgICAgIHJlc3VsdHM6IFtdLFxuICAgICAgbWVzc2FnZTogJ+yImOyglSDqsIDriqXtlZwg6riA7J20IOyXhuyKteuLiOuLpCAo67Cc7ZaJ65CcIOq4gOydtCDsl4bqsbDrgpgg7J2066+4IOyImOygleuQqCknLFxuICAgIH07XG4gIH1cblxuICBjb25zb2xlLmxvZyhgW01BTlVTQ1JJUFQgTU9ESUZZXSDsiJjsoJUg64yA7IOBOiAke2FydGljbGVzVG9Nb2RpZnkubGVuZ3RofeqwnCDquIBgKTtcblxuICBjb25zdCByZXN1bHRzOiBNYW51c2NyaXB0TW9kaWZ5QXJ0aWNsZVJlc3VsdFtdID0gW107XG4gIGxldCBjb21wbGV0ZWQgPSAwO1xuICBsZXQgZmFpbGVkID0gMDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGFydGljbGVzVG9Nb2RpZnkubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBhcnRpY2xlID0gYXJ0aWNsZXNUb01vZGlmeVtpXTtcbiAgICBjb25zdCBtYW51c2NyaXB0ID0gbWFudXNjcmlwdHNbaV07XG4gICAgY29uc3QgeyBhcnRpY2xlSWQsIHdyaXRlckFjY291bnRJZCwga2V5d29yZCB9ID0gYXJ0aWNsZTtcbiAgICBjb25zdCB3cml0ZXJBY2NvdW50ID0gYWNjb3VudHMuZmluZCgoYSkgPT4gYS5pZCA9PT0gd3JpdGVyQWNjb3VudElkKTtcblxuICAgIGlmICghd3JpdGVyQWNjb3VudCkge1xuICAgICAgY29uc29sZS5sb2coYFtNQU5VU0NSSVBUIE1PRElGWV0g7J6R7ISx7J6QIOqzhOyglSgke3dyaXRlckFjY291bnRJZH0pIOyXhuydjCAtIOyKpO2CtWApO1xuICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgYXJ0aWNsZUlkLFxuICAgICAgICBrZXl3b3JkLFxuICAgICAgICBtYW51c2NyaXB0TmFtZTogbWFudXNjcmlwdC5uYW1lLFxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IGDsnpHshLHsnpAg6rOE7KCVKCR7d3JpdGVyQWNjb3VudElkfSkg7JeG7J2MYCxcbiAgICAgIH0pO1xuICAgICAgZmFpbGVkKys7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgeyB0aXRsZTogbmV3VGl0bGUsIGh0bWxDb250ZW50OiBuZXdDb250ZW50IH0gPSBidWlsZENhZmVQb3N0Q29udGVudEZyb21NYW51c2NyaXB0KFxuICAgICAgICBtYW51c2NyaXB0LmNvbnRlbnQsXG4gICAgICAgIG1hbnVzY3JpcHQubmFtZSxcbiAgICAgICAgbWFudXNjcmlwdC5pbWFnZXNcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IG1vZGlmeVJlc3VsdCA9IGF3YWl0IG1vZGlmeUFydGljbGVXaXRoQWNjb3VudCh3cml0ZXJBY2NvdW50LCB7XG4gICAgICAgIGNhZmVJZDogY2FmZS5jYWZlSWQsXG4gICAgICAgIGFydGljbGVJZCxcbiAgICAgICAgbmV3VGl0bGUsXG4gICAgICAgIG5ld0NvbnRlbnQsXG4gICAgICAgIGNhdGVnb3J5OiBtYW51c2NyaXB0LmNhdGVnb3J5LFxuICAgICAgfSk7XG5cbiAgICAgIGlmICghbW9kaWZ5UmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICBhcnRpY2xlSWQsXG4gICAgICAgICAga2V5d29yZCxcbiAgICAgICAgICBtYW51c2NyaXB0TmFtZTogbWFudXNjcmlwdC5uYW1lLFxuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIGVycm9yOiBtb2RpZnlSZXN1bHQuZXJyb3IgfHwgJ+yImOyglSDsi6TtjKgnLFxuICAgICAgICB9KTtcbiAgICAgICAgZmFpbGVkKys7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCBNb2RpZmllZEFydGljbGUuY3JlYXRlKHtcbiAgICAgICAgb3JpZ2luYWxBcnRpY2xlSWQ6IGFydGljbGUuX2lkLFxuICAgICAgICBhcnRpY2xlSWQsXG4gICAgICAgIGNhZmVJZDogY2FmZS5jYWZlSWQsXG4gICAgICAgIGtleXdvcmQ6IG1hbnVzY3JpcHQubmFtZSxcbiAgICAgICAgbmV3VGl0bGUsXG4gICAgICAgIG5ld0NvbnRlbnQsXG4gICAgICAgIG1vZGlmaWVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgIG1vZGlmaWVkQnk6IHdyaXRlckFjY291bnRJZCxcbiAgICAgIH0pO1xuXG4gICAgICBhd2FpdCBQdWJsaXNoZWRBcnRpY2xlLmRlbGV0ZU9uZSh7IF9pZDogYXJ0aWNsZS5faWQgfSk7XG5cbiAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgIGFydGljbGVJZCxcbiAgICAgICAga2V5d29yZCxcbiAgICAgICAgbWFudXNjcmlwdE5hbWU6IG1hbnVzY3JpcHQubmFtZSxcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIH0pO1xuICAgICAgY29tcGxldGVkKys7XG5cbiAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBgW01BTlVTQ1JJUFQgTU9ESUZZXSDsiJjsoJUg7JmE66OMOiAke21hbnVzY3JpcHQubmFtZX0g4oaSICR7YXJ0aWNsZUlkfSAoJHtpICsgMX0vJHthcnRpY2xlc1RvTW9kaWZ5Lmxlbmd0aH0pYFxuICAgICAgKTtcblxuICAgICAgaWYgKGkgPCBhcnRpY2xlc1RvTW9kaWZ5Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1tNQU5VU0NSSVBUIE1PRElGWV0g64uk7J2MIOq4gCDsiJjsoJUg7KCEIDMw7LSIIOuMgOq4sC4uLicpO1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCAzMDAwMCkpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICfslYwg7IiYIOyXhuuKlCDsmKTrpZgnO1xuICAgICAgY29uc29sZS5lcnJvcihgW01BTlVTQ1JJUFQgTU9ESUZZXSDsl5Drn6w6ICR7bWFudXNjcmlwdC5uYW1lfWAsIGVycm9yKTtcbiAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgIGFydGljbGVJZCxcbiAgICAgICAga2V5d29yZCxcbiAgICAgICAgbWFudXNjcmlwdE5hbWU6IG1hbnVzY3JpcHQubmFtZSxcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiBlcnJvck1lc3NhZ2UsXG4gICAgICB9KTtcbiAgICAgIGZhaWxlZCsrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc3VjY2VzczogZmFpbGVkID09PSAwLFxuICAgIHRvdGFsQXJ0aWNsZXM6IGFydGljbGVzVG9Nb2RpZnkubGVuZ3RoLFxuICAgIGNvbXBsZXRlZCxcbiAgICBmYWlsZWQsXG4gICAgcmVzdWx0cyxcbiAgICBtZXNzYWdlOiBgJHtjb21wbGV0ZWR96rCcIOyImOyglSDsmYTro4wsICR7ZmFpbGVkfeqwnCDsi6TtjKhgLFxuICB9O1xufTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoicVVBdUlhLHNNQUFBIn0=
}),
"[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ManuscriptUploadUI",
    ()=>ManuscriptUploadUI
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/cn.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/ui/index.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$accounts$2f$actions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/features/accounts/actions.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$cafe$2f$api$2f$data$3a$4f4b56__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/src/entities/cafe/api/data:4f4b56 [app-client] (ecmascript) <text/javascript>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$post$2d$options$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/entities/post-options/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$post$2d$options$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/entities/post-options/ui/index.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$types$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/types/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$types$2f$post$2d$options$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/types/post-options.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$publish$2f$data$3a$5a1623__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/src/features/auto-comment/publish/data:5a1623 [app-client] (ecmascript) <text/javascript>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$publish$2f$data$3a$a57ae3__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/src/features/auto-comment/publish/data:a57ae3 [app-client] (ecmascript) <text/javascript>");
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
const parseFolderName = (folderName)=>{
    const lastUnderscoreIndex = folderName.lastIndexOf('_');
    if (lastUnderscoreIndex === -1) {
        return {
            name: folderName
        };
    }
    return {
        name: folderName.slice(0, lastUnderscoreIndex),
        category: folderName.slice(lastUnderscoreIndex + 1)
    };
};
const isImageFile = (fileName)=>{
    const ext = fileName.toLowerCase().split('.').pop();
    return [
        'png',
        'jpg',
        'jpeg',
        'gif',
        'webp',
        'bmp'
    ].includes(ext || '');
};
const fileToDataUrl = (file)=>{
    return new Promise((resolve, reject)=>{
        const reader = new FileReader();
        reader.onload = ()=>resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};
const fileToText = (file)=>{
    return new Promise((resolve, reject)=>{
        const reader = new FileReader();
        reader.onload = ()=>resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
};
const ManuscriptUploadUI = ()=>{
    _s();
    const [isPending, startTransition] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransition"])();
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('publish');
    const [cafes, setCafes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedCafeId, setSelectedCafeId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [postOptions, setPostOptions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$types$2f$post$2d$options$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_POST_OPTIONS"]);
    const [manuscripts, setManuscripts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [result, setResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isDragOver, setIsDragOver] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [parseError, setParseError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [sortOrder, setSortOrder] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('oldest');
    const [daysLimit, setDaysLimit] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [showClearModal, setShowClearModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showExecuteModal, setShowExecuteModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ManuscriptUploadUI.useEffect": ()=>{
            const loadCafes = {
                "ManuscriptUploadUI.useEffect.loadCafes": async ()=>{
                    const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$cafe$2f$api$2f$data$3a$4f4b56__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["getCafesAction"])();
                    setCafes(data);
                    const defaultCafe = data.find({
                        "ManuscriptUploadUI.useEffect.loadCafes": (c)=>c.isDefault
                    }["ManuscriptUploadUI.useEffect.loadCafes"]) || data[0];
                    if (defaultCafe) setSelectedCafeId(defaultCafe.cafeId);
                }
            }["ManuscriptUploadUI.useEffect.loadCafes"];
            loadCafes();
        }
    }["ManuscriptUploadUI.useEffect"], []);
    const selectedCafe = cafes.find((c)=>c.cafeId === selectedCafeId);
    const inputClassName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-full rounded-xl border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--ink)', 'placeholder:text-(--ink-tertiary) transition-all', 'focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/10');
    const labelClassName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-sm font-medium text-(--ink)');
    const helperClassName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-xs text-(--ink-muted) mt-1');
    const handleDrop = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ManuscriptUploadUI.useCallback[handleDrop]": async (e)=>{
            e.preventDefault();
            setIsDragOver(false);
            setParseError(null);
            const items = e.dataTransfer.items;
            const parsedManuscripts = [];
            const folderMap = new Map();
            const processEntry = {
                "ManuscriptUploadUI.useCallback[handleDrop].processEntry": async (entry, parentPath = '')=>{
                    if (entry.isFile) {
                        const fileEntry = entry;
                        const file = await new Promise({
                            "ManuscriptUploadUI.useCallback[handleDrop].processEntry": (resolve, reject)=>{
                                fileEntry.file(resolve, reject);
                            }
                        }["ManuscriptUploadUI.useCallback[handleDrop].processEntry"]);
                        const pathParts = parentPath.split('/').filter(Boolean);
                        if (pathParts.length < 1) return;
                        const folderName = pathParts[pathParts.length - 1];
                        if (!folderMap.has(folderName)) {
                            folderMap.set(folderName, {
                                images: []
                            });
                        }
                        const folderData = folderMap.get(folderName);
                        if (file.name === '원고.txt' || file.name.endsWith('.txt')) {
                            folderData.content = await fileToText(file);
                        } else if (isImageFile(file.name)) {
                            const dataUrl = await fileToDataUrl(file);
                            folderData.images.push({
                                name: file.name,
                                dataUrl
                            });
                        }
                    } else if (entry.isDirectory) {
                        const dirEntry = entry;
                        const dirReader = dirEntry.createReader();
                        const entries = await new Promise({
                            "ManuscriptUploadUI.useCallback[handleDrop].processEntry": (resolve, reject)=>{
                                dirReader.readEntries(resolve, reject);
                            }
                        }["ManuscriptUploadUI.useCallback[handleDrop].processEntry"]);
                        for (const childEntry of entries){
                            await processEntry(childEntry, `${parentPath}/${entry.name}`);
                        }
                    }
                }
            }["ManuscriptUploadUI.useCallback[handleDrop].processEntry"];
            try {
                for(let i = 0; i < items.length; i++){
                    const entry = items[i].webkitGetAsEntry();
                    if (entry) {
                        await processEntry(entry, '');
                    }
                }
                for (const [folderName, data] of folderMap){
                    if (!data.content) {
                        console.warn(`[MANUSCRIPT] ${folderName}: 원고.txt 없음, 스킵`);
                        continue;
                    }
                    const { name, category } = parseFolderName(folderName);
                    parsedManuscripts.push({
                        name,
                        category,
                        content: data.content,
                        images: data.images
                    });
                }
                if (parsedManuscripts.length === 0) {
                    setParseError('유효한 원고 폴더가 없습니다. 각 폴더에 원고.txt가 있어야 합니다.');
                    return;
                }
                if (parsedManuscripts.length > 100) {
                    setParseError('최대 100개까지만 업로드 가능합니다.');
                    parsedManuscripts.splice(100);
                }
                setManuscripts(parsedManuscripts);
            } catch (error) {
                console.error('[MANUSCRIPT] 파싱 에러:', error);
                setParseError('폴더 파싱 중 오류 발생');
            }
        }
    }["ManuscriptUploadUI.useCallback[handleDrop]"], []);
    const handleDragOver = (e)=>{
        e.preventDefault();
        setIsDragOver(true);
    };
    const handleDragLeave = (e)=>{
        e.preventDefault();
        setIsDragOver(false);
    };
    const handleSubmit = ()=>{
        if (manuscripts.length === 0) return;
        startTransition(async ()=>{
            setResult(null);
            if (mode === 'publish') {
                const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$publish$2f$data$3a$5a1623__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["runManuscriptUploadAction"])({
                    manuscripts,
                    cafeId: selectedCafeId || undefined,
                    postOptions
                });
                setResult(res);
            } else {
                const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$publish$2f$data$3a$a57ae3__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["runManuscriptModifyAction"])({
                    manuscripts,
                    cafeId: selectedCafeId || undefined,
                    sortOrder,
                    daysLimit: daysLimit > 0 ? daysLimit : undefined
                });
                setResult(res);
            }
        });
    };
    const handleClear = ()=>{
        setManuscripts([]);
        setResult(null);
        setParseError(null);
        setShowClearModal(false);
    };
    const handleSubmitClick = ()=>{
        if (manuscripts.length === 0) return;
        setShowExecuteModal(true);
    };
    const handleConfirmedSubmit = ()=>{
        setShowExecuteModal(false);
        handleSubmit();
    };
    const groupedByCategory = manuscripts.reduce((acc, m)=>{
        const cat = m.category || '미지정';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(m);
        return acc;
    }, {});
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('space-y-6'),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex gap-2'),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                        variant: mode === 'publish' ? 'primary' : 'secondary',
                        onClick: ()=>{
                            setMode('publish');
                            setResult(null);
                        },
                        className: "flex-1",
                        children: "발행 (새 글)"
                    }, void 0, false, {
                        fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                        lineNumber: 246,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                        variant: mode === 'modify' ? 'primary' : 'secondary',
                        onClick: ()=>{
                            setMode('modify');
                            setResult(null);
                        },
                        className: "flex-1",
                        children: "수정 (기존 글)"
                    }, void 0, false, {
                        fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                        lineNumber: 253,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                lineNumber: 245,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('space-y-4'),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Select"], {
                        label: "카페 선택",
                        value: selectedCafeId,
                        onChange: (e)=>setSelectedCafeId(e.target.value),
                        options: cafes.map((cafe)=>({
                                value: cafe.cafeId,
                                label: `${cafe.name}${cafe.isDefault ? ' (기본)' : ''}`
                            })),
                        helperText: selectedCafe && `카테고리: ${selectedCafe.categories.join(', ')}`
                    }, void 0, false, {
                        fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                        lineNumber: 263,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        onDrop: handleDrop,
                        onDragOver: handleDragOver,
                        onDragLeave: handleDragLeave,
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer', isDragOver ? 'border-(--accent) bg-(--accent)/5' : 'border-(--border) bg-(--surface) hover:border-(--accent)/50'),
                        children: manuscripts.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Fragment, {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-4xl mb-3'),
                                    children: "📁"
                                }, void 0, false, {
                                    fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                                    lineNumber: 287,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('font-medium text-(--ink)'),
                                    children: "원고 폴더를 여기에 드래그"
                                }, void 0, false, {
                                    fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                                    lineNumber: 288,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-xs text-(--ink-muted) mt-2'),
                                    children: "폴더명 형식: 원고명_카테고리 (예: 제주도여행_일상)"
                                }, void 0, false, {
                                    fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                                    lineNumber: 291,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-xs text-(--ink-muted)'),
                                    children: "각 폴더에 원고.txt + 이미지 파일"
                                }, void 0, false, {
                                    fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                                    lineNumber: 294,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                            lineNumber: 286,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Fragment, {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('font-medium text-(--ink) mb-2'),
                                    children: [
                                        manuscripts.length,
                                        "개 원고 준비됨"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                                    lineNumber: 300,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    variant: "danger",
                                    size: "xs",
                                    onClick: ()=>setShowClearModal(true),
                                    children: "초기화"
                                }, void 0, false, {
                                    fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                                    lineNumber: 303,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                            lineNumber: 299,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                        lineNumber: 274,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    parseError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-sm text-(--danger)'),
                        children: parseError
                    }, void 0, false, {
                        fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                        lineNumber: 315,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    manuscripts.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('space-y-2'),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-sm font-medium text-(--ink)'),
                                children: [
                                    "원고 목록 (",
                                    manuscripts.length,
                                    "개)"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                                lineNumber: 320,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('max-h-52 overflow-y-auto space-y-2'),
                                children: Object.entries(groupedByCategory).map(([category, items])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('rounded-xl bg-(--surface-muted) p-3'),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-xs font-medium text-(--accent) mb-2'),
                                                children: [
                                                    category,
                                                    " (",
                                                    items.length,
                                                    "개)"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                                                lineNumber: 326,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex flex-wrap gap-1.5'),
                                                children: items.map((m, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs', 'bg-(--surface) border border-(--border-light) text-(--ink)'),
                                                        children: [
                                                            m.name,
                                                            m.images.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-(--ink-muted)'),
                                                                children: [
                                                                    "🖼️",
                                                                    m.images.length
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                                                                lineNumber: 340,
                                                                columnNumber: 27
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, i, true, {
                                                        fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                                                        lineNumber: 331,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)))
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                                                lineNumber: 329,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, category, true, {
                                        fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                                        lineNumber: 325,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)))
                            }, void 0, false, {
                                fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                                lineNumber: 323,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                        lineNumber: 319,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    mode === 'modify' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('rounded-xl border border-(--border-light) bg-(--surface) p-4 space-y-4'),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-sm font-medium text-(--ink)'),
                                children: "수정 옵션"
                            }, void 0, false, {
                                fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                                lineNumber: 355,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('grid grid-cols-2 gap-4'),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Select"], {
                                        label: "정렬 순서",
                                        value: sortOrder,
                                        onChange: (e)=>setSortOrder(e.target.value),
                                        options: [
                                            {
                                                value: 'oldest',
                                                label: '오래된 순'
                                            },
                                            {
                                                value: 'newest',
                                                label: '최신 순'
                                            },
                                            {
                                                value: 'random',
                                                label: '랜덤'
                                            }
                                        ]
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                                        lineNumber: 357,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('space-y-2'),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: labelClassName,
                                                children: "기간 제한 (일)"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                                                lineNumber: 368,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "number",
                                                value: daysLimit,
                                                onChange: (e)=>setDaysLimit(Number(e.target.value)),
                                                min: 0,
                                                className: inputClassName,
                                                placeholder: "0 = 전체"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                                                lineNumber: 369,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                                        lineNumber: 367,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                                lineNumber: 356,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: helperClassName,
                                children: [
                                    "발행된 글 중 ",
                                    daysLimit > 0 ? `${daysLimit}일 이내` : '전체',
                                    "에서 ",
                                    sortOrder === 'oldest' ? '오래된' : sortOrder === 'newest' ? '최신' : '랜덤',
                                    " 순으로 ",
                                    manuscripts.length,
                                    "개 선택"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                                lineNumber: 379,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                        lineNumber: 354,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    mode === 'publish' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('rounded-xl border border-(--border-light) bg-(--surface-muted) p-4'),
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$entities$2f$post$2d$options$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PostOptionsUI"], {
                            options: postOptions,
                            onChange: setPostOptions
                        }, void 0, false, {
                            fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                            lineNumber: 387,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                        lineNumber: 386,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                lineNumber: 262,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ConfirmModal"], {
                isOpen: showClearModal,
                onClose: ()=>setShowClearModal(false),
                onConfirm: handleClear,
                title: "원고 목록을 초기화하시겠습니까?",
                description: `${manuscripts.length}개 원고가 삭제됩니다.`,
                variant: "danger",
                confirmText: "초기화",
                cancelText: "취소"
            }, void 0, false, {
                fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                lineNumber: 393,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExecuteConfirmModal"], {
                isOpen: showExecuteModal,
                onClose: ()=>setShowExecuteModal(false),
                onConfirm: handleConfirmedSubmit,
                title: mode === 'publish' ? '원고를 발행하시겠습니까?' : '원고를 수정하시겠습니까?',
                description: "아래 설정으로 작업이 진행됩니다.",
                settings: [
                    {
                        label: '원고 수',
                        value: `${manuscripts.length}개`,
                        highlight: true
                    },
                    {
                        label: '카페',
                        value: selectedCafe?.name || '선택 안됨'
                    },
                    ...mode === 'modify' ? [
                        {
                            label: '정렬',
                            value: sortOrder === 'oldest' ? '오래된 순' : sortOrder === 'newest' ? '최신 순' : '랜덤'
                        },
                        {
                            label: '기간',
                            value: daysLimit > 0 ? `${daysLimit}일 이내` : '전체'
                        }
                    ] : []
                ],
                confirmText: mode === 'publish' ? '발행' : '수정',
                isLoading: isPending
            }, void 0, false, {
                fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                lineNumber: 405,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                onClick: handleSubmitClick,
                disabled: manuscripts.length === 0,
                isLoading: isPending,
                size: "lg",
                fullWidth: true,
                children: `${manuscripts.length}개 원고 ${mode === 'publish' ? '발행' : '수정'}`
            }, void 0, false, {
                fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                lineNumber: 425,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            result && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('rounded-2xl border p-5', result.success ? 'border-(--success)/30 bg-(--success-soft)' : 'border-(--danger)/30 bg-(--danger-soft)'),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex items-center justify-between mb-3'),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('font-semibold', result.success ? 'text-(--success)' : 'text-(--danger)'),
                                children: result.success ? mode === 'publish' ? '큐에 추가됨' : '수정 완료' : '실패'
                            }, void 0, false, {
                                fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                                lineNumber: 445,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-sm text-(--ink-muted)'),
                                children: 'jobsAdded' in result ? `${result.jobsAdded}개 작업` : `${result.completed}/${result.totalArticles}개 완료`
                            }, void 0, false, {
                                fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                                lineNumber: 455,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                        lineNumber: 444,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-sm text-(--ink-muted)'),
                        children: result.message
                    }, void 0, false, {
                        fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                        lineNumber: 459,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
                lineNumber: 436,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx",
        lineNumber: 244,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(ManuscriptUploadUI, "0AQuSFuGRCQtT0TWwuQP0N5kwk8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransition"]
    ];
});
_c = ManuscriptUploadUI;
var _c;
__turbopack_context__.k.register(_c, "ManuscriptUploadUI");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/features/auto-comment/publish/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$publish$2f$post$2d$only$2d$ui$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/auto-comment/publish/post-only-ui.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$publish$2f$comment$2d$only$2d$ui$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/auto-comment/publish/comment-only-ui.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$publish$2f$manuscript$2d$upload$2d$ui$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/auto-comment/publish/manuscript-upload-ui.tsx [app-client] (ecmascript)");
;
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/features/auth/data:5451f4 [app-client] (ecmascript) <text/javascript>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "logout",
    ()=>$$RSC_SERVER_ACTION_1
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
/* __next_internal_action_entry_do_not_use__ [{"00ba43b06b44b5ff61002c5831f0aac3fa1d4ed9c2":"logout"},"src/features/auth/actions.ts",""] */ "use turbopack no side effects";
;
const $$RSC_SERVER_ACTION_1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("00ba43b06b44b5ff61002c5831f0aac3fa1d4ed9c2", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "logout");
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auth$2f$data$3a$5451f4__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/src/features/auth/data:5451f4 [app-client] (ecmascript) <text/javascript>");
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
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auth$2f$data$3a$5451f4__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["logout"])();
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
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto pb-1 pr-1', 'scrollbar-hidden'),
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
"[project]/src/widgets/page-layout/ui/page-layout.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PageLayout",
    ()=>PageLayout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/cn.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$widgets$2f$page$2d$layout$2f$ui$2f$app$2d$header$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/widgets/page-layout/ui/app-header.tsx [app-client] (ecmascript)");
;
;
;
const PageLayout = ({ children, title, subtitle, description })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('min-h-screen bg-(--background)'),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$widgets$2f$page$2d$layout$2f$ui$2f$app$2d$header$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AppHeader"], {}, void 0, false, {
                fileName: "[project]/src/widgets/page-layout/ui/page-layout.tsx",
                lineNumber: 14,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8'),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('mb-6 border-b border-(--border-light) pb-5 sm:mb-8 sm:pb-6'),
                        children: [
                            subtitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-xs font-semibold uppercase tracking-[0.16em] text-(--info)'),
                                children: subtitle
                            }, void 0, false, {
                                fileName: "[project]/src/widgets/page-layout/ui/page-layout.tsx",
                                lineNumber: 19,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('mt-1 text-2xl font-semibold text-(--ink) sm:text-3xl'),
                                children: title
                            }, void 0, false, {
                                fileName: "[project]/src/widgets/page-layout/ui/page-layout.tsx",
                                lineNumber: 23,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('mt-2 max-w-3xl text-sm leading-6 text-(--ink-muted) sm:text-base'),
                                children: description
                            }, void 0, false, {
                                fileName: "[project]/src/widgets/page-layout/ui/page-layout.tsx",
                                lineNumber: 31,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/widgets/page-layout/ui/page-layout.tsx",
                        lineNumber: 17,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: children
                    }, void 0, false, {
                        fileName: "[project]/src/widgets/page-layout/ui/page-layout.tsx",
                        lineNumber: 37,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/widgets/page-layout/ui/page-layout.tsx",
                lineNumber: 16,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/widgets/page-layout/ui/page-layout.tsx",
        lineNumber: 13,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_c = PageLayout;
var _c;
__turbopack_context__.k.register(_c, "PageLayout");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/widgets/page-layout/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$widgets$2f$page$2d$layout$2f$ui$2f$page$2d$layout$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/widgets/page-layout/ui/page-layout.tsx [app-client] (ecmascript)");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/widgets/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$widgets$2f$page$2d$layout$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/widgets/page-layout/index.ts [app-client] (ecmascript) <locals>");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/widgets/page-layout/index.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PageLayout",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$widgets$2f$page$2d$layout$2f$ui$2f$page$2d$layout$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PageLayout"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$widgets$2f$page$2d$layout$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/widgets/page-layout/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$widgets$2f$page$2d$layout$2f$ui$2f$page$2d$layout$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/widgets/page-layout/ui/page-layout.tsx [app-client] (ecmascript)");
}),
"[project]/src/app/publish/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PublishPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/cn.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$publish$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/features/auto-comment/publish/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$publish$2f$post$2d$only$2d$ui$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/auto-comment/publish/post-only-ui.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$publish$2f$comment$2d$only$2d$ui$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/auto-comment/publish/comment-only-ui.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$widgets$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/widgets/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$widgets$2f$page$2d$layout$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/widgets/page-layout/index.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/ui/index.ts [app-client] (ecmascript)");
'use client';
;
;
;
;
;
const TABS = [
    {
        id: 'post',
        label: '글만 발행'
    },
    {
        id: 'comment',
        label: '댓글만 달기'
    }
];
function PublishPage() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$widgets$2f$page$2d$layout$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PageLayout"], {
        title: "분리 발행",
        subtitle: "글만 발행하거나, 기존 글에 댓글만 달거나",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatedTabs"], {
                tabs: TABS,
                defaultTab: "post",
                children: (activeTab)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatedCard"], {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('p-6 lg:p-8'),
                        children: [
                            activeTab === 'post' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('space-y-6'),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SlideUp"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-lg font-semibold text-(--ink)'),
                                                children: "글만 발행"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/publish/page.tsx",
                                                lineNumber: 25,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-sm text-(--ink-muted) mt-1'),
                                                children: "댓글 없이 글만 발행 (원고 데이터 축적 용도)"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/publish/page.tsx",
                                                lineNumber: 26,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/publish/page.tsx",
                                        lineNumber: 24,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$publish$2f$post$2d$only$2d$ui$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PostOnlyUI"], {}, void 0, false, {
                                        fileName: "[project]/src/app/publish/page.tsx",
                                        lineNumber: 30,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/publish/page.tsx",
                                lineNumber: 23,
                                columnNumber: 15
                            }, this),
                            activeTab === 'comment' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('space-y-6'),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SlideUp"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-lg font-semibold text-(--ink)'),
                                                children: "댓글만 달기"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/publish/page.tsx",
                                                lineNumber: 37,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-sm text-(--ink-muted) mt-1'),
                                                children: "기존 글에 댓글/대댓글 자동 추가"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/publish/page.tsx",
                                                lineNumber: 38,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/publish/page.tsx",
                                        lineNumber: 36,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auto$2d$comment$2f$publish$2f$comment$2d$only$2d$ui$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CommentOnlyUI"], {}, void 0, false, {
                                        fileName: "[project]/src/app/publish/page.tsx",
                                        lineNumber: 42,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/publish/page.tsx",
                                lineNumber: 35,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/publish/page.tsx",
                        lineNumber: 21,
                        columnNumber: 11
                    }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/publish/page.tsx",
                lineNumber: 19,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SlideUp"], {
                delay: 0.2,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HelpAccordion"], {
                    title: "분리 발행 사용법",
                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('mt-8'),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('grid gap-4 lg:grid-cols-2'),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('rounded-xl border border-(--border-light) bg-(--surface) p-5'),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('font-semibold text-(--ink) mb-3'),
                                            children: "글만 발행"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/publish/page.tsx",
                                            lineNumber: 53,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-sm text-(--ink-muted) space-y-1.5'),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                    children: "• 키워드 입력 후 발행 버튼 클릭"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/publish/page.tsx",
                                                    lineNumber: 55,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                    children: "• 댓글 없이 글만 발행됨"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/publish/page.tsx",
                                                    lineNumber: 56,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                    children: "• 원고 데이터 축적 용도"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/publish/page.tsx",
                                                    lineNumber: 57,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/publish/page.tsx",
                                            lineNumber: 54,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/publish/page.tsx",
                                    lineNumber: 52,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('rounded-xl border border-(--border-light) bg-(--surface) p-5'),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('font-semibold text-(--ink) mb-3'),
                                            children: "댓글만 달기"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/publish/page.tsx",
                                            lineNumber: 62,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('text-sm text-(--ink-muted) space-y-1.5'),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                    children: "• 최근 글 중 랜덤 절반 선택"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/publish/page.tsx",
                                                    lineNumber: 64,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                    children: "• 글당 3~15개 (대댓글 50%)"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/publish/page.tsx",
                                                    lineNumber: 65,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                    children: "• 자동으로 댓글/대댓글 추가"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/publish/page.tsx",
                                                    lineNumber: 66,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/publish/page.tsx",
                                            lineNumber: 63,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/publish/page.tsx",
                                    lineNumber: 61,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/publish/page.tsx",
                            lineNumber: 51,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('mt-4 text-xs text-(--ink-muted)'),
                            children: "글 발행과 댓글을 분리하면 타임라인이 더 자연스러워집니다."
                        }, void 0, false, {
                            fileName: "[project]/src/app/publish/page.tsx",
                            lineNumber: 71,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/publish/page.tsx",
                    lineNumber: 50,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/publish/page.tsx",
                lineNumber: 49,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/publish/page.tsx",
        lineNumber: 15,
        columnNumber: 5
    }, this);
}
_c = PublishPage;
var _c;
__turbopack_context__.k.register(_c, "PublishPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_773bdc09._.js.map