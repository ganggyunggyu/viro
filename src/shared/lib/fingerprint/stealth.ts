import type { BrowserContext } from 'playwright';
import type { DeviceProfile } from './profiles';

export const applyStealth = async (
  context: BrowserContext,
  profile: DeviceProfile,
): Promise<void> => {
  await context.addInitScript((p) => {
    type ChromeRuntimeWindow = Window & {
      chrome?: {
        runtime: Record<string, never>;
        loadTimes: () => Record<string, never>;
        csi: () => Record<string, never>;
      };
    };
    const chromeWindow = window as ChromeRuntimeWindow;

    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

    Object.defineProperty(navigator, 'platform', { get: () => p.platform });
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get: () => p.hardwareConcurrency,
    });
    Object.defineProperty(navigator, 'languages', {
      get: () => [p.locale, p.locale.split('-')[0]],
    });

    if (!chromeWindow.chrome) {
      chromeWindow.chrome = { runtime: {}, loadTimes: () => ({}), csi: () => ({}) };
    }

    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        { name: 'PDF Viewer', filename: 'internal-pdf-viewer' },
        { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer' },
        { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer' },
        { name: 'Microsoft Edge PDF Viewer', filename: 'internal-pdf-viewer' },
        { name: 'WebKit built-in PDF', filename: 'internal-pdf-viewer' },
      ],
    });

    const originalQuery = window.navigator.permissions.query.bind(window.navigator.permissions);
    window.navigator.permissions.query = ((params: PermissionDescriptor) =>
      params.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission, onchange: null } as PermissionStatus)
        : originalQuery(params)) as typeof window.navigator.permissions.query;

    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (
      this: WebGLRenderingContext,
      parameter: GLenum
    ) {
      if (parameter === 37445) return 'Intel Inc.';
      if (parameter === 37446) return 'Intel Iris OpenGL Engine';
      return getParameter.call(this, parameter);
    };
  }, profile);
};
