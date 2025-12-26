'use client';

// components/builder/property/tabs/ValidationTab.tsx - 검증 규칙 탭

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { useSurveyActions } from '@/stores';
import type { Question, LegacyValidation } from '@/types';

interface ValidationTabProps {
  question: Question;
  nodeId: string;
}

export function ValidationTab({ question, nodeId }: ValidationTabProps) {
  const surveyActions = useSurveyActions();
  const validation = question.validation as LegacyValidation;

  const handleChange = useCallback(
    (field: string, value: number | string | null) => {
      surveyActions.updateQuestionNode(nodeId, {
        validation: { ...validation, [field]: value },
      });
    },
    [nodeId, validation, surveyActions]
  );

  // 객관식: 선택 개수 검증
  if (question.questionType === 'multiple_choice') {
    return (
      <div className="space-y-5">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          선택 개수 제한
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="minSelections"
              className="text-xs text-gray-600 dark:text-gray-400"
            >
              최소 선택
            </label>
            <Input
              id="minSelections"
              type="number"
              value={validation.minSelections || 1}
              onChange={(e) =>
                handleChange('minSelections', parseInt(e.target.value) || 1)
              }
              min={1}
              max={validation.maxSelections || 10}
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="maxSelections"
              className="text-xs text-gray-600 dark:text-gray-400"
            >
              최대 선택
            </label>
            <Input
              id="maxSelections"
              type="number"
              value={validation.maxSelections || 1}
              onChange={(e) =>
                handleChange('maxSelections', parseInt(e.target.value) || 1)
              }
              min={validation.minSelections || 1}
              max={question.options?.length || 10}
            />
          </div>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            {validation.minSelections === validation.maxSelections
              ? `정확히 ${validation.minSelections}개를 선택해야 합니다.`
              : `${validation.minSelections || 1}개 이상 ${
                  validation.maxSelections || 1
                }개 이하로 선택해야 합니다.`}
          </p>
        </div>
      </div>
    );
  }

  // 텍스트 의견: 글자 수 검증
  if (question.questionType === 'text_opinion') {
    return (
      <div className="space-y-5">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          글자 수 제한
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="minLength"
              className="text-xs text-gray-600 dark:text-gray-400"
            >
              최소 글자 수
            </label>
            <Input
              id="minLength"
              type="number"
              value={validation.minLength || 0}
              onChange={(e) =>
                handleChange('minLength', parseInt(e.target.value) || 0)
              }
              min={0}
              data-testid="validation-min-length"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="maxLength"
              className="text-xs text-gray-600 dark:text-gray-400"
            >
              최대 글자 수
            </label>
            <Input
              id="maxLength"
              type="number"
              value={validation.maxLength || 1000}
              onChange={(e) =>
                handleChange('maxLength', parseInt(e.target.value) || 1000)
              }
              min={validation.minLength || 0}
              max={10000}
              data-testid="validation-max-length"
            />
          </div>
        </div>

        <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
          <p className="text-xs text-green-700 dark:text-green-300">
            {validation.minLength
              ? `최소 ${validation.minLength}자 이상 입력해야 합니다.`
              : '글자 수 제한이 없습니다.'}
            {validation.maxLength &&
              ` (최대 ${validation.maxLength}자)`}
          </p>
        </div>
      </div>
    );
  }

  // 음성 의견: 녹음 시간 검증
  if (question.questionType === 'voice_opinion') {
    return (
      <div className="space-y-5">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          녹음 시간 제한
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="minDuration"
              className="text-xs text-gray-600 dark:text-gray-400"
            >
              최소 녹음 시간 (초)
            </label>
            <Input
              id="minDuration"
              type="number"
              value={validation.minDuration || 0}
              onChange={(e) =>
                handleChange('minDuration', parseInt(e.target.value) || 0)
              }
              min={0}
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="maxDuration"
              className="text-xs text-gray-600 dark:text-gray-400"
            >
              최대 녹음 시간 (초)
            </label>
            <Input
              id="maxDuration"
              type="number"
              value={validation.maxDuration || 120}
              onChange={(e) =>
                handleChange('maxDuration', parseInt(e.target.value) || 120)
              }
              min={validation.minDuration || 0}
              max={300}
            />
          </div>
        </div>

        <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
          <p className="text-xs text-purple-700 dark:text-purple-300">
            {validation.minDuration
              ? `최소 ${validation.minDuration}초 이상 녹음해야 합니다.`
              : '최소 녹음 시간 제한이 없습니다.'}
            {validation.maxDuration &&
              ` (최대 ${validation.maxDuration}초)`}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
