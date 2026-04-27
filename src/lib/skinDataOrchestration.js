/**
 * Orchestrate and merge new skin analysis data with historical skin data
 * Ensures routine regeneration uses the most accurate, comprehensive skin profile
 */

export async function mergeSkinData(newAnalysis, pastAnalyses = []) {
  if (!newAnalysis) return null;

  // Calculate trends from past analyses
  const trends = calculateSkinTrends(newAnalysis, pastAnalyses);

  // Merge new data with historical context
  const mergedData = {
    // Current snapshot from new analysis
    ...newAnalysis,

    // Add trend indicators for routine adaptation
    skin_trends: trends,

    // Priority concerns enhanced with history
    priority_concerns_with_trends: enhanceConcernsWithHistory(
      newAnalysis.priority_concerns || [],
      pastAnalyses
    ),

    // Historical comparison
    comparison_to_previous: compareToPreviousAnalysis(newAnalysis, pastAnalyses[0]),

    // Merged insights for better routine decisions
    merged_insights: {
      consistent_concerns: getConsistentConcerns(newAnalysis, pastAnalyses),
      improving_areas: getImprovingAreas(newAnalysis, pastAnalyses),
      worsening_areas: getWorseningAreas(newAnalysis, pastAnalyses),
      stable_areas: getStableAreas(newAnalysis, pastAnalyses),
    },
  };

  return mergedData;
}

function calculateSkinTrends(newAnalysis, pastAnalyses) {
  if (pastAnalyses.length === 0) {
    return {
      trend_direction: 'baseline',
      overall_score_change: 0,
      confidence: 'low',
    };
  }

  const previousAnalysis = pastAnalyses[0];
  const scoreDiff = (newAnalysis.overall_score || 0) - (previousAnalysis.overall_score || 0);
  const dateNew = new Date(newAnalysis.analysis_date || Date.now());
  const datePrev = new Date(previousAnalysis.analysis_date || Date.now());
  const daysDiff = Math.floor((dateNew - datePrev) / (1000 * 60 * 60 * 24));

  return {
    trend_direction: scoreDiff > 2 ? 'improving' : scoreDiff < -2 ? 'worsening' : 'stable',
    overall_score_change: Math.round(scoreDiff * 10) / 10,
    days_since_last_analysis: daysDiff,
    confidence: pastAnalyses.length >= 3 ? 'high' : pastAnalyses.length >= 1 ? 'medium' : 'low',
  };
}

function enhanceConcernsWithHistory(currentConcerns, pastAnalyses) {
  if (!currentConcerns || pastAnalyses.length === 0) return currentConcerns;

  return currentConcerns.map((concern) => {
    const occurrences = pastAnalyses.filter((a) =>
      (a.priority_concerns || []).includes(concern)
    ).length;

    return {
      concern,
      persistency: occurrences > pastAnalyses.length * 0.5 ? 'persistent' : 'emerging',
      occurred_in_past_analyses: occurrences,
    };
  });
}

function compareToPreviousAnalysis(newAnalysis, previousAnalysis) {
  if (!previousAnalysis) return null;

  const metrics = [
    'acne_level',
    'dark_spots',
    'wrinkles',
    'pores',
    'redness',
    'oiliness',
    'dryness',
    'sensitivity',
  ];

  const comparison = {};
  metrics.forEach((metric) => {
    const newVal = newAnalysis[metric] || 0;
    const prevVal = previousAnalysis[metric] || 0;
    const change = newVal - prevVal;

    comparison[metric] = {
      previous: prevVal,
      current: newVal,
      change: Math.round(change * 10) / 10,
      direction: change > 0.5 ? 'worsened' : change < -0.5 ? 'improved' : 'stable',
    };
  });

  return comparison;
}

function getConsistentConcerns(newAnalysis, pastAnalyses) {
  if (pastAnalyses.length < 2) return newAnalysis.priority_concerns || [];

  const allConcerns = [
    ...(newAnalysis.priority_concerns || []),
    ...pastAnalyses.flatMap((a) => a.priority_concerns || []),
  ];

  // Count occurrences
  const concernCounts = {};
  allConcerns.forEach((c) => {
    concernCounts[c] = (concernCounts[c] || 0) + 1;
  });

  // Return concerns that appeared in at least 50% of analyses
  const threshold = Math.ceil((pastAnalyses.length + 1) * 0.5);
  return Object.entries(concernCounts)
    .filter(([, count]) => count >= threshold)
    .map(([concern]) => concern);
}

function getImprovingAreas(newAnalysis, pastAnalyses) {
  if (pastAnalyses.length === 0) return [];

  const previousAnalysis = pastAnalyses[0];
  const metrics = [
    'acne_level',
    'dark_spots',
    'wrinkles',
    'pores',
    'redness',
    'oiliness',
    'dryness',
    'sensitivity',
  ];

  return metrics
    .filter((metric) => {
      const newVal = newAnalysis[metric] || 0;
      const prevVal = previousAnalysis[metric] || 0;
      return newVal < prevVal - 0.5; // Improvement threshold
    })
    .map((metric) => ({
      area: metric,
      improvement: Math.round((previousAnalysis[metric] - newAnalysis[metric]) * 10) / 10,
    }));
}

function getWorseningAreas(newAnalysis, pastAnalyses) {
  if (pastAnalyses.length === 0) return [];

  const previousAnalysis = pastAnalyses[0];
  const metrics = [
    'acne_level',
    'dark_spots',
    'wrinkles',
    'pores',
    'redness',
    'oiliness',
    'dryness',
    'sensitivity',
  ];

  return metrics
    .filter((metric) => {
      const newVal = newAnalysis[metric] || 0;
      const prevVal = previousAnalysis[metric] || 0;
      return newVal > prevVal + 0.5; // Worsening threshold
    })
    .map((metric) => ({
      area: metric,
      worsening: Math.round((newAnalysis[metric] - previousAnalysis[metric]) * 10) / 10,
    }));
}

function getStableAreas(newAnalysis, pastAnalyses) {
  if (pastAnalyses.length === 0) return [];

  const previousAnalysis = pastAnalyses[0];
  const metrics = [
    'acne_level',
    'dark_spots',
    'wrinkles',
    'pores',
    'redness',
    'oiliness',
    'dryness',
    'sensitivity',
  ];

  return metrics.filter((metric) => {
    const newVal = newAnalysis[metric] || 0;
    const prevVal = previousAnalysis[metric] || 0;
    return Math.abs(newVal - prevVal) <= 0.5; // Stable threshold
  });
}