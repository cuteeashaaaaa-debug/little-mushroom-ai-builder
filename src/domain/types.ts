export type LearningStatus = 'not_started' | 'in_progress' | 'completed';
export type MasteryStatus = 'unassessed' | 'needs_review' | 'understood' | 'verified';
export type ReleaseStatus = 'planned' | 'published';
export interface ModuleMeta { id: string; title: string; description: string; units: UnitMeta[] }
export interface UnitMeta { id: string; moduleId: string; title: string; objectives: string[]; prerequisites: string[]; releaseStatus: ReleaseStatus }
export interface UnitProgress { unitId: string; learningStatus: LearningStatus; masteryStatus: MasteryStatus; updatedAt: string }
export interface ExerciseRecord { unitId: string; quizAnswers: Record<string, number>; quizScore?: number; quizSubmitted?: boolean; scenarioAnswer: string; rubricScores: Record<string, number>; updatedAt: string }
export interface TextHighlight { id: string; unitId: string; passageId: string; quote: string; passageText: string; startOffset: number; endOffset: number; createdAt: string }
export interface Checkin { date: string }
export interface Preferences { key: 'theme'; theme: 'light' | 'dark' | 'system' }
