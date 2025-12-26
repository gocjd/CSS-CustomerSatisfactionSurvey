'use client';

// components/builder/property/tabs/ImageTab.tsx - 이미지 설정 탭

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useSurveyActions } from '@/stores';
import type { Question } from '@/types';

interface ImageTabProps {
    question: Question;
    nodeId: string;
}

export function ImageTab({ question, nodeId }: ImageTabProps) {
    const surveyActions = useSurveyActions();

    const handleChange = useCallback(
        (field: keyof Question, value: any) => {
            surveyActions.updateQuestionNode(nodeId, { [field]: value });
        },
        [nodeId, surveyActions]
    );

    return (
        <div className="space-y-5">
            {/* 이미지 URL */}
            <div className="space-y-2">
                <label
                    htmlFor="imageUrl"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                    이미지 URL
                </label>
                <Input
                    id="imageUrl"
                    value={question.imageUrl || ''}
                    onChange={(e) => handleChange('imageUrl', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    표시할 이미지의 절대 경로를 입력하세요.
                </p>
            </div>

            {/* 이미지 링크 */}
            <div className="space-y-2">
                <label
                    htmlFor="imageLink"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                    클릭 시 이동할 링크 (Optional)
                </label>
                <Input
                    id="imageLink"
                    value={question.imageLink || ''}
                    onChange={(e) => handleChange('imageLink', e.target.value)}
                    placeholder="https://example.com"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    이미지를 클릭했을 때 이동할 페이지 URL입니다.
                </p>
            </div>

            {/* 새 창에서 열기 */}
            <div className="flex items-center space-x-3">
                <Checkbox
                    id="openInNewTab"
                    checked={question.openInNewTab ?? true}
                    onCheckedChange={(checked) => handleChange('openInNewTab', checked)}
                />
                <label
                    htmlFor="openInNewTab"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                    새 브라우저 탭에서 링크 열기
                </label>
            </div>

            {/* 미리보기 (있는 경우) */}
            {question.imageUrl && (
                <div className="space-y-2 pt-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        미리보기
                    </label>
                    <div className="relative aspect-video rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-950">
                        <img
                            src={question.imageUrl}
                            alt="Preview"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=Invalid+Image+URL';
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
