'use client';

// components/builder/property/PropertyPanel.tsx - 속성 편집 패널

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUIStore, useUIActions } from '@/stores';
import { useSurveyStore } from '@/stores';
import type { QuestionNode } from '@/types';
import { BasicInfoTab } from './tabs/BasicInfoTab';
import { OptionsTab } from './tabs/OptionsTab';
import { ValidationTab } from './tabs/ValidationTab';
import { BranchingTab } from './tabs/BranchingTab';
import { ImageTab } from './tabs/ImageTab';

export function PropertyPanel() {
  const isPropertyPanelOpen = useUIStore((state) => state.isPropertyPanelOpen);
  const propertyPanelTab = useUIStore((state) => state.propertyPanelTab);
  const uiActions = useUIActions();

  const selectedNodeId = useSurveyStore((state) => state.selectedNodeId);
  const nodes = useSurveyStore((state) => state.nodes);

  // 선택된 노드 찾기
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const isQuestionNode = selectedNode?.type === 'question';
  const question = isQuestionNode
    ? (selectedNode as QuestionNode).data.question
    : null;

  if (!isPropertyPanelOpen || !question) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex flex-col h-full w-96',
        'bg-white dark:bg-gray-900',
        'border-l border-gray-200 dark:border-gray-800',
        'shadow-xl',
        'animate-in slide-in-from-right duration-200'
      )}
      data-testid="property-panel"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            속성 편집
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {question.questionId} - {question.title}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => uiActions.closePropertyPanel()}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* 탭 */}
      <Tabs
        value={propertyPanelTab}
        onValueChange={(v) => uiActions.setPropertyPanelTab(v as any)}
        className="flex-1 flex flex-col"
      >
        <TabsList className="w-full justify-start px-2 pt-2 bg-transparent gap-1">
          <TabsTrigger
            value="basic"
            className="text-xs px-3 py-1.5 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800"
          >
            기본 정보
          </TabsTrigger>
          <TabsTrigger
            value="branching"
            className="text-xs px-3 py-1.5 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800"
          >
            분기
          </TabsTrigger>
          {question.questionType === 'image_item' && (
            <TabsTrigger
              value="image"
              className="text-xs px-3 py-1.5 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800"
            >
              이미지
            </TabsTrigger>
          )}
          <TabsTrigger
            value="validation"
            className="text-xs px-3 py-1.5 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800"
            data-testid="tab-validation"
          >
            검증
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="basic" className="m-0 p-4">
            <BasicInfoTab question={question} nodeId={selectedNodeId!} />
          </TabsContent>
          <TabsContent value="branching" className="m-0 p-4">
            <BranchingTab question={question} nodeId={selectedNodeId!} />
          </TabsContent>
          {question.questionType === 'image_item' && (
            <TabsContent value="image" className="m-0 p-4">
              <ImageTab question={question} nodeId={selectedNodeId!} />
            </TabsContent>
          )}
          <TabsContent value="validation" className="m-0 p-4">
            <ValidationTab question={question} nodeId={selectedNodeId!} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
