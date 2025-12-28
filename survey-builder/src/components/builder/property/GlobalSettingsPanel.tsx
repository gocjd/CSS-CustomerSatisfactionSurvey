'use client';

import { useSurveyStore, useSurveyActions } from '@/stores';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SectionManager } from './SectionManager';

export function GlobalSettingsPanel() {
    const survey = useSurveyStore((state) => state.survey);
    const { updateSurveyMeta } = useSurveyActions();

    if (!survey) return <div className="p-4 text-sm text-muted-foreground">No Survey Loaded</div>;

    return (
        <div className="flex flex-col h-full w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-xl overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-base font-semibold">Survey Settings</h2>
                <p className="text-xs text-muted-foreground">Global configuration for the entire survey.</p>
            </div>

            <div className="p-4 space-y-6">
                {/* General Settings */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium border-l-2 border-indigo-500 pl-2">General Info</h3>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Survey Title</label>
                        <Input
                            value={survey.title}
                            onChange={(e) => updateSurveyMeta({ title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Description</label>
                        <Textarea
                            value={survey.description || ''}
                            onChange={(e) => updateSurveyMeta({ description: e.target.value })}
                            className="min-h-[80px]"
                        />
                    </div>
                </div>

                <hr className="border-gray-100 dark:border-gray-800" />

                {/* Sections Manager */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium border-l-2 border-indigo-500 pl-2">Sections</h3>
                    <p className="text-xs text-muted-foreground mb-2">Group questions into logical sections.</p>
                    <SectionManager />
                </div>
            </div>
        </div>
    );
}
