APP_DIR := express-app

.PHONY: test audit security

# Run unit tests
test:
	cd $(APP_DIR) && npm test

# Run npm audit; fail the build if any vulnerabilities are found
audit:
	cd $(APP_DIR) && npm audit --audit-level=low

# Run all security checks (audit + tests)
security: audit test
