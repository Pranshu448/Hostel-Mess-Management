import { useEffect, useState } from 'react';
import { wasteAPI } from '../../services/api';

export default function AdminWasteTab({ token }) {
  const [history, setHistory] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [items, setItems] = useState([{ ingredient: 'Rice', quantity: 0, unit: 'kg' }]);

  const load = () =>
    wasteAPI.list(token).then((r) => {
      setHistory(r.history || []);
    });

  useEffect(() => {
    if (token) load();
  }, [token]);

  const addRow = () => setItems((p) => [...p, { ingredient: '', quantity: 0, unit: 'kg' }]);

  const save = async (e) => {
    e.preventDefault();
    const date = e.target.date.value;
    await wasteAPI.save(token, { date, items: items.filter((i) => i.ingredient && i.quantity > 0) });
    load();
    setItems([{ ingredient: 'Rice', quantity: 0, unit: 'kg' }]);
    alert('Waste record saved.');
  };

  const predict = async () => {
    try {
      const res = await wasteAPI.predict(token);
      setPrediction(res.prediction);
    } catch {
      alert('Could not load waste prediction.');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Food Waste Management</h2>

      <form className="bg-white border rounded-xl p-6 space-y-4" onSubmit={save}>
        <input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-lg border p-2" required />
        {items.map((row, idx) => (
          <div key={idx} className="flex gap-2 flex-wrap">
            <input
              className="rounded-lg border p-2 text-sm flex-1"
              placeholder="Ingredient"
              value={row.ingredient}
              onChange={(e) => {
                const next = [...items];
                next[idx].ingredient = e.target.value;
                setItems(next);
              }}
            />
            <input
              type="number"
              step="0.1"
              className="rounded-lg border p-2 text-sm w-28"
              placeholder="Qty"
              value={row.quantity}
              onChange={(e) => {
                const next = [...items];
                next[idx].quantity = Number(e.target.value);
                setItems(next);
              }}
            />
            <input
              className="rounded-lg border p-2 text-sm w-24"
              value={row.unit}
              onChange={(e) => {
                const next = [...items];
                next[idx].unit = e.target.value;
                setItems(next);
              }}
            />
          </div>
        ))}
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={addRow} className="text-sm text-blue-600 font-semibold">
            + Add item
          </button>
          <button type="submit" className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold">
            Save Waste Entry
          </button>
          <button type="button" onClick={predict} className="rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-semibold">
            Predict Tomorrow&apos;s Waste
          </button>
        </div>
      </form>

      {prediction && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
          <p className="font-bold text-amber-900">
            Expected waste for {prediction.date} · estimated cost ₹{prediction.wasteCost} ·{' '}
            {prediction.wastePercentage}% of service
          </p>
          <ul className="mt-2 space-y-1">
            {prediction.expectedWaste?.map((w) => (
              <li key={w.ingredient}>
                {w.ingredient}: {w.expectedWaste} {w.unit}
              </li>
            ))}
          </ul>
          {prediction.recommendations?.length > 0 && (
            <ul className="mt-3 text-amber-900 space-y-1">
              {prediction.recommendations.map((r) => (
                <li key={r}>• {r}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="bg-white border rounded-xl overflow-x-auto">
        <h3 className="font-bold text-slate-800 p-4 border-b">Waste History</h3>
        {history.length === 0 ? (
          <p className="p-6 text-sm text-slate-500 text-center">No waste records yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b font-semibold">
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Ingredient</th>
                <th className="p-3 text-right">Quantity</th>
                <th className="p-3 text-left">Unit</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row, idx) => (
                <tr key={`${row.recordId}-${row.ingredient}-${idx}`} className="border-b hover:bg-slate-50/50">
                  <td className="p-3 text-slate-700">{row.date}</td>
                  <td className="p-3 font-medium capitalize">{row.ingredient}</td>
                  <td className="p-3 text-right">{row.quantity}</td>
                  <td className="p-3 text-slate-600">{row.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
