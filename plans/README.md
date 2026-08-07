# Animation plans

| # | Plan | Severity | Status |
| --- | --- | --- | --- |
| 001 | [Make card cancellation a seamless shared-element return](001-seamless-card-return.md) | HIGH | IN PROGRESS |
| 002 | [Return recitation cards into the exact deck slot](002-return-into-deck-slot.md) | HIGH | DONE |

## Recommended execution order

1. Finish plan 001 if any remaining handoff/reduced-motion tasks are still pending.
2. Execute plan 002 immediately after plan 001. It fixes the remaining edge-card return path and angle issues caused by measuring hover/spread state instead of the resting deck slot.

## Notes

Plan 001 replaces the reverse-keyframe cancellation with a measured two-element FLIP/shared-element handoff.

Plan 002 refines that handoff so edge cards return into the exact resting fan slot, not the hover/spread card position. It should be completed before further tuning of timing/easing.
