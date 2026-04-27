import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, attendanceAPI, crowdAPI, feedbackAPI, inventoryAPI, menuAPI, paymentAPI } from '../../services/api';

const studentTabs = ['Dashboard', 'QR Attendance', 'Weekly Menu', 'Food Preference', 'Fees / Payments', 'Feedback'];
const adminTabs = ['Dashboard', 'Attendance Management', 'Payments', 'Crowd Management', 'Menu Management', 'Inventory', 'Feedback Management'];

const dayLabels = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function Card({ title, value }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">{title}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>;
}

function Dashboard() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attendance, setAttendance] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [menu, setMenu] = useState(null);
  const [payment, setPayment] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [crowd, setCrowd] = useState('Low');
  const [adminOverview, setAdminOverview] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendanceList, setAttendanceList] = useState([]);
  const [paymentList, setPaymentList] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [prefForm, setPrefForm] = useState(null);
  const [prefAnswers, setPrefAnswers] = useState({});
  const [showQrModal, setShowQrModal] = useState(false);
  const [showPrefModal, setShowPrefModal] = useState(false);

  const tabs = useMemo(() => (user?.role === 'admin' ? adminTabs : studentTabs), [user?.role]);

  const safeCall = async (fn) => {
    setLoading(true);
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const loadCommon = async () => {
    const [crowdRes, menuRes] = await Promise.all([crowdAPI.get(token), menuAPI.getWeekly(token)]);
    setCrowd(crowdRes.crowd.level);
    setMenu(menuRes.menu);
  };

  const loadStudent = async () => {
    const [attendanceRes, paymentRes, feedbackRes, formRes] = await Promise.all([
      attendanceAPI.getMine(token),
      paymentAPI.getMine(token),
      feedbackAPI.mine(token),
      menuAPI.getForm(token),
    ]);
    setAttendance(attendanceRes);
    setPayment(paymentRes.payment);
    setFeedback(feedbackRes.feedback);
    setPrefForm(formRes.form);
  };

  const loadAdmin = async () => {
    const [overviewRes, paymentRes, feedRes, invRes, suggRes] = await Promise.all([
      adminAPI.overview(token),
      paymentAPI.list(token),
      feedbackAPI.list(token),
      inventoryAPI.list(token),
      menuAPI.suggestions(token),
    ]);
    setAdminOverview(overviewRes.overview);
    setPaymentList(paymentRes.payments);
    setFeedback(feedRes.feedback);
    setInventory(invRes.items);
    setSuggestions(suggRes.suggestions);
  };

  useEffect(() => {
    if (!token) return;
    safeCall(async () => {
      await loadCommon();
      if (user?.role === 'admin') await loadAdmin();
      else await loadStudent();
    });
  }, [token, user?.role]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handlePayNow = () => safeCall(async () => {
    const result = await paymentAPI.payNow(token);
    setPayment(result.payment);
  });

  const handleOpenQr = () => safeCall(async () => {
    const result = await attendanceAPI.getQr(token);
    setQrData(result);
    setShowQrModal(true);
  });

  const handleMarkAttendance = (studentId) => safeCall(async () => {
    await attendanceAPI.mark(token, { studentId, source: 'manual', date: attendanceDate });
    const updated = await attendanceAPI.listByDate(token, attendanceDate);
    setAttendanceList(updated.items);
  });

  const loadAttendanceList = () => safeCall(async () => {
    const result = await attendanceAPI.listByDate(token, attendanceDate);
    setAttendanceList(result.items);
  });

  const submitFeedback = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await safeCall(async () => {
      await feedbackAPI.create(token, { title: form.get('title'), message: form.get('message') });
      const updated = await feedbackAPI.mine(token);
      setFeedback(updated.feedback);
      event.currentTarget.reset();
    });
  };

  const resolveFeedback = (id) => safeCall(async () => {
    await feedbackAPI.resolve(token, id, 'Resolved by mess admin.');
    const updated = await feedbackAPI.list(token);
    setFeedback(updated.feedback);
  });

  const submitPreferences = () => safeCall(async () => {
    await menuAPI.submitPrefs(token, { answers: prefAnswers });
    setShowPrefModal(false);
  });

  const saveMenu = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const days = {};
    dayLabels.forEach((day) => {
      days[day] = {
        breakfast: form.get(`${day}-breakfast`),
        lunch: form.get(`${day}-lunch`),
        dinner: form.get(`${day}-dinner`),
      };
    });
    safeCall(async () => {
      const result = await menuAPI.saveWeekly(token, { weekStartDate: new Date().toISOString().slice(0, 10), days });
      setMenu(result.menu);
    });
  };

  const saveInventory = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    safeCall(async () => {
      await inventoryAPI.upsert(token, {
        name: form.get('name'),
        quantity: Number(form.get('quantity')),
        unit: form.get('unit'),
      });
      const updated = await inventoryAPI.list(token);
      setInventory(updated.items);
      event.currentTarget.reset();
    });
  };

  const buildForm = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const raw = (form.get('questions') || '').toString().split('\n').map((q, i) => q.trim() ? ({ id: `q${i + 1}`, label: q.trim(), type: 'text' }) : null).filter(Boolean);
    safeCall(async () => {
      await menuAPI.createForm(token, { title: form.get('title') || 'Weekly Food Preferences', questions: raw });
      const current = await menuAPI.getForm(token);
      setPrefForm(current.form);
      event.currentTarget.reset();
    });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        <aside className="min-h-screen w-64 bg-slate-900 p-4 text-white">
          <h2 className="mb-1 text-xl font-bold">Mess Management</h2>
          <p className="mb-4 text-sm text-slate-300">{user?.username} ({user?.role})</p>
          <div className="space-y-2">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full rounded px-3 py-2 text-left text-sm ${activeTab === tab ? 'bg-blue-600' : 'bg-slate-800 hover:bg-slate-700'}`}>{tab}</button>
            ))}
          </div>
          <button onClick={handleLogout} className="mt-6 w-full rounded bg-red-600 px-3 py-2 text-sm">Logout</button>
        </aside>

        <main className="flex-1 p-6">
          {error && <div className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</div>}
          {loading && <div className="mb-4 rounded bg-blue-50 p-3 text-blue-700">Loading...</div>}

          {activeTab === 'Dashboard' && user?.role === 'student' && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Card title="Today's attendance" value={attendance?.statusToday || 'absent'} />
              <Card title="Payment status" value={payment?.status || 'pending'} />
              <Card title="Crowd level" value={crowd} />
              <Card title="Recent announcement" value="Dinner timing shifted to 8:30 PM" />
              <Card title="Weekly menu preview" value={menu?.days?.monday?.lunch || 'No menu set'} />
            </div>
          )}

          {activeTab === 'QR Attendance' && user?.role === 'student' && (
            <div className="space-y-4">
              <button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={handleOpenQr}>Show QR</button>
              <div className="grid gap-4 md:grid-cols-2">
                <Card title="Total present days" value={attendance?.stats?.totalPresentDays || 0} />
                <Card title="Monthly attendance %" value={`${attendance?.stats?.monthlyAttendancePercent || 0}%`} />
              </div>
              <table className="w-full overflow-hidden rounded-lg bg-white text-sm shadow-sm"><thead><tr className="bg-slate-100"><th className="p-2 text-left">Date</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Source</th></tr></thead><tbody>{attendance?.history?.map((h) => <tr key={h._id} className="border-t"><td className="p-2">{h.date}</td><td className="p-2">{h.status}</td><td className="p-2">{h.source}</td></tr>)}</tbody></table>
            </div>
          )}

          {activeTab === 'Weekly Menu' && (
            <table className="w-full overflow-hidden rounded-lg bg-white text-sm shadow-sm">
              <thead><tr className="bg-slate-100"><th className="p-2 text-left">Day</th><th className="p-2 text-left">Breakfast</th><th className="p-2 text-left">Lunch</th><th className="p-2 text-left">Dinner</th></tr></thead>
              <tbody>{dayLabels.map((day) => <tr key={day} className="border-t"><td className="p-2 capitalize">{day}</td><td className="p-2">{menu?.days?.[day]?.breakfast || '-'}</td><td className="p-2">{menu?.days?.[day]?.lunch || '-'}</td><td className="p-2">{menu?.days?.[day]?.dinner || '-'}</td></tr>)}</tbody>
            </table>
          )}

          {activeTab === 'Food Preference' && user?.role === 'student' && (
            <button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={() => setShowPrefModal(true)}>Fill Preference Form</button>
          )}

          {activeTab === 'Fees / Payments' && user?.role === 'student' && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card title="Total fees" value={payment?.totalFees || 0} />
                <Card title="Paid amount" value={payment?.paidAmount || 0} />
                <Card title="Status" value={payment?.status || 'pending'} />
              </div>
              <button className="rounded bg-emerald-600 px-4 py-2 text-white" onClick={handlePayNow}>Pay Now (Simulate)</button>
            </div>
          )}

          {activeTab === 'Feedback' && user?.role === 'student' && (
            <div className="space-y-4">
              <form className="rounded-lg bg-white p-4 shadow-sm" onSubmit={submitFeedback}>
                <input className="mb-2 w-full rounded border p-2" name="title" placeholder="Feedback title" required />
                <textarea className="mb-2 w-full rounded border p-2" name="message" placeholder="Write your complaint or feedback" required />
                <button className="rounded bg-blue-600 px-4 py-2 text-white">Submit</button>
              </form>
              <table className="w-full overflow-hidden rounded-lg bg-white text-sm shadow-sm"><thead><tr className="bg-slate-100"><th className="p-2 text-left">Title</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Response</th></tr></thead><tbody>{feedback.map((f) => <tr key={f._id} className="border-t"><td className="p-2">{f.title}</td><td className="p-2">{f.status}</td><td className="p-2">{f.adminResponse || '-'}</td></tr>)}</tbody></table>
            </div>
          )}

          {activeTab === 'Attendance Management' && user?.role === 'admin' && (
            <div className="space-y-4">
              <div className="flex gap-2"><input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="rounded border p-2" /><button onClick={loadAttendanceList} className="rounded bg-blue-600 px-4 py-2 text-white">Load</button></div>
              <table className="w-full overflow-hidden rounded-lg bg-white text-sm shadow-sm"><thead><tr className="bg-slate-100"><th className="p-2 text-left">Student</th><th className="p-2 text-left">Date</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Action</th></tr></thead><tbody>{attendanceList.map((a) => <tr key={a._id} className="border-t"><td className="p-2">{a.student?.username}</td><td className="p-2">{a.date}</td><td className="p-2">{a.status}</td><td className="p-2"><button onClick={() => handleMarkAttendance(a.student?._id)} className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">Mark Present</button></td></tr>)}</tbody></table>
            </div>
          )}

          {activeTab === 'Payments' && user?.role === 'admin' && (
            <table className="w-full overflow-hidden rounded-lg bg-white text-sm shadow-sm"><thead><tr className="bg-slate-100"><th className="p-2 text-left">Student</th><th className="p-2 text-left">Paid</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Action</th></tr></thead><tbody>{paymentList.map((p, idx) => <tr key={idx} className="border-t"><td className="p-2">{p.student?.username}</td><td className="p-2">{p.paidAmount}/{p.totalFees}</td><td className="p-2">{p.status}</td><td className="p-2">{p.status === 'pending' ? <button onClick={() => safeCall(async () => { await paymentAPI.markPaid(token, p.student._id); const refreshed = await paymentAPI.list(token); setPaymentList(refreshed.payments); })} className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">Mark Paid</button> : '-'}</td></tr>)}</tbody></table>
          )}

          {activeTab === 'Crowd Management' && user?.role === 'admin' && (
            <div className="space-x-2">{['Low', 'Medium', 'High'].map((level) => <button key={level} onClick={() => safeCall(async () => { await crowdAPI.update(token, level); setCrowd(level); })} className="rounded bg-blue-600 px-4 py-2 text-white">{level}</button>)}</div>
          )}

          {activeTab === 'Menu Management' && user?.role === 'admin' && (
            <div className="space-y-6">
              <form className="grid gap-2 rounded-lg bg-white p-4 shadow-sm" onSubmit={saveMenu}>
                {dayLabels.map((day) => <div key={day} className="grid grid-cols-4 gap-2"><span className="self-center text-sm capitalize">{day}</span><input name={`${day}-breakfast`} defaultValue={menu?.days?.[day]?.breakfast || ''} placeholder="Breakfast" className="rounded border p-2" /><input name={`${day}-lunch`} defaultValue={menu?.days?.[day]?.lunch || ''} placeholder="Lunch" className="rounded border p-2" /><input name={`${day}-dinner`} defaultValue={menu?.days?.[day]?.dinner || ''} placeholder="Dinner" className="rounded border p-2" /></div>)}
                <button className="mt-2 rounded bg-blue-600 px-4 py-2 text-white">Save Weekly Menu</button>
              </form>
              <form className="rounded-lg bg-white p-4 shadow-sm" onSubmit={buildForm}>
                <h3 className="mb-2 font-semibold">Generate preference form</h3>
                <input name="title" className="mb-2 w-full rounded border p-2" placeholder="Form title" />
                <textarea name="questions" className="mb-2 w-full rounded border p-2" placeholder="One question per line" rows={4} />
                <button className="rounded bg-blue-600 px-4 py-2 text-white">Save Form</button>
              </form>
              <div className="rounded-lg bg-white p-4 shadow-sm"><h3 className="mb-2 font-semibold">Suggested menu items</h3>{suggestions.map((s) => <p key={s.item} className="text-sm">{s.item} ({s.votes} votes)</p>)}</div>
            </div>
          )}

          {activeTab === 'Inventory' && user?.role === 'admin' && (
            <div className="space-y-4">
              <form className="flex gap-2 rounded-lg bg-white p-4 shadow-sm" onSubmit={saveInventory}>
                <input name="name" className="rounded border p-2" placeholder="Item name" required />
                <input name="quantity" type="number" className="rounded border p-2" placeholder="Qty" required />
                <input name="unit" className="rounded border p-2" placeholder="Unit" defaultValue="kg" />
                <button className="rounded bg-blue-600 px-4 py-2 text-white">Update</button>
              </form>
              <table className="w-full overflow-hidden rounded-lg bg-white text-sm shadow-sm"><thead><tr className="bg-slate-100"><th className="p-2 text-left">Item</th><th className="p-2 text-left">Stock</th><th className="p-2 text-left">Unit</th></tr></thead><tbody>{inventory.map((i) => <tr key={i._id} className="border-t"><td className="p-2">{i.name}</td><td className="p-2">{i.quantity}</td><td className="p-2">{i.unit}</td></tr>)}</tbody></table>
            </div>
          )}

          {activeTab === 'Feedback Management' && user?.role === 'admin' && (
            <table className="w-full overflow-hidden rounded-lg bg-white text-sm shadow-sm"><thead><tr className="bg-slate-100"><th className="p-2 text-left">Student</th><th className="p-2 text-left">Message</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Action</th></tr></thead><tbody>{feedback.map((f) => <tr key={f._id} className="border-t"><td className="p-2">{f.student?.username}</td><td className="p-2">{f.message}</td><td className="p-2">{f.status}</td><td className="p-2">{f.status === 'pending' ? <button onClick={() => resolveFeedback(f._id)} className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">Resolve</button> : '-'}</td></tr>)}</tbody></table>
          )}

          {activeTab === 'Dashboard' && user?.role === 'admin' && adminOverview && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Card title="Total students" value={adminOverview.totalStudents} />
              <Card title="Today's attendance" value={adminOverview.todaysAttendance} />
              <Card title="Meals served" value={adminOverview.mealsServed} />
              <Card title="Pending payments" value={adminOverview.pendingPayments} />
              <Card title="Crowd level" value={adminOverview.crowdLevel} />
            </div>
          )}
        </main>
      </div>

      {showQrModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4">
            <h3 className="mb-3 text-lg font-semibold">Today's Attendance QR</h3>
            <div className="flex justify-center"><QRCodeCanvas value={JSON.stringify(qrData?.payload || {})} size={200} /></div>
            <button className="mt-4 rounded bg-slate-900 px-4 py-2 text-white" onClick={() => setShowQrModal(false)}>Close</button>
          </div>
        </div>
      )}

      {showPrefModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white p-4">
            <h3 className="mb-3 text-lg font-semibold">{prefForm?.title || 'Preference Form'}</h3>
            {prefForm?.questions?.map((q) => <div key={q.id} className="mb-2"><label className="mb-1 block text-sm">{q.label}</label><input className="w-full rounded border p-2" onChange={(e) => setPrefAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))} /></div>)}
            <div className="mt-4 flex gap-2">
              <button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={submitPreferences}>Submit</button>
              <button className="rounded bg-slate-500 px-4 py-2 text-white" onClick={() => setShowPrefModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;