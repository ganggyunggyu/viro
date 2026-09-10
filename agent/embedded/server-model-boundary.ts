/** Server-only helpers can share source files with browser automation.
 * Fail closed if one is accidentally called from the embedded worker. */
const serverOnly = new Proxy({}, { get: () => { throw new Error('서버 데이터는 바이로 API로만 조회할 수 있습니다.'); } });
export const Account = serverOnly;
export const Cafe = serverOnly;
