module.exports = [
"[project]/src/shared/lib/fingerprint/profiles.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEVICE_PROFILES",
    ()=>DEVICE_PROFILES,
    "getProfileForAccount",
    ()=>getProfileForAccount
]);
const DEVICE_PROFILES = [
    // macOS Chrome
    {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        viewport: {
            width: 1440,
            height: 900
        },
        deviceScaleFactor: 2,
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul',
        hardwareConcurrency: 8,
        colorScheme: 'light',
        platform: 'MacIntel'
    },
    {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
        viewport: {
            width: 1680,
            height: 1050
        },
        deviceScaleFactor: 2,
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul',
        hardwareConcurrency: 10,
        colorScheme: 'light',
        platform: 'MacIntel'
    },
    {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        viewport: {
            width: 1280,
            height: 800
        },
        deviceScaleFactor: 2,
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul',
        hardwareConcurrency: 8,
        colorScheme: 'dark',
        platform: 'MacIntel'
    },
    // Windows Chrome
    {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        viewport: {
            width: 1920,
            height: 1080
        },
        deviceScaleFactor: 1,
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul',
        hardwareConcurrency: 12,
        colorScheme: 'light',
        platform: 'Win32'
    },
    {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
        viewport: {
            width: 1366,
            height: 768
        },
        deviceScaleFactor: 1,
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul',
        hardwareConcurrency: 4,
        colorScheme: 'light',
        platform: 'Win32'
    },
    {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        viewport: {
            width: 1536,
            height: 864
        },
        deviceScaleFactor: 1.25,
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul',
        hardwareConcurrency: 8,
        colorScheme: 'light',
        platform: 'Win32'
    },
    {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        viewport: {
            width: 1600,
            height: 900
        },
        deviceScaleFactor: 1,
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul',
        hardwareConcurrency: 16,
        colorScheme: 'dark',
        platform: 'Win32'
    },
    // Edge (Windows)
    {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
        viewport: {
            width: 1920,
            height: 1080
        },
        deviceScaleFactor: 1,
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul',
        hardwareConcurrency: 8,
        colorScheme: 'light',
        platform: 'Win32'
    },
    {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 Edg/132.0.0.0',
        viewport: {
            width: 1440,
            height: 900
        },
        deviceScaleFactor: 1,
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul',
        hardwareConcurrency: 12,
        colorScheme: 'light',
        platform: 'Win32'
    },
    // Linux Chrome (일부)
    {
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
        viewport: {
            width: 1920,
            height: 1080
        },
        deviceScaleFactor: 1,
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul',
        hardwareConcurrency: 8,
        colorScheme: 'light',
        platform: 'Linux x86_64'
    }
];
const hashAccountId = (accountId)=>{
    let hash = 0;
    for(let i = 0; i < accountId.length; i++){
        hash = hash * 31 + accountId.charCodeAt(i) | 0;
    }
    return Math.abs(hash);
};
const getProfileForAccount = (accountId)=>{
    const idx = hashAccountId(accountId) % DEVICE_PROFILES.length;
    return DEVICE_PROFILES[idx];
};
}),
"[project]/src/shared/lib/fingerprint/stealth.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "applyStealth",
    ()=>applyStealth
]);
const applyStealth = async (context, profile)=>{
    await context.addInitScript((p)=>{
        const chromeWindow = window;
        Object.defineProperty(navigator, 'webdriver', {
            get: ()=>undefined
        });
        Object.defineProperty(navigator, 'platform', {
            get: ()=>p.platform
        });
        Object.defineProperty(navigator, 'hardwareConcurrency', {
            get: ()=>p.hardwareConcurrency
        });
        Object.defineProperty(navigator, 'languages', {
            get: ()=>[
                    p.locale,
                    p.locale.split('-')[0]
                ]
        });
        if (!chromeWindow.chrome) {
            chromeWindow.chrome = {
                runtime: {},
                loadTimes: ()=>({}),
                csi: ()=>({})
            };
        }
        Object.defineProperty(navigator, 'plugins', {
            get: ()=>[
                    {
                        name: 'PDF Viewer',
                        filename: 'internal-pdf-viewer'
                    },
                    {
                        name: 'Chrome PDF Viewer',
                        filename: 'internal-pdf-viewer'
                    },
                    {
                        name: 'Chromium PDF Viewer',
                        filename: 'internal-pdf-viewer'
                    },
                    {
                        name: 'Microsoft Edge PDF Viewer',
                        filename: 'internal-pdf-viewer'
                    },
                    {
                        name: 'WebKit built-in PDF',
                        filename: 'internal-pdf-viewer'
                    }
                ]
        });
        const originalQuery = window.navigator.permissions.query.bind(window.navigator.permissions);
        window.navigator.permissions.query = (params)=>params.name === 'notifications' ? Promise.resolve({
                state: Notification.permission,
                onchange: null
            }) : originalQuery(params);
        const getParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function(parameter) {
            if (parameter === 37445) return 'Intel Inc.';
            if (parameter === 37446) return 'Intel Iris OpenGL Engine';
            return getParameter.call(this, parameter);
        };
    }, profile);
};
}),
"[project]/src/shared/lib/fingerprint/index.ts [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$fingerprint$2f$profiles$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/fingerprint/profiles.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$fingerprint$2f$stealth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/fingerprint/stealth.ts [app-rsc] (ecmascript)");
;
;
}),
"[project]/src/shared/lib/fingerprint/index.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "applyStealth",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$fingerprint$2f$stealth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["applyStealth"],
    "getProfileForAccount",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$fingerprint$2f$profiles$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getProfileForAccount"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$fingerprint$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/shared/lib/fingerprint/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$fingerprint$2f$profiles$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/fingerprint/profiles.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$lib$2f$fingerprint$2f$stealth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/lib/fingerprint/stealth.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=src_shared_lib_fingerprint_464856ca._.js.map