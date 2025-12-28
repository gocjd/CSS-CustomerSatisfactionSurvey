import { create } from 'zustand';
import { SurveyEngine } from '@/lib/survey-engine';
import { Survey, Question } from '@/types'; // Import from central index

interface SurveyRunnerState {
    survey: Survey | null;
    currentQuestionId: string | null;
    answers: Record<string, any>;
    errors: Record<string, string>;
    history: string[]; // Stack of question IDs visited
    isCompleted: boolean;

    // Actions
    initSurvey: (survey: Survey) => void;
    setAnswer: (questionId: string, value: any) => void;
    validateCurrent: () => boolean;
    next: () => void;
    prev: () => void;
    reset: () => void;
}

export const useSurveyRunnerStore = create<SurveyRunnerState>((set, get) => ({
    survey: null,
    currentQuestionId: null,
    answers: {},
    errors: {},
    history: [],
    isCompleted: false,

    initSurvey: (survey: Survey) => {
        // Find first question (First section, first question)
        let firstQId = null;
        if (survey.sections.length > 0 && survey.sections[0].questionIds.length > 0) {
            firstQId = survey.sections[0].questionIds[0];
        }

        // Check layout for start node? (Optional advanced logic)

        set({
            survey,
            currentQuestionId: firstQId,
            answers: {},
            errors: {},
            history: [],
            isCompleted: false
        });
    },

    setAnswer: (questionId, value) => {
        set((state) => ({
            answers: { ...state.answers, [questionId]: value },
            // Clear error when user types
            errors: { ...state.errors, [questionId]: '' }
        }));
    },

    validateCurrent: () => {
        const { survey, currentQuestionId, answers } = get();
        if (!survey || !currentQuestionId) return true;

        const currentQ = survey.questions.find(q => q.questionId === currentQuestionId);
        if (!currentQ) return true;

        const result = SurveyEngine.validate(currentQ, answers[currentQuestionId]);

        if (!result.valid && result.error) {
            set((state) => ({
                errors: { ...state.errors, [currentQuestionId]: result.error! }
            }));
            return false;
        }

        return true;
    },

    next: () => {
        const { survey, currentQuestionId, answers, history, validateCurrent } = get();
        if (!survey || !currentQuestionId) return;

        if (!validateCurrent()) return;

        // Calculate next
        const { nextQuestionId, endOfSurvey } = SurveyEngine.getNextQuestion(survey, currentQuestionId, answers);

        if (endOfSurvey) {
            set({ isCompleted: true });
        } else if (nextQuestionId) {
            set({
                history: [...history, currentQuestionId],
                currentQuestionId: nextQuestionId
            });
        }
    },

    prev: () => {
        const { history } = get();
        if (history.length === 0) return;

        const prevId = history[history.length - 1];
        set({
            currentQuestionId: prevId,
            history: history.slice(0, -1)
        });
    },

    reset: () => {
        const { survey, initSurvey } = get();
        if (survey) initSurvey(survey);
    }
}));
