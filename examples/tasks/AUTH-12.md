# AUTH-12: Replace JWT with PASETO

## Context

After AUTH-7 (audit), we are replacing JWT with PASETO for signed tokens. PASETO provides versioned, misuse-resistant tokens.

## Acceptance criteria

- [ ] Choose PASETO version (v2 recommended for modern stacks).
- [ ] Replace JWT sign/verify at auth service with PASETO equivalents.
- [ ] Update token payload shape if needed; keep backward compatibility for existing clients during rollout.
- [ ] Document key rotation and expiry in runbook.
- [ ] Add/update tests for token issuance and validation.

## Notes

- Depends on AUTH-7 (audit) being done.
- Consider feature flag for gradual rollout.
