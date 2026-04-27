import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const GEMINI_2_FLASH = 'gemini-2.0-flash';
const API_KEY = Deno.env.get('GEMINI_API_KEY');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { imageUrls, prompt } = await req.json();

    if (!imageUrls || !imageUrls.length) {
      return Response.json({ error: 'No image URLs provided' }, { status: 400 });
    }

    // Fetch images and convert to base64
    const imageParts = await Promise.all(imageUrls.map(async (url) => {
      const res = await fetch(url);
      const arrayBuffer = await res.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const mimeType = res.headers.get('content-type') || 'image/jpeg';
      return { inline_data: { data: base64, mime_type: mimeType } };
    }));

    const textPart = {
      text: prompt || `Analyze these 3 face photos (front, left, right). Return JSON with: overall_score (0-100), skin_type, skin_tone, acne_level (0-10), dark_spots (0-10), wrinkles (0-10), pores (0-10), redness (0-10), oiliness (0-10), dryness (0-10), sensitivity (0-10), recommendations (array of strings), skin_strengths (array of strings), priority_concerns (array of strings), concern_insights (object with keys for each concern: cause, fix, ingredient, timeline), zone_notes (object with front, left, right string descriptions). Be precise and clinical.`
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_2_FLASH}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [...imageParts, textPart] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          }
        })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return Response.json({ error: `Gemini API error: ${err}` }, { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return Response.json({ error: 'No response from Gemini' }, { status: 500 });

    const result = JSON.parse(text);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});