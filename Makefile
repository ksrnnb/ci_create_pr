.PHONY: microservices/app/release_pr
microservices/app/release_pr:
	scripts/app/release_pr $(SERVICE_NAME) $(VERSION) $(GITHUB_TOKEN)
