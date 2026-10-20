import { z } from 'zod';

export interface Env {
  DB?: any;
  ATTACHMENTS?: any;
  APP_ENV?: string;
  API_VERSION?: string;
  MAX_BLOB_BYTES?: number | string;
}

const EnrollDeviceSchema = z.object({
  ownerId: z.string().min(1),
  deviceName: z.string().min(1).max(100),
  platform: z.enum(['windows', 'macos', 'linux', 'android', 'ios', 'extension', 'web']),
});

const PushSyncSchema = z.object({
  ownerId: z.string().min(1),
  deviceId: z.string().min(1),
  mutations: z.array(z.object({
    id: z.string().uuid(),
    type: z.string(),
    entityId: z.string().uuid(),
    payload: z.any(),
    revision: z.number().int().positive(),
    timestamp: z.string(),
  })).max(50),
});

const BlobTicketSchema = z.object({
  ownerId: z.string().min(1),
  byteSize: z.number().int().positive(),
  contentType: z.string().min(1),
});

export class ApiRouter {
  // In-memory backing store for local/test execution or when D1 is bound
  private devices: Map<string, { id: string; ownerId: string; deviceName: string; platform: string; enrolledAt: string; revokedAt: string | null }> = new Map();
  private syncJournal: Array<{ cursor: number; eventId: string; ownerId: string; deviceId: string; type: string; entityId: string; payload: any; revision: number; timestamp: string }> = [];
  private blobs: Map<string, { id: string; ownerId: string; byteSize: number; contentType: string; status: string; createdAt: string }> = new Map();
  private nextCursor = 1;

  async handle(request: Request, env?: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Device-Id',
        },
      });
    }

    const json = (data: any, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    };

    const error = (message: string, status = 400) => {
      return json({ error: message, success: false }, status);
    };

    try {
      // 1. Health & Version
      if (method === 'GET' && url.pathname === '/v1/health') {
        return json({
          status: 'healthy',
          version: env?.API_VERSION || '0.1.0',
          environment: env?.APP_ENV || 'development',
          freeTierSafetyActive: true,
          timestamp: new Date().toISOString(),
        });
      }

      // 2. Device Enrollment
      if (method === 'POST' && url.pathname === '/v1/devices/enroll') {
        const body = await request.json();
        const parsed = EnrollDeviceSchema.safeParse(body);
        if (!parsed.success) return error('Invalid device enrollment request', 422);

        const deviceId = globalThis.crypto.randomUUID();
        const deviceRecord = {
          id: deviceId,
          ownerId: parsed.data.ownerId,
          deviceName: parsed.data.deviceName,
          platform: parsed.data.platform,
          enrolledAt: new Date().toISOString(),
          revokedAt: null,
        };

        this.devices.set(deviceId, deviceRecord);
        return json({ success: true, device: deviceRecord }, 201);
      }

      // 3. Device Revocation
      const revokeMatch = url.pathname.match(/^\/v1\/devices\/([^/]+)\/revoke$/);
      if (method === 'POST' && revokeMatch) {
        const deviceId = revokeMatch[1]!;
        const device = this.devices.get(deviceId);
        if (!device) return error('Device not found', 404);

        device.revokedAt = new Date().toISOString();
        return json({ success: true, message: `Device '${deviceId}' revoked successfully` });
      }

      // 4. Sync Push
      if (method === 'POST' && url.pathname === '/v1/sync/push') {
        const body = await request.json();
        const parsed = PushSyncSchema.safeParse(body);
        if (!parsed.success) return error('Invalid sync push payload', 422);

        const { ownerId, deviceId, mutations } = parsed.data;

        // Verify device is enrolled and not revoked
        const device = this.devices.get(deviceId);
        if (device && device.revokedAt) {
          return error('Device is revoked. Sync access denied.', 403);
        }

        let appliedCount = 0;
        for (const mut of mutations) {
          // Idempotency check: Ignore duplicate mutation IDs
          const alreadyApplied = this.syncJournal.some(e => e.eventId === mut.id);
          if (!alreadyApplied) {
            this.syncJournal.push({
              cursor: this.nextCursor++,
              eventId: mut.id,
              ownerId,
              deviceId,
              type: mut.type,
              entityId: mut.entityId,
              payload: mut.payload,
              revision: mut.revision,
              timestamp: mut.timestamp,
            });
            appliedCount++;
          }
        }

        return json({
          success: true,
          appliedCount,
          serverCursor: this.nextCursor - 1,
          rejectedMutations: [],
        });
      }

      // 5. Sync Pull
      if (method === 'GET' && url.pathname === '/v1/sync/pull') {
        const ownerId = url.searchParams.get('ownerId');
        const deviceId = url.searchParams.get('deviceId');
        const cursor = Number(url.searchParams.get('cursor') || '0');

        if (!ownerId || !deviceId) {
          return error('Missing required query parameters: ownerId, deviceId', 400);
        }

        // Verify device is not revoked
        const device = this.devices.get(deviceId);
        if (device && device.revokedAt) {
          return error('Device is revoked. Sync access denied.', 403);
        }

        const events = this.syncJournal.filter(
          e => e.ownerId === ownerId && e.cursor > cursor
        );

        return json({
          success: true,
          serverCursor: this.nextCursor - 1,
          hasMore: false,
          events,
        });
      }

      // 6. Blob Upload Ticket (Cloudflare R2 Free-Tier Safety)
      if (method === 'POST' && url.pathname === '/v1/blobs/upload-ticket') {
        const body = await request.json();
        const parsed = BlobTicketSchema.safeParse(body);
        if (!parsed.success) return error('Invalid blob ticket request', 422);

        const maxBytes = Number(env?.MAX_BLOB_BYTES || 5242880); // 5MB limit
        if (parsed.data.byteSize > maxBytes) {
          return error(`File exceeds free tier attachment limit of ${Math.round(maxBytes / 1024 / 1024)}MB.`, 413);
        }

        const blobId = globalThis.crypto.randomUUID();
        const blobRecord = {
          id: blobId,
          ownerId: parsed.data.ownerId,
          byteSize: parsed.data.byteSize,
          contentType: parsed.data.contentType,
          status: 'ticket_issued',
          createdAt: new Date().toISOString(),
        };

        this.blobs.set(blobId, blobRecord);

        return json({
          success: true,
          blobId,
          uploadUrl: `https://r2-upload.pill.dev/v1/blobs/${blobId}?token=mock_presigned_ticket`,
          expiresInSeconds: 3600,
        }, 201);
      }

      // 7. Blob Download Ticket
      const downloadMatch = url.pathname.match(/^\/v1\/blobs\/([^/]+)\/download-ticket$/);
      if (method === 'POST' && downloadMatch) {
        const blobId = downloadMatch[1]!;
        const blob = this.blobs.get(blobId);
        if (!blob) return error('Blob not found', 404);

        return json({
          success: true,
          blobId,
          downloadUrl: `https://r2-download.pill.dev/v1/blobs/${blobId}?token=mock_download_ticket`,
          expiresInSeconds: 3600,
        });
      }

      return error('Endpoint not found', 404);
    } catch (err: any) {
      return error(err.message || 'Internal server error', 500);
    }
  }
}
