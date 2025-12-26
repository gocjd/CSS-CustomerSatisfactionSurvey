import Link from 'next/link';
import { FileText, ArrowRight, Zap, GitBranch, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-950 dark:to-gray-900">
      <main className="flex flex-col items-center gap-8 px-4 text-center">
        {/* 로고 */}
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Survey Builder
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              CSS Visual Editor
            </p>
          </div>
        </div>

        {/* 설명 */}
        <p className="max-w-md text-lg text-gray-600 dark:text-gray-300">
          직관적인 드래그 앤 드롭 인터페이스로
          <br />
          복잡한 설문 흐름을 시각적으로 설계하세요.
        </p>

        {/* 특징 */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
            <Zap className="h-6 w-6 text-amber-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              빠른 설계
            </span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
            <GitBranch className="h-6 w-6 text-green-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              조건 분기
            </span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
            <Shield className="h-6 w-6 text-blue-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              실시간 검증
            </span>
          </div>
        </div>

        {/* CTA 버튼 */}
        <Link
          href="/builder"
          className="mt-6 flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/40"
        >
          빌더 시작하기
          <ArrowRight className="h-5 w-5" />
        </Link>

        {/* 부가 정보 */}
        <p className="mt-8 text-xs text-gray-400 dark:text-gray-500">
          Customer Satisfaction Survey System
          <br />
          Version 1.0.0
        </p>
      </main>
    </div>
  );
}
