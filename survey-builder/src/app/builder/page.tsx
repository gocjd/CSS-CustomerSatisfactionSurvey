'use client';

// app/builder/page.tsx - Survey Builder 메인 페이지

import { useEffect, useState } from 'react';
import { BuilderLayout } from '@/components/builder/BuilderLayout';
import { useSurveyActions, useSurveyStore } from '@/stores';

export default function BuilderPage() {
  const surveyActions = useSurveyActions();
  const [hasHydrated, setHasHydrated] = useState(false);

  // Zustand persist hydration logic
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;

    const state = useSurveyStore.getState();
    // 데이터가 아예 없는 경우(메타데이터와 노드 모두 비어있음)에만 초기화
    if (!state.survey && state.nodes.length === 0) {
      surveyActions.createNewSurvey();
    }
  }, [hasHydrated, surveyActions]);

  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse text-sm text-gray-500">Loading Builder...</div>
      </div>
    );
  }

  return <BuilderLayout />;
}
