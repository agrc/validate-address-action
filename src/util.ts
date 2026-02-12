import * as core from '@actions/core';
import * as github from '@actions/github';
import { type WebhookPayload } from '@actions/github/lib/interfaces';

export type Octokit = ReturnType<typeof getOctokit>;

export const requiresAction = (
  payload: WebhookPayload,
  commentBody: string,
) => {
  if (payload?.action !== 'created') {
    core.error('This action is only supported on comment creation.');

    return false;
  }

  // Check if the first line of the comment is a slash command
  const firstLine = (commentBody ?? '').split(/\r?\n/)[0]?.trim() ?? '';
  if (firstLine.length < 2 || firstLine.charAt(0) !== '/') {
    core.error('The first line of the comment is not a valid slash command.');

    return false;
  }

  const { command } = generateTokens(commentBody);

  return command === 'validate addresses';
};

export function getOctokit() {
  const token = core.getInput('GITHUB_TOKEN', { required: true });
  return github.getOctokit(token);
}

export function isValidEvent(event: string, action?: string) {
  const { context } = github;
  const { payload } = context;

  if (event === context.eventName) {
    return action == null || action === payload.action;
  }

  return false;
}

const TOKEN_REGEX = /^\/(?<command>.*(?!\S))/gm;

const markdownToList = (markdownString: string) => {
  const regex = /^\s*-\s*(.+)$/gm; // Matches lines starting with '-' and captures the content
  const listItems = [];
  let match;

  while ((match = regex.exec(markdownString)) !== null) {
    listItems.push((match[1] ?? '').trim()); // Push the captured content (trimmed)
  }

  return listItems;
};

export function generateTokens(comment: string) {
  const match = TOKEN_REGEX.exec(comment);

  const command = match?.groups?.command || '';

  comment = comment.replace(TOKEN_REGEX, '').trim();

  return {
    command,
    addresses: markdownToList(comment),
  };
}

export function formatResults(
  results: {
    status: boolean;
    record: string;
    response: string | number;
  }[],
) {
  return results.reduce((acc, { status, record, response }) => {
    const emoji = status ? '✅' : '❌';
    acc += `- ${emoji} ${record}\n  - ${status ? `score: ${response}` : response}\n`;
    return acc;
  }, '## Geocode results\n\n');
}
