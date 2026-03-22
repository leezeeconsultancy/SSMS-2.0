import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, IndianRupee, Zap, Activity, Info, Briefcase, History, Clock, Loader2, ShieldCheck, CheckCircle, Edit3, X, FileText, AlertCircle, PauseCircle, RefreshCw, Ban, AlertTriangle } from 'lucide-react';
import Tooltip from '../../components/Tooltip';
import toast, { Toaster } from 'react-hot-toast';

const PayrollLeave = () => {
  const [tab, setTab] = useState<'payroll' | 'leaves' | 'history' | 'cycles'>('payroll');
  const [cycles, setCycles] = useState<any[]>([]);
  const [isCompleting, setIsCompleting] = useState<string | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<any>(null);
  const [cycleSummary, setCycleSummary] = useState<any[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  const [payoutHistory, setPayoutHistory] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  // Manual Edit State
  const [bonus, setBonus] = useState(0);
  const [manualDeduction, setManualDeduction] = useState(0);
  const [holdAmount, setHoldAmount] = useState(0);
  const [editableBaseSalary, setEditableBaseSalary] = useState(0);
  const [editableOvertime, setEditableOvertime] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [payoutDate, setPayoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCycles();
  }, []);

  const fetchCycles = async () => {
    try {
        const res = await axios.get('/api/payouts/cycles');
        setCycles(res.data);
    } catch (err) {
        console.error('Failed to fetch cycles');
    }
  };

  const handleCompleteMonth = async (m: number, y: number) => {
    const key = `${m}-${y}`;
    setIsCompleting(key);
    try {
        await axios.post('/api/payouts/cycles/complete', { month: m, year: y });
        toast.success(`Payroll for ${m}/${y} completed and closed!`);
        fetchCycles();
    } catch (err) {
        toast.error('Failed to complete payroll cycle');
    } finally {
        setIsCompleting(null);
    }
  };

  const fetchCycleSummary = async (m: number, y: number) => {
    setIsLoadingSummary(true);
    try {
        const res = await axios.get(`/api/payouts/summary/${m}/${y}`);
        setCycleSummary(res.data);
        setSelectedCycle({ month: m, year: y });
    } catch (err) {
        toast.error('Failed to load cycle summary');
    } finally {
        setIsLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
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

  const handleSelectEmployee = async (empId: string) => {
    setSelectedEmpId(empId);
    setLoading(true);
    try {
      const now = new Date();
      const [calcRes, historyRes] = await Promise.all([
        axios.get(`/api/payroll/calculate?employeeId=${empId}&month=${now.getMonth() + 1}&year=${now.getFullYear()}`),
        axios.get(`/api/payouts/${empId}`)
      ]);
      
      setSelectedPayslip(calcRes.data);
      setPayoutHistory(historyRes.data);
      
      // Reset manual fields with calculated values
      setBonus(0);
      setManualDeduction(0);
      setHoldAmount(0);
      setEditableBaseSalary(calcRes.data.baseSalary);
      setEditableOvertime(calcRes.data.overtimePay);
      setRemarks('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch employee details');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayout = async (status: 'Pending' | 'Processing' | 'Paid' | 'On Hold' | 'Cancelled' = 'Paid') => {
    if (!selectedPayslip || !selectedEmpId) return;

    // 1. Validation Logic
    const grossSalary = Number(editableBaseSalary) + Number(editableOvertime) + Number(bonus);
    const totalDeduct = selectedPayslip.totalDeductions + Number(manualDeduction);
    const netSalary = grossSalary - totalDeduct - Number(holdAmount);
    
    if (netSalary < 0) {
      toast.error('Net salary cannot be negative. Please adjust deductions, hold, or bonus.');
      return;
    }

    if (Number(holdAmount) < 0) {
      toast.error('Hold amount cannot be negative.');
      return;
    }

    if (status === 'Paid' && !remarks.trim() && (Number(bonus) !== 0 || Number(manualDeduction) !== 0)) {
      toast.error('Please provide remarks explaining the manual adjustments.');
      return;
    }

    // 2. Final Confirmation for Rollout
    if (status === 'Paid') {
      const confirm = window.confirm(`Are you sure you want to ROLLOUT ₹${netSalary.toLocaleString()} for ${selectedPayslip.employeeName}? This action is official.`);
      if (!confirm) return;
    }

    setIsSaving(true);
    try {
      const payload = {
        employeeId: selectedEmpId,
        month: selectedPayslip.month,
        year: selectedPayslip.year,
        baseSalary: Number(editableBaseSalary),
        bonus: Number(bonus),
        deductions: selectedPayslip.totalDeductions + Number(manualDeduction),
        netSalary,
        holdAmount: Number(holdAmount),
        payoutDate,
        remarks,
        status,
      };

      await axios.post('/api/payouts', payload);
      toast.success(status === 'Paid' ? 'Salary rolled out successfully!' : 'Draft saved as Pending');
      
      // Refresh history
      const historyRes = await axios.get(`/api/payouts/${selectedEmpId}`);
      setPayoutHistory(historyRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save salary record');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="mr-2 h-6 w-6 text-primary-500" />
            Payroll & History Management
        </h2>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white px-6 rounded-t-xl shadow-sm">
        <nav className="-mb-px flex space-x-8">
          <button onClick={() => setTab('payroll')} className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${tab === 'payroll' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <IndianRupee className="h-4 w-4 inline mr-2" /> Payroll Processing
          </button>
          <button onClick={() => setTab('history')} className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${tab === 'history' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <History className="h-4 w-4 inline mr-2" /> Payout History
          </button>
          <button onClick={() => setTab('leaves')} className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${tab === 'leaves' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Clock className="h-4 w-4 inline mr-2" /> Leave Requests ({leaves.filter(l => l.status === 'Pending').length})
          </button>
          <button onClick={() => setTab('cycles')} className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${tab === 'cycles' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <ShieldCheck className="h-4 w-4 inline mr-2" /> Monthly Logs
          </button>
        </nav>
      </div>

      {(tab === 'payroll' || tab === 'history') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center text-sm">
                    <Users className="h-4 w-4 mr-2 text-gray-400" /> Select Staff
                </h3>
                <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-2 custom-scrollbar">
                {employees.map(emp => (
                    <button 
                        key={emp._id} 
                        onClick={() => handleSelectEmployee(emp._id)} 
                        className={`w-full text-left flex items-center justify-between p-3 rounded-xl border transition-all ${selectedEmpId === emp._id ? 'bg-primary-50 border-primary-200 shadow-sm' : 'bg-white border-gray-100 hover:border-primary-100 hover:bg-gray-50'}`}
                    >
                    <div className="flex items-center">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs uppercase ${selectedEmpId === emp._id ? 'bg-primary-500 text-white' : 'bg-primary-100 text-primary-700'}`}>
                            {emp.name?.charAt(0)}
                        </div>
                        <div className="ml-3">
                            <p className={`text-sm font-semibold ${selectedEmpId === emp._id ? 'text-primary-900' : 'text-gray-900'}`}>{emp.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{emp.department}</p>
                        </div>
                    </div>
                    </button>
                ))}
                </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {selectedPayslip ? (
              tab === 'payroll' ? (
                /* Salary Processing Form */
                <div className="space-y-6">
                    {/* 1. Summary Header Card */}
                    <div className="bg-gradient-to-br from-primary-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><IndianRupee className="h-20 w-20" /></div>
                        <p className="text-xs text-primary-100 uppercase tracking-widest font-bold mb-1">Estimated Net Payout</p>
                        <h4 className="text-4xl font-black tracking-tight">
                            ₹{(Number(editableBaseSalary) + Number(editableOvertime) + Number(bonus) - (selectedPayslip.totalDeductions + Number(manualDeduction)) - Number(holdAmount)).toLocaleString()}
                        </h4>
                        {Number(holdAmount) > 0 && (
                            <p className="text-xs text-orange-200 mt-1 font-bold">₹{Number(holdAmount).toLocaleString()} held back</p>
                        )}
                        <div className="flex items-center justify-center space-x-2 mt-2">
                            <span className="bg-white/20 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase backdrop-blur-sm">
                                {selectedPayslip.employeeName}
                            </span>
                            <span className="bg-white/20 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase backdrop-blur-sm">
                                {selectedPayslip.month}/{selectedPayslip.year}
                            </span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 2. Auto-Calculation Details (Left) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                            <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center mb-4">
                                <Activity className="h-3.5 w-3.5 mr-2 text-primary-500" />
                                System Calculations
                            </h5>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex items-center">
                                        <Briefcase className="h-4 w-4 text-gray-400 mr-2" />
                                        <span className="text-sm font-bold text-gray-700">Base Salary</span>
                                    </div>
                                    <input 
                                        type="number" 
                                        value={editableBaseSalary} 
                                        onChange={(e) => setEditableBaseSalary(Number(e.target.value))}
                                        className="w-24 bg-white border border-gray-200 rounded-lg px-2 py-1 text-right font-black text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="flex justify-between items-center p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                                    <div className="flex items-center space-x-1">
                                        <Zap className="h-4 w-4 text-emerald-500 mr-1" />
                                        <span className="text-sm font-bold text-emerald-900">Overtime Pay</span>
                                        <Tooltip content="(Base Salary / Days / Hours) × OT Multiplier × OT Hours" position="top">
                                            <Info className="h-3 w-3 text-emerald-400 cursor-help" />
                                        </Tooltip>
                                    </div>
                                    <input 
                                        type="number" 
                                        value={editableOvertime} 
                                        onChange={(e) => setEditableOvertime(Number(e.target.value))}
                                        className="w-24 bg-white border border-emerald-200 rounded-lg px-2 py-1 text-right font-black text-emerald-600 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="flex justify-between items-center p-3 bg-red-50/50 rounded-xl border border-red-100">
                                    <div className="flex items-center space-x-1">
                                        <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                                        <span className="text-sm font-bold text-red-900">Auto Deductions</span>
                                        <Tooltip content="Calculated from attendance rules (Late, Half Day, Absent)" position="top">
                                            <Info className="h-3 w-3 text-red-400 cursor-help" />
                                        </Tooltip>
                                    </div>
                                    <span className="font-black text-red-600">-₹{selectedPayslip.totalDeductions.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Manual Adjustments (Right) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                            <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center mb-4">
                                <Edit3 className="h-3.5 w-3.5 mr-2 text-amber-500" />
                                Manual Adjustments
                            </h5>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 ml-1">Bonus / Allowances</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">₹</span>
                                        <input 
                                            type="number" 
                                            value={bonus} 
                                            onChange={(e) => setBonus(Number(e.target.value))}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-7 pr-4 py-2.5 text-sm font-black text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider">Extra Deductions</label>
                                        <Tooltip content="Manual adjustments for advances, penalties, etc." position="top">
                                            <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                        </Tooltip>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 font-bold">₹</span>
                                        <input 
                                            type="number" 
                                            value={manualDeduction} 
                                            onChange={(e) => setManualDeduction(Number(e.target.value))}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-7 pr-4 py-2.5 text-sm font-black text-gray-900 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-black text-orange-600 uppercase flex items-center">
                                            <PauseCircle className="h-3 w-3 mr-1" /> Salary Hold
                                        </label>
                                        <Tooltip content="Keeps amount in system (e.g. Security). Deducted from payout but tracked." position="top">
                                            <Info className="h-3 w-3 text-orange-400 cursor-help" />
                                        </Tooltip>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 font-bold">₹</span>
                                        <input 
                                            type="number" 
                                            value={holdAmount} 
                                            onChange={(e) => setHoldAmount(Number(e.target.value))}
                                            placeholder="0"
                                            className="w-full bg-orange-50 border border-orange-200 rounded-xl pl-7 pr-4 py-2.5 text-sm font-black text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Dates & Remarks Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Remarks for Employee Dashboard</label>
                                <textarea 
                                    rows={3}
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Add a note (e.g., Performance Bonus Q1)"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                                />
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Actual Payout Date</label>
                                    <input 
                                        type="date" 
                                        value={payoutDate}
                                        onChange={(e) => setPayoutDate(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                    <p className="text-[10px] text-primary-500 mt-2 font-bold px-1 flex items-center">
                                      <Info className="h-3 w-3 mr-1" />
                                      Employee's Default Day: {employees.find(e => e._id === selectedEmpId)?.defaultPayoutDay || 1}
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-3 pt-2">
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => handleSavePayout('Pending')}
                                            disabled={isSaving}
                                            className="bg-white border-2 border-amber-400 text-amber-600 rounded-xl py-3 font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-amber-50 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 group"
                                        >
                                            <Clock className="h-3.5 w-3.5 group-hover:animate-pulse" />
                                            <span>Draft</span>
                                        </button>
                                        <button 
                                            onClick={() => handleSavePayout('Processing')}
                                            disabled={isSaving}
                                            className="bg-white border-2 border-blue-400 text-blue-600 rounded-xl py-3 font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-blue-50 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
                                        >
                                            <RefreshCw className="h-3.5 w-3.5" />
                                            <span>Processing</span>
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => handleSavePayout('Paid')}
                                        disabled={isSaving}
                                        className="w-full bg-emerald-600 text-white rounded-xl py-3.5 font-black text-xs uppercase tracking-widest shadow-lg hover:bg-emerald-700 hover:shadow-emerald-200 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                                        <span>{isSaving ? 'Processing...' : 'Confirm & Pay'}</span>
                                    </button>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => handleSavePayout('On Hold')}
                                            disabled={isSaving}
                                            className="bg-white border border-orange-300 text-orange-500 rounded-xl py-2.5 font-black text-[10px] uppercase tracking-widest hover:bg-orange-50 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
                                        >
                                            <PauseCircle className="h-3.5 w-3.5" />
                                            <span>Hold</span>
                                        </button>
                                        <button 
                                            onClick={() => handleSavePayout('Cancelled')}
                                            disabled={isSaving}
                                            className="bg-white border border-red-300 text-red-500 rounded-xl py-2.5 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
                                        >
                                            <Ban className="h-3.5 w-3.5" />
                                            <span>Cancel</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              ) : (
                /* Payout History View */
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900 flex items-center">
                            <History className="h-5 w-5 mr-3 text-primary-500" />
                            Payout History for {selectedPayslip.employeeName}
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Period</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Payout Date</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Bonus</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Hold</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Net Salary</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {payoutHistory.length > 0 ? payoutHistory.map((p, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-bold text-gray-900">{p.month}/{p.year}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(p.payoutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium">+₹{p.bonus.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">{p.holdAmount ? `₹${p.holdAmount.toLocaleString()}` : '—'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-600 font-black">₹{p.netSalary.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {(() => {
                                                const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
                                                    'Paid':       { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
                                                    'Pending':    { bg: 'bg-amber-100',   text: 'text-amber-700',   icon: Clock },
                                                    'Processing': { bg: 'bg-blue-100',    text: 'text-blue-700',    icon: RefreshCw },
                                                    'On Hold':    { bg: 'bg-orange-100',  text: 'text-orange-700',  icon: AlertTriangle },
                                                    'Cancelled':  { bg: 'bg-red-100',     text: 'text-red-700',     icon: Ban },
                                                };
                                                const sc = statusConfig[p.status] || statusConfig['Pending'];
                                                const SIcon = sc.icon;
                                                return (
                                                    <span className={`${sc.bg} ${sc.text} text-[9px] font-black px-2 py-0.5 rounded-full uppercase flex items-center w-fit`}>
                                                        <SIcon className="h-2 w-2 mr-1" /> {p.status}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                            <p className="text-sm text-gray-400">No payout records found for this employee.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
              )
            ) : (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-100 p-20 text-center flex flex-col items-center justify-center">
                    <div className="bg-primary-50 p-6 rounded-full mb-4">
                        <Users className="h-10 w-10 text-primary-200" />
                    </div>
                    <h4 className="text-gray-900 font-bold">Select Staff to Process Payroll</h4>
                    <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">Click an employee from the sidebar to start calculating, editing bonus, and saving payout data.</p>
                </div>
            )}
          </div>
        </div>
      )}

      {tab === 'cycles' && (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Monthly Payroll Logs</h3>
                    <p className="text-sm text-gray-500">Track and close monthly payment cycles</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cycles.map((item, idx) => {
                    const progress = (item.completedEmployees / (item.totalEmployees || 1)) * 100;
                    const isClosed = item.status === 'Closed';
                    const key = `${item.month}-${item.year}`;
                    
                    return (
                        <div key={idx} className={`silk-card p-6 border transition-all hover:shadow-md cursor-pointer group ${isClosed ? 'border-emerald-100 bg-emerald-50/20' : 'border-gray-100 bg-white'}`} onClick={() => fetchCycleSummary(item.month, item.year)}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        {new Date(item.year, item.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </p>
                                    <div className="flex items-center mt-1">
                                        <h4 className="text-lg font-black text-gray-900">₹{item.totalPayout.toLocaleString()}</h4>
                                        <span className={`ml-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${isClosed ? 'bg-emerald-100 text-emerald-700' : 'bg-primary-100 text-primary-700'}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-gray-900">{item.completedEmployees}/{item.totalEmployees}</p>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase">Staff Paid</p>
                                </div>
                            </div>

                            {/* Mini Progress */}
                            <div className="w-full h-1.5 bg-gray-100 rounded-full mb-6 overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-1000 ${isClosed ? 'bg-emerald-500' : 'bg-primary-500'}`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100/50">
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-gray-400 font-black uppercase">Completion</span>
                                    <span className="text-sm font-black text-gray-700">{Math.round(progress)}%</span>
                                </div>
                                {!isClosed ? (
                                    <button 
                                        onClick={() => handleCompleteMonth(item.month, item.year)}
                                        disabled={isCompleting === key}
                                        className="silk-btn bg-primary-600 text-white px-4 py-2 text-xs flex items-center shadow-lg shadow-primary-200"
                                    >
                                        {isCompleting === key ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <ShieldCheck className="h-3 w-3 mr-2" />}
                                        Complete Month
                                    </button>
                                ) : (
                                    <div className="flex items-center text-emerald-600 text-xs font-bold">
                                        <CheckCircle className="h-4 w-4 mr-1.5" /> Closed
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      )}

      {/* Cycle Summary Modal */}
      {selectedCycle && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden animate-scale-in border border-slate-200">
                <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-black text-slate-900">Payroll Breakdown</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {new Date(selectedCycle.year, selectedCycle.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <button onClick={() => setSelectedCycle(null)} className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all text-slate-400"><X className="h-5 w-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {isLoadingSummary ? (
                        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-4 py-2 bg-slate-50 rounded-xl">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff Member</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Net Payout — Status</span>
                            </div>
                            {cycleSummary.map((item, i) => (
                                <div key={i} className="flex justify-between items-center p-4 rounded-2xl border border-slate-100 hover:border-primary-100 hover:bg-primary-50/30 transition-all">
                                    <div className="flex items-center">
                                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500 uppercase">
                                            {item.name?.charAt(0)}
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-black text-slate-900">{item.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{item.employeeId}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-slate-900">₹{item.netSalary.toLocaleString()}</p>
                                        <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                            item.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 
                                            item.status === 'Hold' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button 
                        onClick={() => setSelectedCycle(null)}
                        className="bg-white px-6 py-2.5 rounded-xl border border-slate-200 text-xs font-black text-slate-500 uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all"
                    >
                        Close Breakdown
                    </button>
                </div>
            </div>
        </div>
      )}

      {tab === 'leaves' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* ... Leave table implementation ... */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {leaves.length > 0 ? leaves.map(leave => (
                    <tr key={leave._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{leave.employeeId?.name || 'Unknown'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{leave.leaveType}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(leave.startDate).toLocaleDateString('en-IN')} — {new Date(leave.endDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{leave.reason}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                            leave.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>{leave.status}</span>
                        </td>
                    </tr>
                    )) : (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">No leave requests.</td></tr>
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
