# validate-address-action

A slash command to validate addresses

## installation

1. create an action secret named API_KEY and add the API key linked to the UGRC API Client
1. Create a github action file

```yml
name: Issue Comment (Validate Addresses)

on:
  issue_comment:
    types: [created]

permissions:
  issues: write
  contents: read

jobs:
  validate:
    name: ✅ Validate addresses
    runs-on: ubuntu-latest
    steps:
      - name: Add emoji to comment
        uses: actions/github-script@v7
        with:
          script: |
            const comment = context.payload.comment;
            const body = comment.body;

            if (!body.startsWith('/validate addresses')) {
              return;
            }

             github.rest.reactions.createForIssueComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                comment_id: context.payload.comment.id,
                content: 'eyes'
              });
      - name: 🧪 Test addresses
        uses: agrc/validate-address-action@v1
        with:
          API_KEY: ${{ secrets.API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## usage

1. Write a comment with the following form

```sh
/validate addresses

- street, zone
- street, zone
```
