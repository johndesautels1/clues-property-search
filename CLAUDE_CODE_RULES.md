# CLAUDE CODE MANDATORY RULES

**READ THIS FILE AT THE START OF EVERY SESSION**

## ABSOLUTE PROHIBITIONS - NEVER DO THESE:

### 1. NEVER TOUCH THE SOURCE OF TRUTH SCHEMA
- `src/types/fields-schema.ts` is the SOURCE OF TRUTH
- DO NOT modify field numbers
- DO NOT modify field keys
- DO NOT modify field definitions
- If something doesn't match, the OTHER file is wrong - NOT fields-schema.ts

### 2. NEVER ROLL BACK CODE WITHOUT EXPLICIT PERMISSION
- DO NOT use `git checkout` to revert files without asking
- DO NOT use `git reset` without asking
- DO NOT undo changes without the user explicitly saying "roll back" or "revert"
- If you made a mistake, TELL the user and ASK before reverting

### 3. NEVER CHANGE LLM MODEL CONFIGURATIONS
- DO NOT change model names/versions (e.g., gpt-5.2-2025-12-11, claude-opus-4, etc.)
- DO NOT assume a model "doesn't exist" - THE USER KNOWS THEIR API ACCESS
- DO NOT substitute models you think are "better" or "more current"
- If you see a model name you don't recognize, IT EXISTS - leave it alone

### 4. NEVER ASSUME YOU KNOW BETTER THAN THE USER
- The user has context you don't have
- The user has API access you can't verify
- The user's model configurations are INTENTIONAL
- ASK before changing anything that seems "wrong" to you

## WHAT TO DO INSTEAD:

- ASK before making changes to critical files
- CONFIRM model names are intentional before touching them
- REPORT issues without automatically "fixing" them
- WAIT for explicit permission to revert or rollback

## CONSEQUENCES OF VIOLATING THESE RULES:

Breaking these rules wastes the user's time, breaks production code, and destroys trust.

---
**Created: 2026-01-04**
**This file must be read at the start of every Claude Code session**
