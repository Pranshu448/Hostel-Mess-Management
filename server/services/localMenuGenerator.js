const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const MEAL_SLOTS = ['breakfast', 'lunch', 'snacks', 'dinner'];
const MEAL_CAL_SHARE = { breakfast: 0.21, lunch: 0.37, snacks: 0.08, dinner: 0.34 };

const mulberry32 = (seed) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const generateMenuLocally = (payload) => {
  const rng = mulberry32(payload.generation_nonce || Date.now());
  const dishes = payload.dishes?.length
    ? payload.dishes
    : [
        { name: 'Poha', mealTypes: ['breakfast'], nutrition: { calories: 280, protein: 6, carbohydrates: 48, fat: 7, fiber: 3 }, avgRating: 4 },
        { name: 'Dosa', mealTypes: ['breakfast'], nutrition: { calories: 350, protein: 7, carbohydrates: 55, fat: 9, fiber: 2 }, avgRating: 4.2 },
        { name: 'Rajma Rice', mealTypes: ['lunch', 'dinner'], nutrition: { calories: 480, protein: 18, carbohydrates: 72, fat: 12, fiber: 9 }, avgRating: 4.5 },
        { name: 'Paneer Butter Masala', mealTypes: ['lunch', 'dinner'], nutrition: { calories: 520, protein: 22, carbohydrates: 38, fat: 28, fiber: 4 }, avgRating: 4.8 },
        { name: 'Bhelpuri', mealTypes: ['snacks'], nutrition: { calories: 220, protein: 4, carbohydrates: 38, fat: 6, fiber: 3 }, avgRating: 3.8 },
        { name: 'Dal Makhani', mealTypes: ['dinner'], nutrition: { calories: 450, protein: 16, carbohydrates: 52, fat: 18, fiber: 6 }, avgRating: 4.3 },
      ];

  const ratingMap = {};
  (payload.ratings || []).forEach((r) => {
    const key = r.dishName;
    if (!ratingMap[key]) ratingMap[key] = [];
    ratingMap[key].push(r.rating);
  });

  const dishScores = dishes.map((d) => {
    const ratings = ratingMap[d.name] || [];
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : d.avgRating || 3.5;
    return { ...d, score: avg + rng() * 0.8 };
  });

  const targets = payload.nutrition_targets || {
    dailyCalories: 2400,
    protein: 80,
    carbohydrates: 320,
    fat: 70,
    fiber: 30,
  };

  const weekUsage = {};
  const days = {};

  DAY_NAMES.forEach((day, dayIdx) => {
    const usedToday = new Set();
    const dayMenu = {};

    MEAL_SLOTS.forEach((slot) => {
      const candidates = dishScores
        .filter((d) => {
          if (usedToday.has(d.name)) return false;
          const types = d.mealTypes?.length ? d.mealTypes : MEAL_SLOTS;
          return types.includes(slot);
        })
        .map((d) => ({
          ...d,
          adjusted:
            d.score +
            Math.sin(dayIdx + d.name.length) * 0.2 -
            (weekUsage[d.name] || 0) * 0.35 +
            rng() * 0.5,
        }))
        .sort((a, b) => b.adjusted - a.adjusted);

      const pick = candidates[0] || dishScores[Math.floor(rng() * dishScores.length)];
      usedToday.add(pick.name);
      weekUsage[pick.name] = (weekUsage[pick.name] || 0) + 1;

      dayMenu[slot] = pick.name;
      const nut = pick.nutrition || {};
      const share = MEAL_CAL_SHARE[slot];
      dayMenu[`${slot}Nutrition`] = {
        calories: Math.round(nut.calories || targets.dailyCalories * share),
        protein: Math.round((nut.protein || targets.protein * share) * 10) / 10,
        carbohydrates: Math.round((nut.carbohydrates || targets.carbohydrates * share) * 10) / 10,
        fat: Math.round((nut.fat || targets.fat * share) * 10) / 10,
        fiber: Math.round((nut.fiber || targets.fiber * share) * 10) / 10,
      };
    });

    days[day] = dayMenu;
  });

  return {
    days,
    generatedByMl: true,
    mlMetadata: { explanation: 'Generated from ratings and dish catalog with weekly variety.' },
  };
};

module.exports = { generateMenuLocally };
