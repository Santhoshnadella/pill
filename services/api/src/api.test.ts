import { describe, it, expect, beforeEach } from 'vitest';
import { ApiRouter } from './router.js';

describe('Cloudflare Workers API Relay & Quota Safeguards', () => {
  let router: ApiRouter;

  beforeEach(() => {
    router = new ApiRouter();
  });

  it('GET /v1/health should return 200 with free-tier safety flags', async () => {
    const req = new Request('http://localhost/v1/health');
    const res = await router.handle(req);
    expect(res.status).toBe(200);

    const body = await res.json() as any;
    expect(body.status).toBe('healthy');
    expect(body.freeTierSafetyActive).toBe(true);
  });

  it('POST /v1/devices/enroll should register a device', async () => {
    const req = new Request('http://localhost/v1/devices/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerId: 'alice',
        deviceName: 'Alice MacBook Pro',
        platform: 'macos',
      }),
    });

    const res = await router.handle(req);
    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.device.id).toBeDefined();
    expect(body.device.deviceName).toBe('Alice MacBook Pro');
  });

  it('POST /v1/sync/push should apply mutations and enforce idempotency', async () => {
    const mutationId = '11111111-1111-4111-8111-111111111111';
    const entityId = '22222222-2222-4222-8222-222222222222';

    const pushPayload = {
      ownerId: 'alice',
      deviceId: 'dev_123',
      mutations: [
        {
          id: mutationId,
          type: 'create_pill',
          entityId,
          payload: { title: 'First Note' },
          revision: 1,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    // First push
    const req1 = new Request('http://localhost/v1/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pushPayload),
    });
    const res1 = await router.handle(req1);
    const body1 = await res1.json() as any;
    expect(body1.appliedCount).toBe(1);
    expect(body1.serverCursor).toBe(1);

    // Duplicate push (Idempotency test)
    const req2 = new Request('http://localhost/v1/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pushPayload),
    });
    const res2 = await router.handle(req2);
    const body2 = await res2.json() as any;
    expect(body2.appliedCount).toBe(0); // Duplicate mutation was safely ignored!
    expect(body2.serverCursor).toBe(1);
  });

  it('GET /v1/sync/pull should return incremental events by cursor', async () => {
    // Push two events
    await router.handle(new Request('http://localhost/v1/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerId: 'alice',
        deviceId: 'dev_123',
        mutations: [
          {
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            type: 'create_pill',
            entityId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            payload: { title: 'Event 1' },
            revision: 1,
            timestamp: new Date().toISOString(),
          },
          {
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
            type: 'create_pill',
            entityId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
            payload: { title: 'Event 2' },
            revision: 1,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    }));

    // Pull with cursor = 1 (should only get the second event)
    const pullReq = new Request('http://localhost/v1/sync/pull?ownerId=alice&deviceId=dev_123&cursor=1');
    const pullRes = await router.handle(pullReq);
    expect(pullRes.status).toBe(200);

    const pullBody = await pullRes.json() as any;
    expect(pullBody.events.length).toBe(1);
    expect(pullBody.events[0].cursor).toBe(2);
  });

  it('CRITICAL SECURITY: Revoked device cannot push or pull sync changes', async () => {
    // 1. Enroll device
    const enrollRes = await router.handle(new Request('http://localhost/v1/devices/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerId: 'alice',
        deviceName: 'Compromised Phone',
        platform: 'android',
      }),
    }));
    const { device } = await enrollRes.json() as any;

    // 2. Revoke device
    const revokeRes = await router.handle(new Request(`http://localhost/v1/devices/${device.id}/revoke`, {
      method: 'POST',
    }));
    expect(revokeRes.status).toBe(200);

    // 3. Attempt push from revoked device (Must fail 403)
    const pushRes = await router.handle(new Request('http://localhost/v1/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerId: 'alice',
        deviceId: device.id,
        mutations: [],
      }),
    }));
    expect(pushRes.status).toBe(403);

    // 4. Attempt pull from revoked device (Must fail 403)
    const pullRes = await router.handle(new Request(`http://localhost/v1/sync/pull?ownerId=alice&deviceId=${device.id}&cursor=0`));
    expect(pullRes.status).toBe(403);
  });

  it('FREE-TIER QUOTA CEILING: Rejects attachments exceeding 5MB limit', async () => {
    // 6MB payload (Exceeds 5MB free-tier ceiling)
    const oversizedReq = new Request('http://localhost/v1/blobs/upload-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerId: 'alice',
        byteSize: 6 * 1024 * 1024,
        contentType: 'video/mp4',
      }),
    });

    const res = await router.handle(oversizedReq, { MAX_BLOB_BYTES: 5242880 });
    expect(res.status).toBe(413); // Payload Too Large

    // Valid 2MB payload passes
    const validReq = new Request('http://localhost/v1/blobs/upload-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerId: 'alice',
        byteSize: 2 * 1024 * 1024,
        contentType: 'image/png',
      }),
    });

    const validRes = await router.handle(validReq, { MAX_BLOB_BYTES: 5242880 });
    expect(validRes.status).toBe(201);
    const validBody = await validRes.json() as any;
    expect(validBody.uploadUrl).toBeDefined();
    expect(validBody.blobId).toBeDefined();
  });
});
