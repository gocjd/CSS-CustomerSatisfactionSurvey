import { Survey, Section, Layout, Question } from '@/types';
import { Question as QuestionType, ValidationRule } from '@/types';

// Types for return values
export interface NavigationResult {
    nextQuestionId: string | null; // null means end of section or survey
    endOfSurvey: boolean;
}

export class SurveyEngine {

    /**
     * Determines the next question based on current state and survey definition.
     * Priority:
     * 1. Question.nextQuestion (Direct branching)
     * 2. Layout.edges (Graph branching)
     * 3. Section sequence (Linear)
     */
    static getNextQuestion(
        survey: Survey,
        currentQuestionId: string,
        answers: Record<string, any>
    ): NavigationResult {
        const currentQ = survey.questions.find(q => q.questionId === currentQuestionId);
        if (!currentQ) {
            return { nextQuestionId: null, endOfSurvey: true };
        }

        const answer = answers[currentQuestionId];

        // 1. Check direct 'nextQuestion' property (Legacy/Simple Branching)
        if (currentQ.nextQuestion) {
            if (typeof currentQ.nextQuestion === 'string') {
                return { nextQuestionId: currentQ.nextQuestion, endOfSurvey: false };
            }
            // If it's a record (map), check if answer matches a key
            if (typeof currentQ.nextQuestion === 'object' && answer) {
                const nextId = (currentQ.nextQuestion as Record<string, string>)[String(answer)];
                if (nextId) return { nextQuestionId: nextId, endOfSurvey: false };
            }
        }

        // 2. Check Layout/Graph Edges (Visual Flow)
        if (survey.layout && survey.layout.edges) {
            const edge = survey.layout.edges.find(e => {
                if (e.source !== currentQuestionId) return false;
                // Evaluate condition if exists
                if (e.condition) {
                    // TODO: Implement proper condition parser. For now, simple string match
                    // e.g., "value == 'yes'"
                    try {
                        const [key, operator, val] = e.condition.split(' ');
                        if (operator === '==' && String(answer) === val.replace(/'/g, '')) return true;
                        return false;
                    } catch (err) {
                        return false;
                    }
                }
                return true; // No condition means direct path
            });

            if (edge) {
                return { nextQuestionId: edge.target, endOfSurvey: false };
            }
        }

        // 3. Fallback: Sequential order within current Section
        const currentSection = survey.sections.find(s => s.sectionId === currentQ.sectionId);
        if (currentSection) {
            const idx = currentSection.questionIds.indexOf(currentQuestionId);
            if (idx !== -1 && idx < currentSection.questionIds.length - 1) {
                return { nextQuestionId: currentSection.questionIds[idx + 1], endOfSurvey: false };
            }
        }

        // 4. End of Section -> Next Section?
        const sectionIdx = survey.sections.findIndex(s => s.sectionId === currentQ.sectionId);
        if (sectionIdx !== -1 && sectionIdx < survey.sections.length - 1) {
            const nextSection = survey.sections[sectionIdx + 1];
            if (nextSection.questionIds.length > 0) {
                return { nextQuestionId: nextSection.questionIds[0], endOfSurvey: false };
            }
        }

        return { nextQuestionId: null, endOfSurvey: true };
    }

    /**
     * Validates a single answer against the question's rules.
     */
    static validate(question: QuestionType, answer: any): { valid: boolean; error?: string } {
        if (question.required) {
            if (answer === undefined || answer === null || answer === '') {
                return { valid: false, error: 'This field is required.' };
            }
        }

        if (!question.validation || !answer) return { valid: true };

        const rule = question.validation;

        // Type guard or loose checking
        if (typeof rule === 'object') {
            // Selection Validation
            if ('minSelections' in rule && Array.isArray(answer)) {
                const min = (rule as any).minSelections;
                const max = (rule as any).maxSelections;
                if (min && answer.length < min) return { valid: false, error: `Select at least ${min} options.` };
                if (max && answer.length > max) return { valid: false, error: `Select at most ${max} options.` };
            }
            // Text Validation
            if ('minLength' in rule && typeof answer === 'string') {
                const min = (rule as any).minLength;
                const max = (rule as any).maxLength;
                if (min && answer.length < min) return { valid: false, error: `Minimum ${min} characters required.` };
                if (max && answer.length > max) return { valid: false, error: `Maximum ${max} characters allowed.` };
            }
        }

        return { valid: true };
    }
}
