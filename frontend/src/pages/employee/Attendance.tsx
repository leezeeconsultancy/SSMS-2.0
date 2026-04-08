import { useState, useEffect } from 'react';
import axios from 'axios';
import { Fingerprint, LogIn, LogOut as LogOutIcon, CheckCircle2, Clock, Loader2, DoorOpen, MessageSquare, AlertTriangle, MapPin, History } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Attendance = () => {
  const [loading, setLoading] = useState(false);
  const [leavingNow, setLeavingNow] = useState(false);
  const [todayStatus, setTodayStatus] = useState<'none' | 'checked_in' | 'checked_out'>('none');
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Late Request States
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [isLate, setIsLate] = useState(false);
  const [isTooEarly, setIsTooEarly] = useState(false);
  const [earlyLimitTime, setEarlyLimitTime] = useState('');
  const [config, setConfig] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [stats, setStats] = useState({ present: 0, late: 0, hours: 0 });

  // Live clock
  const [distanceInfo, setDistanceInfo] = useState<any>(null);

  // Live clock and distance check
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const distTimer = setInterval(() => checkLiveDistance(), 15000); // Check distance every 15s
    checkLiveDistance();
    return () => {
      clearInterval(timer);
      clearInterval(distTimer);
    };
  }, []);

  const checkLiveDistance = async () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await axios.get(`/api/attendance/check-location?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}`);
          setDistanceInfo(res.data);
        } catch (e) {
          console.error('Distance check failed');
        }
      },
      null,
      { enableHighAccuracy: true }
    );
  };

  const fetchData = async () => {
    try {
      const [attRes, reqRes, configRes, profileRes] = await Promise.allSettled([
        axios.get('/api/attendance/me'),
        axios.get('/api/attendance/requests'),
        axios.get('/api/config'),
        axios.get('/api/employees/me'),
      ]);

      let fetchedConfig: any = { checkInEndHour: 13 };
      if (configRes.status === 'fulfilled') {
        fetchedConfig = configRes.value.data;
        setConfig(fetchedConfig);
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      let todayRec = null;
      if (attRes.status === 'fulfilled') {
        const records = attRes.value.data;
        setAttendance(records);
        
        // Calculate stats for current month
        const nowMonth = new Date().getMonth();
        const nowYear = new Date().getFullYear();
        const monthly = records.filter((r: any) => {
          const d = new Date(r.date);
          return d.getMonth() === nowMonth && d.getFullYear() === nowYear;
        });

        setStats({
          present: monthly.filter((r: any) => ['Present', 'Late'].includes(r.status)).length,
          late: monthly.filter((r: any) => r.status === 'Late').length,
          hours: monthly.reduce((sum: number, r: any) => sum + (r.totalWorkingHours || 0), 0)
        });

        todayRec = records.find((r: any) => r.date?.slice(0, 10) === todayStr);
        if (todayRec) {
          setTodayRecord(todayRec);
          setTodayStatus(todayRec.checkOut?.time ? 'checked_out' : 'checked_in');
        }
      }

      const now = new Date();
      if (now.getHours() >= fetchedConfig.checkInEndHour && !todayRec) {
        setIsLate(true);
      }

      if (profileRes.status === 'fulfilled') {
        const profile = profileRes.value.data;
        const shiftStart = profile.shiftStartTime || "09:00";
        const [h, m] = shiftStart.split(':').map(Number);
        const limitDate = new Date();
        limitDate.setHours(h - 1, m, 0, 0); // 1 hour before
        setEarlyLimitTime(limitDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
        if (now < limitDate) {
          setIsTooEarly(true);
        }
      }

      if (reqRes.status === 'fulfilled') {
        const myTodayReq = reqRes.value.data.find((r: any) => r.date === todayStr);
        if (myTodayReq) {
          setRequestStatus(myTodayReq.status.toLowerCase() as any);
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setFetchingStatus(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    let interval: any;
    if (requestStatus === 'pending') {
      interval = setInterval(() => fetchData(), 5000);
    }
    return () => clearInterval(interval);
  }, [requestStatus]);

  const getLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (error) => {
            toast.error(`GPS Error: ${error.message}. Please enable high-accuracy location.`);
            resolve({ lat: 0, lng: 0 });
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        toast.error('Geolocation is not supported by your browser');
        resolve({ lat: 0, lng: 0 });
      }
    });
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const qrRes = await axios.get('/api/attendance/my-qr');
      const qrToken = qrRes.data.token;

      if (qrRes.data.used) {
        toast.error('You have already marked attendance today!');
        setLoading(false);
        return;
      }

      const loc = await getLocation();
      const deviceId = localStorage.getItem('ssms_device_id');

      const res = await axios.post('/api/attendance/check-in', {
        qrToken,
        latitude: loc.lat,
        longitude: loc.lng,
        deviceId: deviceId || 'unknown',
      });

      setTodayStatus('checked_in');
      setTodayRecord(res.data.attendance);
      toast.success(res.data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const loc = await getLocation();
      const deviceId = localStorage.getItem('ssms_device_id');

      const res = await axios.post('/api/attendance/check-out', {
        latitude: loc.lat,
        longitude: loc.lng,
        deviceId: deviceId || 'unknown'
      });
      setTodayStatus('checked_out');
      setTodayRecord(res.data.attendance);
      toast.success(res.data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!requestReason.trim()) return toast.error('Please enter a reason');
    setLoading(true);
    try {
      await axios.post('/api/attendance/request-late-checkin', { reason: requestReason });
      setRequestStatus('pending');
      setShowRequestModal(false);
      toast.success('Request submitted to admin!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveNow = async () => {
    if (!window.confirm('Are you sure you want to leave early? Your current time will be recorded.')) return;
    setLeavingNow(true);
    try {
      const loc = await getLocation();
      const res = await axios.post('/api/attendance/check-out', {
        latitude: loc.lat,
        longitude: loc.lng,
      });
      setTodayStatus('checked_out');
      setTodayRecord(res.data.attendance);
      const hours = res.data.attendance?.totalWorkingHours || 0;
      toast.success(`Left early at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}. Worked ${hours}h today.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Leave failed');
    } finally {
      setLeavingNow(false);
    }
  };

  const getTimeSinceCheckIn = () => {
    if (!todayRecord?.checkIn?.time) return null;
    const checkInTime = new Date(todayRecord.checkIn.time);
    const diff = currentTime.getTime() - checkInTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours}h ${mins}m ${secs}s`;
  };

  const formatDeadline = () => {
    const hour = config?.checkInEndHour || 13;
    const h12 = hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${h12}:00 ${ampm}`;
  };

  if (fetchingStatus) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-10 w-10 rounded-full border-3 border-primary-200 border-t-primary-600 animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading attendance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-md mx-auto p-4 relative stagger-children">
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: '16px', fontWeight: 600, fontSize: '13px' } }} />

      {/* ═══ Status Header ═══ */}
      <div className="text-center pt-4 animate-fade-in-up">
        <div className={`inline-flex items-center justify-center h-20 w-20 rounded-3xl mb-5 shadow-lg transition-all duration-500 ${
          todayStatus === 'none' ? 'bg-slate-100 shadow-slate-200/50' : 
          todayStatus === 'checked_in' ? 'bg-emerald-100 shadow-emerald-200/50' : 
          'bg-primary-100 shadow-primary-200/50'
        }`}>
          {todayStatus === 'none' && <Fingerprint className="h-10 w-10 text-slate-400" />}
          {todayStatus === 'checked_in' && <CheckCircle2 className="h-10 w-10 text-emerald-500" />}
          {todayStatus === 'checked_out' && <Clock className="h-10 w-10 text-primary-500" />}
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          {todayStatus === 'none' && 'Mark Your Attendance'}
          {todayStatus === 'checked_in' && "You're Checked In!"}
          {todayStatus === 'checked_out' && 'Day Complete ✓'}
        </h2>
        <p className="text-sm text-slate-400 mt-1.5 font-medium">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        {/* Live clock */}
        <p className="text-lg font-mono font-bold text-primary-600 mt-3 tracking-wider">
          {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      </div>

      {/* ═══ Monthly Stats Grid ═══ */}
      <div className="grid grid-cols-3 gap-2.5 animate-fade-in-up delay-250">
        <div className="bg-white rounded-2xl p-3 border border-slate-100/60 shadow-sm text-center">
          <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Present</p>
          <p className="text-lg font-black text-slate-800 leading-none">{stats.present}</p>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-slate-100/60 shadow-sm text-center">
          <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Late</p>
          <p className="text-lg font-black text-amber-600 leading-none">{stats.late}</p>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-slate-100/60 shadow-sm text-center">
          <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Worked</p>
          <p className="text-lg font-black text-primary-600 leading-none">{stats.hours.toFixed(0)}<span className="text-[10px] ml-0.5 opacity-50">h</span></p>
        </div>
      </div>

      {/* ═══ Late Check-in Alert ═══ */}
      {isLate && todayStatus === 'none' && requestStatus !== 'approved' && (
        <div className="silk-card border-rose-200 bg-rose-50/80 p-4 animate-scale-in">
          <div className="flex items-start gap-3">
            <div className="bg-rose-100 p-2 rounded-xl shrink-0">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-800">Check-in Window Closed</p>
              <p className="text-xs text-rose-600 mt-1">You missed the {formatDeadline()} deadline. Please request Admin to enable your check-in.</p>
              
              {requestStatus === 'none' ? (
                <button 
                  onClick={() => setShowRequestModal(true)}
                  className="mt-3 silk-btn bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm"
                >
                  Request Late Check-in
                </button>
              ) : requestStatus === 'pending' ? (
                <div className="mt-3 inline-flex items-center px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-xl border border-amber-200">
                  <Clock className="h-3 w-3 mr-1.5 animate-spin" /> Waiting for Approval...
                </div>
              ) : requestStatus === 'rejected' && (
                <p className="mt-3 text-xs font-bold text-rose-700">❌ Request Rejected by Admin</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Too Early Alert ═══ */}
      {isTooEarly && todayStatus === 'none' && (
        <div className="silk-card border-slate-200 bg-slate-50/80 p-4 animate-scale-in">
          <div className="flex items-start gap-3">
            <div className="bg-slate-100 p-2 rounded-xl shrink-0">
              <Clock className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Check-in Not Open Yet</p>
              <p className="text-xs text-slate-600 mt-1">Please wait until {earlyLimitTime} to mark your attendance.</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Geofence Status ═══ */}
      {distanceInfo && todayStatus === 'none' && (
        <div className={`silk-card border-none p-4 flex items-center justify-between animate-fade-in ${
          distanceInfo.withinRange ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${distanceInfo.withinRange ? 'bg-emerald-100' : 'bg-rose-100'}`}>
              <MapPin className={`h-4 w-4 ${distanceInfo.withinRange ? 'text-emerald-500' : 'text-rose-500'}`} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest">{distanceInfo.officeName || 'Checking Location...'}</p>
              <p className="text-[10px] font-medium opacity-70">
                {distanceInfo.withinRange ? 'You are within office range' : `You are ${distanceInfo.distance}m away (Max ${distanceInfo.radiusMeters}m)`}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
             <div className={`h-2.5 w-2.5 rounded-full ${distanceInfo.withinRange ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
             <p className="text-[9px] font-bold mt-1 uppercase tracking-tighter">{distanceInfo.withinRange ? 'IN RANGE' : 'OUTSIDE'}</p>
          </div>
        </div>
      )}

      {/* ═══ Admin Approved ═══ */}
      {requestStatus === 'approved' && todayStatus === 'none' && (
        <div className="silk-card border-emerald-200 bg-emerald-50/80 p-4 animate-scale-in">
          <p className="text-sm font-bold text-emerald-800 flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-2" /> Late Check-in Approved!
          </p>
          <p className="text-xs text-emerald-600 mt-1">Admin has enabled your check-in. You can mark present now.</p>
        </div>
      )}

      {/* ═══ Live Timer ═══ */}
      {todayStatus === 'checked_in' && getTimeSinceCheckIn() && (
        <div className="silk-card border-emerald-200 bg-emerald-50/50 p-5 text-center animate-scale-in">
          <p className="text-[10px] uppercase tracking-[0.15em] text-emerald-500 font-bold">Working Time</p>
          <p className="text-3xl font-black font-mono text-emerald-700 mt-1.5 tracking-wider">{getTimeSinceCheckIn()}</p>
        </div>
      )}

      {/* ═══ Today's Record ═══ */}
      {todayRecord && (
        <div className="silk-card p-5 animate-slide-up">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100/60">
              <LogIn className="h-5 w-5 text-emerald-500 mx-auto mb-1.5" />
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Check In</p>
              <p className="text-sm font-bold text-slate-900">
                {todayRecord.checkIn ? new Date(todayRecord.checkIn.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
              </p>
            </div>
            <div className="text-center p-4 bg-primary-50/60 rounded-2xl border border-primary-100/60">
              <LogOutIcon className="h-5 w-5 text-primary-500 mx-auto mb-1.5" />
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Check Out</p>
              <p className="text-sm font-bold text-slate-900">
                {todayRecord.checkOut?.time ? new Date(todayRecord.checkOut.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
              </p>
            </div>
          </div>
          {todayRecord.totalWorkingHours > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <span className="text-xs text-slate-400 font-medium">Total Hours: </span>
              <span className="text-sm font-bold text-primary-600">{todayRecord.totalWorkingHours}h</span>
              {todayRecord.overTimeHours > 0 && (
                <span className="text-xs text-emerald-600 ml-2 font-semibold">(+{todayRecord.overTimeHours}h overtime)</span>
              )}
            </div>
          )}
          <div className="mt-3 text-center">
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
              todayRecord.status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
              todayRecord.status === 'Late' ? 'bg-amber-100 text-amber-700' :
              todayRecord.status === 'Half Day' ? 'bg-orange-100 text-orange-700' :
              'bg-slate-100 text-slate-700'
            }`}>{todayRecord.status}</span>
          </div>
        </div>
      )}

      {/* ═══ Action Buttons ═══ */}
      <div className="space-y-3 pb-2">
        {todayStatus === 'none' && (
          <button
            onClick={handleCheckIn}
            disabled={loading || (isLate && requestStatus !== 'approved') || isTooEarly}
            className={`w-full silk-btn font-extrabold py-4.5 rounded-2xl shadow-xl transition-all flex items-center justify-center text-base tracking-tight ${
              (isLate && requestStatus !== 'approved') || isTooEarly
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25'
            }`}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Fingerprint className="h-5 w-5 mr-2" />}
            {loading ? 'Marking Attendance...' : (isLate && requestStatus !== 'approved') || isTooEarly ? 'Check-in Locked' : 'Mark Present — Check In'}
          </button>
        )}

        {todayStatus === 'checked_in' && (
          <>
            <button
              onClick={handleCheckOut}
              disabled={loading || leavingNow}
              className="w-full silk-btn bg-primary-600 hover:bg-primary-700 text-white font-extrabold py-4.5 rounded-2xl shadow-xl shadow-primary-500/25 transition-all flex items-center justify-center disabled:opacity-60 text-base tracking-tight"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <LogOutIcon className="h-5 w-5 mr-2" />}
              {loading ? 'Processing...' : 'Check Out — End Day'}
            </button>

            <button
              onClick={handleLeaveNow}
              disabled={loading || leavingNow}
              className="w-full silk-btn bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center disabled:opacity-60 text-sm"
            >
              {leavingNow ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <DoorOpen className="h-4 w-4 mr-2" />}
              {leavingNow ? 'Recording...' : 'Leave Now — Early Exit'}
            </button>
          </>
        )}

        {todayStatus === 'checked_out' && (
          <div className="text-center py-6 bg-primary-50/60 rounded-2xl border border-primary-100/60 animate-scale-in">
            <CheckCircle2 className="h-8 w-8 text-primary-500 mx-auto mb-2.5" />
            <p className="text-sm font-semibold text-primary-700">You're all done for today!</p>
          </div>
        )}
      </div>

      {/* ═══ Recent History ═══ */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 border border-slate-100 shadow-sm animate-slide-up">
        <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-4 flex items-center">
          <History className="h-3 w-3 mr-2" />
          Recent Logs
        </h3>
        <div className="space-y-2.5">
          {attendance && attendance.length > 0 ? (
            attendance.slice(0, 5).map((rec: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-100 hover:border-primary-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    rec.status === 'Present' ? 'bg-emerald-50 text-emerald-500' : 
                    rec.status === 'Late' ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {rec.status === 'Late' ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800">
                      {new Date(rec.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                      {rec.status} • {rec.checkIn?.time ? new Date(rec.checkIn.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-primary-600">{rec.totalWorkingHours ? `${rec.totalWorkingHours}h` : '—'}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl">
              <p className="text-[10px] font-black text-slate-300 uppercase italic">No logs found</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ REQUEST MODAL ═══ */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-slide-up">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="bg-primary-100 p-2 rounded-xl">
                <MessageSquare className="h-5 w-5 text-primary-600" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Late Check-in Request</h3>
            </div>
            <p className="text-xs text-slate-400 mb-5 font-medium">Explain why you are checking in after the {formatDeadline()} deadline.</p>
            
            <textarea
              className="w-full p-4 border-2 border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-400 outline-none h-32 resize-none transition-all silk-input"
              placeholder="Enter reason here..."
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
            />
            
            <div className="flex gap-3 mt-5">
              <button 
                onClick={() => setShowRequestModal(false)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl text-sm hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitRequest}
                disabled={loading}
                className="flex-1 silk-btn px-4 py-3 bg-primary-600 text-white font-bold rounded-2xl text-sm flex items-center justify-center hover:bg-primary-700 transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
