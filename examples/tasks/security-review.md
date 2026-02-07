# P-15: Security review and hardening

## Scope

- Auth service (tokens, rate limiting, headers).
- User service (input validation, authz).
- API surface (CORS, CSP, dependency audit).

## Checklist

- [ ] Run `npm audit` and address high/critical.
- [ ] Review auth flows and session handling.
- [ ] Verify WIP limits and sensitive data in logs.
- [ ] Document findings and remediation in ADR or runbook.
