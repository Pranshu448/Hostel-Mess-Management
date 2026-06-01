import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../../context/AuthContext';
import { 
  adminAPI, 
  attendanceAPI, 
  crowdAPI, 
  feedbackAPI, 
  menuAPI, 
  paymentAPI,
  qrAPI,
} from '../../services/api';
import StudentAttendanceTab from '../../components/dashboard/StudentAttendanceTab';
import StudentMenuNutritionTab from '../../components/dashboard/StudentMenuNutritionTab';
import FoodRatingsTab from '../../components/dashboard/FoodRatingsTab';
import AdminMenuManagement from '../../components/dashboard/AdminMenuManagement';
import AdminAttendanceTab from '../../components/dashboard/AdminAttendanceTab';
import AdminInventoryTab from '../../components/dashboard/AdminInventoryTab';
import AdminWasteTab from '../../components/dashboard/AdminWasteTab';

const studentTabs = [
  'Dashboard', 
  'QR Attendance', 
  'Weekly Menu', 
  'Food Ratings', 
  'Purchase & Extras', 
  'Fees / Payments', 
  'Feedback'
];

const adminTabs = [
  'Dashboard', 
  'Attendance Management', 
  'Daily Items Manager',
  'QR Scanner',
  'Payments', 
  'Crowd Management', 
  'Menu Management', 
  'Inventory Management', 
  'Food Waste',
  'Feedback Management'
];

