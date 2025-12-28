"use client";

import React, { useEffect, useState } from 'react';
import surveyDataRaw from '@/data/sample-survey.json';
import { Survey } from '@/types';
import { useSurveyRunnerStore } from '@/stores/useSurveyRunnerStore';
import { SurveyQuestionRenderer } from '@/components/survey/SurveyQuestionRenderer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const surveyData = surveyDataRaw as unknown as Survey;

export default function Type2Page() {
    const {
        survey,
        currentQuestionId,
        answers,
        setAnswer,
        initSurvey,
        next,
        prev,
        history,
        isCompleted,
        errors
    } = useSurveyRunnerStore();

    const [direction, setDirection] = useState(0);

    useEffect(() => {
        initSurvey(surveyData);
    }, [initSurvey]);

    // Handle transitions
    const handleNext = () => {
        setDirection(1);
        next();
    };

    const handlePrev = () => {
        setDirection(-1);
        prev();
    };

    if (!survey) return <div className="p-8 text-center">Loading...</div>;

    if (isCompleted) {
        return (
            <div className="container mx-auto p-8 max-w-2xl flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="rounded-full bg-green-100 p-6"
                >
                    <Check className="w-12 h-12 text-green-600" />
                </motion.div>
                <h2 className="text-3xl font-bold">All done!</h2>
                <p className="text-lg text-muted-foreground">Thanks for taking the time to complete this survey.</p>
                <Link href="/surveys">
                    <Button variant="outline" size="lg">Back to Demos</Button>
                </Link>
            </div>
        );
    }

    const currentQ = survey.questions.find(q => q.questionId === currentQuestionId);
    if (!currentQ) return <div>Question not found</div>;

    // Simple progress estimation: current index in total list (not perfect for branching)
    const totalQ = survey.questions.length;
    const currentIdx = survey.questions.findIndex(q => q.questionId === currentQuestionId);
    const progress = ((currentIdx + 1) / totalQ) * 100;

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
            <div className="p-4 safe-area-inset-top mt-4">
                <div className="container mx-auto max-w-2xl flex items-center justify-between">
                    <Link href="/surveys" className="text-sm text-muted-foreground hover:text-foreground">
                        Close
                    </Link>
                    <div className="w-1/3">
                        <Progress value={progress} className="h-2" />
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                        {currentIdx + 1} / {totalQ}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentQuestionId}
                        custom={direction}
                        initial={{ x: direction > 0 ? 50 : -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: direction > 0 ? -50 : 50, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="w-full max-w-xl"
                    >
                        <Card className="border-none shadow-xl">
                            <CardHeader className="text-center pt-8 pb-2">
                                <h2 className="text-2xl font-semibold leading-tight">{currentQ.prompt}</h2>
                                {currentQ.required && <span className="text-xs text-red-500 uppercase tracking-wide font-bold mt-2 block">Required</span>}
                            </CardHeader>
                            <CardContent className="pt-6 pb-8 px-8">
                                <SurveyQuestionRenderer
                                    question={currentQ}
                                    value={answers[currentQ.questionId]}
                                    onChange={(val) => setAnswer(currentQ.questionId, val)}
                                />

                                {errors[currentQ.questionId] && (
                                    <p className="text-sm text-red-500 mt-2">{errors[currentQ.questionId]}</p>
                                )}
                            </CardContent>
                            <CardFooter className="flex justify-between px-8 pb-8">
                                <Button
                                    variant="ghost"
                                    onClick={handlePrev}
                                    disabled={history.length === 0}
                                >
                                    Previous
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    className="min-w-[100px]"
                                >
                                    Next
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
