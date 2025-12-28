'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { QuestionOption } from '@/types';

interface SortableOptionItemProps {
    id: string;
    option: QuestionOption;
    index: number;
    onUpdate: (index: number, field: keyof QuestionOption, value: string | number) => void;
    onRemove: (index: number) => void;
    isRemovable: boolean;
    showScore?: boolean;
}

export function SortableOptionItem({
    id,
    option,
    index,
    onUpdate,
    onRemove,
    isRemovable,
    showScore = false,
}: SortableOptionItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'flex items-start gap-3 p-3',
                'bg-gray-50 dark:bg-gray-800 rounded-lg',
                'border border-gray-200 dark:border-gray-700',
                'group transition-colors',
                isDragging && 'opacity-50 ring-2 ring-blue-500 border-transparent shadow-lg'
            )}
            data-testid={`option-item-${index}`}
        >
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
                <GripVertical className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
            </div>

            <div className="flex-1 space-y-2">
                {/* 1줄: Label */}
                <Input
                    value={option.label}
                    onChange={(e) => onUpdate(index, 'label', e.target.value)}
                    placeholder="레이블"
                    className="h-9 text-base focus-visible:ring-1"
                />

                {/* 2줄: Score + Value */}
                <div className="flex gap-2">
                    {showScore && (
                        <div className="flex items-center gap-2 w-28">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Score:</span>
                            <Input
                                type="number"
                                value={option.score}
                                onChange={(e) => onUpdate(index, 'score', parseInt(e.target.value) || 0)}
                                placeholder="점수"
                                className="h-9 text-base text-center focus-visible:ring-1 w-16"
                                min={0}
                                max={999}
                            />
                        </div>
                    )}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Value:</span>
                        <Input
                            value={option.value}
                            onChange={(e) => onUpdate(index, 'value', e.target.value)}
                            placeholder="값"
                            className="h-9 text-base focus-visible:ring-1 flex-1"
                        />
                    </div>
                </div>
            </div>

            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    'h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20',
                    'opacity-0 group-hover:opacity-100 transition-opacity',
                    !isRemovable && 'invisible'
                )}
                onClick={() => onRemove(index)}
                disabled={!isRemovable}
                title="삭제"
            >
                <Trash2 className="w-4 h-4" />
            </Button>
        </div>
    );
}
