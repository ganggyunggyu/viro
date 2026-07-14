import { Account, PublishedArticle } from '@/shared/models';
import { hasCommented, addCommentToArticle } from '@/shared/models/published-article';
import { writeCommentWithAccount } from '@/shared/lib/naver-cafe-writing/comment-writer';
import { readCafeArticleContent } from '@/shared/lib/cafe-article-reader';

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const DEEPSEEK_MODEL = 'deepseek-chat';
const MAX_TURNS = 40;

interface ToolDef {
  type: 'function';
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

const TOOLS: ToolDef[] = [
  {
    type: 'function',
    function: {
      name: 'read_article',
      description: '카페 글의 실제 제목/본문/작성자 닉네임을 읽어온다. 댓글을 작성하기 전에 반드시 먼저 호출해야 한다.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_accounts',
      description: '이 글에 댓글을 달 수 있는 계정 후보 목록을 최근 사용 빈도가 낮은 순으로 반환한다 (글쓴이 본인 계정, 다른 업체 전용 계정, 이미 이 글에 댓글 단 계정은 자동 제외됨).',
      parameters: {
        type: 'object',
        properties: { limit: { type: 'number', description: '가져올 후보 계정 수 (기본 20)' } },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'post_comment',
      description: '지정한 계정으로 실제 네이버 댓글을 등록한다. 캡차 실패 등으로 실패할 수 있으니, 실패하면 다른 계정으로 재시도할 것.',
      parameters: {
        type: 'object',
        properties: {
          accountId: { type: 'string', description: 'list_accounts로 받은 계정 ID' },
          content: { type: 'string', description: '등록할 댓글 내용 (존댓말, 35~120자, 원고의 구체적인 내용을 언급할 것)' },
        },
        required: ['accountId', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'wait_minutes',
      description: '다음 댓글을 달기 전에 대기한다. 계정 간 자연스러운 간격을 위해 사용한다 (최소 1분, 최대 15분으로 강제됨).',
      parameters: {
        type: 'object',
        properties: { minutes: { type: 'number', description: '대기할 분 (1~15)' } },
        required: ['minutes'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'finish',
      description: '작업을 종료한다. 댓글 작성이 충분히 끝났거나 더 진행할 수 없을 때 호출.',
      parameters: {
        type: 'object',
        properties: { summary: { type: 'string', description: '무엇을 했는지 요약' } },
        required: ['summary'],
      },
    },
  },
];

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }>;
  tool_call_id?: string;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const normalizeName = (v: string): string => (v || '').replace(/\([^)]*\)/g, '').replace(/\s+/g, '').trim();

const callDeepSeek = async (
  apiKey: string,
  messages: ChatMessage[],
): Promise<{ message: ChatMessage; finishReason: string }> => {
  const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: DEEPSEEK_MODEL, messages, tools: TOOLS, tool_choice: 'auto', temperature: 0.8 }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DeepSeek API 오류: ${res.status} ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  return { message: choice.message, finishReason: choice.finish_reason };
};

export interface DeepSeekAgentEvent {
  type: 'log' | 'post_success' | 'post_fail' | 'wait' | 'finish';
  message: string;
  accountId?: string;
  nickname?: string;
  content?: string;
  commentId?: string;
}

export interface RunDeepSeekAgentParams {
  userId: string;
  cafeId: string;
  cafeSlug: string;
  articleId: number;
  onEvent?: (event: DeepSeekAgentEvent) => void | Promise<void>;
}

export const runDeepSeekAgentCommentJob = async (
  params: RunDeepSeekAgentParams,
): Promise<{ successCount: number; summary: string }> => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY missing');

  const { userId, cafeId, cafeSlug, articleId, onEvent } = params;
  const emit = async (event: DeepSeekAgentEvent): Promise<void> => {
    console.log(`[DEEPSEEK-AGENT] ${event.type}: ${event.message}`);
    await onEvent?.(event);
  };

  const commenterAccounts = await Account.find({
    userId,
    isActive: true,
    role: 'commenter',
    excludeFromAutoComment: { $ne: true },
  })
    .select('accountId password nickname')
    .lean<Array<{ accountId: string; password: string; nickname?: string }>>();

  if (commenterAccounts.length === 0) {
    throw new Error('사용 가능한 댓글 계정이 없습니다');
  }

  let ownerNickname = '';
  let successCount = 0;

  const executeTool = async (name: string, argsJson: string): Promise<string> => {
    const parsed = argsJson ? JSON.parse(argsJson) : {};

    if (name === 'read_article') {
      const reader = commenterAccounts[0];
      const result = await readCafeArticleContent(
        { id: reader.accountId, password: reader.password, nickname: reader.nickname || reader.accountId },
        cafeId,
        articleId,
        { reason: `deepseek_agent_read:${reader.accountId}` },
      );
      if (!result.success) {
        await emit({ type: 'log', message: `본문 읽기 실패: ${result.error}` });
        return JSON.stringify({ success: false, error: result.error });
      }
      ownerNickname = result.authorNickname || '';
      await emit({ type: 'log', message: `본문 읽음: "${result.title}" (${result.content?.length}자)` });
      return JSON.stringify({ success: true, title: result.title, content: result.content, authorNickname: result.authorNickname });
    }

    if (name === 'list_accounts') {
      const limit = Number(parsed.limit) || 20;
      const existing = await PublishedArticle.findOne({ cafeId, articleId }, { comments: 1 }).lean<{
        comments?: Array<{ accountId?: string }>;
      } | null>();
      const alreadyCommented = new Set((existing?.comments || []).map((c) => c.accountId).filter(Boolean) as string[]);

      const allDocs = await PublishedArticle.find({}, { comments: 1 }).lean<Array<{ comments?: Array<{ accountId?: string; createdAt?: Date }> }>>();
      const lastUsedAt = new Map<string, number>();
      for (const doc of allDocs) {
        for (const c of doc.comments || []) {
          if (!c.accountId || !c.createdAt) continue;
          const ts = new Date(c.createdAt).getTime();
          if (ts > (lastUsedAt.get(c.accountId) || 0)) lastUsedAt.set(c.accountId, ts);
        }
      }

      const eligible = commenterAccounts.filter(
        (a) => normalizeName(a.nickname || a.accountId) !== normalizeName(ownerNickname) && !alreadyCommented.has(a.accountId),
      );
      const sorted = [...eligible].sort((a, b) => (lastUsedAt.get(a.accountId) || 0) - (lastUsedAt.get(b.accountId) || 0));
      return JSON.stringify(sorted.slice(0, limit).map((a) => ({ accountId: a.accountId, nickname: a.nickname })));
    }

    if (name === 'post_comment') {
      const { accountId, content } = parsed as { accountId: string; content: string };
      const account = commenterAccounts.find((a) => a.accountId === accountId);
      if (!account) return JSON.stringify({ success: false, error: '알 수 없는 accountId' });

      const already = await hasCommented(cafeId, articleId, accountId, 'comment');
      if (already) return JSON.stringify({ success: false, error: '이 계정은 이미 이 글에 댓글을 달았음' });

      const result = await writeCommentWithAccount(
        { id: account.accountId, password: account.password, nickname: account.nickname || account.accountId },
        cafeId,
        articleId,
        content,
      );

      if (!result.success) {
        await emit({ type: 'post_fail', message: `${accountId}: ${result.error}`, accountId, content });
        return JSON.stringify({ success: false, error: result.error });
      }

      await addCommentToArticle(cafeId, articleId, {
        accountId: account.accountId,
        nickname: account.nickname || account.accountId,
        content,
        type: 'comment',
        commentId: result.commentId,
      });
      successCount += 1;
      await emit({
        type: 'post_success',
        message: `${accountId} commentId=${result.commentId}`,
        accountId,
        nickname: account.nickname,
        content,
        commentId: result.commentId,
      });
      return JSON.stringify({ success: true, commentId: result.commentId });
    }

    if (name === 'wait_minutes') {
      const minutes = Math.min(15, Math.max(1, Number(parsed.minutes) || 3));
      await emit({ type: 'wait', message: `${minutes}분 대기` });
      await sleep(minutes * 60_000);
      return JSON.stringify({ waited_minutes: minutes });
    }

    return JSON.stringify({ error: `알 수 없는 tool: ${name}` });
  };

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: [
        '너는 네이버 카페 댓글 작업을 자율적으로 수행하는 에이전트다.',
        '주어진 도구(read_article, list_accounts, post_comment, wait_minutes, finish)만 사용해서 작업을 완료한다.',
        '',
        '작업 절차:',
        '1. read_article로 실제 본문을 읽는다. 절대 본문을 상상하지 않는다.',
        '2. 본문 내용을 바탕으로 8~13개 사이에서 자연스러운 개수의 댓글을 계획한다.',
        '3. list_accounts로 사용 가능한 계정을 확인한다.',
        '4. post_comment로 계정마다 서로 다른 댓글을 하나씩 등록한다. 실패하면 다른 계정으로 같은 댓글을 재시도한다.',
        '5. 댓글 사이마다 wait_minutes로 2~8분 정도 자연스럽게 대기한다.',
        '6. 댓글 규칙: 존댓말만 사용, 35~120자, 본문의 구체적인 내용(제품명/숫자/조건 등)을 실제로 언급, "저도/맞아요/좋은 정보"로 시작하는 댓글은 전체에서 최대 1개, 질문형/경험형/정보형/생활잡담형을 섞어서 다양하게, 광고처럼 보이는 구매 유도 금지.',
        '7. 목표 개수만큼(또는 계정이 소진될 때까지) 등록했으면 finish를 호출해 종료한다.',
      ].join('\n'),
    },
    {
      role: 'user',
      content: `카페 슬러그: ${cafeSlug}, cafeId: ${cafeId}, articleId: ${articleId} 글에 댓글 작업을 진행해줘.`,
    },
  ];

  let turns = 0;
  let summary = '';

  while (turns < MAX_TURNS) {
    turns += 1;
    const { message, finishReason } = await callDeepSeek(apiKey, messages);
    messages.push(message);

    if (!message.tool_calls || message.tool_calls.length === 0) {
      await emit({ type: 'log', message: `텍스트 응답 (도구 호출 없음, finish_reason=${finishReason}): ${message.content}` });
      break;
    }

    let shouldStop = false;
    for (const toolCall of message.tool_calls) {
      const { name, arguments: argsJson } = toolCall.function;
      const result = await executeTool(name, argsJson);
      messages.push({ role: 'tool', tool_call_id: toolCall.id, content: result });

      if (name === 'finish') {
        summary = JSON.parse(argsJson).summary || '';
        await emit({ type: 'finish', message: summary });
        shouldStop = true;
      }
    }

    if (shouldStop) break;
  }

  if (turns >= MAX_TURNS && !summary) {
    summary = '최대 턴 수 도달로 강제 종료';
    await emit({ type: 'log', message: summary });
  }

  return { successCount, summary };
};
