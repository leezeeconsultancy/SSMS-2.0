import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Download, Search, Filter } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const AttendanceRecords = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
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
    fetchAttendance();
  }, []);

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
        <button onClick={exportCSV} className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors">
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </button>
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
                          <span key={idx} className="bg-rose-100 text-rose-700 text-[9px] font-bold px-1.5 py-0.5 rounded leading-none border border-rose-200" title="Suspicious activity detected">
                            {flag.replace(/_/g, ' ')}
                          </span>
                        ))
                      ) : (
                        <span className="text-emerald-500 text-[10px] italic">Verified ✓</span>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceRecords;
