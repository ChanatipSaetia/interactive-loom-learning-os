# Triage Labels

Five canonical triage roles mapped to GitHub issue labels.

| Canonical Role | Label String | Description |
|---|---|---|
| needs-triage | `needs-triage` | Maintainer needs to evaluate the issue |
| needs-info | `needs-info` | Waiting on reporter for more information |
| ready-for-agent | `ready-for-agent` | Fully specified, an AFK agent can pick it up |
| ready-for-human | `ready-for-human` | Needs human implementation |
| wontfix | `wontfix` | Will not be actioned |

## State machine flow

```
new issue -> needs-triage -> needs-info -> (back to needs-triage or close)
                                         -> ready-for-agent -> done
                                         -> ready-for-human -> done
                                         -> wontfix -> close
```

## For skills

- Apply labels via `gh issue edit <number> --add-label <label> --remove-label <old-label>`
- An issue is agent-pickable only when it has `ready-for-agent` and does NOT have `needs-info` or `needs-triage`
