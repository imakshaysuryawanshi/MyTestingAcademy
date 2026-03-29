# Phase 14: User Story Generation

## Objective
Generate User Stories from URL Analysis or Test Plans.

## Features
- Agile format:
  As a..., I want..., So that...
- Acceptance Criteria (testable)

## Inputs
- URL analyzed data (flows, elements)
- Test plan scenarios

## Actions
- Generate from URL
- Generate from Test Plan

## AI Rules
- Use prompt: userstory/generator.md
- Respond ONLY in JSON

## Output
{
  "user_stories": [
    {
      "title": "",
      "description": "",
      "acceptance_criteria": []
    }
  ]
}
