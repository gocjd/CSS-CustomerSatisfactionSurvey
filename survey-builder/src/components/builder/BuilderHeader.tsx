'use client';

// components/builder/BuilderHeader.tsx - 빌더 헤더

import { useState } from 'react';
import {
  Save,
  Download,
  Upload,
  Settings,
  FileText,
  ChevronDown,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSurveyStore, useSurveyActions } from '@/stores';
import { useUIActions } from '@/stores';
import { cn } from '@/lib/utils';

export function BuilderHeader() {
  const [isEditingName, setIsEditingName] = useState(false);

  const fileName = useSurveyStore((state) => state.fileName);
  const isDirty = useSurveyStore((state) => state.isDirty);
  const isValid = useSurveyStore((state) => state.isValid);
  const survey = useSurveyStore((state) => state.survey);

  const surveyActions = useSurveyActions();
  const uiActions = useUIActions();

  const handleExport = () => {
    // 저장 전 검증 수행
    const errors = surveyActions.validateGraph();
    if (errors.length > 0) {
      uiActions.showToast('설문에 오류가 있어 저장할 수 없습니다.', 'warning');
      uiActions.setPropertyPanelTab('basic'); // 포커스 이동 유도
      return;
    }

    // 파일명 입력 받기
    const newFileName = window.prompt('저장할 파일 이름을 입력하세요:', fileName || 'survey');
    if (!newFileName) return; // 취소한 경우

    try {
      const surveyData = surveyActions.exportToSurvey();
      const blob = new Blob([JSON.stringify(surveyData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${newFileName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      surveyActions.setFileName(newFileName);
      surveyActions.setDirty(false);
      uiActions.showToast('설문이 저장되었습니다.', 'success');
    } catch (error) {
      uiActions.showToast('저장 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        surveyActions.initSurvey(data);
        surveyActions.setFileName(file.name.replace('.json', ''));
        uiActions.showToast('설문을 불러왔습니다.', 'success');
      } catch (error) {
        uiActions.showToast('파일을 읽는 중 오류가 발생했습니다.', 'error');
      }
    };
    input.click();
  };

  const handleNewSurvey = () => {
    if (isDirty) {
      uiActions.showConfirmDialog({
        title: '새 설문 만들기',
        message: '저장하지 않은 변경사항이 있습니다. 새 설문을 만들까요?',
        onConfirm: () => {
          surveyActions.createNewSurvey();
          uiActions.closeConfirmDialog();
          uiActions.showToast('새 설문이 생성되었습니다.', 'success');
        },
      });
    } else {
      surveyActions.createNewSurvey();
      uiActions.showToast('새 설문이 생성되었습니다.', 'success');
    }
  };

  return (
    <header
      className={cn(
        'flex items-center justify-between h-14 px-4',
        'bg-white dark:bg-gray-900',
        'border-b border-gray-200 dark:border-gray-800',
        'shadow-sm'
      )}
    >
      {/* 왼쪽: 로고 & 파일명 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            Survey Builder
          </span>
        </div>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

        {/* 파일명 */}
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <Input
              autoFocus
              value={fileName}
              onChange={(e) => surveyActions.setFileName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
              className="h-9 w-64 text-lg font-semibold"
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {fileName || 'untitled'}
              {isDirty && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title="저장되지 않은 변경사항" />
              )}
            </button>
          )}
        </div>

        {/* 상태 표시 */}
        <div className="flex items-center gap-2">
          {isValid ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold text-sm border border-green-300 dark:border-green-700">
              <Check className="w-4 h-4" />
              유효함
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold text-sm border border-red-300 dark:border-red-700 animate-pulse">
              <AlertCircle className="w-4 h-4" />
              오류
            </span>
          )}
        </div>
      </div>

      {/* 오른쪽: 액션 버튼들 */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewSurvey}
          className="h-8 text-xs"
        >
          새 설문
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleImport}
          className="h-8 text-xs"
          data-testid="import-button"
        >
          <Upload className="w-4 h-4 mr-1" />
          불러오기
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleExport}
          className="h-8 text-xs"
        >
          <Download className="w-4 h-4 mr-1" />
          다른 이름으로 저장
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={handleExport}
          className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
          data-testid="export-button"
        >
          <Download className="w-4 h-4 mr-1" />
          저장
        </Button>
      </div>
    </header>
  );
}
