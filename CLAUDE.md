# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Customer Satisfaction Survey (CSS) system consisting of a visual survey builder and survey data specifications. The project aims to enable non-developers to create surveys through a drag-and-drop interface while maintaining a clean JSON structure internally.

## Development Commands

All commands run from the `survey-builder/` directory:

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Tech Stack

- **Framework**: Next.js 16 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives (dialog, tabs, checkbox, slider, switch)
- **Visual Editor**: @xyflow/react (React Flow) for drag-and-drop graph-based survey building
- **State Management**: Zustand with Immer for immutable updates
- **Validation**: Zod

## Architecture

### Directory Structure

- `survey-builder/src/app/` - Next.js App Router pages
- `survey-builder/src/components/ui/` - Reusable UI components (shadcn/ui style)
- `survey-builder/src/lib/` - Utility functions
- Root directory contains design documentation and survey JSON schemas

### Survey Builder Design (from `20251223_v1_survey_builder_design.md`)

The builder follows this component hierarchy:
```
SurveyBuilderPage
├── BuilderHeader (file management, save state)
├── BuilderLayout
│   ├── QuestionPalette (drag source for question types)
│   ├── CanvasArea (React Flow graph for visual editing)
│   └── PropertyPanel (question property editing)
└── BuilderFooter
```

### Core State Structure

```typescript
surveyMeta        // Survey metadata (title, schedule, settings)
questionMap       // Question definitions by ID
questionGraph     // Edges representing flow between questions
selectedNodeId    // Currently selected question
uiState          // UI-related state
```

### Question Types

- `multiple_choice` - Single or multiple selection
- `multiple_choice` with `displayType: "likert_scale"` - Likert scale display
- `text_opinion` - Free text input
- `voice_opinion` - Voice recording input

### Survey JSON Schema

The survey JSON structure (see `20251223_v1_css.json`) includes:
- Survey metadata (surveyId, version, title, language)
- Creator info and schedule
- Settings (anonymous, revision, analytics)
- Sections containing question IDs
- Questions with branching logic via `nextQuestion` (can be string or object for conditional branching)

## Path Aliases

TypeScript is configured with `@/*` mapping to `./src/*`.

## Key Design Principles

1. **JSON Schema is the Source of Truth** - Builder UI translates to/from JSON schema
2. **Visual Flow Editing** - Questions are nodes, connections represent flow/branching
3. **Type-safe Question Definitions** - Each question type has specific validation rules and UI mappings
