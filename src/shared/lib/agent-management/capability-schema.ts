type Schema = Record<string, unknown>;
const text = (maxLength: number): Schema => ({ type: 'string', minLength: 1, maxLength });
const numericId = { type: 'string', pattern: '^[1-9][0-9]*$', maxLength: 20 };
const accountId = { ...text(64), pattern: '^[a-zA-Z0-9][a-zA-Z0-9_.-]*$' };
const object = (properties: Record<string, Schema>, required: string[] = []): Schema => ({
  type: 'object', additionalProperties: false, properties, required,
});

const inputs: Record<string, Schema> = {
  list_accounts: object({}), list_cafes: object({}),
  register_account: object({ accountId, password: { ...text(1024), writeOnly: true }, nickname: text(100), role: { enum: ['writer', 'commenter'], default: 'commenter' } }, ['accountId', 'password']),
  register_cafe: object({ cafeId: numericId, cafeUrl: text(300), name: text(100), menuId: numericId }, ['cafeId', 'cafeUrl', 'name', 'menuId']),
  join_cafe: object({ type: { const: 'join_cafe' }, accountId, cafeId: numericId, nickname: text(30) }, ['type', 'accountId', 'cafeId']),
  write_comment: object({ type: { const: 'write_comment' }, accountId, cafeId: numericId, articleId: { type: 'integer', minimum: 1 }, content: text(3000) }, ['type', 'accountId', 'cafeId', 'articleId', 'content']),
  list_operations: object({ limit: { type: 'integer', minimum: 1, maximum: 100 } }),
  get_operation: object({ operationId: { type: 'string', pattern: '^[a-f0-9]{24}$' } }, ['operationId']),
};

export const capabilitySchema = (id: string) => {
  const queued = id === 'join_cafe' || id === 'write_comment';
  const write = queued || id.startsWith('register_');
  return {
    inputSchema: inputs[id], inputLocation: id === 'get_operation' ? 'path' : write ? 'body' : 'query',
    tool: write ? 'viro_manage' : 'api_get',
    ...(write ? { toolArguments: { action: id } } : {}),
    approvalRequired: write, workerRequired: queued,
    sideEffects: queued ? ['naver-write'] : write ? ['save-configuration'] : [],
    ...(queued ? {
      preconditions: ['operationWorkerOnline', 'owned-active-account', 'owned-cafe'],
      result: { method: 'GET', path: '/api/agent/operations/{operationId}', acceptanceIsCompletion: false,
        states: ['pending', 'running', 'done', 'failed', 'needs_review'],
        successEvidence: id === 'write_comment' ? ['result.success', 'result.commentId'] : ['result.success', 'result.membershipStatus'] },
      retry: '동일 요청은 동일 Idempotency-Key를 재사용한다. needs_review는 실제 결과 확인 전 재실행하지 않는다.',
    } : {}),
  };
};