const dayLabels = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function Card({ title, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Existing states
  const [attendance, setAttendance] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [menu, setMenu] = useState(null);
  const [payment, setPayment] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [crowd, setCrowd] = useState('Low');
  const [adminOverview, setAdminOverview] = useState(null);
  const [paymentList, setPaymentList] = useState([]);
  const [nutritionConfig, setNutritionConfig] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);

  // New billing & dynamic daily items states
  const [dailyItems, setDailyItems] = useState([]);
  const [selectedDailyItems, setSelectedDailyItems] = useState({});
  const [studentTransactions, setStudentTransactions] = useState([]);
  const [adminTransactions, setAdminTransactions] = useState([]);
  const [scanPayloadInput, setScanPayloadInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedTransactionData, setScannedTransactionData] = useState(null);
  const [showBillingQrModal, setShowBillingQrModal] = useState(false);

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
    const [crowdRes, menuRes, dailyRes, nutRes] = await Promise.all([
      crowdAPI.get(token), 
      menuAPI.getWeekly(token),
      menuAPI.getDailyItems(token),
      menuAPI.getNutrition(token),
    ]);
    setCrowd(crowdRes.crowd.level);
    setMenu(menuRes.menu);
    setDailyItems(dailyRes.items || []);
    setNutritionConfig(nutRes.config);
  };

  const loadStudent = async () => {
    const [attendanceRes, paymentRes, feedbackRes, transRes] = await Promise.all([
      attendanceAPI.getMine(token),
      paymentAPI.getMine(token),
      feedbackAPI.mine(token),
      paymentAPI.getTransactions(token)
    ]);
    setAttendance(attendanceRes);
    setPayment(paymentRes.payment);
    setFeedback(feedbackRes.feedback);
    setStudentTransactions(transRes.transactions || []);
  };

  const loadAdmin = async () => {
    const [overviewRes, paymentRes, feedRes, dailyRes, adminTransRes] = await Promise.all([
      adminAPI.overview(token),
      paymentAPI.list(token),
      feedbackAPI.list(token),
      menuAPI.getDailyItems(token),
      paymentAPI.getAdminTransactions(token).catch(err => {
        console.error("Error loading admin transactions", err);
        return { transactions: [] };
      })
    ]);
    setAdminOverview(overviewRes.overview);
    setPaymentList(paymentRes.payments);
    setFeedback(feedRes.feedback);
    setDailyItems(dailyRes.items || []);
    setAdminTransactions(adminTransRes.transactions || []);
  };

  useEffect(() => {
    if (!token) return;
    safeCall(async () => {
      await loadCommon();
      if (user?.role === 'admin') await loadAdmin();
      else await loadStudent();
    });
  }, [token, user?.role]);

  // Live Camera Scanner Setup using raw Html5Qrcode for full mobile support
  useEffect(() => {
    let html5QrCode;
    
    if (activeTab === 'QR Scanner' && isScanning) {
      html5QrCode = new Html5Qrcode("qr-reader");

      const onScanSuccess = async (decodedText) => {
        try {
          const data = JSON.parse(decodedText);
          setIsScanning(false);
          try {
            await html5QrCode.stop();
          } catch (stopErr) {
            console.error("Error stopping qr scanner", stopErr);
          }
          if (data.type === "mess-billing") {
            setScannedTransactionData(data);
            return;
          }
          const result = await qrAPI.scan(token, { payload: data, raw: decodedText });
          alert(result.message || "QR processed successfully.");
        } catch (err) {
          alert(err.response?.data?.message || "Unable to process QR code.");
        }
      };

      const onScanFailure = () => {
        // Quiet failure to keep continuous listening
      };

      html5QrCode.start(
        { facingMode: "environment" }, // Forces mobile rear camera!
        {
          fps: 15,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.7;
            return { width: size, height: size };
          },
          aspectRatio: 1.0
        },
        onScanSuccess,
        onScanFailure
      ).catch(err => {
        console.error("Failed to start camera", err);
        setError("Camera permission denied or camera not available. Make sure you accepted permissions and are using HTTPS.");
        setIsScanning(false);
      });
    }

    return () => {
      if (html5QrCode) {
        try {
          if (html5QrCode.isScanning) {
            html5QrCode.stop().catch(err => console.error("Error stopping scanner on unmount", err));
          }
        } catch (e) {
          console.error("Error checking scanner state on unmount", e);
        }
      }
    };
  }, [activeTab, isScanning]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const html5QrCode = new Html5Qrcode("qr-reader-temp");
    
    safeCall(async () => {
      try {
        const decodedText = await html5QrCode.scanFile(file, true);
        const data = JSON.parse(decodedText);
        if (data.type === "mess-billing") {
          setScannedTransactionData(data);
          setError("");
        } else {
          setError("Invalid QR Code category. Must be a purchase invoice.");
        }
      } catch (err) {
        console.error("File upload scanning error", err);
        setError("Could not find a valid QR Code in the uploaded image. Please ensure the QR is clear, well-lit, and in focus.");
      }
    });
  };

  const handlePayNow = () => safeCall(async () => {
    const result = await paymentAPI.payNow(token);
    setPayment(result.payment);
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

  // Staff Daily Item Handlers
  const handleAddDailyItem = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = form.get('name');
    const price = Number(form.get('price'));
    const category = form.get('category');
    
    safeCall(async () => {
      await menuAPI.addDailyItem(token, { name, price, category });
      const updated = await menuAPI.getDailyItems(token);
      setDailyItems(updated.items || []);
      event.target.reset();
    });
  };

  const handleToggleDailyItem = (id) => safeCall(async () => {
    await menuAPI.toggleDailyItem(token, id);
    const updated = await menuAPI.getDailyItems(token);
    setDailyItems(updated.items || []);
  });

  const handleDeleteDailyItem = (id) => safeCall(async () => {
    await menuAPI.deleteDailyItem(token, id);
    const updated = await menuAPI.getDailyItems(token);
    setDailyItems(updated.items || []);
  });

  // Student Daily Item Selection Handlers
  const handleSelectDailyItem = (id) => {
    setSelectedDailyItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const purchaseQrPayload = useMemo(() => {
    const chosen = dailyItems.filter(item => selectedDailyItems[item._id] && item.isAvailable);
    if (chosen.length === 0) return null;
    const total = chosen.reduce((acc, curr) => acc + curr.price, 0);
    return {
      type: "mess-billing",
      studentId: user?.id || user?._id,
      username: user?.username,
      items: chosen.map(item => ({
        itemId: item._id,
        name: item.name,
        price: item.price
      })),
      totalAmount: total,
      date: new Date().toISOString().slice(0, 10)
    };
  }, [dailyItems, selectedDailyItems, user]);

  const handleConfirmTransaction = () => {
    if (!scannedTransactionData) return;
    safeCall(async () => {
      const res = await paymentAPI.processScan(token, {
        studentId: scannedTransactionData.studentId,
        items: scannedTransactionData.items,
        totalAmount: scannedTransactionData.totalAmount
      });
      alert(res.message || "Transaction approved!");
      setScannedTransactionData(null);
      setScanPayloadInput('');
      
      // Reload admin reports/payments state
      const [overviewRes, paymentsRes, adminTransRes] = await Promise.all([
        adminAPI.overview(token),
        paymentAPI.list(token),
        paymentAPI.getAdminTransactions(token).catch(() => ({ transactions: [] }))
      ]);
      setAdminOverview(overviewRes.overview);
      setPaymentList(paymentsRes.payments);
      setAdminTransactions(adminTransRes.transactions || []);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col lg:flex-row">
      {/* Mobile Sticky Header */}
      <header className="lg:hidden bg-slate-900 text-white p-4 flex items-center justify-between shadow-md z-40 sticky top-0">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-wider text-blue-500">HMMS</span>
          <span className="bg-blue-600/20 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-widest">Portal</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition"
          aria-label="Toggle Menu"
        >
          {isSidebarOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </header>

      {/* Mobile Drawer Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Nav Drawer */}
      <aside className={`min-h-screen w-64 bg-slate-900 p-4 text-white shadow-xl flex flex-col justify-between fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 flex-shrink-0`}>
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-wider text-blue-500">HMMS</span>
              <span className="bg-blue-600/20 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest">Portal</span>
            </div>
            {/* Close Button inside Sidebar on Mobile */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="mb-6 rounded-lg bg-slate-800/40 border border-slate-700/50 p-3">
            <p className="text-xs text-slate-400 font-medium">Logged in as</p>
            <h3 className="text-sm font-semibold mt-0.5 text-white truncate">{user?.username}</h3>
            <span className="inline-block mt-1 bg-slate-700 text-slate-300 font-semibold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
              {user?.role}
            </span>
          </div>

          <div className="space-y-1">
            {tabs.map((tab) => (
              <button 
                key={tab} 
                onClick={() => {
                  setActiveTab(tab);
                  setIsSidebarOpen(false); // Auto-close drawer on mobile selection
                  // Refresh data on tab navigation
                  if (token) {
                    if (user?.role === 'admin') loadAdmin();
                    else loadStudent();
                  }
                }} 
                className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition duration-150 flex items-center gap-3 ${activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        
        <button 
          onClick={handleLogout} 
          className="w-full rounded-lg bg-slate-800 hover:bg-red-700 hover:text-white px-3 py-2.5 text-sm font-medium transition duration-150 flex items-center justify-center gap-2"
        >
          Logout
        </button>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-hidden">
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2 shadow-sm animate-pulse">
              <span>Error:</span> {error}
            </div>
          )}
          {loading && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 flex items-center gap-2 shadow-sm">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-700 border-t-transparent"></div>
              <span>Processing... Please wait</span>
            </div>
          )}

          {/* STUDENT DASHBOARD TAB */}
          {activeTab === 'Dashboard' && user?.role === 'student' && (() => {
            const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const todayMenu = menu?.days?.[todayDay] || { breakfast: '-', lunch: '-', snacks: '-', dinner: '-' };
            return (
              <div className="space-y-8 animate-fadeIn">
                {/* Modern Hero Greeting */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 p-8 text-white shadow-lg">
                  <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl"></div>
                  <div className="absolute bottom-0 right-0 -mb-16 -mr-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl"></div>
                  <span className="bg-blue-500/30 text-blue-200 border border-blue-400/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Student Portal
                  </span>
                  <h1 className="text-3xl font-extrabold mt-3 tracking-tight">Welcome Back, {user?.username}!</h1>
                  <p className="text-blue-100/90 text-sm mt-2 max-w-xl font-medium">
                    Monitor your daily mess attendance, view today's scheduled meals & snacks, and manage your billing transactions.
                  </p>
                </div>

                {/* Premium Metrics Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Attendance Card */}
                  <div className="group relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200 overflow-hidden">
                    <div className={`absolute top-0 left-0 w-2 h-full ${attendance?.statusToday === 'present' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Attendance Today</span>
                        <h3 className="text-2xl font-bold mt-1 text-slate-800">
                          {attendance?.statusToday === 'present' ? 'Present' : 'Absent'}
                        </h3>
                      </div>
                      <div className={`rounded-xl p-3 ${attendance?.statusToday === 'present' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {attendance?.statusToday === 'present' ? (
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        ) : (
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex gap-4 text-xs font-semibold text-slate-500">
                      <span>Total Present: <strong className="text-slate-800">{attendance?.stats?.totalPresentDays || 0} days</strong></span>
                      <span>Average: <strong className="text-slate-800">{attendance?.stats?.monthlyAttendancePercent || 0}%</strong></span>
                    </div>
                  </div>

                  {/* Mess Crowd Card */}
                  <div className="group relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200 overflow-hidden">
                    <div className={`absolute top-0 left-0 w-2 h-full ${crowd === 'High' ? 'bg-red-500' : crowd === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mess Occupancy</span>
                        <h3 className="text-2xl font-bold mt-1 text-slate-800">{crowd || 'Low'}</h3>
                      </div>
                      <div className={`rounded-xl p-3 ${crowd === 'High' ? 'bg-red-50 text-red-600' : crowd === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 025.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      </div>
                    </div>
                    <p className="mt-4 text-xs text-slate-500 font-medium">
                      {crowd === 'High' ? 'High density. Expect queuing times.' : crowd === 'Medium' ? 'Moderate traffic at the counters.' : 'Mess is relatively empty. Best time to eat!'}
                    </p>
                  </div>

                  {/* Food Budget Remaining Card */}
                  <div className="group relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200 overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Food Budget Remaining</span>
                        <h3 className="text-2xl font-bold mt-1 text-slate-800">₹ {payment?.leftFoodBudget !== undefined ? payment.leftFoodBudget : 15000}</h3>
                      </div>
                      <div className="rounded-xl p-3 bg-indigo-50 text-indigo-600">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-500">
                        <span>Used: <strong className="text-slate-800 font-bold">₹{payment?.usedFoodBudget || 0}</strong></span>
                        <span>Total Budget: <strong className="text-slate-800 font-bold">₹15,000</strong></span>
                      </div>
                      {/* Simple progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full bg-indigo-600" 
                          style={{ width: `${Math.min(100, Math.round(((payment?.leftFoodBudget !== undefined ? payment.leftFoodBudget : 15000) / 15000) * 100))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Today's Meals Visual Section */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
                    <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <h3 className="text-lg font-bold text-slate-800">Today's Menu Schedule</h3>
                    <span className="ml-auto text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full capitalize">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Breakfast */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 hover:border-blue-300 transition duration-150">
                      <div className="flex items-center gap-2 mb-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                        <span>Breakfast</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 capitalize leading-relaxed">
                        {todayMenu.breakfast || 'Not Scheduled'}
                      </p>
                    </div>

                    {/* Lunch */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 hover:border-amber-300 transition duration-150">
                      <div className="flex items-center gap-2 mb-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
                        <span>Lunch</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 capitalize leading-relaxed">
                        {todayMenu.lunch || 'Not Scheduled'}
                      </p>
                    </div>

                    {/* Snacks */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 hover:border-emerald-300 transition duration-150">
                      <div className="flex items-center gap-2 mb-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                        <span>Snacks</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 capitalize leading-relaxed">
                        {todayMenu.snacks || 'Not Scheduled'}
                      </p>
                    </div>

                    {/* Dinner */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 hover:border-purple-300 transition duration-150">
                      <div className="flex items-center gap-2 mb-2 text-purple-600 font-bold text-xs uppercase tracking-wider">
                        <span>Dinner</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 capitalize leading-relaxed">
                        {todayMenu.dinner || 'Not Scheduled'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* STUDENT QR ATTENDANCE TAB */}
          {activeTab === 'QR Attendance' && user?.role === 'student' && (
            <StudentAttendanceTab token={token} />
          )}

          {activeTab === 'Weekly Menu' && (
            <StudentMenuNutritionTab menu={menu} nutritionConfig={nutritionConfig} />
          )}

          {activeTab === 'Food Ratings' && user?.role === 'student' && (
            <FoodRatingsTab token={token} />
          )}

          {/* DYNAMIC FOOD & EXTRAS SELECTION TAB (STUDENT) */}
          {activeTab === 'Purchase & Extras' && user?.role === 'student' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Dynamic Meals & Extras</h2>
                <p className="text-slate-500 mt-1">Select items for today to generate your unique billing QR code.</p>
              </div>

              <div className="grid gap-8 lg:grid-cols-3">
                {/* Available Items selector list */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-slate-800 text-lg mb-4">Today's Menu Items & Extras</h3>
                    {dailyItems.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-6">No food items listed for today yet. Check back soon!</p>
                    ) : (
                      <div className="space-y-3">
                        {dailyItems.map(item => (
                          <div 
                            key={item._id}
                            onClick={() => item.isAvailable && handleSelectDailyItem(item._id)}
                            className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
                              selectedDailyItems[item._id] && item.isAvailable
                                ? 'bg-blue-50/50 border-blue-500' 
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/55'
                            } ${!item.isAvailable && 'opacity-50 cursor-not-allowed'}`}
                          >
                            <div className="flex items-center gap-3">
                              <input 
                                type="checkbox" 
                                checked={!!selectedDailyItems[item._id] && item.isAvailable}
                                disabled={!item.isAvailable}
                                onChange={() => {}}
                                className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div>
                                <h4 className="font-semibold text-slate-800 text-sm capitalize">{item.name}</h4>
                                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                  item.category === 'meal' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {item.category}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-slate-900 text-base">₹{item.price}</span>
                              <p className="text-[10px] mt-0.5 font-semibold">
                                {item.isAvailable ? (
                                  <span className="text-green-600">Available</span>
                                ) : (
                                  <span className="text-red-500">Out of Stock</span>
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bill Generator sidebar */}
                <div className="space-y-6">
                  <div className="bg-slate-900 text-white rounded-xl shadow-lg p-6 flex flex-col justify-between sticky top-6">
                    <div>
                      <h3 className="font-bold text-lg border-b border-slate-800 pb-3">QR Invoice Generator</h3>
                      
                      <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                        {dailyItems.filter(item => selectedDailyItems[item._id] && item.isAvailable).length === 0 ? (
                          <p className="text-xs text-slate-400 py-4 text-center">No items selected.</p>
                        ) : (
                          dailyItems.filter(item => selectedDailyItems[item._id] && item.isAvailable).map(item => (
                            <div key={item._id} className="flex justify-between text-sm py-1">
                              <span className="text-slate-300 capitalize">{item.name}</span>
                              <span className="font-semibold">₹{item.price}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="mt-6 border-t border-slate-800 pt-4">
                      <div className="flex justify-between text-base font-bold mb-5">
                        <span>Total Bill</span>
                        <span className="text-blue-400">
                          ₹{dailyItems.filter(item => selectedDailyItems[item._id] && item.isAvailable).reduce((acc, curr) => acc + curr.price, 0)}
                        </span>
                      </div>
                      
                      <button 
                        disabled={!purchaseQrPayload}
                        onClick={() => setShowBillingQrModal(true)}
                        className={`w-full rounded-xl py-3 text-center font-bold text-sm transition duration-150 ${
                          purchaseQrPayload 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Generate Purchase QR
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions list details */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 text-lg mb-4">Historical Dynamic Purchases</h3>
                {studentTransactions.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4">No scanning purchases logged for this month.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <th className="p-4 text-left">Purchase Date</th>
                          <th className="p-4 text-left">Purchased Items</th>
                          <th className="p-4 text-right">Total Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentTransactions.map(trans => (
                          <tr key={trans._id} className="hover:bg-slate-50/50">
                            <td className="p-4 text-slate-700 font-medium">{trans.date}</td>
                            <td className="p-4 text-slate-600 capitalize">
                              {trans.items.map(i => `${i.name} (₹${i.price})`).join(', ')}
                            </td>
                            <td className="p-4 text-right font-bold text-slate-900">₹{trans.totalAmount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STUDENT FEES & PAYMENTS TAB */}
          {activeTab === 'Fees / Payments' && user?.role === 'student' && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                {/* Semester Payment Card */}
                <div className="group relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200 overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-slate-900"></div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Semester Payment</span>
                  <h3 className="text-3xl font-extrabold mt-1 text-slate-800">₹ 25,000</h3>
                  <p className="mt-2 text-xs text-slate-500">Labor Service: ₹10,000 | Food Budget: ₹15,000</p>
                </div>
                
                {/* Food Budget Used Card */}
                <div className="group relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200 overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Food Budget Used</span>
                  <h3 className="text-3xl font-extrabold mt-1 text-slate-800">₹ {payment?.usedFoodBudget || 0}</h3>
                  <p className="mt-2 text-xs text-slate-500">Daily bills scanned and processed so far.</p>
                </div>

                {/* Remaining Food Budget Card */}
                <div className="group relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200 overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Food Budget Remaining</span>
                  <h3 className="text-3xl font-extrabold mt-1 text-slate-800">₹ {payment?.leftFoodBudget !== undefined ? payment.leftFoodBudget : 15000}</h3>
                  <p className="mt-2 text-xs text-emerald-600 font-medium">Left out from ₹15,000 food allocation.</p>
                </div>
              </div>

              {/* Info alert about the prepaid semester package */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-sm text-blue-800 flex items-center gap-3 shadow-sm">
                <span className="text-xl font-bold">Info:</span>
                <p className="font-medium">
                  Your **₹25,000 Semester Fee** has been fully paid upfront. Daily mess extras and custom lunch logs deduct directly from your **₹15,000 Food Budget** in real-time.
                </p>
              </div>

              {/* Transactions view inside payments tab for full financial audit trail */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mt-6">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                  <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                  <h3 className="font-bold text-slate-800 text-lg">Detailed Purchases & Billing Logs</h3>
                </div>
                {studentTransactions.length === 0 ? (
                  <p className="text-sm text-slate-500 py-6 text-center">No extras or purchases billed yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <th className="p-4 text-left">Date</th>
                          <th className="p-4 text-left">Description</th>
                          <th className="p-4 text-right">Charged Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentTransactions.map(trans => (
                          <tr key={trans._id} className="hover:bg-slate-50/50">
                            <td className="p-4 text-slate-600 font-medium">{trans.date}</td>
                            <td className="p-4 text-slate-800 capitalize font-semibold">
                              Purchased Extras: {trans.items.map(i => i.name).join(', ')}
                            </td>
                            <td className="p-4 text-right font-extrabold text-red-600">+ ₹{trans.totalAmount}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-700">
                          <td className="p-4" colSpan={2}>Semester Payment (Fully Paid Upfront)</td>
                          <td className="p-4 text-right text-emerald-600">₹25,000</td>
                        </tr>
                        <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-700">
                          <td className="p-4" colSpan={2}>Daily Food Budget Used</td>
                          <td className="p-4 text-right text-red-600">₹{payment?.usedFoodBudget || 0}</td>
                        </tr>
                        <tr className="bg-slate-100/50 font-extrabold border-t-2 border-slate-300 text-slate-900">
                          <td className="p-4 text-indigo-700" colSpan={2}>Remaining Food Budget Balance (Left Out)</td>
                          <td className="p-4 text-right text-indigo-700 text-base">₹{payment?.leftFoodBudget !== undefined ? payment.leftFoodBudget : 15000}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STUDENT FEEDBACK TAB */}
          {activeTab === 'Feedback' && user?.role === 'student' && (
            <div className="grid gap-8 md:grid-cols-3">
              <form className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:col-span-1 h-fit" onSubmit={submitFeedback}>
                <h3 className="font-bold text-slate-800 text-lg mb-4">Submit New Feedback</h3>
                <input className="mb-3 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500" name="title" placeholder="Feedback title" required />
                <textarea className="mb-4 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500" name="message" placeholder="Describe your concern or feedback in detail" rows={4} required />
                <button className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 py-2.5 font-bold text-white shadow transition">Submit</button>
              </form>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm md:col-span-2 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <th className="p-4 text-left">Title</th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-left">Admin Response</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {feedback.map((f) => (
                      <tr key={f._id} className="hover:bg-slate-50/50">
                        <td className="p-4 text-slate-800 font-medium">{f.title}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${f.status === 'resolved' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                            {f.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">{f.adminResponse || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ADMIN ATTENDANCE MANAGEMENT TAB */}
          {activeTab === 'Attendance Management' && user?.role === 'admin' && (
            <AdminAttendanceTab token={token} />
          )}

          {/* STAFF DALLY ITEMS MANAGEMENT TAB (ADMIN) */}
          {activeTab === 'Daily Items Manager' && user?.role === 'admin' && (
            <div className="grid gap-8 md:grid-cols-3">
              {/* Daily Item creation Form */}
              <form className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:col-span-1 h-fit" onSubmit={handleAddDailyItem}>
                <h3 className="font-bold text-slate-800 text-lg mb-4">Add Menu Item & Extras</h3>
                
                <div className="mb-3">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Item Name</label>
                  <input className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500" name="name" placeholder="e.g. Curd, Chips, Lunch Meal" required />
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Price (₹)</label>
                  <input type="number" min="0" className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500" name="price" placeholder="e.g. 15" required />
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category</label>
                  <select name="category" className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white">
                    <option value="extra">Extra Item (curd, chips, etc.)</option>
                    <option value="meal">Meal Base (breakfast, lunch, etc.)</option>
                  </select>
                </div>

                <button className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 py-2.5 font-bold text-white shadow transition">Publish Today</button>
              </form>

              {/* Items listing with toggle availability */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm md:col-span-2 p-4 sm:p-6 min-w-0 overflow-hidden">
                <h3 className="font-bold text-slate-800 text-lg mb-4">Today's Listed Items & Stock</h3>
                {dailyItems.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">No daily items listed. Add items to publish to student profiles.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <th className="p-4 text-left">Item Name</th>
                          <th className="p-4 text-left">Category</th>
                          <th className="p-4 text-left">Price</th>
                          <th className="p-4 text-left">Status</th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dailyItems.map(item => (
                          <tr key={item._id} className="hover:bg-slate-50/50">
                            <td className="p-4 text-slate-800 font-semibold capitalize">{item.name}</td>
                            <td className="p-4 text-slate-600 capitalize">
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                item.category === 'meal' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {item.category}
                              </span>
                            </td>
                            <td className="p-4 text-slate-900 font-bold">₹{item.price}</td>
                            <td className="p-4 text-slate-600">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${item.isAvailable ? 'text-green-700 bg-green-50 border border-green-200' : 'text-red-700 bg-red-50'}`}>
                                {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </td>
                            <td className="p-4 text-center flex justify-center gap-2">
                              <button 
                                onClick={() => handleToggleDailyItem(item._id)}
                                className={`rounded px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition duration-150 ${
                                  item.isAvailable ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                                }`}
                              >
                                {item.isAvailable ? 'Mark Sold Out' : 'Restock'}
                              </button>
                              <button 
                                onClick={() => handleDeleteDailyItem(item._id)}
                                className="rounded bg-red-600 hover:bg-red-700 px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STAFF CAMERA QR CODE SCANNER BILLING TAB (ADMIN) */}
          {activeTab === 'QR Scanner' && user?.role === 'admin' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-900 to-indigo-950 p-6 text-white shadow-lg">
                <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl"></div>
                <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Billing Terminal
                </span>
                <h1 className="text-2xl font-extrabold mt-3 tracking-tight">Mess QR Billing Terminal</h1>
                <p className="text-slate-300 text-sm mt-2 max-w-xl">
                  Scan student purchase QR codes using your device camera to instantly charge their food budgets and record transactions.
                </p>
              </div>

              <div className="grid gap-8 lg:grid-cols-5 items-start">
                {/* Terminal Controls Column */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Scanner Camera Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center relative overflow-hidden">
                    <h3 className="font-bold text-slate-800 text-base self-start mb-4 flex items-center gap-2">
                      <span className="text-blue-500 text-xl font-bold">POS</span> Live Scanner Camera
                    </h3>
                    {isScanning ? (
                      <div className="w-full">
                        <div id="qr-reader" className="overflow-hidden rounded-xl border-2 border-dashed border-slate-300 p-2 bg-slate-50"></div>
                        <button 
                          onClick={() => setIsScanning(false)}
                          className="mt-4 w-full rounded-xl bg-rose-600 hover:bg-rose-700 py-2.5 font-bold text-white shadow transition text-sm flex items-center justify-center gap-2"
                        >
                          Stop Camera
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-6 flex flex-col items-center gap-3">
                        <button 
                          onClick={() => {
                            setScannedTransactionData(null);
                            setIsScanning(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3 font-bold text-white shadow-md transition duration-150 text-base"
                        >
                          Open Scanner Camera
                        </button>
                        <div className="relative w-full max-w-[220px]">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileUpload} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-5 py-2.5 font-bold text-slate-700 transition text-sm">
                            Upload QR Screenshot
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-[250px] mx-auto font-medium">
                          Use real-time camera scanning or upload a saved screenshot of the student's invoice QR.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Fallback Paste Input Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <span className="text-amber-500 font-bold">Manual</span> Offline / Clipboard Fallback
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      If camera access is blocked or unavailable on this device, paste the raw JSON invoice string generated by the student below:
                    </p>
                    <textarea 
                      rows={3}
                      value={scanPayloadInput}
                      onChange={(e) => setScanPayloadInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-3 text-xs font-mono focus:ring-blue-500 focus:border-blue-500 bg-slate-50"
                      placeholder='{"type":"mess-billing", ...}'
                    />
                    <button 
                      onClick={() => {
                        try {
                          const data = JSON.parse(scanPayloadInput);
                          if (data.type === "mess-billing") {
                            setScannedTransactionData(data);
                            setError("");
                          } else {
                            setError("Invalid QR payload category. Must be mess-billing.");
                          }
                        } catch (err) {
                          setError("Failed to parse JSON structure. Make sure the text is copied exactly.");
                        }
                      }}
                      className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs text-white transition font-semibold"
                    >
                      Verify Payload String
                    </button>
                  </div>
                </div>

                {/* Scanned Invoice & Bills History Column */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Verified Invoice Details Card */}
                  {scannedTransactionData ? (
                    <div className="bg-slate-900 text-white rounded-2xl shadow-xl p-6 space-y-4 animate-fadeIn border border-slate-800 relative overflow-hidden">
                      <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl"></div>
                      <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                        <div>
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider">
                            Verified Invoice
                          </span>
                          <h3 className="font-bold text-lg mt-1 text-slate-100">Student: {scannedTransactionData.username}</h3>
                        </div>
                        <span className="text-xs font-semibold text-slate-400 font-mono">Date: {scannedTransactionData.date}</span>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Purchased Items</h4>
                        <div className="divide-y divide-slate-800 max-h-48 overflow-y-auto pr-1">
                          {scannedTransactionData.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm py-2">
                              <span className="text-slate-300 capitalize">{item.name}</span>
                              <span className="font-semibold text-slate-100">₹{item.price}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between text-base font-bold border-t border-slate-800 pt-3 mt-2">
                          <span className="text-slate-400">Total Bill Amount</span>
                          <span className="text-indigo-400 text-xl font-extrabold">₹{scannedTransactionData.totalAmount}</span>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button 
                          onClick={handleConfirmTransaction}
                          className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-center font-bold text-sm text-white shadow-md transition duration-150 flex items-center justify-center gap-1.5"
                        >
                          Confirm & Charge Student
                        </button>
                        <button 
                          onClick={() => setScannedTransactionData(null)}
                          className="rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-3 text-center font-bold text-sm text-slate-400 transition"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
                      <span className="text-4xl font-bold text-slate-300">#</span>
                      <h4 className="font-bold text-slate-700 text-sm mt-3">Invoice Details Pending</h4>
                      <p className="text-xs text-slate-400 max-w-[280px] mt-1.5 leading-relaxed">
                        Open the scanner above or paste a student payload to view detailed invoice items here for approval.
                      </p>
                    </div>
                  )}

                  {/* Gorgeous Processed Billings Audit Log Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">Receipts Processed By You</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Dual-profile billing history for admin profile verification.</p>
                      </div>
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono">
                        {adminTransactions.length} Scans
                      </span>
                    </div>

                    {adminTransactions.length === 0 ? (
                      <div className="text-center py-8">
                        <span className="text-3xl font-bold text-slate-300">-</span>
                        <p className="text-xs text-slate-400 mt-2 font-medium">You haven't scanned or billed any student invoices today.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-slate-500 font-semibold text-xs border-b border-slate-100 uppercase tracking-wider">
                              <th className="py-2.5 text-left font-bold">Student</th>
                              <th className="py-2.5 text-left font-bold">Purchased Items</th>
                              <th className="py-2.5 text-right font-bold">Amount</th>
                              <th className="py-2.5 text-right font-bold">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                            {adminTransactions.map(trans => (
                              <tr key={trans._id} className="hover:bg-slate-50/50 transition">
                                <td className="py-3 text-slate-900 font-semibold">
                                  {trans.student?.username || 'Student'}
                                  <p className="text-[10px] text-slate-400 font-normal font-mono">{trans.student?.email}</p>
                                </td>
                                <td className="py-3 text-xs text-slate-500 max-w-[150px] truncate capitalize">
                                  {trans.items.map(i => i.name).join(', ')}
                                </td>
                                <td className="py-3 text-right font-bold text-indigo-600">₹{trans.totalAmount}</td>
                                <td className="py-3 text-right text-[10px] text-slate-400 font-mono">{trans.date}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN PAYMENTS MANAGER TAB */}
          {activeTab === 'Payments' && user?.role === 'admin' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">Student Semester & Food Bills</h2>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <th className="p-4 text-left">Student Name</th>
                      <th className="p-4 text-left">Semester Payment</th>
                      <th className="p-4 text-left">Food Budget (Used / Left)</th>
                      <th className="p-4 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentList.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-4 text-slate-800 font-medium">{p.student?.username}</td>
                        <td className="p-4 font-semibold text-slate-700">₹25,000</td>
                        <td className="p-4 text-slate-600">
                          Used: <strong className="text-red-600">₹{p.usedFoodBudget || 0}</strong> / Left: <strong className="text-indigo-600">₹{p.leftFoodBudget !== undefined ? p.leftFoodBudget : 15000}</strong>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700 border border-green-200 uppercase">
                            Prepaid
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ADMIN CROWD LEVEL STATUS TOGGLE TAB */}
          {activeTab === 'Crowd Management' && user?.role === 'admin' && (
            <div className="space-y-6 max-w-md mx-auto text-center py-12">
              <h2 className="text-2xl font-bold text-slate-800">Crowd Levels Status</h2>
              <p className="text-slate-500 mb-6">Toggle the live mess crowd occupancy status visible to student portals.</p>
              <div className="flex justify-center gap-3">
                {['Low', 'Medium', 'High'].map((level) => (
                  <button 
                    key={level} 
                    onClick={() => safeCall(async () => { 
                      await crowdAPI.update(token, level); 
                      setCrowd(level); 
                    })} 
                    className={`rounded-xl px-6 py-3 font-bold shadow-sm border transition ${
                      crowd === level 
                        ? 'bg-blue-600 border-blue-500 text-white shadow' 
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ADMIN MENU MANAGEMENT WEEKLY SCHEDULE TAB */}
          {activeTab === 'Menu Management' && user?.role === 'admin' && (
            <AdminMenuManagement
              token={token}
              menu={menu}
              onMenuUpdated={(m) => {
                setMenu(m);
                loadCommon();
              }}
            />
          )}

          {activeTab === 'Inventory Management' && user?.role === 'admin' && (
            <AdminInventoryTab token={token} />
          )}

          {activeTab === 'Food Waste' && user?.role === 'admin' && (
            <AdminWasteTab token={token} />
          )}

          {/* ADMIN FEEDBACK RESOLUTION TAB */}
          {activeTab === 'Feedback Management' && user?.role === 'admin' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="p-4 text-left">Student Name</th>
                    <th className="p-4 text-left">Complaint Message</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feedback.map((f) => (
                    <tr key={f._id} className="hover:bg-slate-50/50">
                      <td className="p-4 text-slate-800 font-medium">{f.student?.username}</td>
                      <td className="p-4 text-slate-600">{f.message}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${f.status === 'resolved' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {f.status === 'pending' ? (
                          <button onClick={() => resolveFeedback(f._id)} className="rounded bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow transition">
                            Mark Resolved
                          </button>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ADMIN OVERVIEW DASHBOARD */}
          {activeTab === 'Dashboard' && user?.role === 'admin' && adminOverview && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">Admin Command Center</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card title="Registered Students" value={adminOverview.totalStudents} />
                <Card title="Today's Meal Attendance" value={adminOverview.todaysAttendance} />
                <Card title="Daily Meals Served" value={adminOverview.mealsServed} />
                <Card title="Outstanding Fee Payments" value={adminOverview.pendingPayments} />
                <Card title="Portal Occupancy crowd" value={adminOverview.crowdLevel} />
              </div>
            </div>
          )}
        </main>

      {/* ATTENDANCE QR CODE MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 transform scale-100 transition duration-300">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-800">Attendance Scan Entry</h3>
              <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <div className="flex flex-col items-center py-6">
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-md">
                <QRCodeCanvas value={JSON.stringify(qrData?.payload || {})} size={200} />
              </div>
              <p className="mt-4 text-xs text-slate-500 font-mono">Date: {qrData?.payload?.date}</p>
            </div>
            <button className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 py-3 font-semibold text-white transition shadow" onClick={() => setShowQrModal(false)}>
              Close QR Screen
            </button>
          </div>
        </div>
      )}

      {/* MEAL/EXTRAS BILLING PURCHASE QR CODE MODAL (STUDENT VIEW) */}
      {showBillingQrModal && purchaseQrPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-scaleUp">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-800">Purchase QR Billing Invoice</h3>
              <button onClick={() => setShowBillingQrModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <div className="flex flex-col items-center py-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
                <QRCodeCanvas value={JSON.stringify(purchaseQrPayload)} size={220} />
              </div>
              <p className="mt-4 text-sm font-bold text-slate-900">Total Purchase: ₹{purchaseQrPayload.totalAmount}</p>
              <p className="text-xs text-slate-500 mt-1">Show this QR to the mess staff at checkout to add to your monthly bill.</p>
            </div>

            {/* Render absolute JSON value for copy-paste fallback testing convenience */}
            <div className="mt-2 bg-slate-50 border rounded-lg p-2.5 font-mono text-[9px] text-slate-600 overflow-x-auto select-all max-h-24">
              {JSON.stringify(purchaseQrPayload)}
            </div>
            <p className="text-[9px] text-center text-slate-400 mt-1 mb-4 select-none">TIP: Triple-click above box to copy QR code text for testing paste fallback.</p>

            <button 
              className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 py-3 font-semibold text-white transition shadow" 
              onClick={() => {
                setShowBillingQrModal(false);
                setSelectedDailyItems({}); // Clear selections upon generation
              }}
            >
              Done & Clear Selections
            </button>
          </div>
        </div>
      )}

      <div id="qr-reader-temp" className="hidden"></div>
    </div>
  );
}

export default Dashboard;