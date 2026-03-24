import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Trash2, Save, Sliders, Settings as SettingsIcon, 
  Loader2, Info, RefreshCw, Clock, Shield, CalendarDays
} from 'lucide-react';
import Tooltip from '../../components/Tooltip';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [configLoading, setConfigLoading] = useState(false);

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
      const [rulesRes, holidaysRes, configRes] = await Promise.allSettled([
        axios.get('/api/payroll/rules'),
        axios.get('/api/holidays'),
        axios.get('/api/config'),
      ]);
      if (rulesRes.status === 'fulfilled') setRules(rulesRes.value.data);
      if (holidaysRes.status === 'fulfilled') setHolidays(holidaysRes.value.data);
      if (configRes.status === 'fulfilled') setConfig(configRes.value.data);
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

  const handleDeleteRule = async (id: string) => {
    if (!window.confirm('Delete this rule?')) return;
    try {
      await axios.delete(`/api/payroll/rules/${id}`);
      toast.success('Rule deleted');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to delete rule');
    }
  };

  const handleToggleRule = async (id: string) => {
    try {
      await axios.patch(`/api/payroll/rules/${id}/toggle`);
      toast.success('Rule status updated');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to update rule');
    }
  };

  const handleSaveConfig = async () => {
    setConfigLoading(true);
    try {
      const res = await axios.put('/api/config', config);
      setConfig(res.data.config);
      toast.success('Configuration saved!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save config');
    } finally {
      setConfigLoading(false);
    }
  };

  const updateConfigField = (field: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  const configFields = config ? [
    {
      section: 'Attendance Rules',
      icon: '🕐',
      fields: [
        { key: 'lateThresholdHour', label: 'Late After (Hour)', type: 'number', min: 0, max: 23, hint: '24h format, e.g. 9' },
        { key: 'lateThresholdMinute', label: 'Late After (Minute)', type: 'number', min: 0, max: 59, hint: 'e.g. 15 → 9:15 AM' },
        { key: 'checkInStartHour', label: 'Check-in Opens (Hour)', type: 'number', min: 0, max: 23, hint: 'Earliest check-in' },
        { key: 'checkInEndHour', label: 'Check-in Closes (Hour)', type: 'number', min: 0, max: 23, hint: 'Latest check-in allowed' },
        { key: 'minWorkMinutes', label: 'Min Work Before Checkout (min)', type: 'number', min: 1, max: 480 },
        { key: 'maxWorkHours', label: 'Max Work Hours / Day', type: 'number', min: 1, max: 24 },
      ]
    },
    {
      section: 'Payroll Rules',
      icon: '💰',
      fields: [
        { key: 'overtimeMultiplier', label: 'Overtime Multiplier', type: 'number', min: 1, max: 5, step: 0.1, hint: 'e.g. 1.5 = 150% rate' },
        { key: 'workingDaysPerMonth', label: 'Working Days / Month', type: 'number', min: 20, max: 31, hint: 'Base for per-day salary calc' },
        { key: 'maxOvertimeHoursPerDay', label: 'Max OT Hours / Day', type: 'number', min: 0, max: 12 },
        { key: 'defaultWorkHoursPerDay', label: 'Default Work Hours / Day', type: 'number', min: 4, max: 12, hint: 'Fallback if employee has none' },
        { key: 'defaultPayoutDay', label: 'Default Payout Day', type: 'number', min: 1, max: 28, hint: 'Day of month for salary' },
      ]
    },
    {
      section: 'Leave Policy',
      icon: '📅',
      fields: [
        { key: 'defaultLeaveBalance', label: 'Annual Leave Days', type: 'number', min: 0, max: 60, hint: 'For new employees' },
        { key: 'allowPastDateLeave', label: 'Allow Past Date Leave', type: 'toggle' },
      ]
    },
    {
      section: 'Company',
      icon: '🏢',
      fields: [
        { key: 'companyName', label: 'Company Name', type: 'text' },
      ]
    },
  ] : [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center">
        <SettingsIcon className="mr-2 h-6 w-6 text-primary-500" />
        System Settings
      </h2>

      {/* Dynamic System Configuration */}
      {config && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-900 flex items-center text-sm">
              <Sliders className="h-4 w-4 mr-2 text-primary-500" /> System Configuration
            </h3>
            <button 
              onClick={handleSaveConfig} 
              disabled={configLoading}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-primary-700 disabled:opacity-50 transition-all"
            >
              {configLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              {configLoading ? 'Saving...' : 'Save Config'}
            </button>
          </div>

          <div className="space-y-6">
            {configFields.map((section, si) => (
              <div key={si}>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center">
                  <span className="mr-2">{section.icon}</span> {section.section}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {section.fields.map((field) => (
                    <div key={field.key} className="bg-gray-50 rounded-lg p-3 border border-gray-100 relative group">
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">{field.label}</label>
                        {(field as any).hint && (
                          <Tooltip content={(field as any).hint} position="top">
                            <Info className="h-3 w-3 text-gray-400 cursor-help" />
                          </Tooltip>
                        )}
                      </div>
                      {field.type === 'toggle' ? (
                        <button
                          onClick={() => updateConfigField(field.key, !config[field.key])}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                            config[field.key] 
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          {config[field.key] ? 'Enabled' : 'Disabled'}
                        </button>
                      ) : field.type === 'text' ? (
                        <input
                          type="text"
                          value={config[field.key] || ''}
                          onChange={(e) => updateConfigField(field.key, e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-primary-500 focus:border-primary-500 bg-white"
                        />
                      ) : (
                        <input
                          type="number"
                          value={config[field.key] ?? ''}
                          onChange={(e) => updateConfigField(field.key, Number(e.target.value))}
                          min={(field as any).min}
                          max={(field as any).max}
                          step={(field as any).step || 1}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-primary-500 focus:border-primary-500 bg-white"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Live Preview */}
          <div className="mt-6 bg-primary-50 border border-primary-100 rounded-xl p-4">
            <h4 className="text-xs font-black text-primary-700 uppercase tracking-widest mb-2 flex items-center">
              <RefreshCw className="h-3 w-3 mr-1.5" /> Live Preview
            </h4>
            <div className="space-y-1.5 text-sm text-primary-800">
              <p>• Late after <strong>{config.lateThresholdHour}:{String(config.lateThresholdMinute).padStart(2, '0')} {config.lateThresholdHour >= 12 ? 'PM' : 'AM'}</strong></p>
              <p>• Check-in window: <strong>{config.checkInStartHour}:00 AM</strong> to <strong>{config.checkInEndHour > 12 ? config.checkInEndHour - 12 : config.checkInEndHour}:00 {config.checkInEndHour >= 12 ? 'PM' : 'AM'}</strong></p>
              <p>• Overtime: <strong>{config.overtimeMultiplier}x</strong> rate after <strong>{config.defaultWorkHoursPerDay}h</strong></p>
              <p>• Salary based on <strong>{config.workingDaysPerMonth} working days</strong>/month</p>
              <p>• Max OT cap: <strong>{config.maxOvertimeHoursPerDay}h</strong>/day</p>
              <p>• New employees get <strong>{config.defaultLeaveBalance} days</strong> annual leave</p>
              <p>• Past-date leave: <strong>{config.allowPastDateLeave ? 'Allowed' : 'Not Allowed'}</strong></p>
            </div>
          </div>
        </div>
      )}

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
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleToggleRule(rule._id)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${rule.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {rule.isActive ? 'Active' : 'Disabled'}
                </button>
                <button 
                  onClick={() => handleDeleteRule(rule._id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
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
    </div>
  );
};

export default AdminSettings;
