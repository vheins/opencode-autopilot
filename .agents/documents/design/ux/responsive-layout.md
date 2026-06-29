# Responsive Layout Rules: AUTOPILOT Plugin

## CLI Responsive Behavior

```mermaid
flowchart LR
    W["Terminal Width"] --> C{W < 60?}
    C -->|Yes| Compact["Compact Mode: No ASCII borders, abbreviated status"]
    C -->|No| D{W 60-100?}
    D -->|Yes| Normal["Normal Mode: Full layout as shown in wireframes"]
    D -->|No| Wide["Wide Mode: Side-by-side plan + diff view (>100 chars)"]
```

- Color scheme: Respect terminal theme (light/dark via OSC 4/10/11 detection)
- No mouse interaction — keyboard-only navigation (tab, arrows for multi-select, letter shortcuts)
