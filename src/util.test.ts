import { expect, test } from 'vitest';
import payload from '../data/issueComment.json';
import { formatResults, generateTokens, requiresAction } from './util';

test('requires action when issue comment starts with a /validate addresses', () => {
  expect(requiresAction(payload, payload.comment!.body as string)).toBe(true);
});

test('it generates tokens from a command', () => {
  const commentBody = `/validate addresses
  - 326 east south temple, 84111
  - 2236 east atkin ave, slc
  `;

  const { command, addresses: args } = generateTokens(commentBody);

  expect(command).toBe('validate addresses');
  expect(args).toEqual([
    '326 east south temple, 84111',
    '2236 east atkin ave, slc',
  ]);
});

test('it formats results', () => {
  const results = [
    { status: true, record: '326 east south temple, 84111', response: 100 },
    {
      status: false,
      record: '2236 east atkin ave, slc',
      response: 'Invalid address',
    },
  ];

  const formatted = formatResults(results);

  expect(formatted).toBe(`## Geocode results

- ✅ 326 east south temple, 84111
  - score: 100
- ❌ 2236 east atkin ave, slc
  - Invalid address
`);
});
