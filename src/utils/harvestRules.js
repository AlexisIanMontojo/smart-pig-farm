/**
 * Farm-defined harvest readiness rules.
 * These are configurable thresholds set by the farm, NOT a determination of the
 * optimal slaughter date, market price, or meat quality. Authorized users review
 * every classification before any action is taken.
 */
export const DEFAULT_HARVEST_CRITERIA = {
  targetWeightKg: 90,
  nearReadyMarginKg: 12,     // within this much of target => Near Ready
  minAgeDays: 150,           // farm policy minimum age
  staleRecordDays: 21,       // weight older than this is treated as outdated
};

export const READINESS = {
  READY: 'Ready',
  NEAR: 'Near Ready',
  NOT_YET: 'Not Yet Ready',
  NO_DATA: 'Insufficient Data',
};

export function classifyHarvestReadiness(pig, latestWeightRecord, criteria = DEFAULT_HARVEST_CRITERIA) {
  const c = { ...DEFAULT_HARVEST_CRITERIA, ...(criteria || {}) };

  if (!latestWeightRecord || !Number.isFinite(Number(latestWeightRecord.weightKg))) {
    return { status: READINESS.NO_DATA, reason: 'No valid weight record on file for this pig.' };
  }

  const weight = Number(latestWeightRecord.weightKg);
  const ageDays = pig?.birthDate ? Math.round((Date.now() - new Date(pig.birthDate)) / 86400000) : null;
  const recordAge = Math.round((Date.now() - new Date(latestWeightRecord.date)) / 86400000);

  if (recordAge > c.staleRecordDays) {
    return {
      status: READINESS.NO_DATA,
      reason: `Latest weight is ${recordAge} days old, beyond the ${c.staleRecordDays}-day freshness rule. Re-weigh to classify.`,
    };
  }
  if (weight >= c.targetWeightKg && ageDays !== null && ageDays < c.minAgeDays) {
    return {
      status: READINESS.NEAR,
      reason: `Weight target met (${weight} kg) but age ${ageDays} days is below the farm minimum of ${c.minAgeDays} days.`,
    };
  }
  if (weight >= c.targetWeightKg) {
    return { status: READINESS.READY, reason: `Recorded weight ${weight} kg meets the farm target of ${c.targetWeightKg} kg.` };
  }
  if (weight >= c.targetWeightKg - c.nearReadyMarginKg) {
    return {
      status: READINESS.NEAR,
      reason: `Recorded weight ${weight} kg is within ${c.nearReadyMarginKg} kg of the ${c.targetWeightKg} kg target.`,
    };
  }
  return {
    status: READINESS.NOT_YET,
    reason: `Recorded weight ${weight} kg is ${(c.targetWeightKg - weight).toFixed(1)} kg below the farm target.`,
  };
}

export const readinessTone = (status) => ({
  [READINESS.READY]: 'ok',
  [READINESS.NEAR]: 'info',
  [READINESS.NOT_YET]: 'muted',
  [READINESS.NO_DATA]: 'warn',
}[status] || 'muted');
