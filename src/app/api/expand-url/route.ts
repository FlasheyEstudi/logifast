// app/api/expand-url/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL requerida' }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const finalUrl = response.url || targetUrl;

    // Extraer coordenadas de la URL final resuelta
    let lat: number | null = null;
    let lng: number | null = null;

    // Patrón 1: ?q=lat,lng
    const qMatch = finalUrl.match(/[?&]q=([+-]?\d+(?:\.\d+)?)[,\s]+([+-]?\d+(?:\.\d+)?)/);
    if (qMatch) {
      lat = parseFloat(qMatch[1]);
      lng = parseFloat(qMatch[2]);
    }

    // Patrón 2: @lat,lng
    if (!lat || !lng) {
      const atMatch = finalUrl.match(/@([+-]?\d+(?:\.\d+)?),([+-]?\d+(?:\.\d+)?)/);
      if (atMatch) {
        lat = parseFloat(atMatch[1]);
        lng = parseFloat(atMatch[2]);
      }
    }

    // Patrón 3: /place/lat,lng
    if (!lat || !lng) {
      const placeMatch = finalUrl.match(/place\/([+-]?\d+(?:\.\d+)?)\+([+-]?\d+(?:\.\d+)?)/);
      if (placeMatch) {
        lat = parseFloat(placeMatch[1]);
        lng = parseFloat(placeMatch[2]);
      }
    }

    return NextResponse.json({
      originalUrl: targetUrl,
      finalUrl,
      lat,
      lng,
      success: Boolean(lat && lng),
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Fallo al expandir URL', details: err.message }, { status: 500 });
  }
}
