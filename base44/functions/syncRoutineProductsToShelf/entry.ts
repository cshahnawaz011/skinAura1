import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Syncs products selected in routine to SavedProduct entity (product shelf).
 * Called when user selects products during routine generation.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { products, routine_id } = body;

    if (!products || !Array.isArray(products)) {
      return Response.json({ error: 'Invalid products data' }, { status: 400 });
    }

    const synced = [];

    for (const product of products) {
      if (!product.name) continue;

      // Check if product already exists
      const existing = await base44.entities.SavedProduct.filter({
        user_email: user.email,
        product_name: product.name,
        brand: product.brand || '',
      }).then(r => r[0] || null);

      if (existing) {
        // Update existing
        await base44.entities.SavedProduct.update(existing.id, {
          routine_step: product.routine_step || 'selected',
          skin_compatibility_score: product.compatibility_score || 85,
        });
        synced.push({ id: existing.id, action: 'updated' });
      } else {
        // Create new
        const newProduct = await base44.entities.SavedProduct.create({
          user_email: user.email,
          product_name: product.name,
          brand: product.brand || 'Unknown',
          category: product.category || 'treatment',
          key_ingredients: product.key_ingredients || [],
          benefits: product.benefits || '',
          price_range: product.price_range || 'mid',
          rating: product.rating || 4.5,
          routine_step: product.routine_step || 'selected',
          skin_compatibility_score: product.compatibility_score || 85,
          skin_analysis_notes: `Added from routine ${routine_id || 'generation'}`,
        });
        synced.push({ id: newProduct.id, action: 'created', name: product.name });
      }
    }

    return Response.json({
      message: 'Products synced to shelf',
      synced_count: synced.length,
      products: synced,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});