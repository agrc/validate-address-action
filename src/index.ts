import * as core from '@actions/core';
import * as github from '@actions/github';
import { geocode } from './geocode';
import {
  formatResults,
  generateTokens,
  getOctokit,
  requiresAction,
} from './util';

export async function run() {
  core.debug('Starting action');
  try {
    const { context } = github;
    const payload = context.payload;
    const commentBody = context.payload.comment!.body as string;

    if (payload?.comment?.id == null) {
      core.setFailed('no comment found in payload');

      return;
    }

    if (!requiresAction(payload, commentBody)) {
      core.warning('no action required');

      return;
    }

    const octokit = getOctokit();

    const { addresses } = generateTokens(commentBody);

    const results = await geocode(addresses, core.getInput('API_KEY'));

    core.notice(
      `geocoding ${addresses.length} addresses

### Inputs

${addresses.join('\n')}

### Results

${JSON.stringify(results, null, 2)}`,
    );

    const body = `${formatResults(results)}

### Initiated by

\`\`\`
${commentBody}
\`\`\`
    `;

    await octokit.rest.issues.updateComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: payload.comment.id,
      body,
    });

    core.info('geocoding complete, updating comment');
  } catch (e) {
    core.error(e);
    core.setFailed(e.message);
  }
}

run();
