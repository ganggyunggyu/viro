'use client';

import { cn } from '@/shared';
import { useEffect, useState } from 'react';
import { Button, ConfirmModal } from '@/shared';
import { useDelaySettings, type DelaySettings } from '@/shared/hooks/use-delay-settings';

const rangeInputClassName = cn(
  'w-16 rounded-lg border border-(--border) bg-(--surface) px-2 py-2 text-sm text-center text-(--ink)',
  'focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/10'
);

const formatUnitValue = (ms: number, factor: number, allowDecimal: boolean): string => {
  const val = ms / factor;
  return allowDecimal ? String(Number(val.toFixed(2))) : String(Math.round(val));
};

interface RangeInputRowProps {
  label: string;
  min: number;
  max: number;
  step: number;
  minValue: number;
  maxValue: number;
  unit: string;
  factor: number;
  allowDecimal?: boolean;
  onChange: (min: number, max: number) => void;
}

const RangeInputRow = ({
  label,
  min,
  max,
  step,
  minValue,
  maxValue,
  unit,
  factor,
  allowDecimal = false,
  onChange,
}: RangeInputRowProps) => {
  const [minText, setMinText] = useState(() => formatUnitValue(minValue, factor, allowDecimal));
  const [maxText, setMaxText] = useState(() => formatUnitValue(maxValue, factor, allowDecimal));

  useEffect(() => {
    setMinText(formatUnitValue(minValue, factor, allowDecimal));
  }, [minValue, factor, allowDecimal]);

  useEffect(() => {
    setMaxText(formatUnitValue(maxValue, factor, allowDecimal));
  }, [maxValue, factor, allowDecimal]);

  const handleTextChange = (raw: string, setText: (value: string) => void) => {
    const filtered = allowDecimal ? raw.replace(/[^0-9.]/g, '') : raw.replace(/\D/g, '');
    setText(filtered);
  };

  const commitMin = () => {
    const num = Number(minText);
    if (Number.isNaN(num)) {
      setMinText(formatUnitValue(minValue, factor, allowDecimal));
      return;
    }
    const newMs = Math.round(num * factor);
    const clamped = Math.max(min, Math.min(newMs, maxValue - step));
    onChange(clamped, maxValue);
  };

  const commitMax = () => {
    const num = Number(maxText);
    if (Number.isNaN(num)) {
      setMaxText(formatUnitValue(maxValue, factor, allowDecimal));
      return;
    }
    const newMs = Math.round(num * factor);
    const clamped = Math.min(max, Math.max(newMs, minValue + step));
    onChange(minValue, clamped);
  };

  return (
    <div className={cn('flex items-center justify-between gap-4')}>
      <span className={cn('text-sm font-medium text-(--ink)')}>{label}</span>
      <div className={cn('flex items-center gap-2')}>
        <input
          type="text"
          inputMode={allowDecimal ? 'decimal' : 'numeric'}
          value={minText}
          onFocus={(e) => e.target.select()}
          onChange={(e) => handleTextChange(e.target.value, setMinText)}
          onBlur={commitMin}
          className={rangeInputClassName}
        />
        <span className={cn('text-sm text-(--ink-tertiary)')}>~</span>
        <input
          type="text"
          inputMode={allowDecimal ? 'decimal' : 'numeric'}
          value={maxText}
          onFocus={(e) => e.target.select()}
          onChange={(e) => handleTextChange(e.target.value, setMaxText)}
          onBlur={commitMax}
          className={rangeInputClassName}
        />
        <span className={cn('text-sm text-(--ink-tertiary)')}>{unit}</span>
      </div>
    </div>
  );
};

