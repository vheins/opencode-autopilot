# Sprint 07: Quality & Reliability (Weeks 13-14)

## Goal
Backpressure handling, error recovery, stability improvements.

## Tasks
| Task | Effort | Owner | Dependencies |
|---|---|---|---|
| Implement exponential backpressure | M | Dev 1 | Sprint 06 |
| Implement session error recovery | M | Dev 2 | Sprint 06 |
| State integrity verification (SHA256) | S | Dev 1 | Sprint 06 |
| Error handling audit | M | Dev 2 | Task 1-3 |
| Resilience tests (kill, rate limit, disk) | M | Dev 1 | Task 1-4 |

## Sprint Capacity: 8/8 points

## Demo
API rate limit triggered → backoff → retry → success. Process killed → state recovered.
