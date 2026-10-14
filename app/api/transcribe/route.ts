import { NextResponse } from 'next/server';
import Groq, { toFile } from 'groq-sdk';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const rawKey = process.env.GROQ_API_KEY?.trim().replace(/^["']|["']$/g, '');
    if (!rawKey) {
      return NextResponse.json(
        {
          error:
            'Server-side Whisper transcription requires GROQ_API_KEY in your environment.',
        },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const audioEntry = formData.get('audio') || formData.get('file');

    if (!audioEntry || !(audioEntry instanceof Blob)) {
      return NextResponse.json(
        { error: 'No valid audio data was provided.' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await audioEntry.arrayBuffer());
    if (buffer.length < 500) {
      return NextResponse.json(
        { error: 'Audio recording was too short or empty. Please speak again.' },
        { status: 400 },
      );
    }

    const mimeType = audioEntry.type || 'audio/webm';
    const extension = mimeType.includes('mp4')
      ? 'mp4'
      : mimeType.includes('ogg')
        ? 'ogg'
        : mimeType.includes('wav')
          ? 'wav'
          : 'webm';

    const file = await toFile(buffer, `recording.${extension}`, {
      type: mimeType,
    });

    const client = new Groq({ apiKey: rawKey });
    const transcription = await client.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3-turbo',
      language: 'en',
      response_format: 'json',
      temperature: 0.0,
    });

    const text = transcription.text?.trim() || '';
    return NextResponse.json({ text });
  } catch (error) {
    console.error('Whisper transcription error:', error);
    const message =
      error instanceof Error ? error.message : 'Transcription service failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
