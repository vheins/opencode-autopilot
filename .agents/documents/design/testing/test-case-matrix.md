# Requirements-Based Test Case Matrix: AUTOPILOT Plugin

| Req ID | Requirement | Test Case | Type |
|---|---|---|---|
| FR-01 | Execute iteration loop | Given feature description, full loop completes | E2E |
| FR-02 | Supervised mode | Given supervised mode, each step waits for approval | Integration |
| FR-03 | State persistence | Given active session, state restores after restart | Integration |
| FR-04 | Quality gates | Given code generated, linter runs automatically | Integration |
| NFR-01 | <5 min iteration | Given <500 LOC feature, loop completes in <5 min | Performance |
| NFR-02 | Rate limit handling | Given 429 response, backoff executes correctly | Unit |
| NFR-03 | File boundary safety | Given malicious file write, operation blocked | Security |
