import { useEffect, useState } from 'react';
import { inventoryAPI, mlAPI } from '../../services/api';

const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Snacks',
  dinner: 'Dinner',
};

export default function AdminInventoryTab({ token }) {
  const [items, setItems] = useState([]);
  const [demand, setDemand] = useState(null);

  const load = () => inventoryAPI.list(token).then((r) => setItems(r.items || []));

  useEffect(() => {
    if (token) load();
  }, [token]);

  const save = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    await inventoryAPI.upsert(token, {
      name: form.get('name'),
      quantity: Number(form.get('quantity')),
      unit: form.get('unit'),
      purchaseDate: form.get('purchaseDate'),
      expiryDate: form.get('expiryDate'),
      cost: Number(form.get('cost')),
    });
    e.target.reset();
    load();
  };

  const forecastDemand = async () => {
    try {
      const res = await mlAPI.forecastDemand(token);
      setDemand(res.prediction);
    } catch {
      alert('Could not load ingredient forecast. Ensure the server and ML service are running.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        <button type="button" onClick={forecastDemand} className="rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-semibold">
          Forecast Ingredient Needs
        </button>
      </div>

      {demand?.byMeal && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate-700">
            Predicted requirements for {demand.date}
          </p>
          {Object.entries(demand.byMeal).map(([meal, rows]) => (
            <div key={meal} className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <h3 className="font-bold text-emerald-900 capitalize mb-2">{MEAL_LABELS[meal] || meal}</h3>
              {rows.length === 0 ? (
                <p className="text-sm text-emerald-700">No inventory items to forecast.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-emerald-800 border-b border-emerald-200">
                      <th className="pb-2">Item (in stock)</th>
                      <th className="pb-2">Needed</th>
                      <th className="pb-2">Shortfall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={`${meal}-${r.ingredient}`} className="border-b border-emerald-100/80">
                        <td className="py-1.5 capitalize">
                          {r.ingredient}{' '}
                          <span className="text-emerald-600 text-xs">({r.currentStock} {r.unit} on hand)</span>
                        </td>
                        <td className="py-1.5">
                          {r.quantity} {r.unit}
                        </td>
                        <td className="py-1.5 font-semibold text-amber-800">
                          {r.shortfall > 0 ? `${r.shortfall} ${r.unit}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}

      <form className="grid gap-3 md:grid-cols-3 bg-white p-6 rounded-xl border" onSubmit={save}>
        <input name="name" placeholder="Item name" className="rounded-lg border p-2 text-sm" required />
        <input name="quantity" type="number" placeholder="Quantity" className="rounded-lg border p-2 text-sm" required />
        <input name="unit" placeholder="Unit" defaultValue="kg" className="rounded-lg border p-2 text-sm" />
        <input name="purchaseDate" type="date" className="rounded-lg border p-2 text-sm" />
        <input name="expiryDate" type="date" className="rounded-lg border p-2 text-sm" />
        <input name="cost" type="number" placeholder="Cost (₹)" className="rounded-lg border p-2 text-sm" />
        <button type="submit" className="md:col-span-3 rounded-lg bg-blue-600 text-white py-2 font-semibold">
          Save Item
        </button>
      </form>

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 font-semibold border-b">
              <th className="p-4 text-left">Item</th>
              <th className="p-4 text-left">Qty</th>
              <th className="p-4 text-left">Unit</th>
              <th className="p-4 text-left">Purchase</th>
              <th className="p-4 text-left">Expiry</th>
              <th className="p-4 text-left">Cost</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i._id} className="border-b">
                <td className="p-4 font-medium capitalize">{i.name}</td>
                <td className="p-4">{i.quantity}</td>
                <td className="p-4">{i.unit}</td>
                <td className="p-4">{i.purchaseDate || '—'}</td>
                <td className="p-4">{i.expiryDate || '—'}</td>
                <td className="p-4">₹{i.cost || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
