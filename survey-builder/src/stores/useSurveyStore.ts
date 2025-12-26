// stores/useSurveyStore.ts - 메인 설문 상태 관리

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import type {
  Survey,
  Question,
  Section,
  QuestionNode,
  SurveyEdge,
  SurveyNode,
  GraphError,
} from '@/types';
import {
  DEFAULT_SURVEY,
  QUESTION_TEMPLATES,
  createQuestionNode,
  createStartNode,
  createEndNode,
  createEdge,
} from '@/types';
import type { XYPosition } from '@xyflow/react';
import { useHistoryStore } from './useHistoryStore';

interface SurveyState {
  // 설문 메타데이터
  survey: Omit<Survey, 'questions' | 'sections'> | null;
  sections: Section[];
  isDirty: boolean;
  fileName: string;
  questionCounter: number;

  // 그래프 상태
  nodes: SurveyNode[];
  edges: SurveyEdge[];

  // 선택 상태
  selectedNodeId: string | null;

  // 검증 상태
  validationErrors: GraphError[];
  isValid: boolean;
}

interface SurveyActions {
  // 설문 관리
  initSurvey: (survey: Survey) => void;
  createNewSurvey: () => void;
  updateSurveyMeta: (meta: Partial<Omit<Survey, 'questions' | 'sections'>>) => void;
  setFileName: (name: string) => void;
  setDirty: (dirty: boolean) => void;

  // 노드 관리
  addQuestionNode: (
    questionType: Question['questionType'],
    position: XYPosition
  ) => string;
  updateQuestionNode: (nodeId: string, data: Partial<Question>) => void;
  deleteNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  updateNodePosition: (nodeId: string, position: XYPosition) => void;
  setNodes: (nodes: SurveyNode[]) => void;

  // 엣지 관리
  addEdge: (
    source: string,
    target: string,
    sourceHandle?: string,
    targetHandle?: string,
    condition?: string
  ) => void;
  deleteEdge: (edgeId: string) => void;
  setEdges: (edges: SurveyEdge[]) => void;

  // 섹션 관리
  addSection: (section: Section) => void;
  updateSection: (sectionId: string, data: Partial<Section>) => void;
  deleteSection: (sectionId: string) => void;

  // 검증
  validateGraph: () => GraphError[];
  setValidationErrors: (errors: GraphError[]) => void;
  clearErrors: () => void;

  // 변환
  getSelectedQuestion: () => Question | null;
  exportToSurvey: () => Survey;
  reset: () => void;
}

type SurveyStore = SurveyState & { actions: SurveyActions };

const initialState: SurveyState = {
  survey: null,
  sections: [],
  isDirty: false,
  fileName: 'untitled',
  questionCounter: 0,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  validationErrors: [],
  isValid: true,
};

// ID 생성 헬퍼
function generateSectionId(): string {
  return `SEC${Date.now()}`;
}

