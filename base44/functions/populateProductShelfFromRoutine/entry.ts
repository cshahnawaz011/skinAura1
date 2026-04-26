import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Extracts products from saved routine steps and populates SavedProduct shelf.
 * Called when SkinRoutine is created/updated.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const routineData = body.data;

    if (!routineData?.steps) {
      return Response.json({ message: 'No routine steps found' });
    }

    const steps = routineData.steps;
    const synced = [];

    // Extract products from routine steps
    const extractedProducts = [];

    // Morning routine
    if (steps.morning_routine?.length) {
      steps.morning_routine.forEach(step => {
        extractedProducts.push({
          name: step.name || 'Unknown Product',
          type: step.product_type || 'cleanser',
          routine_step: 'Morning',
          ingredients: step.key_ingredients || [],
          tip: step.tip || '',
        });
      });
    }

    // Night routine
    if (steps.night_week_plan?.length) {
      steps.night_week_plan.forEach(day => {
        if (day.steps?.length) {
          day.steps.forEach(step => {
            extractedProducts.push({
              name: step.name || 'Unknown Product',
              type: step.active ? 'active' : 'support',
              routine_step: `Night - ${day.day_label}`,
              ingredients: [],
              tip: step.tip || '',
            });
          });
        }
      });
    }

    // Weekly add-ons
    if (steps.weekly_addons?.length) {
      steps.weekly_addons.forEach(addon => {
        extractedProducts.push({
          name: addon.name || 'Unknown Product',
          type: 'treatment',
          routine_step: 'Weekly',
          ingredients: [],
          tip: addon.tip || '',
        });
      });
    }

    // Save extracted products to shelf
    for (const product of extractedProducts) {
      if (!product.name || product.name.includes('Unknown')) continue;

      const existing = await base44.entities.SavedProduct.filter({
        user_email: user.email,
        product_name: product.name,
      }).then(r => r[0] || null);

      if (!existing) {
        await base44.entities.SavedProduct.create({
          user_email: user.email,
          product_name: product.name,
          brand: 'AI-Recommended',
          category: product.type || 'treatment',
          key_ingredients: product.ingredients,
          benefits: product.tip,
          price_range: 'mid',
          rating: 4.5,
          routine_step: product.routine_step,
          skin_compatibility_score: 85,
          skin_analysis_notes: 'Added from routine generation',
        });
        synced.push(product.name);
      }
    }

    return Response.json({
      message: 'Routine products populated to shelf',
      products_added: synced.length,
      products: synced,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});