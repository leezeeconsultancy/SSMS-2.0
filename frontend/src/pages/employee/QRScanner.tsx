import { useState, useEffect } from 'react';
import axios from 'axios';
import { Fingerprint, LogIn, LogOut as LogOutIcon, CheckCircle2, Clock, Loader2, DoorOpen, MessageSquare, AlertTriangle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const QRScanner = () => {
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

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check today's status & requests on mount
  const fetchData = async () => {
    try {
      // Check attendance status
      const attRes = await axios.get('/api/attendance/me');
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayRec = attRes.data.find((r: any) => r.date?.slice(0, 10) === todayStr);
      
      if (todayRec) {
        setTodayRecord(todayRec);
        setTodayStatus(todayRec.checkOut?.time ? 'checked_out' : 'checked_in');
      }

      // Check if current time is late (> 1 PM)
      const now = new Date();
      if (now.getHours() >= 13 && !todayRec) {
        setIsLate(true);
      }

      // Check for existing requests
      const reqRes = await axios.get('/api/attendance/requests');
      const myTodayReq = reqRes.data.find((r: any) => r.date === todayStr);
      if (myTodayReq) {
        setRequestStatus(myTodayReq.status.toLowerCase() as any);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setFetchingStatus(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔄 REAL-TIME POLLING: Check for admin approval every 5 seconds
  useEffect(() => {
    let interval: any;
    if (requestStatus === 'pending') {
      interval = setInterval(() => {
        fetchData();
      }, 5000); // Check every 5 seconds
    }
    return () => clearInterval(interval);
  }, [requestStatus]);

  const getLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve({ lat: 0, lng: 0 }),
          { timeout: 5000 }
        );
      } else {
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

  // Calculate time since check-in
  const getTimeSinceCheckIn = () => {
    if (!todayRecord?.checkIn?.time) return null;
    const checkInTime = new Date(todayRecord.checkIn.time);
    const diff = currentTime.getTime() - checkInTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours}h ${mins}m ${secs}s`;
  };

  if (fetchingStatus) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
  }

  return (
    <div className="space-y-6 max-w-md mx-auto relative">
      <Toaster position="top-center" />

      {/* Status Header */}
      <div className="text-center">
        <div className={`inline-flex items-center justify-center h-20 w-20 rounded-full mb-4 ${
          todayStatus === 'none' ? 'bg-gray-100' : todayStatus === 'checked_in' ? 'bg-emerald-100' : 'bg-blue-100'
        }`}>
          {todayStatus === 'none' && <Fingerprint className="h-10 w-10 text-gray-400" />}
          {todayStatus === 'checked_in' && <CheckCircle2 className="h-10 w-10 text-emerald-500" />}
          {todayStatus === 'checked_out' && <Clock className="h-10 w-10 text-blue-500" />}
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          {todayStatus === 'none' && 'Mark Your Attendance'}
          {todayStatus === 'checked_in' && "You're Checked In!"}
          {todayStatus === 'checked_out' && 'Day Complete ✓'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        {/* Live clock */}
        <p className="text-lg font-mono font-bold text-primary-600 mt-2">
          {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      </div>

      {/* Late Check-in Alert */}
      {isLate && todayStatus === 'none' && requestStatus !== 'approved' && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-rose-800">Check-in Window Closed</p>
              <p className="text-xs text-rose-600 mt-1">You missed the 1:00 PM deadline. Please request Admin to enable your check-in.</p>
              
              {requestStatus === 'none' ? (
                <button 
                  onClick={() => setShowRequestModal(true)}
                  className="mt-3 bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-lg"
                >
                  Request Late Check-in
                </button>
              ) : requestStatus === 'pending' ? (
                <div className="mt-3 inline-flex items-center px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg border border-amber-200">
                  <Clock className="h-3 w-3 mr-1" /> Waiting for Admin Approval...
                </div>
              ) : requestStatus === 'rejected' && (
                <p className="mt-3 text-xs font-bold text-rose-700">❌ Request Rejected by Admin</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Approved Message */}
      {requestStatus === 'approved' && todayStatus === 'none' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-emerald-800 flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-2" /> Late Check-in Approved!
          </p>
          <p className="text-xs text-emerald-600 mt-1">Admin has enabled your check-in. You can mark present now.</p>
        </div>
      )}

      {/* Live timer when checked in */}
      {todayStatus === 'checked_in' && getTimeSinceCheckIn() && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-medium">Working Time</p>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">{getTimeSinceCheckIn()}</p>
        </div>
      )}

      {/* Today's Record Card */}
      {todayRecord && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-emerald-50 rounded-xl">
              <LogIn className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Check In</p>
              <p className="text-sm font-bold text-gray-900">
                {todayRecord.checkIn ? new Date(todayRecord.checkIn.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
              </p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <LogOutIcon className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Check Out</p>
              <p className="text-sm font-bold text-gray-900">
                {todayRecord.checkOut?.time ? new Date(todayRecord.checkOut.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
              </p>
            </div>
          </div>
          {todayRecord.totalWorkingHours > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 text-center">
              <span className="text-xs text-gray-500">Total Hours: </span>
              <span className="text-sm font-bold text-primary-600">{todayRecord.totalWorkingHours}h</span>
              {todayRecord.overTimeHours > 0 && (
                <span className="text-xs text-emerald-600 ml-2">(+{todayRecord.overTimeHours}h overtime)</span>
              )}
            </div>
          )}
          <div className="mt-2 text-center">
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
              todayRecord.status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
              todayRecord.status === 'Late' ? 'bg-amber-100 text-amber-700' :
              todayRecord.status === 'Half Day' ? 'bg-orange-100 text-orange-700' :
              'bg-gray-100 text-gray-700'
            }`}>{todayRecord.status}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {todayStatus === 'none' && (
          <button
            onClick={handleCheckIn}
            disabled={loading || (isLate && requestStatus !== 'approved')}
            className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-50 text-base ${
              isLate && requestStatus !== 'approved' ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30'
            }`}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Fingerprint className="h-5 w-5 mr-2" />}
            {loading ? 'Marking Attendance...' : isLate && requestStatus !== 'approved' ? 'Check-in Locked' : 'Mark Present — Check In'}
          </button>
        )}

        {todayStatus === 'checked_in' && (
          <>
            <button
              onClick={handleCheckOut}
              disabled={loading || leavingNow}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-60 text-base"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <LogOutIcon className="h-5 w-5 mr-2" />}
              {loading ? 'Processing...' : 'Check Out — End Day'}
            </button>

            <button
              onClick={handleLeaveNow}
              disabled={loading || leavingNow}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-60 text-sm"
            >
              {leavingNow ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <DoorOpen className="h-4 w-4 mr-2" />}
              {leavingNow ? 'Recording...' : 'Leave Now — Early Exit'}
            </button>
          </>
        )}

        {todayStatus === 'checked_out' && (
          <div className="text-center py-4 bg-blue-50 rounded-2xl border border-blue-100">
            <CheckCircle2 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-blue-700">You're all done for today!</p>
          </div>
        )}
      </div>

      {/* REQUEST MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-primary-500" />
              <h3 className="text-lg font-bold text-gray-900">Late Check-in Request</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">Explain why you are checking in after the 1:00 PM deadline. Admin will review your request.</p>
            
            <textarea
              className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none h-32 resize-none"
              placeholder="Enter reason here..."
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
            />
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowRequestModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitRequest}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary-600 text-white font-bold rounded-xl text-sm flex items-center justify-center"
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

export default QRScanner;
