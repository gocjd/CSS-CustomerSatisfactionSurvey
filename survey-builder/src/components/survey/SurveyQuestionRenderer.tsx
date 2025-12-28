import React from 'react';
import { Question } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Mic, Image as ImageIcon } from 'lucide-react';

interface SurveyQuestionRendererProps {
    question: Question;
    value: any;
    onChange: (value: any) => void;
}

export function SurveyQuestionRenderer({ question, value, onChange }: SurveyQuestionRendererProps) {

    // 1. Multiple Choice (Radio / Button List)
    if (question.questionType === 'multiple_choice') {
        return (
            <div className="space-y-2 flex flex-col">
                {question.options?.map((option) => (
                    <Button
                        key={option.value}
                        variant={value === option.value ? "default" : "outline"}
                        className={cn(
                            "justify-start h-auto py-3 px-4 text-left",
                            value === option.value ? "border-primary" : ""
                        )}
                        onClick={() => onChange(option.value)}
                    >
                        {option.label}
                    </Button>
                ))}
            </div>
        );
    }

    // 2. Text Opinion (Short or Long text)
    if (question.questionType === 'text_opinion') {
        // Check validation to decide if it's a textarea or input? 
        // For now default to Textarea for "opinion"
        return (
            <div className="space-y-2">
                <Textarea
                    placeholder={question.placeholder}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="min-h-[100px]"
                />
            </div>
        );
    }

    // 3. Voice Opinion (Audio Recorder Placeholder)
    if (question.questionType === 'voice_opinion') {
        return (
            <div className="space-y-4 border rounded-lg p-6 flex flex-col items-center justify-center bg-muted/20">
                <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-muted-foreground">
                    <Mic className="w-8 h-8" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                    {question.audio?.transcript || "Record your response"}
                </p>
                <Button variant="outline" className="gap-2">
                    Start Recording
                </Button>
            </div>
        );
    }

    // 4. Image Item (Display Only)
    if (question.questionType === 'image_item') {
        return (
            <div className="space-y-4 flex flex-col items-center">
                {question.imageUrl ? (
                    <img
                        src={question.imageUrl}
                        alt="Survey item"
                        className="rounded-lg max-h-[300px] object-cover"
                    />
                ) : (
                    <div className="w-full h-[200px] bg-muted flex items-center justify-center rounded-lg">
                        <ImageIcon className="w-10 h-10 text-muted-foreground" />
                    </div>
                )}
                {question.prompt && <p className="text-sm text-center text-muted-foreground">{question.prompt}</p>}
            </div>
        );
    }

    return <div>Unknown question type: {question.questionType}</div>;
}
