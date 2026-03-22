import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Download, Search, Filter, CheckCircle2, Edit3, X, Clock, Loader2, ShieldCheck } from 'lucide-react';
import SilkTooltip from '../../components/Tooltip';
import toast, { Toaster } from 'react-hot-toast';

const AttendanceRecords = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    checkInTime: '',
    checkOutTime: '',
    status: '',
    adminNote: ''
  });

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await axios.get('/api/attendance');
      setRecords(res.data);
    } catch (error) {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const filtered = records.filter(r => {
    const nameMatch = !searchTerm || r.employeeId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || r.employeeId?.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    const dateMatch = !dateFilter || r.date?.slice(0, 10) === dateFilter;
    return nameMatch && dateMatch;
  });

  const exportCSV = () => {
    const headers = 'Employee,ID,Date,Check In,Check Out,Hours,Status\n';
    const rows = filtered.map(r =>
      `"${r.employeeId?.name || ''}","${r.employeeId?.employeeId || ''}","${r.date?.slice(0, 10) || ''}","${r.checkIn ? new Date(r.checkIn.time).toLocaleTimeString() : ''}","${r.checkOut?.time ? new Date(r.checkOut.time).toLocaleTimeString() : ''}","${r.totalWorkingHours || 0}","${r.status}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${dateFilter || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded!');
  };

  const openEditModal = (record: any) => {
    setEditingRecord(record);
    setOverrideForm({
        checkInTime: record.checkIn?.time ? new Date(new Date(record.checkIn.time).getTime() - new Date(record.checkIn.time).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
        checkOutTime: record.checkOut?.time ? new Date(new Date(record.checkOut.time).getTime() - new Date(record.checkOut.time).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
        status: record.status,
        adminNote: ''
    });
  };

  const handleManualOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
        await axios.patch(`/api/attendance/${editingRecord._id}`, overrideForm);
        toast.success('Attendance record updated successfully');
        setEditingRecord(null);
        fetchAttendance();
    } catch (err: any) {
        toast.error(err.response?.data?.message || 'Update failed');
    } finally {
        setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="mr-2 h-6 w-6 text-primary-500" />
            Attendance Records
          </h2>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} records found</p>
        </div>
        <SilkTooltip content="Download current view as CSV" position="left">
          <button onClick={exportCSV} className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </button>
        </SilkTooltip>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search by name or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flags</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">Loading...</td></tr>
              ) : filtered.length > 0 ? filtered.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs uppercase">{r.employeeId?.name?.charAt(0) || '?'}</div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{r.employeeId?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{r.employeeId?.employeeId || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.checkIn ? new Date(r.checkIn.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.checkOut?.time ? new Date(r.checkOut.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.totalWorkingHours ? `${r.totalWorkingHours}h` : '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      r.status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                      r.status === 'Late' ? 'bg-amber-100 text-amber-700' :
                      r.status === 'Half Day' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {r.flags && r.flags.length > 0 ? (
                        r.flags.map((flag: string, idx: number) => (
                          <SilkTooltip key={idx} content="Security alert detected" position="left">
                            <span className="bg-rose-100 text-rose-700 text-[9px] font-bold px-1.5 py-0.5 rounded leading-none border border-rose-200 cursor-help">
                              {flag.replace(/_/g, ' ')}
                            </span>
                          </SilkTooltip>
                        ))
                      ) : (
                        <SilkTooltip content="Device and Location verified" position="left">
                          <span className="text-emerald-500 text-[10px] italic flex items-center cursor-default">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                          </span>
                        </SilkTooltip>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <SilkTooltip content="Manual Override" position="left">
                      <button 
                        onClick={() => openEditModal(r)}
                        className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-primary-50 hover:text-primary-600 transition-all"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </SilkTooltip>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Override Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in border border-slate-200">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-base font-black text-slate-900">Manual Override</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Case: {editingRecord.employeeId?.name}</p>
                    </div>
                    <button onClick={() => setEditingRecord(null)} className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all text-slate-400"><X className="h-5 w-5" /></button>
                </div>

                <form onSubmit={handleManualOverride} className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Check-in Time</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                <input 
                                    type="datetime-local" 
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={overrideForm.checkInTime}
                                    onChange={(e) => setOverrideForm({...overrideForm, checkInTime: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Check-out Time</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                <input 
                                    type="datetime-local" 
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={overrideForm.checkOutTime}
                                    onChange={(e) => setOverrideForm({...overrideForm, checkOutTime: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Override</label>
                        <select 
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                            value={overrideForm.status}
                            onChange={(e) => setOverrideForm({...overrideForm, status: e.target.value})}
                        >
                            <option value="Present">Present (Full Day)</option>
                            <option value="Late">Late Arrival</option>
                            <option value="Half Day">Half Day</option>
                            <option value="Absent">Absent</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Case Notes / Reason</label>
                        <textarea 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                            placeholder="e.g. Forgot checkout, Machine error resolved, Emergency exit..."
                            rows={3}
                            value={overrideForm.adminNote}
                            onChange={(e) => setOverrideForm({...overrideForm, adminNote: e.target.value})}
                            required
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button 
                            type="button"
                            onClick={() => setEditingRecord(null)}
                            className="flex-1 py-3 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={isUpdating}
                            className="flex-[2] bg-primary-600 shadow-lg shadow-primary-200 text-white rounded-xl py-3 text-sm font-black uppercase tracking-widest hover:bg-primary-700 transition-all flex items-center justify-center"
                        >
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                            Update Record
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceRecords;
