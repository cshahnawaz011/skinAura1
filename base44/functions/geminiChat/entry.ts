import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const GEMINI_15_FLASH = 'gemini-2.0-flash';
const API_KEY = Deno.env.get('GEMINI_API_KEY');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { prompt, responseJsonSchema } = await req.json();

    if (!prompt) return Response.json({ error: 'No prompt provided' }, { status: 400 });

    const generationConfig = {
      temperature: 0.4,
    };

    if (responseJsonSchema) {
      generationConfig.responseMimeType = 'application/json';
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_15_FLASH}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig,
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

    if (responseJsonSchema) {
      return Response.json(JSON.parse(text));
    }

    return Response.json({ text });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});