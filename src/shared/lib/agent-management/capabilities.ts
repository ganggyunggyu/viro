import { capabilitySchema } from '@/shared/lib/agent-management/capability-schema';

const definitions = [
    { id: 'list_accounts', method: 'GET', path: '/api/agent/naver-accounts', description: '내 네이버 계정 목록. 비밀번호는 반환하지 않습니다.' },
    { id: 'register_account', method: 'POST', path: '/api/agent/naver-accounts', required: ['accountId', 'password'], optional: ['nickname', 'role'], description: '기존 네이버 계정을 Viro에 등록합니다. 비밀번호는 브라우저의 저장된 계정에서 직접 전송하며 모델에 전달하지 않습니다.' },
    { id: 'list_cafes', method: 'GET', path: '/api/agent/cafes', description: '내 등록 카페 목록을 조회합니다.' },
    { id: 'register_cafe', method: 'POST', path: '/api/agent/cafes', required: ['cafeId', 'cafeUrl', 'name', 'menuId'], description: '기존 카페를 Viro 운영 목록에 등록합니다.' },
    { id: 'join_cafe', method: 'POST', path: '/api/agent/operations', required: ['type', 'accountId', 'cafeId'], optional: ['nickname'], idempotencyHeader: 'Idempotency-Key', description: 'type=join_cafe. 등록된 계정으로 등록된 카페 가입을 요청합니다. 새 네이버 계정 생성 기능이 아닙니다.' },
    { id: 'write_comment', method: 'POST', path: '/api/agent/operations', required: ['type', 'accountId', 'cafeId', 'articleId', 'content'], idempotencyHeader: 'Idempotency-Key', description: 'type=write_comment. 지정 계정으로 댓글 1개를 요청합니다. 카페 가입은 별도로 요청합니다.' },
    { id: 'list_operations', method: 'GET', path: '/api/agent/operations', description: '내 가입 및 댓글 작업 상태를 조회합니다.' },
    { id: 'get_operation', method: 'GET', path: '/api/agent/operations/{operationId}', description: '접수는 완료가 아닙니다. 결과의 success와 commentId 또는 membershipStatus를 확인하세요. needs_review는 실제 카페 결과 확인이 필요합니다.' },
  ];

export const managementCapabilities = definitions.map((definition) => ({
  ...definition,
  ...capabilitySchema(definition.id),
}));
