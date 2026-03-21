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

  const fetchLeaves = async () => {
    try {
      const response = await axios.get('/api/leaves/me');
      setLeaves(response.data);
    } catch (error: any) {
      toast.error('Failed to load leave history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

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
    <div className="space-y-5">
      <Toaster position="top-center" />
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900 flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-primary-500" />
          My Leaves
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-50 text-primary-600 font-medium px-3 py-1.5 rounded-lg text-sm flex items-center hover:bg-primary-100 transition-colors"
        >
          {showForm ? 'Cancel' : <><Plus className="h-4 w-4 mr-1" /> Request</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
                <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full text-sm border-gray-300 rounded-md px-3 py-2 border focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
                <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full text-sm border-gray-300 rounded-md px-3 py-2 border focus:ring-primary-500 focus:border-primary-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select required value={leaveType} onChange={e => setLeaveType(e.target.value)} className="w-full text-sm border-gray-300 rounded-md px-3 py-2 border focus:ring-primary-500 focus:border-primary-500">
                <option value="Casual">Casual</option>
                <option value="Sick">Sick</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Reason</label>
              <textarea required value={reason} onChange={e => setReason(e.target.value)} rows={2} className="w-full text-sm border-gray-300 rounded-md px-3 py-2 border focus:ring-primary-500 focus:border-primary-500" placeholder="Brief explanation..."></textarea>
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-primary-600 text-white font-medium py-2 rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="text-center text-sm text-gray-500 py-6">Loading...</div>
        ) : leaves.length > 0 ? (
          leaves.map((leave) => (
            <div key={leave._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 relative overflow-hidden">
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${leave.status === 'Approved' ? 'bg-emerald-400' : leave.status === 'Rejected' ? 'bg-red-400' : 'bg-amber-400'}`}></div>
              <div className="flex justify-between items-start pl-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{leave.leaveType}</span>
                  <h4 className="text-sm font-medium text-gray-900 mt-0.5">{leave.reason}</h4>
                </div>
                <span className="text-sm font-bold text-gray-700">{getDayDiff(leave.startDate, leave.endDate)}d</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mt-2 border-t border-gray-50 pt-2 pl-3">
                <span>{new Date(leave.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(leave.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                <span className="flex items-center space-x-1">
                  {getStatusIcon(leave.status)}
                  <span className={`font-medium ${leave.status === 'Approved' ? 'text-emerald-700' : leave.status === 'Rejected' ? 'text-red-700' : 'text-amber-700'}`}>{leave.status}</span>
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-sm text-gray-400 py-10 bg-white rounded-xl border border-gray-100 border-dashed">
            No leave history.
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveRequests;
