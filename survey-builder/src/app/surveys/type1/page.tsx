"use client";

import React, { useEffect } from 'react';
import surveyDataRaw from '@/data/sample-survey.json';
import { Survey } from '@/types';
import { useSurveyRunnerStore } from '@/stores/useSurveyRunnerStore'; // New runner store
import { SurveyQuestionRenderer } from '@/components/survey/SurveyQuestionRenderer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

const surveyData = surveyDataRaw as unknown as Survey;

export default function Type1Page() {
    const { survey, answers, setAnswer, initSurvey, isCompleted } = useSurveyRunnerStore();

    useEffect(() => {
        initSurvey(surveyData);
    }, [initSurvey]);

    const handleSubmit = () => {
        // In a real app, we might call a final validateAll() here
        // For now, we manually trigger completion or just log
        console.log("Survey Submitted:", answers);
        alert("Survey Submitted! (Check console for data)");
        // Typically the store would have a submit action
    };

    if (!survey) return <div className="p-8 text-center">Loading survey...</div>;

    if (isCompleted) {
        return (
            <div className="container mx-auto p-8 max-w-2xl flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                <h2 className="text-2xl font-bold text-green-600">Thank You!</h2>
                <p>Your response has been recorded.</p>
                <Link href="/surveys">
                    <Button variant="outline">Back to Demos</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-3xl">
            <div className="mb-6">
                <Link href="/surveys" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Demos
                </Link>
            </div>

            <Card>
                <CardHeader className="space-y-4 text-center pb-8 border-b bg-muted/20">
                    <CardTitle className="text-3xl">{survey.title}</CardTitle>
                    {survey.description && (
                        <CardDescription className="text-lg">{survey.description}</CardDescription>
                    )}
                </CardHeader>

                <CardContent className="space-y-8 pt-8">
                    {survey.sections.map((section) => (
                        <div key={section.sectionId} className="space-y-6">
                            <h3 className="text-xl font-semibold border-l-4 border-blue-500 pl-3">
                                {section.title}
                            </h3>
                            {section.description && <p className="text-sm text-muted-foreground">{section.description}</p>}

                            <div className="space-y-8 pl-2">
                                {section.questionIds.map((qId, idx) => {
                                    const question = survey.questions.find(q => q.questionId === qId);
                                    if (!question) return null;

                                    return (
                                        <div key={qId} className="space-y-3">
                                            <div className="flex items-baseline space-x-2">
                                                <span className="text-sm font-medium text-muted-foreground">{question.promptType === 'text_prompt' ? 'Q.' : 'Voice Q.'}</span>
                                                <label className="font-semibold text-lg leading-tight">
                                                    {question.prompt}
                                                    {question.required && <span className="text-red-500 ml-1">*</span>}
                                                </label>
                                            </div>
                                            <div className="pl-6">
                                                <SurveyQuestionRenderer
                                                    question={question}
                                                    value={answers[question.questionId]}
                                                    onChange={(val) => setAnswer(question.questionId, val)}
                                                />
                                                {/* Error Message Placeholders could go here */}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </CardContent>

                <CardFooter className="flex justify-center pt-6 pb-8 border-t bg-muted/20">
                    <Button size="lg" className="w-full max-w-sm" onClick={handleSubmit}>
                        Submit Survey
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
