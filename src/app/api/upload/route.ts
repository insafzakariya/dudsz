import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSiteConfig } from '@/lib/actions/site-config';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);

    // Get site config for watermark
    const config = await getSiteConfig();
    const watermarkText = config.watermarkText || 'DUDSZ.lk';

    // Process image with sharp and add watermark
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();
      const width = metadata.width || 800;
      const height = metadata.height || 600;

      // Calculate watermark size and position
      const fontSize = Math.floor(width / 20); // Responsive font size
      const padding = Math.floor(fontSize / 2);

      // Create SVG watermark
      const svgWatermark = `
        <svg width="${width}" height="${height}">
          <style>
            .watermark {
              fill: white;
              font-size: ${fontSize}px;
              font-family: Arial, sans-serif;
              font-weight: bold;
              opacity: 0.8;
            }
          </style>
          <rect x="${width - (watermarkText.length * fontSize * 0.6) - padding * 2}"
                y="${height - fontSize - padding * 2}"
                width="${watermarkText.length * fontSize * 0.6 + padding * 2}"
                height="${fontSize + padding * 2}"
                fill="rgba(0,0,0,0.5)"
                rx="8"/>
          <text x="${width - padding}"
                y="${height - padding}"
                text-anchor="end"
                class="watermark">${watermarkText}</text>
        </svg>
      `;

      // Apply watermark
      buffer = await image
        .composite([
          {
            input: Buffer.from(svgWatermark),
            top: 0,
            left: 0,
          },
        ])
        .toBuffer();
    } catch (imageError) {
      console.error('Error adding watermark:', imageError);
      // If watermarking fails, continue with original image
    }

    // Convert to base64
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      filename: file.name,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
