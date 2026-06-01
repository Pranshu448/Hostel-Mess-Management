import { useEffect, useState } from 'react';
import { ratingsAPI } from '../../services/api';

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-2xl ${star <= value ? 'text-amber-400' : 'text-slate-300'}`}
          aria-label={`Rate ${star} stars`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function FoodRatingsTab({ token }) {
  const [dishes, setDishes] = useState([]);
  const [ratings, setRatings] = useState({});
  const [draft, setDraft] = useState({});
  const [message, setMessage] = useState('');

  const load = async () => {
    const [dRes, rRes] = await Promise.all([ratingsAPI.getDishes(token), ratingsAPI.list(token)]);
    setDishes(dRes.dishes || []);
    const map = {};
    (rRes.ratings || []).forEach((r) => {
      map[r.dishName] = r.rating;
    });
    setRatings(map);
    setDraft(map);
  };

  useEffect(() => {
    if (token) load();
  }, [token]);

  const submit = async (dishName) => {
    const rating = draft[dishName];
    if (!rating) return;
    await ratingsAPI.submit(token, { dishName, rating });
    setMessage(`Rated ${dishName}`);
    await load();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800">Food Ratings</h2>
      <p className="text-slate-500 text-sm">Your ratings train the menu ML models (NMF + gradient boosting).</p>
      {message && <p className="text-green-600 text-sm">{message}</p>}
      <div className="space-y-4">
        {dishes.map((d) => (
          <div key={d._id || d.name} className="bg-white border rounded-xl p-4 flex flex-wrap justify-between items-center gap-3">
            <div>
              <p className="font-semibold text-slate-800">{d.name}</p>
              <p className="text-xs text-slate-500">Avg mess rating: {d.avgRating?.toFixed(1) || '—'}</p>
            </div>
            <div className="flex items-center gap-3">
              <StarRating value={draft[d.name] || 0} onChange={(v) => setDraft((p) => ({ ...p, [d.name]: v }))} />
              <button type="button" className="rounded-lg bg-blue-600 text-white px-3 py-1.5 text-sm font-semibold" onClick={() => submit(d.name)}>
                Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
