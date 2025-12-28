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
import { LAYOUT_CONSTANTS } from '@/lib/transform/autoLayout';
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
  insertQuestionBetweenEdge: (
    edgeId: string,
    sourceNodeId: string,
    targetNodeId: string,
    questionType: Question['questionType']
  ) => string;

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
              // 2. 레이아웃 데이터가 없는 경우 (수평 자동 배치)
              const startX = 100;
              const startY = 100;
              // autoLayout의 상수와 일관성 있게 사용
              const stepX = LAYOUT_CONSTANTS.NODE_WIDTH + LAYOUT_CONSTANTS.HORIZONTAL_SPACING; // 280 + 200 = 480

              // 모든 질문 노드를 같은 Y 높이에 배치 (X축만 증가)
              const questionNodes: SurveyNode[] = survey.questions.map((q, index) =>
                createQuestionNode(q, {
                  x: startX + stepX + index * stepX,
                  y: startY,  // 모든 노드가 같은 높이
                })
              );

              state.nodes = [
                createStartNode({ x: startX, y: startY }),
                ...questionNodes,
                createEndNode({
                  x: startX + (survey.questions.length + 1) * stepX,
                  y: startY,  // End 노드도 같은 높이
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
            // 시작-종료 노드를 자동으로 연결
            state.edges = [createEdge('start', 'end')];
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

          // 히스토리 저장 및 유효성 검증
          const updatedState = get();
          useHistoryStore.getState().actions.saveState(updatedState.nodes, updatedState.edges);
          get().actions.validateGraph();

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

          // 히스토리 저장 및 유효성 검증
          const updatedState = get();
          useHistoryStore.getState().actions.saveState(updatedState.nodes, updatedState.edges);
          get().actions.validateGraph();
        },

        // 노드 삭제
        deleteNode: (nodeId) => {
          // start/end 노드는 삭제 불가 - 함수 전체에서 빠져나옴
          if (nodeId === 'start' || nodeId === 'end') return;

          set((state) => {
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

          // 히스토리 저장 및 유효성 검증
          const updatedState = get();
          useHistoryStore.getState().actions.saveState(updatedState.nodes, updatedState.edges);
          get().actions.validateGraph();
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
            // NaN 위치가 저장되지 않도록 방지
            state.nodes = nodes.map(node => ({
              ...node,
              position: {
                x: isNaN(node.position.x) ? 0 : node.position.x,
                y: isNaN(node.position.y) ? 0 : node.position.y,
              }
            }));
          });
        },

        // 엣지 사이에 질문 노드 추가
        insertQuestionBetweenEdge: (edgeId, sourceNodeId, targetNodeId, questionType) => {
          const template = QUESTION_TEMPLATES[questionType];
          const firstSection = get().sections[0];
          const sectionId = firstSection?.sectionId || 'SEC1';
          let newQuestionId = '';

          set((state) => {
            // 새 질문 노드 생성
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

            // source와 target 노드 찾기
            const sourceNode = state.nodes.find((n) => n.id === sourceNodeId);
            const targetNode = state.nodes.find((n) => n.id === targetNodeId);

            if (!sourceNode || !targetNode) return;

            // 새 노드의 위치 계산: source에서 400px 오른쪽 (자동 정렬 일관성 유지)
            const newPosition: XYPosition = {
              x: sourceNode.position.x + 400,
              y: sourceNode.position.y,  // 모든 노드가 같은 높이
            };

            const newNode = createQuestionNode(question, newPosition);
            state.nodes.push(newNode);
            state.isDirty = true;

            // 섹션에 질문 추가
            const sIndex = state.sections.findIndex((s) => s.sectionId === sectionId);
            if (sIndex >= 0) {
              state.sections[sIndex].questionIds.push(newQuestionId);
            }

            // 기존 엣지 삭제
            const edgeIndex = state.edges.findIndex((e) => e.id === edgeId);
            if (edgeIndex >= 0) {
              state.edges.splice(edgeIndex, 1);
            }

            // 새로운 엣지 2개 생성
            const edge1 = createEdge(sourceNodeId, newQuestionId);
            const edge2 = createEdge(newQuestionId, targetNodeId);
            state.edges.push(edge1, edge2);

            // target 이후의 모든 downstream 노드를 400px씩 오른쪽으로 이동
            const getDownstreamNodes = (startNodeId: string): Set<string> => {
              const downstream = new Set<string>();
              const queue = [startNodeId];

              while (queue.length > 0) {
                const nodeId = queue.shift()!;
                if (downstream.has(nodeId)) continue;
                downstream.add(nodeId);

                // 이 노드를 source로 하는 모든 edge 찾기
                const outgoingEdges = state.edges.filter((e) => e.source === nodeId);
                outgoingEdges.forEach((edge) => {
                  if (!downstream.has(edge.target)) {
                    queue.push(edge.target);
                  }
                });
              }

              return downstream;
            };

            // target 이후의 모든 노드 ID 구하기 (targetNode 포함)
            const downstreamNodeIds = getDownstreamNodes(targetNodeId);

            // 모든 downstream 노드를 400px씩 이동 (균일한 간격 유지)
            state.nodes.forEach((node) => {
              if (downstreamNodeIds.has(node.id) && node.id !== newQuestionId) {
                node.position.x += 400;
                // Y 좌표는 변경하지 않음 (모든 노드가 같은 높이 유지)
              }
            });
          });

          // 히스토리 저장 및 유효성 검증
          const updatedState = get();
          useHistoryStore.getState().actions.saveState(updatedState.nodes, updatedState.edges);
          get().actions.validateGraph();

          return newQuestionId;
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

          // 히스토리 저장 및 유효성 검증
          const updatedState = get();
          useHistoryStore.getState().actions.saveState(updatedState.nodes, updatedState.edges);
          get().actions.validateGraph();
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

          // 히스토리 저장 및 유효성 검증
          const updatedState = get();
          useHistoryStore.getState().actions.saveState(updatedState.nodes, updatedState.edges);
          get().actions.validateGraph();
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

          // 1. Start -> Node 도달 가능성 계산 (Forward Reachability)
          const forwardReachable = new Set<string>(['start']);
          const forwardQueue = ['start'];
          while (forwardQueue.length > 0) {
            const curr = forwardQueue.shift()!;
            edges
              .filter((e) => e.source === curr)
              .forEach((e) => {
                if (!forwardReachable.has(e.target)) {
                  forwardReachable.add(e.target);
                  forwardQueue.push(e.target);
                }
              });
          }

          // 2. Node -> End 도달 가능성 계산 (Backward Reachability)
          // 역방향 그래프 탐색을 위해 Reverse Edges 맵 생성
          const reverseEdges = new Map<string, string[]>();
          edges.forEach((e) => {
            if (!reverseEdges.has(e.target)) reverseEdges.set(e.target, []);
            reverseEdges.get(e.target)!.push(e.source);
          });

          const backwardReachable = new Set<string>(['end']);
          const backwardQueue = ['end'];
          while (backwardQueue.length > 0) {
            const curr = backwardQueue.shift()!;
            const sources = reverseEdges.get(curr) || [];
            sources.forEach((source) => {
              if (!backwardReachable.has(source)) {
                backwardReachable.add(source);
                backwardQueue.push(source);
              }
            });
          }

          // 3. 노드별 검증
          nodes.forEach((node) => {
            // [검증 1] 시작점에서 도달 불가능한 노드 (Orphan) - Start/End 제외
            if (node.id !== 'start' && node.id !== 'end' && !forwardReachable.has(node.id)) {
              errors.push({
                nodeId: node.id,
                message: '시작 지점에서 도달할 수 없는 노드입니다. (연결 끊김)',
                type: 'orphan',
              });
              // Orphan 노드는 추가 검증(연결 누락 등)을 생략하여 노이즈를 줄임
              return;
            }

            // [검증 2] 고아(Orphan) 상태가 아니지만 여전히 종료에 도달하지 못하는 경우
            if (node.id !== 'end' && forwardReachable.has(node.id)) {
              if (!backwardReachable.has(node.id)) {
                // 노드 자체가 경로상 고립된 경우 (세부 에러는 검증 3에서 처리)
              }
            }

            // [검증 3] 질문 노드 연결 누락 및 분기 무결성 (Missing Connection & Branch Integrity)
            if (node.type === 'question') {
              const questionNode = node as QuestionNode;
              const { questionType, options, nextQuestion } = questionNode.data.question;
              const outgoingEdges = edges.filter((e) => e.source === node.id);

              // 3-1. 공통: 최소 하나의 연결은 필수
              if (outgoingEdges.length === 0) {
                errors.push({
                  nodeId: node.id,
                  message: '다음 단계로 연결되지 않았습니다.',
                  type: 'missing_connection',
                });
                return;
              }

              // 3-2. 분기 유형별 정밀 검증
              const isMultiBranch = typeof nextQuestion === 'object' && nextQuestion !== null;

              if (isMultiBranch && questionType === 'multiple_choice' && options) {
                // 조건부 분기 설정(nextQuestion이 객체)인 경우: 모든 옵션 전수 조사
                const connectedOptionsMap = new Map<string, string>(); // OptionValue -> TargetId
                outgoingEdges.forEach(e => {
                  const condition = e.data?.condition || e.sourceHandle?.replace('output-', '');
                  if (condition) connectedOptionsMap.set(condition, e.target);
                });

                options.forEach((opt) => {
                  const targetId = connectedOptionsMap.get(opt.value);
                  if (!targetId) {
                    // 미연결 옵션 존재
                    errors.push({
                      nodeId: node.id,
                      message: `옵션 '${opt.label}'의 연결이 누락되었습니다.`,
                      type: 'missing_connection',
                    });
                  } else if (!backwardReachable.has(targetId)) {
                    // 연결은 되었으나 종료에 도달하지 못하는 경로
                    errors.push({
                      nodeId: node.id,
                      message: `옵션 '${opt.label}'에서 시작되는 경로가 최종적으로 종료(End)에 도달하지 못합니다.`,
                      type: 'invalid_path',
                    });
                  }
                });
              } else {
                // 단일 분기인 경우
                const defaultEdge = outgoingEdges.find(e => e.sourceHandle === 'output-default' || !e.sourceHandle);
                if (!defaultEdge) {
                  errors.push({
                    nodeId: node.id,
                    message: '다음 단계로의 주 연결이 없습니다.',
                    type: 'missing_connection',
                  });
                } else if (!backwardReachable.has(defaultEdge.target)) {
                  errors.push({
                    nodeId: node.id,
                    message: '다음 단계로 연결되었으나 최종적으로 종료(End)에 도달할 수 없는 경로입니다.',
                    type: 'invalid_path',
                  });
                }
              }
            }
          });

          // [검증 4] Start 노드 연결 및 경로 확인
          const startOutgoing = edges.filter(e => e.source === 'start');
          if (startOutgoing.length === 0) {
            errors.push({
              nodeId: 'start',
              message: '시작 노드가 연결되지 않았습니다.',
              type: 'missing_connection',
            });
          } else {
            // 시작 노드에서 나가는 모든 경로가 종료에 도달하는지 확인
            const deadPaths = startOutgoing.filter(e => !backwardReachable.has(e.target));
            if (deadPaths.length > 0) {
              errors.push({
                nodeId: 'start',
                message: '시작 노드에서 종료 지점으로 도달할 수 없는 경로가 존재합니다.',
                type: 'invalid_path',
              });
            }
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

            // 노드에 에러 상태 반영 (완전한 새로운 객체 생성을 통해 리렌더링 보장)
            state.nodes = state.nodes.map((node) => {
              const nodeErrors = errors.filter((e) => e.nodeId === node.id);
              const hasError = nodeErrors.length > 0;
              const errorMessages = nodeErrors.map((e) => e.message);

              // 데이터가 변경된 경우에만 새로운 객체 생성
              if (node.data.hasError !== hasError ||
                JSON.stringify(node.data.errorMessages) !== JSON.stringify(errorMessages)) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    hasError,
                    errorMessages,
                  } as any, // 각 노드 타입별 데이터 구조를 유지하며 에러 필드만 주입
                } as any;
              }
              return node;
            }) as any;
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
