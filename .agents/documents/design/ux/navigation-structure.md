# Navigation Structure & Routes: AUTOPILOT Plugin

## CLI Command Hierarchy

```mermaid
graph TB
    AP[autopilot]
    AP --> IMP[implement &lt;description&gt;]
    IMP -->|Start new feature implementation| IMP
    AP --> RES[resume &lt;session-id&gt;]
    RES -->|Resume existing session| RES
    AP --> SES[sessions]
    SES --> SHOW[show &lt;id&gt;]
    SES --> DEL[delete &lt;id&gt;]
    SES --> EXP[export &lt;id&gt;]
    AP --> APP[approve]
    APP -->|Approve current iteration step| APP
    AP --> REJ[reject &lt;reason&gt;]
    REJ -->|Reject with feedback| REJ
    AP --> CONF[config]
    CONF --> CONF_SHOW[show]
    CONF --> CONF_SET[set &lt;key&gt; &lt;value&gt;]
    CONF --> CONF_LIST[list]
    AP --> HELP[help]
    HELP -->|Show help| HELP
```

## Session States (for display)

| State | Display | User Action |
|---|---|---|
| Idle | "Ready. Describe a feature to implement." | `autopilot implement` |
| Planning | "Planning implementation..." | Wait |
| AwaitingApproval | "Plan ready. Approve or reject?" | `approve` / `reject <reason>` |
| Coding | "Writing code..." | Wait |
| Reviewing | "Reviewing generated code..." | Wait |
| AwaitApproval | "Code ready. Review diff above. Approve commit?" | `approve` / `reject <reason>` |
| Error | "Error: <message>. Fix and retry?" | Fix issue, then `approve` |
| Paused | "Session paused. Resume with 'autopilot resume'" | `resume` |
