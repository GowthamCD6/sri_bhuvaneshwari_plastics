const toNumber = (value) => {
  const parsed = Number.parseFloat(String(value ?? '').replace(/,/g, ''));
  if (!Number.isFinite(parsed)) return 0;
  // Stabilize floating point imprecision by rounding to 6 decimal places
  return Math.round(parsed * 1e6) / 1e6;
};

const calculateAllValues = (data = {}) => {
  const componentWeight = toNumber(data.componentWeight);
  const noOfCavity = toNumber(data.noOfCavity);
  const runnerWeightPerShot = toNumber(data.runnerWeightPerShot);
  const requirementPerMonth = toNumber(data.requirementPerMonth);
  const ratePerPiece = toNumber(data.ratePerPiece);
  const rawMaterialCostPerKg = toNumber(data.rawMaterialCostPerKg);

  const totalComponentWeight = componentWeight * noOfCavity;
  const shotWeight = (componentWeight * noOfCavity) + runnerWeightPerShot;
  const processLoss = shotWeight * 0.02;
  const totalShotWeight = shotWeight + processLoss;
  const piecesPerKg = totalShotWeight > 0 ? (1000 * noOfCavity) / totalShotWeight : 0;
  const ppuPerKg = totalShotWeight > 0 ? (1000 / totalShotWeight) * noOfCavity : 0;
  const runnerReturnPerPiece = noOfCavity > 0 ? runnerWeightPerShot / noOfCavity : 0;
  const amount = requirementPerMonth * ratePerPiece;
  const rawMaterialCostPerComponent = noOfCavity > 0
    ? (totalShotWeight * rawMaterialCostPerKg) / (noOfCavity * 1000)
    : 0;
  const rawMaterialForTotalQty = ppuPerKg > 0 ? requirementPerMonth / ppuPerKg : 0;
  const rmPercentage = ratePerPiece > 0 ? rawMaterialCostPerComponent / ratePerPiece : 0;

  return {
    componentWeight,
    noOfCavity,
    runnerWeightPerShot,
    requirementPerMonth,
    ratePerPiece,
    rawMaterialCostPerKg,
    totalComponentWeight,
    shotWeight,
    processLoss,
    totalShotWeight,
    piecesPerKg,
    ppuPerKg,
    runnerReturnPerPiece,
    amount,
    rawMaterialCostPerComponent,
    rawMaterialForTotalQty,
    rmPercentage,
  };
};

module.exports = { calculateAllValues };
