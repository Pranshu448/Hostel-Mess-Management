const ML_BASE = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

const postJson = async (path, body) => {
  const res = await fetch(`${ML_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ML service error (${res.status}): ${text}`);
  }
  return res.json();
};

const buildTrainingPayload = async (dataService) => {
  const bundle = await dataService.collectTrainingData();
  return bundle;
};

module.exports = {
  trainAttendance: (payload) => postJson('/train/attendance', payload),
  predictAttendance: (payload) => postJson('/predict/attendance', payload),
  trainMenu: (payload) => postJson('/train/menu', payload),
  generateMenu: (payload) => postJson('/generate/menu', payload),
  trainIngredientDemand: (payload) => postJson('/train/ingredient-demand', payload),
  predictIngredientDemand: (payload) => postJson('/predict/ingredient-demand', payload),
  trainWaste: (payload) => postJson('/train/waste', payload),
  predictWaste: (payload) => postJson('/predict/waste', payload),
  buildTrainingPayload,
};
