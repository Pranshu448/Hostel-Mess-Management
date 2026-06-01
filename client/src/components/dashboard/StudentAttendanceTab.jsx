import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Chart as ChartJS, ArcElement, Tooltip as CJTooltip, Legend as CJLegend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, CJTooltip, CJLegend);
import { attendanceAPI, analyticsAPI } from '../../services/api';
import MealBarChart from './charts/MealBarChart';
import TrendLineChart from './charts/TrendLineChart';

const COLORS = ['#f59e0b', '#2563eb', '#10b981', '#8b5cf6'];

function Card({ title, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-800">{value}</p>
    </div>
  );
}

export default function StudentAttendanceTab({ token }) {
  const [attendance, setAttendance] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [showQr, setShowQr] = useState(false);
  const [mealType, setMealType] = useState('lunch');

  useEffect(() => {
    if (!token) return;
    Promise.all([attendanceAPI.getMine(token), analyticsAPI.student(token)]).then(([att, an]) => {
      setAttendance(att);
      setAnalytics(an.analytics);
    });
  }, [token]);

  const handleOpenQr = async () => {
    const res = await attendanceAPI.getQr(token, mealType);
    setQrData(res);
    setShowQr(true);
  };

  const summary = analytics?.summary || attendance?.stats?.mealSummary || {};
  const mealChart = analytics?.mealWise || [
    { meal: 'breakfast', count: summary.breakfast || 0 },
    { meal: 'lunch', count: summary.lunch || 0 },
    { meal: 'snacks', count: summary.snacks || 0 },
    { meal: 'dinner', count: summary.dinner || 0 },
  ];

  const pieData = mealChart.map((m) => ({ name: m.meal, value: m.count }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">QR Meal Attendance</h2>
          <p className="text-sm text-slate-500 mt-1">Generate meal-specific or general HMMS QR codes.</p>
        </div>
        <div className="flex gap-2 items-center">
          <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="rounded-lg border border-slate-300 p-2 text-sm">
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="snacks">Snacks</option>
            <option value="dinner">Dinner</option>
            <option value="entrance">Entrance</option>
            <option value="gate">Gate</option>
          </select>
          <button type="button" className="rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2.5 font-semibold text-white" onClick={handleOpenQr}>
            Generate QR
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card title="Breakfasts" value={summary.breakfast || 0} />
        <Card title="Lunches" value={summary.lunch || 0} />
        <Card title="Snacks" value={summary.snacks || 0} />
        <Card title="Dinners" value={summary.dinner || 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3">Meal-wise Attendance</h3>
          <MealBarChart data={mealChart} />
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3">Attendance Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3">Monthly Trend</h3>
          <TrendLineChart data={analytics?.monthlyTrend || []} yKey="count" />
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3">Weekly Trend</h3>
          <TrendLineChart data={analytics?.weeklyTrend || []} yKey="count" color="#7c3aed" />
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 shadow-sm grid md:grid-cols-2 gap-4 items-center">
        <p className="text-sm text-slate-600">
          Attendance rate: <strong>{analytics?.attendancePercent || attendance?.stats?.monthlyAttendancePercent || 0}%</strong>
        </p>
        <div className="h-48">
          <Doughnut
            data={{
              labels: ['Attended', 'Remaining'],
              datasets: [
                {
                  data: [
                    analytics?.attendancePercent || 0,
                    Math.max(0, 100 - (analytics?.attendancePercent || 0)),
                  ],
                  backgroundColor: ['#2563eb', '#e2e8f0'],
                },
              ],
            }}
            options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
          />
        </div>
      </div>

      {showQr && qrData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-bold mb-4">Scan QR — {mealType}</h3>
            <div className="flex justify-center p-3 border rounded-xl">
              <QRCodeCanvas value={JSON.stringify(qrData.payload)} size={200} />
            </div>
            <button type="button" className="mt-4 w-full rounded-xl bg-slate-900 text-white py-2" onClick={() => setShowQr(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
