import type { PointerEvent } from 'react';

export const handlePreviewMove = ({ currentTarget, clientX, clientY, pointerType }: PointerEvent<HTMLDivElement>) => {
  if (pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const { left, top, width, height } = currentTarget.getBoundingClientRect();
  currentTarget.style.setProperty('--tilt-x', `${((clientY - top) / height - .5) * -2}deg`);
  currentTarget.style.setProperty('--tilt-y', `${((clientX - left) / width - .5) * 2}deg`);
};

export const handlePreviewLeave = ({ currentTarget }: PointerEvent<HTMLDivElement>) => {
  currentTarget.style.removeProperty('--tilt-x');
  currentTarget.style.removeProperty('--tilt-y');
};
