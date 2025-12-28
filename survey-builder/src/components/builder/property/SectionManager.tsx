'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSurveyStore, useSurveyActions } from '@/stores';
import { Section } from '@/types';

export function SectionManager() {
    const sections = useSurveyStore((state) => state.sections);
    const { addSection, updateSection, deleteSection } = useSurveyActions();

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formSectionId, setFormSectionId] = useState('');
    const [formTitle, setFormTitle] = useState('');
    const [formDesc, setFormDesc] = useState('');

    const resetForm = () => {
        setFormSectionId('');
        setFormTitle('');
        setFormDesc('');
        setIsAdding(false);
        setEditingId(null);
    };

    const handleStartAdd = () => {
        setFormSectionId(`SEC${sections.length + 1}`);
        setFormTitle('');
        setFormDesc('');
        setIsAdding(true);
        setEditingId(null);
    };

    const handleStartEdit = (section: Section) => {
        setFormSectionId(section.sectionId);
        setFormTitle(section.title);
        setFormDesc(section.description || '');
        setEditingId(section.sectionId);
        setIsAdding(false);
    };

    const handleSave = () => {
        if (!formSectionId || !formTitle) return;

        if (isAdding) {
            if (sections.some(s => s.sectionId === formSectionId)) {
                alert('Duplicate Section ID'); // Use proper toast in real app
                return;
            }
            addSection({
                sectionId: formSectionId,
                title: formTitle,
                description: formDesc,
                questionIds: [],
                required: true
            });
        } else if (editingId) {
            updateSection(editingId, {
                sectionId: formSectionId,
                title: formTitle,
                description: formDesc
            });
        }
        resetForm();
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this section? Questions in it will remain but become unassigned.')) {
            deleteSection(id);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Sections</h3>
                <Button variant="outline" size="sm" onClick={handleStartAdd} disabled={isAdding || !!editingId}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                </Button>
            </div>

            {/* Editor Form */}
            {(isAdding || editingId) && (
                <Card className="border-dashed">
                    <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-xs">{isAdding ? 'New Section' : 'Edit Section'}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2">
                        <div>
                            <label className="text-xs text-muted-foreground">ID</label>
                            <Input value={formSectionId} onChange={(e) => setFormSectionId(e.target.value)} disabled={!!editingId} className="h-8 text-xs" />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground">Title</label>
                            <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="h-8 text-xs" />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground">Description</label>
                            <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="min-h-[60px] text-xs" />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button size="sm" variant="ghost" onClick={resetForm}><X className="w-4 h-4" /></Button>
                            <Button size="sm" onClick={handleSave}><Check className="w-4 h-4" /></Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {sections.map(section => (
                    <div key={section.sectionId} className="flex items-start justify-between p-3 rounded-lg border bg-white dark:bg-slate-800 text-sm">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-1 rounded">{section.sectionId}</span>
                                <span className="font-medium">{section.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{section.description}</p>
                            <div className="text-xs text-slate-400">Questions: {section.questionIds.length}</div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStartEdit(section)}>
                                <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-600" onClick={() => handleDelete(section.sectionId)}>
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                ))}
                {sections.length === 0 && !isAdding && (
                    <div className="text-center p-4 text-xs text-muted-foreground border border-dashed rounded-lg">
                        No sections defined.
                    </div>
                )}
            </div>
        </div>
    );
}
