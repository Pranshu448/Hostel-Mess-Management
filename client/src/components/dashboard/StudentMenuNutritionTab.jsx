import { useMemo } from 'react';
import NutritionProgress from './NutritionProgress';

const dayLabels = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const meals = [
  { key: 'breakfast', nutKey: 'breakfastNutrition', label: 'Breakfast' },
  { key: 'lunch', nutKey: 'lunchNutrition', label: 'Lunch' },
  { key: 'snacks', nutKey: 'snacksNutrition', label: 'Snacks' },
  { key: 'dinner', nutKey: 'dinnerNutrition', label: 'Dinner' },
];

const todayDayName = () => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
};

export default function StudentMenuNutritionTab({ menu, nutritionConfig }) {
  const today = todayDayName();
  const todayMenu = menu?.days?.[today] || {};

  const dailyTotals = useMemo(() => {
    const t = { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 };
    meals.forEach((m) => {
      const n = todayMenu[m.nutKey] || {};
      t.calories += n.calories || 0;
      t.protein += n.protein || 0;
      t.carbohydrates += n.carbohydrates || 0;
      t.fat += n.fat || 0;
      t.fiber += n.fiber || 0;
    });
    return t;
  }, [todayMenu]);

  const targets = nutritionConfig || {
    dailyCalories: 2400,
    protein: 80,
    carbohydrates: 320,
    fat: 70,
    fiber: 30,
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Weekly Menu & Nutrition</h2>
        {menu?.generatedByMl && (
          <p className="text-sm text-indigo-600 mt-1">Personalized mess menu</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-500">Daily Calories Target</p>
          <p className="text-xl font-bold">{targets.dailyCalories} kcal</p>
        </div>
        {['protein', 'carbohydrates', 'fat', 'fiber'].map((k) => (
          <div key={k} className="rounded-xl border bg-white p-4 shadow-sm capitalize">
            <p className="text-xs uppercase text-slate-500">{k}</p>
            <p className="text-xl font-bold">
              {targets[k]}
              g
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-lg capitalize">Today — {today}</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {meals.map((m) => {
            const n = todayMenu[m.nutKey] || {};
            return (
              <div key={m.key} className="rounded-lg border border-slate-100 p-4 bg-slate-50/50">
                <h4 className="font-semibold text-slate-800">{m.label}: {todayMenu[m.key] || '—'}</h4>
                <ul className="mt-2 text-sm text-slate-600 space-y-0.5">
                  <li>Calories: {n.calories || 0}</li>
                  <li>Protein: {n.protein || 0}g</li>
                  <li>Carbs: {n.carbohydrates || 0}g</li>
                  <li>Fat: {n.fat || 0}g</li>
                  <li>Fiber: {n.fiber || 0}g</li>
                </ul>
              </div>
            );
          })}
        </div>

        <div className="border-t pt-4 space-y-3">
          <h4 className="font-bold">Daily Summary</h4>
          {meals.map((m) => (
            <p key={m.key} className="text-sm text-slate-600">
              {m.label}: Calories {(todayMenu[m.nutKey]?.calories) || 0}
            </p>
          ))}
          <p className="font-bold text-slate-900">Total: {dailyTotals.calories} kcal (target {targets.dailyCalories} kcal)</p>
          <NutritionProgress label="Calories" current={dailyTotals.calories} target={targets.dailyCalories} unit=" kcal" />
          <NutritionProgress label="Protein" current={Math.round(dailyTotals.protein)} target={targets.protein} unit="g" />
          <NutritionProgress label="Carbs" current={Math.round(dailyTotals.carbohydrates)} target={targets.carbohydrates} unit="g" />
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 font-semibold text-slate-600 border-b">
              <th className="p-4 text-left">Day</th>
              {meals.map((m) => (
                <th key={m.key} className="p-4 text-left">
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {dayLabels.map((day) => (
              <tr key={day}>
                <td className="p-4 capitalize font-medium">{day}</td>
                {meals.map((m) => (
                  <td key={m.key} className="p-4 text-slate-600">
                    {menu?.days?.[day]?.[m.key] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
