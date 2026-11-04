import { describe, expect, it } from 'vitest';
import { isUserToken } from './auth';

const token = (claims: object) =>
  `Bearer x.${btoa(JSON.stringify(claims)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.y`;

describe('isUserToken', () => {
  it('accepts a signed-in user', () => {
    expect(isUserToken(token({ role: 'authenticated', sub: 'abc' }))).toBe(true);
  });
  it('rejects the public anon key', () => {
    expect(isUserToken(token({ role: 'anon' }))).toBe(false);
  });
  it('rejects missing or broken tokens', () => {
    expect(isUserToken(null)).toBe(false);
    expect(isUserToken('Bearer nonsense')).toBe(false);
    expect(isUserToken('Bearer x.%%%.y')).toBe(false);
  });
});
