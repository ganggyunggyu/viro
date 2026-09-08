import type { Metadata } from 'next';
import { LandingPage } from '@/app/landing/_components/landing-page';
import '@/app/landing/_styles/base.css';
import '@/app/landing/_styles/hero.css';
import '@/app/landing/_styles/queue.css';
import '@/app/landing/_styles/details.css';
import '@/app/landing/_styles/operations.css';
import '@/app/landing/_styles/motion.css';

export const metadata: Metadata = {
  title: '바이로 — 카페 발행 관리 도구',
  description: '카페와 계정, 글과 댓글, 발행할 시간까지. 여러 계정의 발행 순서와 결과를 바이로에서 관리합니다.',
  alternates: { canonical: 'https://cafe-bot-two.vercel.app/landing' },
};

export default LandingPage;