export const useSurveyStore = create<SurveyStore>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      actions: {
        // 설문 초기화 (불러오기)
        initSurvey: (survey: Survey) => {
          const maxQuestionNum = survey.questions.reduce((max, q) => {
            const num = parseInt(q.questionId.replace('Q', ''), 10);
            return isNaN(num) ? max : Math.max(max, num);
          }, 0);

          set((state) => {
            state.questionCounter = maxQuestionNum;
            state.survey = {
              surveyId: survey.surveyId,
              version: survey.version,
              title: survey.title,
              description: survey.description,
              language: survey.language,
              supportedLanguages: survey.supportedLanguages,
              creator: survey.creator,
              schedule: survey.schedule,
              settings: survey.settings,
            };
            state.sections = survey.sections;
            state.isDirty = false;
            state.fileName = survey.title || 'untitled';

            // 1. 레이아웃 데이터가 있는 경우 (저장된 상태 그대로 복원)
            if (survey.layout) {
              state.nodes = survey.layout.nodes.map((n) => {
                if (n.type === 'start') return createStartNode(n.position);
                if (n.type === 'end') return createEndNode(n.position);
                const question = survey.questions.find((q) => q.questionId === n.id);
                if (!question) {
                  console.error(`Question not found for node ${n.id}`);
                  return null;
                }
                return createQuestionNode(question, n.position);
              }).filter(Boolean) as SurveyNode[];

              state.edges = survey.layout.edges.map((e) => ({
                ...e,
                type: 'deletable',
              }));
            } else {
              // 2. 레이아웃 데이터가 없는 경우 (계단식 자동 배치)
              const startX = 100;
              const startY = 100;
              const stepX = 350;
              const stepY = 150;

              const questionNodes: SurveyNode[] = survey.questions.map((q, index) =>
                createQuestionNode(q, {
                  x: startX + stepX + index * stepX,
                  y: startY + (index + 1) * stepY,
                })
              );

              state.nodes = [
                createStartNode({ x: startX, y: startY }),
                ...questionNodes,
                createEndNode({
                  x: startX + (survey.questions.length + 1) * stepX,
                  y: startY + (survey.questions.length + 2) * stepY,
                }),
              ];

              // 엣지 생성
              const edges: SurveyEdge[] = [];
              if (survey.questions.length > 0) {
                edges.push(createEdge('start', survey.questions[0].questionId));
              }

              survey.questions.forEach((question) => {
                const { nextQuestion } = question;
                if (nextQuestion === null) {
                  edges.push(createEdge(question.questionId, 'end'));
                } else if (typeof nextQuestion === 'string') {
                  const target = nextQuestion === 'end' ? 'end' : nextQuestion;
                  edges.push(createEdge(question.questionId, target));
                } else if (typeof nextQuestion === 'object') {
                  Object.entries(nextQuestion).forEach(([optionValue, targetId]) => {
                    const target = targetId === 'end' ? 'end' : targetId;
                    edges.push(
                      createEdge(
                        question.questionId,
                        target,
                        `output-${optionValue}`,
                        'input',
                        optionValue
                      )
                    );
                  });
                }
              });
              state.edges = edges;
            }

            state.selectedNodeId = null;
            state.validationErrors = [];
            state.isValid = true;
          });
        },

        // 새 설문 생성
        createNewSurvey: () => {
          const surveyId = `CS${Date.now().toString().slice(-7)}`;

          set((state) => {
            state.questionCounter = 0;
            state.survey = {
              ...DEFAULT_SURVEY,
              surveyId,
            };
            state.sections = [
              {
                sectionId: 'SEC1',
                title: '섹션 1',
                description: '',
                questionIds: [],
                required: true,
              },
            ];
            state.isDirty = false;
            state.fileName = 'untitled';
            state.nodes = [
              createStartNode({ x: 50, y: 200 }),
              createEndNode({ x: 400, y: 200 }),
            ];
            state.edges = [];
            state.selectedNodeId = null;
            state.validationErrors = [];
            state.isValid = true;
          });
        },

        // 설문 메타데이터 업데이트
        updateSurveyMeta: (meta) => {
          set((state) => {
            if (state.survey) {
              Object.assign(state.survey, meta);
              state.isDirty = true;
            }
          });
        },

        setFileName: (name) => {
          set((state) => {
            state.fileName = name;
          });
        },

        setDirty: (dirty) => {
          set((state) => {
            state.isDirty = dirty;
          });
        },

        addQuestionNode: (questionType, position) => {
          const template = QUESTION_TEMPLATES[questionType];
          const firstSection = get().sections[0];
          const sectionId = firstSection?.sectionId || 'SEC1';
          let newQuestionId = '';

          set((state) => {
            state.questionCounter += 1;
            newQuestionId = `Q${state.questionCounter}`;

            const question: Question = {
              ...template,
              questionId: newQuestionId,
              title: `${template.questionType === 'multiple_choice'
                ? '객관식'
                : template.questionType === 'text_opinion'
                  ? '텍스트'
                  : template.questionType === 'voice_opinion'
                    ? '음성'
                    : '이미지'
                } 질문`,
              sectionId,
              nextQuestion: null,
            } as Question;

            const node = createQuestionNode(question, position);
            state.nodes.push(node);
            state.isDirty = true;

            const sIndex = state.sections.findIndex((s) => s.sectionId === sectionId);
            if (sIndex >= 0) {
              state.sections[sIndex].questionIds.push(newQuestionId);
            }
          });

          // 히스토리 저장
          const updatedState = get();
          useHistoryStore.getState().actions.saveState(updatedState.nodes, updatedState.edges);

          return newQuestionId;
        },

        // 질문 노드 업데이트
        updateQuestionNode: (nodeId, data) => {
          set((state) => {
            const nodeIndex = state.nodes.findIndex((n) => n.id === nodeId);
            if (nodeIndex >= 0 && state.nodes[nodeIndex].type === 'question') {
              const node = state.nodes[nodeIndex] as QuestionNode;
              Object.assign(node.data.question, data);
              state.isDirty = true;
            }
          });

          // 히스토리 저장
          const updatedState = get();
          useHistoryStore.getState().actions.saveState(updatedState.nodes, updatedState.edges);
        },

        // 노드 삭제
        deleteNode: (nodeId) => {
          set((state) => {
            // start/end 노드는 삭제 불가
            if (nodeId === 'start' || nodeId === 'end') return;

            const nodeIndex = state.nodes.findIndex((n) => n.id === nodeId);
            if (nodeIndex >= 0) {
              const node = state.nodes[nodeIndex];

              // 섹션에서 질문 ID 제거
              if (node.type === 'question') {
                const questionNode = node as QuestionNode;
                state.sections.forEach((section) => {
                  const qIndex = section.questionIds.indexOf(
                    questionNode.data.question.questionId
                  );
                  if (qIndex >= 0) {
                    section.questionIds.splice(qIndex, 1);
                  }
                });
              }

              state.nodes.splice(nodeIndex, 1);

              // 관련 엣지 삭제
              state.edges = state.edges.filter(
                (e) => e.source !== nodeId && e.target !== nodeId
              );

              // 선택 해제
              if (state.selectedNodeId === nodeId) {
                state.selectedNodeId = null;
              }

              state.isDirty = true;
            }
          });

          // 히스토리 저장
          const updatedState = get();
          useHistoryStore.getState().actions.saveState(updatedState.nodes, updatedState.edges);
        },

        // 노드 선택
        selectNode: (nodeId) => {
          set((state) => {
            state.selectedNodeId = nodeId;

            // 모든 노드의 isSelected 업데이트
            state.nodes.forEach((node) => {
              if (node.type === 'question') {
                (node as QuestionNode).data.isSelected = node.id === nodeId;
              }
            });
          });
        },

        // 노드 위치 업데이트
        updateNodePosition: (nodeId, position) => {
          set((state) => {
            const node = state.nodes.find((n) => n.id === nodeId);
            if (node) {
              node.position = position;
            }
          });
        },

        setNodes: (nodes) => {
          set((state) => {
            state.nodes = nodes;
          });
        },

        // 엣지 추가
        addEdge: (source, target, sourceHandle, targetHandle, condition) => {
          const edge = createEdge(
            source,
            target,
            sourceHandle || 'output-default',
            targetHandle || 'input',
            condition
          );

          set((state) => {
            // 중복 엣지 체크
            const exists = state.edges.some(
              (e) =>
                e.source === source &&
                e.target === target &&
                e.sourceHandle === edge.sourceHandle
            );

            if (!exists) {
              state.edges.push(edge);
              state.isDirty = true;
            }
          });

          // 히스토리 저장
          const updatedState = get();
          useHistoryStore.getState().actions.saveState(updatedState.nodes, updatedState.edges);
        },

        // 엣지 삭제
        deleteEdge: (edgeId) => {
          set((state) => {
            const index = state.edges.findIndex((e) => e.id === edgeId);
            if (index >= 0) {
              state.edges.splice(index, 1);
              state.isDirty = true;
            }
          });

          // 히스토리 저장
          const updatedState = get();
          useHistoryStore.getState().actions.saveState(updatedState.nodes, updatedState.edges);
        },

        setEdges: (edges) => {
          set((state) => {
            state.edges = edges;
          });
        },

        // 섹션 추가
        addSection: (section) => {
          set((state) => {
            state.sections.push(section);
            state.isDirty = true;
          });
        },

        // 섹션 업데이트
        updateSection: (sectionId, data) => {
          set((state) => {
            const index = state.sections.findIndex((s) => s.sectionId === sectionId);
            if (index >= 0) {
              Object.assign(state.sections[index], data);
              state.isDirty = true;
            }
          });
        },

        // 섹션 삭제
        deleteSection: (sectionId) => {
          set((state) => {
            const index = state.sections.findIndex((s) => s.sectionId === sectionId);
            if (index >= 0) {
              state.sections.splice(index, 1);
              state.isDirty = true;
            }
          });
        },

        // 검증
        validateGraph: () => {
          const { nodes, edges } = get();
          const errors: GraphError[] = [];

          // 1. 모든 질문 노드 체크
          nodes.forEach((node) => {
            if (node.type !== 'question') return;
            const questionNode = node as QuestionNode;
            const { questionId, questionType, options } = questionNode.data.question;

            // 출력 엣지 합계
            const outgoingEdges = edges.filter((e) => e.source === node.id);

            // 음성/텍스트/이미지 질문: 무조건 하나의 출력이 있어야 함 (default)
            if (
              questionType === 'voice_opinion' ||
              questionType === 'text_opinion' ||
              questionType === 'image_item'
            ) {
              if (outgoingEdges.length === 0) {
                errors.push({
                  nodeId: node.id,
                  message: '다음 질문으로의 연결이 필요합니다.',
                  type: 'missing_connection',
                });
              }
            }

            // 객관식 질문: nextQuestion이 객체인 경우에만 모든 옵션 연결 검사
            if (questionType === 'multiple_choice' && options) {
              const question = questionNode.data.question;
              // nextQuestion이 객체(분기)인 경우에만 검사
              if (typeof question.nextQuestion === 'object' && question.nextQuestion !== null) {
                const connectedOptions = new Set(
                  outgoingEdges
                    .map((e) => e.data?.condition || e.sourceHandle?.replace('output-', ''))
                    .filter(Boolean)
                );

                options.forEach((opt) => {
                  if (!connectedOptions.has(opt.value)) {
                    errors.push({
                      nodeId: node.id,
                      message: `옵션 '${opt.label}'에 대한 연결이 누락되었습니다.`,
                      type: 'missing_connection',
                    });
                  }
                });
              }
              // nextQuestion이 문자열(단일 경로)이거나 null인 경우는 하나의 출력만 있으면 충분
              else if (outgoingEdges.length === 0) {
                errors.push({
                  nodeId: node.id,
                  message: '다음 질문으로의 연결이 필요합니다.',
                  type: 'missing_connection',
                });
              }
            }
          });

          // 2. 시작 노드에서 도달 가능한지 체크 (Unreachable nodes)
          const reachable = new Set<string>(['start']);
          const queue = ['start'];
          while (queue.length > 0) {
            const curr = queue.shift()!;
            edges
              .filter((e) => e.source === curr)
              .forEach((e) => {
                if (!reachable.has(e.target)) {
                  reachable.add(e.target);
                  queue.push(e.target);
                }
              });
          }

          nodes.forEach((node) => {
            if (!reachable.has(node.id)) {
              errors.push({
                nodeId: node.id,
                message: '시작 지점에서 도달할 수 없는 노드입니다.',
                type: 'orphan',
              });
            }
          });

          // 3. 시작에서 종료까지 도달 가능한지 체크 (Path Existence)
          if (!reachable.has('end')) {
            errors.push({
              nodeId: 'start',
              message: '설문이 종료 노드에 도달할 수 없습니다. 모든 경로를 연결해주세요.',
              type: 'invalid_path',
            });
          }

          // store에 에러 설정
          get().actions.setValidationErrors(errors);
          return errors;
        },

        // 검증 에러 설정
        setValidationErrors: (errors) => {
          set((state) => {
            state.validationErrors = errors;
            state.isValid = errors.length === 0;

            // 노드에 에러 상태 반영
            state.nodes.forEach((node) => {
              if (node.type === 'question') {
                const questionNode = node as QuestionNode;
                const nodeErrors = errors.filter((e) => e.nodeId === node.id);
                questionNode.data.hasError = nodeErrors.length > 0;
                questionNode.data.errorMessages = nodeErrors.map((e) => e.message);
              }
            });
          });
        },

        clearErrors: () => {
          set((state) => {
            state.validationErrors = [];
            state.isValid = true;

            state.nodes.forEach((node) => {
              if (node.type === 'question') {
                const questionNode = node as QuestionNode;
                questionNode.data.hasError = false;
                questionNode.data.errorMessages = [];
              }
            });
          });
        },

        // 선택된 질문 가져오기
        getSelectedQuestion: () => {
          const { selectedNodeId, nodes } = get();
          if (!selectedNodeId) return null;

          const node = nodes.find((n) => n.id === selectedNodeId);
          if (node?.type === 'question') {
            return (node as QuestionNode).data.question;
          }
          return null;
        },

        // Survey 객체로 내보내기
        exportToSurvey: () => {
          const { survey, sections, nodes, edges } = get();

          // 질문 노드에서 Question 배열 추출
          const questions: Question[] = nodes
            .filter((n): n is QuestionNode => n.type === 'question')
            .map((node) => {
              const question = { ...node.data.question };

              // 엣지에서 nextQuestion 재구성
              const outgoingEdges = edges.filter((e) => e.source === node.id);

              if (outgoingEdges.length === 0) {
                question.nextQuestion = null;
              } else if (outgoingEdges.length === 1 && !outgoingEdges[0].data?.condition) {
                const target = outgoingEdges[0].target;
                question.nextQuestion = target === 'end' ? null : target;
              } else {
                const branchMap: Record<string, string> = {};
                outgoingEdges.forEach((edge) => {
                  const condition =
                    edge.data?.condition ||
                    edge.sourceHandle?.replace('output-', '');
                  if (condition && edge.target !== 'end') {
                    branchMap[condition] = edge.target;
                  }
                });
                question.nextQuestion =
                  Object.keys(branchMap).length > 0 ? branchMap : null;
              }

              return question;
            });

          return {
            ...survey!,
            sections,
            questions,
            layout: {
              nodes: nodes.map((n) => ({
                id: n.id,
                type: n.type,
                position: n.position,
              })),
              edges: edges.map((e) => ({
                id: e.id,
                source: e.source,
                target: e.target,
                sourceHandle: e.sourceHandle,
                targetHandle: e.targetHandle,
                type: e.type,
                data: e.data,
              })),
            },
          } as Survey;
        },

        // 리셋
        reset: () => {
          set(initialState);
        },
      },
    })),
    {
      name: 'survey-builder-storage',
      partialize: (state) => ({
        survey: state.survey,
        sections: state.sections,
        nodes: state.nodes,
        edges: state.edges,
        fileName: state.fileName,
        questionCounter: state.questionCounter,
      }),
    }
  )
);

// 액션 셀렉터
export const useSurveyActions = () => useSurveyStore((state) => state.actions);
