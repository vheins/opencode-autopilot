# Form Design Specification: AUTOPILOT Plugin

## Feature Description Input
- Input type: Free-form text (CLI argument)
- Max length: 2000 characters
- Validation: Non-empty, valid UTF-8
- Example: `autopilot implement "add user authentication with JWT tokens and refresh flow"`

## Approval Prompt
- Type: Confirmation (Y/n)
- Valid inputs: y/Y/yes/true/1 (approve), n/N/no/false/0 (reject), free text (reject with reason)
- Empty input: Default to 'n' (safe default)

## Configuration Input
- Key-value pairs via `autopilot config set <key> <value>`
- Validation per config key schema (e.g., `model` must be a valid provider model name)
- Boolean values: true/false, yes/no, 1/0
- Numeric values: integer or float validation
