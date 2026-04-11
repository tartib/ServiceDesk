## Summary

<!-- Brief description of what this PR does -->

## Architecture Checklist

> Required for every PR. See [architecture-policy.md](docs/architecture/architecture-policy.md).

- [ ] **Module owner:** Which module owns this change? (`modules/itsm`, `modules/pm`, `modules/workflow-engine`, `shared`, other)
- [ ] **No new legacy code:** This PR does NOT add files to `src/routes/`, `src/controllers/`, `src/services/`, or `src/presentation/`
- [ ] **No cross-module imports:** This PR does NOT import another module's controllers, services, models, or infrastructure directly
- [ ] **Inter-module communication:** Any cross-module calls use Internal API Registry or Kafka events (not direct imports)
- [ ] **Legacy touch:** Does this PR modify any frozen legacy file? If yes, explain why below

### If legacy is touched

<!-- Why is this change necessary in a frozen directory? Bug fix / security patch / compatibility? -->
<!-- If this is an exception to the architecture policy, link the ADR: docs/architecture/adrs/NNN-title.md -->

## Type of Change

- [ ] Feature (new functionality in a module)
- [ ] Bug fix (fix in existing module code)
- [ ] Legacy maintenance (bug fix / security patch in frozen code)
- [ ] Refactor (no behavior change)
- [ ] Documentation
- [ ] Infrastructure / CI

## Testing

- [ ] Existing tests pass (`npm run test:ci`)
- [ ] New tests added for new functionality
- [ ] Architecture boundaries verified (`npm run boundary:check`)

## Related Issues

<!-- Link related issues or tickets -->
