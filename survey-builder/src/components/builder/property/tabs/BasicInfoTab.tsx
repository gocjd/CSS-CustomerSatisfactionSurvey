'use client';

// components/builder/property/tabs/BasicInfoTab.tsx - 기본 정보 탭

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useSurveyActions, useSurveyStore } from '@/stores';
import type { Question, Importance } from '@/types';
import { IMPORTANCE_LABELS, QUESTION_TYPE_LABELS } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


interface BasicInfoTabProps {
  question: Question;
  nodeId: string;
}

export function BasicInfoTab({ question, nodeId }: BasicInfoTabProps) {
  const surveyActions = useSurveyActions();
  const nodes = useSurveyStore((state) => state.nodes);
  const sections = useSurveyStore((state) => state.sections);


  const handleChange = useCallback(
    (field: keyof Question, value: any) => {
      // title 변경 시 중복 체크 및 자동 번호 추가
      if (field === 'title') {
        let newTitle = value;
        const existingTitles = nodes
          .filter((n) => n.type === 'question' && n.id !== nodeId)
          .map((n) => (n as any).data.question.title);

        // 중복된 제목이 있으면 번호 추가
        if (existingTitles.includes(newTitle)) {
          let suffix = 1;
          while (existingTitles.includes(`${newTitle} ${suffix}`)) {
            suffix++;
          }
          newTitle = `${newTitle} ${suffix}`;
        }

        surveyActions.updateQuestionNode(nodeId, { [field]: newTitle });
      } else {
        surveyActions.updateQuestionNode(nodeId, { [field]: value });
      }
    },
    [nodeId, nodes, surveyActions]
  );

  return (
    <div className="space-y-5">
      {/* 질문 ID (읽기 전용) */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          질문 ID
        </label>
        <div className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400 font-mono">
          {question.questionId}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          시스템에서 자동 생성되며 수정할 수 없습니다. 설문 내에서 고유합니다.
        </p>

      </div>

      {/* Section Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Section
        </label>
        {sections.length > 0 ? (
          <Select
            value={question.sectionId}
            onValueChange={(val) => handleChange('sectionId', val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a section" />
            </SelectTrigger>
            <SelectContent>
              {sections.map(sec => (
                <SelectItem key={sec.sectionId} value={sec.sectionId}>
                  {sec.title} ({sec.sectionId})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
            No sections defined. Click on the empty canvas to add sections in Global Settings.
          </div>
        )}
      </div>

      {/* 질문 제목 */}

      <div className="space-y-2">
        <label
          htmlFor="title"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          질문 제목
        </label>
        <Input
          id="title"
          value={question.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="질문 제목을 입력하세요"
          data-testid="property-title-input"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          중복된 제목은 자동으로 번호가 추가됩니다.
        </p>
      </div>

      {/* 프롬프트 */}
      <div className="space-y-2">
        <label
          htmlFor="prompt"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          질문 내용 (프롬프트)
        </label>
        <textarea
          id="prompt"
          value={question.prompt}
          onChange={(e) => handleChange('prompt', e.target.value)}
          placeholder="질문 내용을 입력하세요"
          className="w-full min-h-[100px] px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* 질문 유형 (읽기 전용) */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          질문 유형
        </label>
        <div className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400">
          {QUESTION_TYPE_LABELS[question.questionType]}
        </div>
      </div>

      {/* 중요도 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          중요도
        </label>
        <select
          value={question.importance}
          onChange={(e) => handleChange('importance', e.target.value as Importance)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {Object.entries(IMPORTANCE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* 필수 여부 */}
      <div className="flex items-center space-x-3">
        <Checkbox
          id="required"
          checked={question.required}
          onCheckedChange={(checked) => handleChange('required', checked)}
        />
        <label
          htmlFor="required"
          className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
        >
          필수 응답
        </label>
      </div>

      {/* 텍스트 의견인 경우 플레이스홀더 */}
      {
        question.questionType === 'text_opinion' && (
          <div className="space-y-2">
            <label
              htmlFor="placeholder"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              입력 안내 문구
            </label>
            <Input
              id="placeholder"
              value={question.placeholder || ''}
              onChange={(e) => handleChange('placeholder', e.target.value)}
              placeholder="예: 자유롭게 의견을 입력해주세요"
            />
          </div>
        )
      }

      {/* Likert Scale 옵션 (객관식인 경우) */}
      {
        question.questionType === 'multiple_choice' && (
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="likertScale"
                checked={question.displayType === 'likert_scale'}
                onCheckedChange={(checked) =>
                  handleChange('displayType', checked ? 'likert_scale' : 'default')
                }
              />
              <label
                htmlFor="likertScale"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Likert Scale
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 pl-7">
              활성화 시 옵션들이 점수 척도 형태(예: 1-5점 만족도)로 표시됩니다. 주로 동의도, 만족도, 빈도 등의 평가에 사용됩니다.
            </p>
          </div>
        )
      }
    </div >
  );
}
