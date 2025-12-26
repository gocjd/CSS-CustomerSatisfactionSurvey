// components/builder/nodes/nodeTypes.ts - 노드 타입 등록

import type { NodeTypes } from '@xyflow/react';
import { QuestionNode } from './QuestionNode';
import { StartNode } from './StartNode';
import { EndNode } from './EndNode';

export const nodeTypes: NodeTypes = {
  question: QuestionNode,
  start: StartNode,
  end: EndNode,
};

export { QuestionNode, StartNode, EndNode };
