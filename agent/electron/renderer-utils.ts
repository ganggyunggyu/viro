export interface DesktopManuscript {
  folderName: string;
  title: string;
  body: string;
  htmlContent: string;
  images: string[];
  category?: string;
}

export const splitLines = (value: string): string[] => value
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

const escapeHtml = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export const parseManuscripts = (value: string): DesktopManuscript[] => value
  .split(/^---+$/m)
  .map((block) => block.trim())
  .filter(Boolean)
  .map((block) => {
    const [rawTitle = '', ...bodyLines] = block.split('\n');
    const [titlePart, categoryPart] = rawTitle.split(':category=');
    const title = titlePart.trim();
    const body = bodyLines.join('\n').trim();
    const htmlContent = body
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll('\n', '<br>')}</p>`)
      .join('');
    return {
      folderName: title,
      title,
      body,
      htmlContent,
      images: [],
      ...(categoryPart?.trim() ? { category: categoryPart.trim() } : {}),
    };
  })
  .filter(({ title, body }) => Boolean(title && body));

export const parseExposureRows = (
  value: string,
): Array<{ cafeId: string; keyword: string; articleId?: number }> => splitLines(value)
  .map((line) => {
    const [cafeId = '', keyword = '', articleId] = line.split('|').map((part) => part.trim());
    const parsedArticleId = Number(articleId);
    return {
      cafeId,
      keyword,
      ...(articleId && Number.isFinite(parsedArticleId) ? { articleId: parsedArticleId } : {}),
    };
  })
  .filter(({ cafeId, keyword }) => Boolean(cafeId && keyword));
