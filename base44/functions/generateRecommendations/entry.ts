import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Triggered after SkinAnalysis completion.
 * Generates product recommendations AND routine updates based on skin analysis + user history.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const analysisId = body.event?.entity_id;
    const analysisData = body.data;

    if (!analysisId || !analysisData) {
      return Response.json({ error: 'Missing analysis data' }, { status: 400 });
    }

    // Build AI prompt for recommendations
    const prompt = `New skin analysis for ${analysisData.skin_type} skin:
Score: ${analysisData.overall_score}/100
Acne: ${analysisData.acne_level}/10, Dryness: ${analysisData.dryness}/10, Oiliness: ${analysisData.oiliness}/10
Sensitivity: ${analysisData.sensitivity}/10, Dark Spots: ${analysisData.dark_spots}/10

Based on this, recommend 5 specific products (cleaner, toner, serum, moisturizer, treatment) and routine structure.
Return JSON with: products (array of {name, brand, category, key_benefits, why_for_this_skin}), routine_structure {morning_steps, night_active_options}, estimated_cost_tier.`;

    const aiRecs = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          products: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                brand: { type: 'string' },
                category: { type: 'string' },
                key_benefits: { type: 'array', items: { type: 'string' } },
                why_for_this_skin: { type: 'string' },
              },
            },
          },
          routine_structure: {
            type: 'object',
            properties: {
              morning_steps: { type: 'array', items: { type: 'string' } },
              night_active_options: { type: 'array', items: { type: 'string' } },
            },
          },
          estimated_cost_tier: { type: 'string' },
        },
      },
    });

    // Save recommendations as SavedProduct records for future reference
    for (const prod of (aiRecs.products || [])) {
      await base44.entities.SavedProduct.create({
        user_email: user.email,
        product_name: prod.name,
        brand: prod.brand,
        category: prod.category,
        key_ingredients: prod.key_benefits || [],
        benefits: prod.why_for_this_skin,
        price_range: aiRecs.estimated_cost_tier === 'Premium' ? 'premium' : aiRecs.estimated_cost_tier === 'Budget' ? 'budget' : 'mid',
        skin_compatibility_score: analysisData.overall_score,
        skin_analysis_notes: `AI-recommended post-analysis (${analysisData.skin_type} skin, Score ${analysisData.overall_score})`,
      });
    }

    return Response.json({
      analysis_id: analysisId,
      recommendations: aiRecs,
      products_saved: (aiRecs.products || []).length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});