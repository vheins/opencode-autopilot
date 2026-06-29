# Database Schema: AUTOPILOT Plugin

## Entity Relationship

```mermaid
erDiagram
    Session ||--o{ Iteration : contains
    Session {
        uuid id PK
        string project_name
        string feature_description
        timestamp created_at
        timestamp updated_at
        string status "active|paused|completed|failed"
        string git_branch
        json config "plugin config snapshot"
    }
    
    Iteration ||--o{ IterationStep : has
    Iteration {
        uuid id PK
        uuid session_id FK
        int number
        string status "in_progress|approved|rejected|failed"
        timestamp created_at
        timestamp completed_at
    }
    
    IterationStep ||--o{ Artifact : produces
    IterationStep {
        uuid id PK
        uuid iteration_id FK
        string step_type "plan|code|lint|test|commit"
        string status "pending|running|completed|failed"
        string model_used
        timestamp started_at
        timestamp completed_at
    }
    
    Artifact {
        uuid id PK
        uuid step_id FK
        string type "plan|diff|lint_result|test_result|commit_message"
        string content_path
        int size_bytes
        string hash "sha256 of content"
        timestamp created_at
    }
```

## Storage Format
- Single JSON file per session: `.autopilot/sessions/{session-id}.json.zlib`
- Artifacts stored as separate files in `.autopilot/artifacts/{session-id}/`
- Maximum session file size: 10MB compressed

## Indexes
- Session status + updated_at (for "resume recent" queries)
- Iteration number per session (for ordering)
