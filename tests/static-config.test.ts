import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

type StaticConfig = {
  globalHeaders: Record<string, string>;
  mimeTypes: Record<string, string>;
  routes: Array<{ route: string; headers?: Record<string, string>; rewrite?: string }>;
  responseOverrides: Record<string, { rewrite: string; statusCode: number }>;
};

describe('static deployment policy', () => {
  it('ships enforcing browser protections, immutable assets, and a manifest MIME type', async () => {
    const config = JSON.parse(await readFile('public/staticwebapp.config.json', 'utf8')) as StaticConfig;
    expect(config.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
    expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(config.globalHeaders['X-Frame-Options']).toBe('DENY');
    expect(config.globalHeaders['Permissions-Policy']).toContain('camera=()');
    expect(config.globalHeaders['Cross-Origin-Opener-Policy']).toBe('same-origin');
    expect(config.mimeTypes['.webmanifest']).toBe('application/manifest+json');
    expect(config.routes.find((route) => route.route === '/assets/*')?.headers?.['Cache-Control']).toContain('immutable');
    expect(config.routes.find((route) => route.route === '/sw.js')?.headers?.['Cache-Control']).toContain('no-cache');
    expect(config.routes.find((route) => route.route === '/demo')?.rewrite).toBe('/demo/index.html');
    expect(config.responseOverrides['404']).toEqual({ rewrite: '/404.html', statusCode: 404 });
  });
});
