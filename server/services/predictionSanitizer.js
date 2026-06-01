const stripPredictionMeta = (prediction) => {
  if (!prediction || typeof prediction !== 'object') return prediction;
  const {
    confidence,
    modelVersion,
    explanation,
    ...rest
  } = prediction;
  return rest;
};

module.exports = { stripPredictionMeta };
