APP_DIR  := express-app
TRIVY    := $(shell command -v trivy 2>/dev/null || echo $(HOME)/bin/trivy)

.PHONY: test audit lint image-scan image-scan-third-party security

# Run unit tests
test:
	cd $(APP_DIR) && npm test

# Check npm dependencies for known CVEs
audit:
	cd $(APP_DIR) && npm audit --audit-level=low

# Static analysis for insecure code patterns (eslint-plugin-security)
lint:
	cd $(APP_DIR) && npm run lint

# Scan our built production image for HIGH/CRITICAL CVEs (blocks on failure)
image-scan:
	docker compose build app
	$(TRIVY) image --exit-code 1 --severity HIGH,CRITICAL \
		--ignore-unfixed radiocalico-app

# Scan third-party images we don't build — informational only, does not fail
image-scan-third-party:
	$(TRIVY) image --exit-code 0 --severity HIGH,CRITICAL \
		--ignore-unfixed postgres:17-alpine
	$(TRIVY) image --exit-code 0 --severity HIGH,CRITICAL \
		--ignore-unfixed nginx:alpine

# Run all security checks
security: audit lint image-scan image-scan-third-party test
