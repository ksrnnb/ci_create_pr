# ci_create_pr

## Test in local
```bash
act workflow_dispatch -s GITHUB_TOKEN=$GITHUB_TOKEN -e payload.json --container-architecture linux/amd64
```