export const DelaySettingsUI = () => {
  const { settings, updateSettings, reset, isLoaded } = useDelaySettings();
  const [showResetModal, setShowResetModal] = useState(false);

  const handleReset = () => {
    reset();
    setShowResetModal(false);
  };

  const inputClassName = cn(
    'w-full rounded-xl border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--ink)',
    'focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/10'
  );

  const handleDelayChange = (
    key: 'betweenPosts' | 'betweenComments' | 'afterPost',
    min: number,
    max: number
  ) => {
    const newSettings: DelaySettings = {
      ...settings,
      delays: {
        ...settings.delays,
        [key]: { min, max },
      },
    };
    updateSettings(newSettings);
  };

  if (!isLoaded) {
    return (
      <div className={cn('p-8 text-center text-(--ink-muted)')}>
        로딩 중...
      </div>
    );
  }

  return (
    <div className={cn('space-y-8')}>
      {/* 딜레이 설정 */}
      <div className={cn('rounded-2xl border border-(--border-light) bg-(--surface) p-6 space-y-6')}>
        <div className={cn('flex items-center justify-between')}>
          <h3 className={cn('text-base font-semibold text-(--ink)')}>딜레이 설정</h3>
          <span className={cn('text-xs bg-(--info-soft) text-(--info) px-2.5 py-1 rounded-lg font-medium')}>
            자동 저장
          </span>
        </div>

        <div className={cn('space-y-4')}>
          <RangeInputRow
            label="글 사이 딜레이"
            min={10 * 1000}
            max={30 * 60 * 1000}
            step={5 * 1000}
            unit="초"
            factor={1000}
            minValue={settings.delays.betweenPosts.min}
            maxValue={settings.delays.betweenPosts.max}
            onChange={(min, max) => handleDelayChange('betweenPosts', min, max)}
          />

          <RangeInputRow
            label="댓글 사이 딜레이"
            min={1 * 60 * 1000}
            max={15 * 60 * 1000}
            step={30 * 1000}
            unit="분"
            factor={60 * 1000}
            allowDecimal
            minValue={settings.delays.betweenComments.min}
            maxValue={settings.delays.betweenComments.max}
            onChange={(min, max) => handleDelayChange('betweenComments', min, max)}
          />

          <RangeInputRow
            label="글 작성 후 딜레이"
            min={1 * 1000}
            max={60 * 1000}
            step={1 * 1000}
            unit="초"
            factor={1000}
            minValue={settings.delays.afterPost.min}
            maxValue={settings.delays.afterPost.max}
            onChange={(min, max) => handleDelayChange('afterPost', min, max)}
          />
        </div>
      </div>

      {/* 재시도 설정 */}
      <div className={cn('rounded-2xl border border-(--border-light) bg-(--surface) p-6 space-y-5')}>
        <h3 className={cn('text-base font-semibold text-(--ink)')}>재시도 설정</h3>

        <div className={cn('grid gap-4 md:grid-cols-2')}>
          <div className={cn('space-y-2')}>
            <label className={cn('text-sm font-medium text-(--ink)')}>재시도 횟수</label>
            <input
              type="text"
              inputMode="numeric"
              value={settings.retry.attempts}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, '');
                if (cleaned === '') return;
                const val = Math.max(1, Math.min(10, Number(cleaned)));
                updateSettings({
                  ...settings,
                  retry: { ...settings.retry, attempts: val },
                });
              }}
              className={inputClassName}
            />
          </div>

          <div className={cn('space-y-2')}>
            <label className={cn('text-sm font-medium text-(--ink)')}>타임아웃 (분)</label>
            <input
              type="text"
              inputMode="numeric"
              value={Math.floor(settings.timeout / 60000)}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, '');
                if (cleaned === '') return;
                const val = Math.max(1, Math.min(30, Number(cleaned)));
                updateSettings({ ...settings, timeout: val * 60000 });
              }}
              className={inputClassName}
            />
          </div>
        </div>
      </div>

      {/* 제한 설정 */}
      <div className={cn('rounded-2xl border border-(--border-light) bg-(--surface) p-6 space-y-5')}>
        <h3 className={cn('text-base font-semibold text-(--ink)')}>제한 설정</h3>

        <div className={cn('space-y-4')}>
          <label className={cn('flex items-center gap-3 cursor-pointer')}>
            <input
              type="checkbox"
              checked={settings.limits?.enableDailyPostLimit ?? false}
              onChange={(e) => {
                updateSettings({
                  ...settings,
                  limits: { ...settings.limits, enableDailyPostLimit: e.target.checked },
                });
              }}
              className={cn('checkbox w-5 h-5')}
            />
            <div>
              <span className={cn('text-sm text-ink')}>일일 글 제한 활성화</span>
              <p className={cn('text-xs text-ink-muted')}>계정별 설정 적용</p>
            </div>
          </label>

          <div className={cn('flex items-center gap-4')}>
            <span className={cn('text-sm text-(--ink)')}>계정당 댓글 수</span>
            <input
              type="text"
              inputMode="numeric"
              value={settings.limits?.maxCommentsPerAccount ?? 1}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, '');
                const val = cleaned === '' ? 0 : Math.min(10, Number(cleaned));
                updateSettings({
                  ...settings,
                  limits: { ...settings.limits, maxCommentsPerAccount: val },
                });
              }}
              className={cn(inputClassName, 'w-20 text-center')}
            />
            <span className={cn('text-xs text-(--ink-muted)')}>0 = 무제한</span>
          </div>
        </div>
      </div>

      {/* 초기화 확인 모달 */}
      <ConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleReset}
        title="설정을 기본값으로 초기화하시겠습니까?"
        description="모든 딜레이, 재시도, 제한 설정이 기본값으로 복원됩니다."
        variant="warning"
        confirmText="초기화"
        cancelText="취소"
      />

      {/* 초기화 버튼 */}
      <Button
        variant="secondary"
        fullWidth
        onClick={() => setShowResetModal(true)}
      >
        기본값으로 초기화
      </Button>
    </div>
  );
};
