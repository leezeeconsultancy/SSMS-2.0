import { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings as SettingsIcon, Plus, Shield, Bell, Clock, CalendarDays, Trash2, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const AdminSettings = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Rule Form
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [triggerType, setTriggerType] = useState('Late');
  const [deductionType, setDeductionType] = useState('FixedAmount');
  const [deductionValue, setDeductionValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New Holiday Form
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayType, setHolidayType] = useState('Public Holiday');

  const fetchData = async () => {
    try {
      const [rulesRes, holidaysRes] = await Promise.allSettled([
        axios.get('/api/payroll/rules'),
        axios.get('/api/holidays'),
      ]);
      if (rulesRes.status === 'fulfilled') setRules(rulesRes.value.data);
      if (holidaysRes.status === 'fulfilled') setHolidays(holidaysRes.value.data);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/api/payroll/rules', {
        ruleName, triggerType, deductionType,
        deductionValue: Number(deductionValue),
        condition: `${triggerType} occurrence`,
        isActive: true,
      });
      toast.success('Rule created!');
      setShowRuleForm(false);
      setRuleName(''); setDeductionValue('');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create rule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/api/holidays', { name: holidayName, date: holidayDate, type: holidayType });
      toast.success('Holiday added!');
      setShowHolidayForm(false);
      setHolidayName(''); setHolidayDate('');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add holiday');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await axios.delete(`/api/holidays/${id}`);
      toast.success('Holiday deleted');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to delete holiday');
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <h2 className="text-2xl font-bold text-gray-900 flex items-center">
        <SettingsIcon className="mr-2 h-6 w-6 text-primary-500" />
        System Settings
      </h2>

      {/* Info: Auto QR Generation */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start">
        <div className="bg-emerald-100 rounded-full p-2 mr-3 shrink-0"><Clock className="h-4 w-4 text-emerald-600" /></div>
        <div>
          <h4 className="text-sm font-semibold text-emerald-800">Daily QR Codes — Fully Automated</h4>
          <p className="text-xs text-emerald-700 mt-0.5">Unique attendance tokens are auto-generated for all employees every day at midnight and on server startup. No manual action required.</p>
        </div>
      </div>

      {/* Salary Deduction Rules */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center text-sm"><Shield className="h-4 w-4 mr-2 text-gray-400" /> Salary Deduction Rules</h3>
          <button onClick={() => setShowRuleForm(!showRuleForm)} className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center">
            {showRuleForm ? 'Cancel' : <><Plus className="h-4 w-4 mr-1" /> Add Rule</>}
          </button>
        </div>

        {showRuleForm && (
          <form onSubmit={handleAddRule} className="mb-6 bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Rule Name</label>
                <input type="text" required value={ruleName} onChange={e => setRuleName(e.target.value)} placeholder="e.g. Late Penalty" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Trigger</label>
                <select value={triggerType} onChange={e => setTriggerType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500">
                  <option value="Late">Late Arrival</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Deduction Type</label>
                <select value={deductionType} onChange={e => setDeductionType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500">
                  <option value="FixedAmount">Fixed Amount (₹)</option>
                  <option value="FullDayCut">Full Day Salary Cut</option>
                  <option value="Percentage">Percentage (%)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Value</label>
                <input type="number" required value={deductionValue} onChange={e => setDeductionValue(e.target.value)} placeholder="e.g. 500" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500" />
              </div>
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {submitting ? 'Creating...' : 'Create Rule'}
            </button>
          </form>
        )}

        <div className="space-y-2">
          {loading ? <p className="text-sm text-gray-400 text-center py-4">Loading...</p> : rules.length > 0 ? rules.map((rule, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-900">{rule.ruleName}</p>
                <p className="text-xs text-gray-500">
                  Trigger: <span className="font-medium">{rule.triggerType}</span> →{' '}
                  {rule.deductionType === 'FixedAmount' && `₹${rule.deductionValue} per occurrence`}
                  {rule.deductionType === 'FullDayCut' && 'Full day salary deducted'}
                  {rule.deductionType === 'Percentage' && `${rule.deductionValue}% of salary`}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rule.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                {rule.isActive ? 'Active' : 'Disabled'}
              </span>
            </div>
          )) : (
            <p className="text-center text-sm text-gray-400 py-8">No deduction rules yet. Add one above.</p>
          )}
        </div>
      </div>

      {/* Holiday Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center text-sm"><CalendarDays className="h-4 w-4 mr-2 text-gray-400" /> Holiday Calendar</h3>
          <button onClick={() => setShowHolidayForm(!showHolidayForm)} className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center">
            {showHolidayForm ? 'Cancel' : <><Plus className="h-4 w-4 mr-1" /> Add Holiday</>}
          </button>
        </div>

        {showHolidayForm && (
          <form onSubmit={handleAddHoliday} className="mb-6 bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Holiday Name</label>
                <input type="text" required value={holidayName} onChange={e => setHolidayName(e.target.value)} placeholder="e.g. Diwali" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                <input type="date" required value={holidayDate} onChange={e => setHolidayDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select value={holidayType} onChange={e => setHolidayType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500">
                  <option value="Public Holiday">Public Holiday</option>
                  <option value="Company Holiday">Company Holiday</option>
                  <option value="Optional Holiday">Optional Holiday</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {submitting ? 'Adding...' : 'Add Holiday'}
            </button>
          </form>
        )}

        <div className="space-y-2">
          {holidays.length > 0 ? holidays.map((h: any) => (
            <div key={h._id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">{h.name}</p>
                <p className="text-xs text-gray-500">{new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} • {h.type}</p>
              </div>
              <button onClick={() => handleDeleteHoliday(h._id)} className="p-1.5 rounded-md text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            </div>
          )) : (
            <p className="text-center text-sm text-gray-400 py-8">No holidays added yet.</p>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center text-sm"><Bell className="h-4 w-4 mr-2 text-gray-400" /> System Info</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• QR tokens are auto-generated at <strong>12:01 AM</strong> every day</p>
          <p>• Employees are marked <strong>"Late"</strong> if they check in after <strong>9:15 AM</strong></p>
          <p>• Working less than <strong>4 hours</strong> counts as a <strong>Half Day</strong></p>
          <p>• Working more than <strong>9 hours</strong> earns <strong>Overtime</strong> pay (1.5x rate)</p>
          <p>• Salary deductions are calculated based on the rules you configure above</p>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
