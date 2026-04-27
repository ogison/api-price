# Pricing Update Workflow Setup

`.github/workflows/update-pricing.yml` runs `pnpm tsx scripts/update-pricing/index.ts` on a schedule and opens a pull request via [`peter-evans/create-pull-request`](https://github.com/peter-evans/create-pull-request) when pricing data changes.

The workflow already declares the required `permissions:` block (`contents: write`, `pull-requests: write`). However, recent runs fail at the "Create Pull Request" step with:

```
GitHub Actions is not permitted to create or approve pull requests.
HttpError: Resource not accessible by integration
```

This is a repository-level restriction that cannot be lifted from inside the workflow file. Pick one of the two options below to unblock automated pricing PRs.

## Option A (recommended): allow Actions to open PRs

1. Open **Settings → Actions → General → Workflow permissions**.
2. Check **"Allow GitHub Actions to create and approve pull requests"**.
3. Save.

After this, the next scheduled or manually dispatched run can create the PR with the default `GITHUB_TOKEN` and no further changes are required.

## Option B: use a Personal Access Token

If org policy keeps the setting above disabled, create a token and reference it from the workflow:

1. Create a fine-grained PAT scoped to this repository with `Contents: Read and write` and `Pull requests: Read and write`. A classic PAT with the `repo` scope also works.
2. Add it as a repository secret named `PRICING_PR_TOKEN` (**Settings → Secrets and variables → Actions → New repository secret**).
3. Update the `Create Pull Request` step in `.github/workflows/update-pricing.yml` to prefer the PAT when present:

   ```yaml
   - name: Create Pull Request
     if: steps.update.outputs.has_changes == 'true'
     uses: peter-evans/create-pull-request@v7
     with:
       token: ${{ secrets.PRICING_PR_TOKEN || secrets.GITHUB_TOKEN }}
       branch: automated/pricing-update
       title: 'chore: update pricing data'
       body-path: /tmp/update-report.txt
       labels: pricing-update,automated
       commit-message: 'chore: update pricing data from official sources'
   ```

   The `||` fallback keeps the workflow working in environments where Option A is enabled instead.

## Verifying the fix

1. Trigger the workflow manually: **Actions → Update Pricing Data → Run workflow**.
2. If pricing data changed, the run should finish without the "Resource not accessible by integration" error and a PR should appear on the `automated/pricing-update` branch.
3. If no pricing data changed, the "Create Pull Request" step is skipped — that is expected and not a failure.
