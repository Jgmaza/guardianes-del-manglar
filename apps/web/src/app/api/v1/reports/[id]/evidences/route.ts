import { NextResponse } from 'next/server';
import { getReportService } from '@/server/report-service';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/reports/:id/evidences
 * JSON body with base64 file content for foundation upload.
 * Distinguishes sharedLocation vs EXIF; hash is integrity of bytes only.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      mimeType?: string;
      contentBase64?: string;
      sharedLocation?: { longitude: number; latitude: number };
      mediaKind?: 'photo' | 'video' | 'other';
    };

    if (!body.mimeType || !body.contentBase64) {
      return NextResponse.json(
        { error: 'mimeType and contentBase64 are required' },
        { status: 400 },
      );
    }

    const bytes = Buffer.from(body.contentBase64, 'base64');
    const { evidence, verifications } = await getReportService().addEvidence(id, {
      bytes,
      mimeType: body.mimeType,
      sharedLocation: body.sharedLocation,
      mediaKind: body.mediaKind,
    });

    return NextResponse.json(
      {
        data: {
          evidence: {
            id: evidence.id,
            reportId: evidence.reportId,
            mediaKind: evidence.mediaKind,
            mimeType: evidence.mimeType,
            byteLength: evidence.byteLength,
            sha256: evidence.sha256,
            storageKey: evidence.storageKey,
            sharedLocation: evidence.sharedLocation ?? null,
            exif: evidence.exif,
            receivedAt: evidence.receivedAt,
          },
          verifications,
        },
        meta: {
          caveats: [
            'SHA-256 proves integrity of stored bytes, not authenticity of origin.',
            'Shared location is not EXIF GPS and does not prove where a photo was taken.',
            'WhatsApp often strips EXIF; missing EXIF is inconclusive.',
            'Institutional validation remains required.',
          ],
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Evidence upload failed' },
      { status: 400 },
    );
  }
}
