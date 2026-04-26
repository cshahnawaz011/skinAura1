import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MODELS = {
  flash2: 'gemini-2.0-flash',       // Skin analysis — full vision power
  flash15: 'gemini-2.0-flash-lite', // Other features — fast & cheap
};

async function urlToBase64(url) {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });
    }

    const body = await req.json();
    const {
      prompt,
      image_urls = [],       // array of image URLs for vision
      response_json = false, // if true, expect JSON output
      use_model = 'flash15', // 'flash2' for skin analysis, 'flash15' for rest
    } = body;

    if (!prompt) {
      return Response.json({ error: 'prompt is required' }, { status: 400 });
    }

    const modelName = MODELS[use_model] || MODELS.flash15;

    // Build parts
    const parts = [];

    // Add images if provided (vision)
    for (const url of image_urls) {
      const mimeType = url.includes('.png') ? 'image/png' : 'image/jpeg';
      const data = await urlToBase64(url);
      parts.push({ inline_data: { mime_type: mimeType, data } });
    }

    parts.push({ text: prompt });

    const requestBody = {
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
        ...(response_json ? { response_mime_type: 'application/json' } : {}),
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return Response.json({ error: err?.error?.message || 'Gemini API error' }, { status: response.status });
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (response_json) {
      try {
        // Strip markdown code fences if present
        const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        const parsed = JSON.parse(cleaned);
        return Response.json({ result: parsed, model: modelName });
      } catch {
        return Response.json({ error: 'Failed to parse JSON from Gemini', raw: rawText }, { status: 500 });
      }
    }

    return Response.json({ text: rawText, model: modelName });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});