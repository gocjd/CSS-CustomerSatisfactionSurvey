"use client";

import React, { useState, useEffect } from 'react';
import surveyDataRaw from '@/data/sample-survey.json';
import { Survey } from '@/types';
import { useSurveyRunnerStore } from '@/stores/useSurveyRunnerStore';
import { SurveyQuestionRenderer } from '@/components/survey/SurveyQuestionRenderer';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';

const surveyData = surveyDataRaw as unknown as Survey;

export default function Type4Page() {
    const [isOpen, setIsOpen] = useState(false);
    const {
        survey,
        currentQuestionId,
        answers,
        setAnswer,
        initSurvey,
        next,
        isCompleted,
        errors
    } = useSurveyRunnerStore();

    const handleOpen = () => {
        initSurvey(surveyData);
        setIsOpen(true);
    };

    const handleNext = () => {
        next();
    };

    if (!survey && isOpen) return null; // Or loader

    const currentQ = survey?.questions.find(q => q.questionId === currentQuestionId);

    // Approximate progress
    const totalQ = survey?.questions.length || 1;
    const currentIdx = survey?.questions.findIndex(q => q.questionId === currentQuestionId) || 0;
    const progress = ((currentIdx + 1) / totalQ) * 100;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">

            <div className="text-center max-w-lg space-y-4">
                <h1 className="text-3xl font-bold">Contextual Survey Demo</h1>
                <p className="text-muted-foreground">
                    Click the button below to trigger the bottom sheet survey.
                    This is useful for gathering feedback without navigating away.
                </p>

                <div className="flex gap-4 justify-center">
                    <Link href="/surveys">
                        <Button variant="outline">Back to Demos</Button>
                    </Link>
                    <Button onClick={handleOpen} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                        Give Feedback
                    </Button>
                </div>
            </div>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent side="bottom" className="h-[60vh] sm:h-[500px] flex flex-col rounded-t-xl">
                    {isCompleted ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <Check className="w-8 h-8 text-green-600" />
                            </div>
                            <SheetTitle>Thank You!</SheetTitle>
                            <SheetDescription>
                                We appreciate your feedback.
                            </SheetDescription>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
                        </div>
                    ) : (
                        currentQ ? (
                            <>
                                <SheetHeader className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <SheetTitle className="text-left">{survey?.title}</SheetTitle>
                                        <span className="text-xs text-muted-foreground">{currentIdx + 1}/{totalQ}</span>
                                    </div>
                                    <Progress value={progress} className="h-1" />
                                </SheetHeader>

                                <div className="flex-1 overflow-y-auto py-2">
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-medium">{currentQ.prompt}</h3>
                                        {currentQ.required && <span className="text-xs text-red-500 font-bold">REQUIRED</span>}

                                        <SurveyQuestionRenderer
                                            question={currentQ}
                                            value={answers[currentQ.questionId]}
                                            onChange={(val) => setAnswer(currentQ.questionId, val)}
                                        />

                                        {errors[currentQ.questionId] && (
                                            <p className="text-sm text-red-500">{errors[currentQ.questionId]}</p>
                                        )}
                                    </div>
                                </div>

                                <SheetFooter className="mt-4 border-t pt-4">
                                    <Button
                                        onClick={handleNext}
                                        className="w-full"
                                    >
                                        Next
                                        <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </SheetFooter>
                            </>
                        ) : (
                            <div className="p-4">Loading question...</div>
                        )
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
