import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { attendanceAPI, analyticsAPI, mlAPI } from '../../services/api';
import MealBarChart from './charts/MealBarChart';

function Card({ title, value }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default function AdminAttendanceTab({ token }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [list, setList] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [forecast, setForecast] = useState(null);

  const load = async () => {
    const [listRes, anRes] = await Promise.all([
      attendanceAPI.listByDate(token, date),
      analyticsAPI.admin(token),
    ]);
    setList(listRes.items || []);
    setAnalytics(anRes.analytics);
  };

  useEffect(() => {
    if (token) load();
  }, [token, date]);

  const runForecast = async () => {
    try {
      const res = await mlAPI.forecastAttendance(token);
      setForecast(res.prediction);
    } catch {
      alert('Start ML service (port 8000) for attendance forecasting.');
    }
  };

  const today = analytics?.today || {};
  const preds = forecast?.predictions || {};

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-5">
        <Card title="Breakfast Today" value={today.breakfast || 0} />
        <Card title="Lunch Today" value={today.lunch || 0} />
        <Card title="Snack Today" value={today.snacks || 0} />
        <Card title="Dinner Today" value={today.dinner || 0} />
        <Card title="Total Served" value={analytics?.totalStudentsServedToday || today.total || 0} />
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-xl border">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border p-2 text-sm" />
        <button type="button" onClick={load} className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold">
          Load Records
        </button>
        <button type="button" onClick={runForecast} className="rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-semibold">
          Train & Forecast Tomorrow
        </button>
      </div>

      {forecast && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm">
          <p className="font-bold text-indigo-900">Tomorrow ({forecast.date})</p>
          <p className="mt-1">
            Breakfast: {preds.breakfast} · Lunch: {preds.lunch} · Snacks: {preds.snacks} · Dinner: {preds.dinner}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-bold mb-3">Today Meal Breakdown</h3>
          <MealBarChart
            data={[
              { meal: 'breakfast', count: today.breakfast || 0 },
              { meal: 'lunch', count: today.lunch || 0 },
              { meal: 'snacks', count: today.snacks || 0 },
              { meal: 'dinner', count: today.dinner || 0 },
            ]}
          />
        </div>
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-bold mb-3">30-Day Daily Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={analytics?.dailyTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#2563eb" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border p-4 lg:col-span-2">
          <h3 className="font-bold mb-3">Attendance Heatmap (recent)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics?.heatmap?.slice(0, 40) || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 8 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#7c3aed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-x-auto max-h-96">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 font-semibold border-b">
              <th className="p-3 text-left">Student</th>
              <th className="p-3 text-left">Meal</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.slice(0, 100).map((a) => (
              <tr key={a._id} className="border-b">
                <td className="p-3">{a.student?.username}</td>
                <td className="p-3 capitalize">{a.mealType || '—'}</td>
                <td className="p-3">{a.source === 'none' ? 'absent' : 'present'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
