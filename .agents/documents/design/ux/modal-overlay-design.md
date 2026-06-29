# Modal/Overlay Design: AUTOPILOT Plugin

## CLI Overlays
- No GUI modals — all interactions are terminal-based
- Overlay types:
  1. **Inline prompt**: `Approve plan? [Y/n]: _` — cursor waits for input
  2. **Scrollable diff**: File diffs displayed via pager (like `git diff` in `less`)
  3. **Progress indicators**: Spinner (`⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏`) for running phases
  4. **Error banner**: Red-highlighted box with error details and recovery options

## Dismissal
- All prompts respond to Ctrl+C to abort and pause session
- Diff pager: 'q' to close, arrow keys to scroll, '/' to search
- Error banner: 'r' to retry, 's' to skip step, 'q' to quit
