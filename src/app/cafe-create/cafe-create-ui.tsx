'use client';

import { useState, useTransition, useEffect } from 'react';
import { cn } from '@/shared';
import { Button } from '@/shared';
import {
  getCafeCreateFormDataAction,
  createCafeAction,
  type CafeCreateOwnerOption,
  type CafeCreateActionResult,
  type CafeCreateFormData,
} from '@/features/auto-comment/batch/cafe-create-actions';
import {
  generateCafeNameSuggestions,
  type CafeNameSuggestion,
} from '@/shared/lib/naver-cafe-creation/name-generator';

export const CafeCreateUI = () => {
  const [isPending, startTransition] = useTransition();
  const [owners, setOwners] = useState<CafeCreateOwnerOption[]>([]);
  const [presets, setPresets] = useState<CafeCreateFormData['presets']>([]);
  const [ownerAccountId, setOwnerAccountId] = useState('');
  const [presetKey, setPresetKey] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [keywordsText, setKeywordsText] = useState('');
  const [result, setResult] = useState<CafeCreateActionResult | null>(null);
  const [nameSuggestions, setNameSuggestions] = useState<CafeNameSuggestion[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const data = await getCafeCreateFormDataAction();
      setOwners(data.owners);
      setPresets(data.presets);
      setOwnerAccountId(data.owners[0]?.accountId ?? '');
      setPresetKey(data.presets[0]?.key ?? '');
    };
    loadData();
  }, []);

  const canSubmit =
    ownerAccountId.trim() !== '' &&
    presetKey.trim() !== '' &&
    name.trim() !== '' &&
    slug.trim() !== '' &&
    description.trim() !== '';

  const handleSuggestNames = () => {
    const preset = presets.find((p) => p.key === presetKey);
    setNameSuggestions(generateCafeNameSuggestions(preset?.sheetCategory, 5));
  };

  const handlePickSuggestion = (suggestion: CafeNameSuggestion) => {
    setName(suggestion.name);
    setSlug(suggestion.slug);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;

    startTransition(async () => {
      setResult(null);
      const keywords = keywordsText
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      const res = await createCafeAction({
        ownerAccountId,
        name: name.trim(),
        slug: slug.trim(),
        presetKey,
        description: description.trim(),
        keywords,
      });
      setResult(res);

      if (res.success) {
        const data = await getCafeCreateFormDataAction();
        setOwners(data.owners);
        setPresets(data.presets);
        setOwnerAccountId(data.owners[0]?.accountId ?? '');
        setPresetKey(data.presets[0]?.key ?? '');
        setName('');
        setSlug('');
        setDescription('');
        setKeywordsText('');
      }
    });
  };

  return (
    <div className={cn('space-y-6')}>
      <div className={cn('space-y-4')}>
        <div>
          <label className={cn('text-xs font-medium text-(--ink-muted) mb-2 block')}>
            소유 계정 ({owners.length}개 사용 가능)
          </label>
          <select
            value={ownerAccountId}
            onChange={(e) => setOwnerAccountId(e.target.value)}
            className={cn(
              'w-full px-4 py-2 rounded-xl border border-(--border) bg-(--surface) text-sm text-(--ink)'
            )}
          >
            {owners.length === 0 && <option value="">사용 가능한 계정 없음</option>}
            {owners.map((owner) => (
              <option key={owner.accountId} value={owner.accountId}>
                {owner.nickname} ({owner.accountId}) {owner.role ? `- ${owner.role}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={cn('text-xs font-medium text-(--ink-muted) mb-2 block')}>
            카테고리
          </label>
          <select
            value={presetKey}
            onChange={(e) => setPresetKey(e.target.value)}
            className={cn(
              'w-full px-4 py-2 rounded-xl border border-(--border) bg-(--surface) text-sm text-(--ink)'
            )}
          >
            {presets.map((preset) => (
              <option key={preset.key} value={preset.key}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className={cn('flex items-center justify-between mb-2')}>
            <label className={cn('text-xs font-medium text-(--ink-muted)')}>카페이름</label>
            <button
              type="button"
              onClick={handleSuggestNames}
              className={cn(
                'text-xs font-medium text-(--teal) hover:underline'
              )}
            >
              이름 자동 추천
            </button>
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 생활 살림노트"
            className={cn(
              'w-full px-4 py-2 rounded-xl border border-(--border) bg-(--surface) text-sm text-(--ink)'
            )}
          />
          {nameSuggestions.length > 0 && (
            <div className={cn('flex flex-wrap gap-2 mt-2')}>
              {nameSuggestions.map((suggestion) => (
                <button
                  key={suggestion.slug}
                  type="button"
                  onClick={() => handlePickSuggestion(suggestion)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-full border border-(--border)',
                    'bg-(--surface-muted) text-(--ink) hover:border-(--teal) hover:text-(--teal)'
                  )}
                >
                  {suggestion.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className={cn('text-xs font-medium text-(--ink-muted) mb-2 block')}>
            카페주소 (cafe.naver.com/뒤에 붙는 영문 주소)
          </label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
            placeholder="예: livingnote702"
            className={cn(
              'w-full px-4 py-2 rounded-xl border border-(--border) bg-(--surface) text-sm text-(--ink)'
            )}
          />
        </div>

        <div>
          <label className={cn('text-xs font-medium text-(--ink-muted) mb-2 block')}>
            카페 설명 (100자 이내)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 100))}
            rows={3}
            className={cn(
              'w-full px-4 py-2 rounded-xl border border-(--border) bg-(--surface) text-sm text-(--ink)'
            )}
          />
          <p className={cn('text-xs text-(--ink-muted) mt-1')}>{description.length}/100</p>
        </div>

        <div>
          <label className={cn('text-xs font-medium text-(--ink-muted) mb-2 block')}>
            카페 검색어 (쉼표로 구분, 최대 10개)
          </label>
          <input
            value={keywordsText}
            onChange={(e) => setKeywordsText(e.target.value)}
            placeholder="예: 생활, 살림, 살림정보"
            className={cn(
              'w-full px-4 py-2 rounded-xl border border-(--border) bg-(--surface) text-sm text-(--ink)'
            )}
          />
        </div>
      </div>

      <Button
        variant="teal"
        size="lg"
        fullWidth
        isLoading={isPending}
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        카페 개설하기
      </Button>

      {result && (
        <div
          className={cn(
            'rounded-2xl border px-4 py-4',
            result.success
              ? 'border-(--success) bg-(--success-soft)'
              : 'border-(--danger) bg-(--danger-soft)'
          )}
        >
          {result.success ? (
            <div className={cn('space-y-1')}>
              <p className={cn('font-semibold text-(--success)')}>카페 개설 완료</p>
              <p className={cn('text-sm text-(--ink)')}>
                <a
                  href={result.cafeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn('underline')}
                >
                  {result.cafeUrl}
                </a>
              </p>
              <p className={cn('text-xs text-(--ink-muted)')}>
                cafeId: {result.cafeId} · 시트 동기화: {result.sheetSynced ? '완료' : '실패(수동 확인 필요)'}
              </p>
            </div>
          ) : (
            <p className={cn('text-sm text-(--danger)')}>{result.error}</p>
          )}
        </div>
      )}
    </div>
  );
};
