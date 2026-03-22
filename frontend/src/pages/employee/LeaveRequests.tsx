import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Leave {
  _id: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
  status: string;
}

const LeaveRequests = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState('Casual');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState<number>(0);

  const fetchLeaves = async () => {
    try {
      const [leaveRes, profileRes] = await Promise.allSettled([
        axios.get('/api/leaves/me'),
        axios.get('/api/employees/me'),
      ]);
      if (leaveRes.status === 'fulfilled') setLeaves(leaveRes.value.data);
      if (profileRes.status === 'fulfilled') setLeaveBalance(profileRes.value.data.leaveBalance ?? 0);
    } catch (error: any) {
      toast.error('Failed to load leave history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/api/leaves/apply', { startDate, endDate, leaveType, reason });
      toast.success('Leave request submitted!');
      setShowForm(false);
      setStartDate(''); setEndDate(''); setReason('');
      fetchLeaves();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit leave.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'Rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  const getDayDiff = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    return Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="space-y-5 p-4 max-w-lg mx-auto stagger-children">
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: '16px', fontWeight: 600, fontSize: '13px' } }} />

      {/* ═══ Leave Balance ═══ */}
      <div className="gradient-hero rounded-3xl p-5 text-white shadow-xl shadow-primary-900/20 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
        <div className="flex items-center justify-between relative">
          <div>
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-[0.15em]">Annual Leave Balance</p>
            <p className="text-3xl font-black mt-1">{leaveBalance} <span className="text-sm font-semibold text-indigo-200">days left</span></p>
          </div>
          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center glass-dark border border-white/15 ${
            leaveBalance > 5 ? '' : leaveBalance > 0 ? '' : ''
          }`}>
            <Calendar className="h-7 w-7 text-white/80" />
          </div>
        </div>
      </div>

      {/* ═══ Header + Add ═══ */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-extrabold text-slate-900 flex items-center tracking-tight">
          <Calendar className="mr-2 h-5 w-5 text-primary-500" />
          My Leaves
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="silk-btn bg-primary-50 text-primary-600 font-semibold px-3.5 py-2 rounded-xl text-sm flex items-center hover:bg-primary-100 transition-colors"
        >
          {showForm ? 'Cancel' : <><Plus className="h-4 w-4 mr-1" /> Request</>}
        </button>
      </div>

      {/* ═══ Leave Form ═══ */}
      {showForm && (
        <div className="silk-card p-5 animate-scale-in border-primary-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">From</label>
                <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full silk-input text-sm rounded-xl px-3 py-2.5 bg-white" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">To</label>
                <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full silk-input text-sm rounded-xl px-3 py-2.5 bg-white" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Type</label>
              <select required value={leaveType} onChange={e => setLeaveType(e.target.value)} className="w-full silk-input text-sm rounded-xl px-3 py-2.5 bg-white">
                <option value="Casual">Casual</option>
                <option value="Sick">Sick</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Reason</label>
              <textarea required value={reason} onChange={e => setReason(e.target.value)} rows={2} className="w-full silk-input text-sm rounded-xl px-3 py-2.5 bg-white resize-none" placeholder="Brief explanation..." />
            </div>
            <button type="submit" disabled={submitting} className="w-full silk-btn bg-primary-600 text-white font-bold py-3 rounded-xl text-sm hover:bg-primary-700 disabled:opacity-50 transition-colors">
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      )}

      {/* ═══ Leave History ═══ */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center text-sm text-slate-400 py-8 animate-pulse">Loading...</div>
        ) : leaves.length > 0 ? (
          leaves.map((leave) => (
            <div key={leave._id} className="silk-card p-4 relative overflow-hidden animate-fade-in-up">
              <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-full ${
                leave.status === 'Approved' ? 'bg-emerald-400' : leave.status === 'Rejected' ? 'bg-red-400' : 'bg-amber-400'
              }`} />
              <div className="flex justify-between items-start pl-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{leave.leaveType}</span>
                  <h4 className="text-sm font-semibold text-slate-900 mt-0.5">{leave.reason}</h4>
                </div>
                <span className="text-sm font-extrabold text-slate-700">{getDayDiff(leave.startDate, leave.endDate)}d</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-3 border-t border-slate-50 pt-3 pl-3">
                <span className="font-medium">{new Date(leave.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(leave.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                <span className="flex items-center space-x-1">
                  {getStatusIcon(leave.status)}
                  <span className={`font-semibold ${leave.status === 'Approved' ? 'text-emerald-700' : leave.status === 'Rejected' ? 'text-red-700' : 'text-amber-700'}`}>{leave.status}</span>
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-sm text-slate-400 py-12 silk-card border-dashed">
            <div className="bg-slate-100 rounded-full p-4 w-fit mx-auto mb-3">
              <Calendar className="h-6 w-6 text-slate-300" />
            </div>
            <p className="font-medium">No leave history yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveRequests;
