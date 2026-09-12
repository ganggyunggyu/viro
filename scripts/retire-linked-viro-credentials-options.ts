export const parseRetirementOptions = (args: string[]): { userId: string; dabutUserId: string; apply: boolean } => {
  const values = new Map<string, string>();
  let apply = false;
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    if (flag === '--apply' && !apply) { apply = true; continue; }
    if (!['--user-id', '--dabut-user-id'].includes(flag) || values.has(flag)) throw new Error('Unknown or duplicate option');
    const value = args[++index];
    if (!value || value.startsWith('--') || value.trim() !== value || value.length > 200) throw new Error('Explicit member selector required');
    values.set(flag, value);
  }
  const userId = values.get('--user-id');
  const dabutUserId = values.get('--dabut-user-id');
  if (!userId || !dabutUserId) throw new Error('Both --user-id and --dabut-user-id are required');
  return { userId, dabutUserId, apply };
};
