import { useEffect, useState } from 'react';
import { menuAPI, mlAPI } from '../../services/api';

const dayLabels = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const emptyDays = () =>
  Object.fromEntries(
    dayLabels.map((day) => [
      day,
      { breakfast: '', lunch: '', snacks: '', dinner: '' },
    ])
  );

export default function AdminMenuManagement({ token, menu, onMenuUpdated }) {
  const [nutrition, setNutrition] = useState({
    dailyCalories: 2400,
    protein: 80,
    carbohydrates: 320,
    fat: 70,
    fiber: 30,
  });
  const [mlLoading, setMlLoading] = useState(false);
  const [editDays, setEditDays] = useState(emptyDays());
  const [menuKey, setMenuKey] = useState(0);

  useEffect(() => {
    menuAPI.getNutrition(token).then((r) => {
      if (r.config) setNutrition(r.config);
    });
  }, [token]);

  useEffect(() => {
    if (menu?.days) {
      setEditDays(menu.days);
      setMenuKey((k) => k + 1);
    }
  }, [menu]);

  const saveNutrition = async (e) => {
    e.preventDefault();
    await menuAPI.saveNutrition(token, nutrition);
    alert('Nutrition targets saved.');
  };

  const generateMenu = async () => {
    setMlLoading(true);
    try {
      const weekStartDate = new Date().toISOString().slice(0, 10);
      const res = await mlAPI.generateMenu(token, { weekStartDate });
      if (res.menu?.days) {
        setEditDays(res.menu.days);
        setMenuKey((k) => k + 1);
      }
      onMenuUpdated?.(res.menu);
      alert(res.message || 'Menu generated.');
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Could not generate menu.');
    } finally {
      setMlLoading(false);
    }
  };

  const saveMenu = async (e) => {
    e.preventDefault();
    const weekStartDate = menu?.weekStartDate || new Date().toISOString().slice(0, 10);
    const res = await menuAPI.saveWeekly(token, { weekStartDate, days: editDays });
    onMenuUpdated?.(res.menu);
    alert('Menu published.');
  };

  const updateDayField = (day, field, value) => {
    setEditDays((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold">ML Menu Generation</h3>
        <p className="text-sm text-indigo-100 mt-2">
          Retrains on ratings, attendance, and waste, then builds a varied weekly plan for all meals.
        </p>
        <button
          type="button"
          disabled={mlLoading}
          onClick={generateMenu}
          className="mt-4 rounded-lg bg-white text-indigo-700 px-5 py-2.5 font-bold shadow disabled:opacity-60"
        >
          {mlLoading ? 'Generating…' : 'Generate Menu'}
        </button>
      </div>

      <form className="bg-white rounded-xl border p-6 space-y-4" onSubmit={saveNutrition}>
        <h3 className="font-bold text-lg border-b pb-2">Nutrition Configuration</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ['dailyCalories', 'Daily Calories (kcal)'],
            ['protein', 'Protein (g)'],
            ['carbohydrates', 'Carbs (g)'],
            ['fat', 'Fat (g)'],
            ['fiber', 'Fiber (g)'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="text-xs font-bold uppercase text-slate-500">{label}</label>
              <input
                type="number"
                className="w-full mt-1 rounded-lg border p-2 text-sm"
                value={nutrition[key]}
                onChange={(e) => setNutrition((p) => ({ ...p, [key]: Number(e.target.value) }))}
              />
            </div>
          ))}
        </div>
        <button type="submit" className="rounded-lg bg-emerald-600 text-white px-5 py-2 font-semibold">
          Save Nutrition Targets
        </button>
      </form>

      <form key={menuKey} className="bg-white rounded-xl border p-6 space-y-4" onSubmit={saveMenu}>
        <h3 className="font-bold text-lg">Review / Edit Generated Weekly Menu</h3>
        {dayLabels.map((day) => (
          <div key={day} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
            <span className="text-sm font-semibold capitalize">{day}</span>
            {['breakfast', 'lunch', 'snacks', 'dinner'].map((meal) => (
              <input
                key={meal}
                value={editDays[day]?.[meal] || ''}
                onChange={(e) => updateDayField(day, meal, e.target.value)}
                placeholder={meal}
                className="rounded-lg border p-2 text-sm"
              />
            ))}
          </div>
        ))}
        <button type="submit" className="rounded-lg bg-blue-600 text-white px-5 py-2 font-semibold">
          Publish Manual Edits
        </button>
      </form>
    </div>
  );
}
