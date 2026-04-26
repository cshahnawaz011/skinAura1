import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return Response.json({ error: 'Query required' }, { status: 400 });
    }

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Suggest 5 healthy foods or meals related to: "${query}". For skin health, prioritize foods rich in antioxidants, omega-3s, vitamins, and minerals. Return as JSON with foods array containing {name: string, benefit: string}. Keep benefits concise (1-2 sentences).`,
      response_json_schema: {
        type: 'object',
        properties: {
          foods: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                benefit: { type: 'string' },
              },
              required: ['name', 'benefit'],
            },
          },
        },
        required: ['foods'],
      },
    });

    return Response.json({ foods: res.foods || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});