type LoginInputPage = {
  locator: (selector: string) => {
    click: (options: { force: boolean }) => Promise<void>;
  };
  keyboard: {
    press: (key: string) => Promise<void>;
    type: (value: string, options: { delay: number }) => Promise<void>;
  };
};

export const fillLoginInput = async (
  page: LoginInputPage,
  selector: string,
  value: string,
  platform: NodeJS.Platform = process.platform,
): Promise<void> => {
  const input = page.locator(selector);
  await input.click({ force: true });
  await page.keyboard.press(platform === 'darwin' ? 'Meta+A' : 'Control+A');
  await page.keyboard.type(value, { delay: 50 });
};
