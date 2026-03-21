import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, CheckCircle, XCircle, Clock, IndianRupee, Users } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const PayrollLeave = () => {
  const [tab, setTab] = useState<'payroll' | 'leaves'>('payroll');
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, leaveRes] = await Promise.allSettled([
          axios.get('/api/employees'),
          axios.get('/api/leaves'),
        ]);
        if (empRes.status === 'fulfilled') setEmployees(empRes.value.data);
        if (leaveRes.status === 'fulfilled') setLeaves(leaveRes.value.data);
      } catch (error) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleViewPayslip = async (empId: string) => {
    try {
      const now = new Date();
      const res = await axios.get(`/api/payroll/calculate?employeeId=${empId}&month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
      setSelectedPayslip(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to calculate salary');
    }
  };

  const handleLeaveAction = async (leaveId: string, status: string) => {
    try {
      await axios.put(`/api/leaves/${leaveId}/status`, { status });
      setLeaves(prev => prev.map(l => l._id === leaveId ? { ...l, status } : l));
      toast.success(`Leave ${status.toLowerCase()}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <h2 className="text-2xl font-bold text-gray-900 flex items-center">
        <FileText className="mr-2 h-6 w-6 text-primary-500" />
        Payroll & Leave Management
      </h2>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button onClick={() => setTab('payroll')} className={`py-3 px-1 border-b-2 font-medium text-sm ${tab === 'payroll' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <IndianRupee className="h-4 w-4 inline mr-1" /> Payroll
          </button>
          <button onClick={() => setTab('leaves')} className={`py-3 px-1 border-b-2 font-medium text-sm ${tab === 'leaves' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Clock className="h-4 w-4 inline mr-1" /> Leave Requests ({leaves.filter(l => l.status === 'Pending').length})
          </button>
        </nav>
      </div>

      {tab === 'payroll' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employee List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center text-sm"><Users className="h-4 w-4 mr-2 text-gray-400" /> Select Employee</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loading ? <p className="text-sm text-gray-400 text-center py-4">Loading...</p> : employees.map(emp => (
                <button key={emp._id} onClick={() => handleViewPayslip(emp._id)} className="w-full text-left flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs uppercase">{emp.name?.charAt(0)}</div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                      <p className="text-xs text-gray-500">{emp.department}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">₹{emp.salary?.toLocaleString()}/mo</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payslip Detail */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">Payslip Preview</h3>
            {selectedPayslip ? (
              <div className="space-y-3">
                <div className="bg-primary-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-primary-500 uppercase tracking-wider">Net Salary — {selectedPayslip.month}/{selectedPayslip.year}</p>
                  <p className="text-3xl font-bold text-primary-700 mt-1">₹{selectedPayslip.finalSalary.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 mt-1">{selectedPayslip.employeeName}</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Base Salary</span><span className="font-medium">₹{selectedPayslip.baseSalary.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Overtime ({selectedPayslip.overtimeHours}h)</span><span className="font-medium text-emerald-600">+₹{selectedPayslip.overtimePay.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Deductions</span><span className="font-medium text-red-600">-₹{selectedPayslip.totalDeductions.toLocaleString()}</span></div>
                </div>
                {selectedPayslip.deductionsBreakdown.length > 0 && (
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Deductions</p>
                    {selectedPayslip.deductionsBreakdown.map((d: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs py-1"><span className="text-gray-600">{d.ruleName} (×{d.count})</span><span className="text-red-500">-₹{d.deductionAmount}</span></div>
                    ))}
                  </div>
                )}
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Attendance Summary</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-emerald-50 rounded-lg p-2"><p className="text-lg font-bold text-emerald-700">{selectedPayslip.attendanceSummary.totalPresent}</p><p className="text-[10px] text-gray-500">Present</p></div>
                    <div className="bg-red-50 rounded-lg p-2"><p className="text-lg font-bold text-red-700">{selectedPayslip.attendanceSummary.totalAbsent}</p><p className="text-[10px] text-gray-500">Absent</p></div>
                    <div className="bg-amber-50 rounded-lg p-2"><p className="text-lg font-bold text-amber-700">{selectedPayslip.attendanceSummary.totalLate}</p><p className="text-[10px] text-gray-500">Late</p></div>
                    <div className="bg-orange-50 rounded-lg p-2"><p className="text-lg font-bold text-orange-700">{selectedPayslip.attendanceSummary.totalHalfDays}</p><p className="text-[10px] text-gray-500">Half</p></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400 text-sm">Select an employee to view their payslip</div>
            )}
          </div>
        </div>
      )}

      {tab === 'leaves' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">Loading...</td></tr>
                ) : leaves.length > 0 ? leaves.map(leave => (
                  <tr key={leave._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{leave.employeeId?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{leave.leaveType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(leave.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(leave.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{leave.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                        leave.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>{leave.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {leave.status === 'Pending' ? (
                        <div className="flex space-x-2">
                          <button onClick={() => handleLeaveAction(leave._id, 'Approved')} className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"><CheckCircle className="h-4 w-4" /></button>
                          <button onClick={() => handleLeaveAction(leave._id, 'Rejected')} className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"><XCircle className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Done</span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">No leave requests.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollLeave;
