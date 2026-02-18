import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question } = body;

    const uploadDir = path.join(process.cwd(), 'upload');
    const images = fs.readdirSync(uploadDir)
      .filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png'))
      .map(f => path.join(uploadDir, f));

    if (images.length === 0) {
      return NextResponse.json({ error: 'No images found' }, { status: 404 });
    }

    const zai = await ZAI.create();

    const content = [
      { type: 'text', text: question },
      ...images.map(imgPath => {
        const imageBuffer = fs.readFileSync(imgPath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = imgPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
        return {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${base64Image}`
          }
        };
      })
    ];

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: content as any
        }
      ],
      thinking: { type: 'disabled' }
    });

    const analysis = response.choices[0]?.message?.content;

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Error analyzing images:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze images'
    }, { status: 500 });
  }
}
