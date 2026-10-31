import { Logger } from '@nestjs/common';
import { DEV_DEFAULT_ORIGINS, resolveCorsOrigins } from './cors.config';

describe('CORS origin resolution (Phase 0, Task H)', () => {
  it('development with no configured origins defaults to the local Next.js frontend origin', () => {
    expect(resolveCorsOrigins(undefined, false)).toEqual(DEV_DEFAULT_ORIGINS);
    expect(resolveCorsOrigins('', false)).toEqual(['http://localhost:3000']);
  });

  it('development honours an explicit ALLOWED_ORIGINS list', () => {
    expect(resolveCorsOrigins('https://app.foodloop.org , http://localhost:3000', false)).toEqual([
      'https://app.foodloop.org',
      'http://localhost:3000',
    ]);
  });

  it('production with no configured origins disables cross-origin requests (no wildcard fallback)', () => {
    expect(resolveCorsOrigins(undefined, true)).toBe(false);
  });

  it('production honours an explicit https allowlist', () => {
    expect(resolveCorsOrigins('https://app.foodloop.org,https://admin.foodloop.org', true)).toEqual([
      'https://app.foodloop.org',
      'https://admin.foodloop.org',
    ]);
  });

  it('wildcard origins are stripped in every environment (never combined with credentials)', () => {
    expect(resolveCorsOrigins('*', false, new Logger())).toEqual(DEV_DEFAULT_ORIGINS);
    expect(resolveCorsOrigins('*, https://app.foodloop.org', true, new Logger())).toEqual([
      'https://app.foodloop.org',
    ]);
  });

  it('rejects non-absolute origins in production', () => {
    expect(() => resolveCorsOrigins('not-a-origin', true)).toThrow(/ALLOWED_ORIGINS entries must be absolute origins/);
  });

  it('non-absolute origins are tolerated in development but replaced by the dev default when list empties', () => {
    expect(resolveCorsOrigins('localhost:3000', false)).toEqual(['localhost:3000']);
  });
});
