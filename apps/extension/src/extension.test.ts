import { describe, it, expect } from 'vitest';
import manifest from '../manifest.json' with { type: 'json' };

describe('Browser Extension Manifest & Permissions', () => {
  it('should be configured with Manifest V3', () => {
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toContain('pill');
  });

  it('LEAST PRIVILEGE: should only request activeTab and storage permissions', () => {
    // Critical security check: Never ask for broad <all_urls> or invasive host permissions
    expect(manifest.permissions).toContain('activeTab');
    expect(manifest.permissions).toContain('storage');
    expect(manifest.permissions.length).toBe(2);
    expect(manifest.permissions).not.toContain('<all_urls>');
    expect(manifest.permissions).not.toContain('webRequest');
    expect(manifest.permissions).not.toContain('cookies');
  });

  it('should declare background service worker', () => {
    expect(manifest.background.service_worker).toBe('src/background.ts');
    expect(manifest.background.type).toBe('module');
  });
});
