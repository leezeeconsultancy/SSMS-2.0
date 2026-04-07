import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, Mail, Phone, X, Loader2, CheckCircle, Clock, AlertTriangle, Ban, RefreshCw, MapPin } from 'lucide-react';
import Tooltip from '../../components/Tooltip';
import toast, { Toaster } from 'react-hot-toast';

interface EmployeeType {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate: string;
  status: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  assignedLocation?: any;
}

const emptyForm = {
  employeeId: '',
  name: '',
  email: '',
  phone: '',
  department: '',
  designation: '',
  salary: '',
  workHoursPerDay: '9',
  joiningDate: '',
  password: '',
  role: 'Employee',
  status: 'Active',
  defaultPayoutDay: '1',
  shiftStartTime: '09:00',
  shiftEndTime: '18:00',
  assignedLocation: '',
};

const Employees = () => {
  const [employees, setEmployees] = useState<EmployeeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  const fetchEmployees = async () => {
    try {
      const [empRes, deptRes, locRes] = await Promise.all([
        axios.get('/api/employees'),
        axios.get('/api/departments'),
        axios.get('/api/attendance/office-locations')
      ]);
      setEmployees(empRes.data);
      setDepartments(deptRes.data);
      setLocations(locRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEditModal = (emp: EmployeeType) => {
    setEditingId(emp._id);
    setForm({
      employeeId: emp.employeeId,
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      department: emp.department,
      designation: emp.designation,
      salary: String(emp.salary),
      workHoursPerDay: String((emp as any).workHoursPerDay || 9),
      joiningDate: emp.joiningDate?.slice(0, 10) || '',
      password: '',
      role: (emp as any).userId?.role || 'Employee',
      status: (emp as any).userId?.status || 'Active',
      defaultPayoutDay: String((emp as any).defaultPayoutDay || 1),
      shiftStartTime: emp.shiftStartTime || '09:00',
      shiftEndTime: emp.shiftEndTime || '18:00',
      assignedLocation: emp.assignedLocation?._id || emp.assignedLocation || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        salary: Number(form.salary),
        workHoursPerDay: Number(form.workHoursPerDay),
      };

      if (editingId) {
        await axios.put(`/api/employees/${editingId}`, payload);
        toast.success('Employee updated!');
      } else {
        await axios.post('/api/employees', payload);
        toast.success('Employee created! They can login with the password you set.');
      }
      setShowModal(false);
      setForm({ ...emptyForm });
      setEditingId(null);
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete ${name}? This will permanently remove their account and all data.`)) return;
    try {
      await axios.delete(`/api/employees/${id}`);
      toast.success('Employee deleted');
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
          <p className="mt-1 text-sm text-gray-500">{employees.length} employees in the system</p>
        </div>
        <button onClick={openAddModal} className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors">
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Add Employee
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-100 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search by name, ID, or department..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500" />
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payout</th>
                <th className="px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">Loading...</td></tr>
              ) : filteredEmployees.length > 0 ? filteredEmployees.map((person) => (
                <tr key={person._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold uppercase">{person.name?.charAt(0)}</div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{person.name}</div>
                        <div className="text-xs text-gray-500">{person.employeeId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-0.5">
                      <span className="flex items-center text-sm text-gray-600"><Mail className="mr-1.5 h-3.5 w-3.5 text-gray-400" />{person.email}</span>
                      <span className="flex items-center text-sm text-gray-600"><Phone className="mr-1.5 h-3.5 w-3.5 text-gray-400" />{person.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{person.department}</div>
                    <div className="flex items-center text-xs text-gray-500 mt-0.5">
                      <MapPin className="h-3 w-3 mr-1" />
                      {typeof person.assignedLocation === 'object' ? person.assignedLocation?.name : 'Default Office'}
                    </div>
                    <div className="flex items-center text-[10px] text-primary-600 mt-1 font-bold">
                        <Clock className="h-2.5 w-2.5 mr-1" />
                        {person.shiftStartTime} - {person.shiftEndTime}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${person.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{person.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const status = (person as any).payrollStatus || 'Pending';
                      const config: Record<string, { bg: string; text: string; icon: any; pulse?: boolean }> = {
                        'Paid':       { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
                        'Pending':    { bg: 'bg-amber-100',   text: 'text-amber-700',   icon: Clock, pulse: true },
                        'Processing': { bg: 'bg-blue-100',    text: 'text-blue-700',    icon: RefreshCw, pulse: true },
                        'On Hold':    { bg: 'bg-orange-100',  text: 'text-orange-700',  icon: AlertTriangle },
                        'Cancelled':  { bg: 'bg-red-100',     text: 'text-red-700',     icon: Ban },
                      };
                      const c = config[status] || config['Pending'];
                      const Icon = c.icon;
                      return (
                        <Tooltip content={`Current payroll status: ${status}`} position="top">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center w-fit cursor-default ${c.bg} ${c.text} ${c.pulse ? 'animate-pulse' : ''}`}>
                            <Icon className="h-2.5 w-2.5 mr-1" />
                            {status}
                          </span>
                        </Tooltip>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end space-x-2">
                      <Tooltip content="Edit Employee" position="top">
                        <button onClick={() => openEditModal(person)} className="p-1.5 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100"><Edit2 className="h-4 w-4" /></button>
                      </Tooltip>
                      <Tooltip content="Remove Employee" position="top">
                        <button onClick={() => handleDelete(person._id, person.name)} className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100"><Trash2 className="h-4 w-4" /></button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">{searchTerm ? 'No employees match your search.' : 'No employees yet. Click "Add Employee" to create one.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Employee' : 'Add New Employee'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-md hover:bg-gray-100"><X className="h-5 w-5 text-gray-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Employee ID *</label>
                  <input type="text" name="employeeId" required value={form.employeeId} onChange={handleChange} placeholder="SSMS-1001" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500" disabled={!!editingId} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                  <input type="text" name="name" required value={form.name} onChange={handleChange} placeholder="Rahul Kumar" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="rahul@company.com" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500" disabled={!!editingId} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone *</label>
                  <input type="tel" name="phone" required value={form.phone} onChange={handleChange} placeholder="9876543210" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Department *</label>
                  <select name="department" required value={form.department} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500 font-medium">
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Designation *</label>
                  <input type="text" name="designation" required value={form.designation} onChange={handleChange} placeholder="Software Engineer" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Salary (₹) *</label>
                  <input type="number" name="salary" required value={form.salary} onChange={handleChange} placeholder="25000" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Hrs/Day</label>
                  <select name="workHoursPerDay" value={form.workHoursPerDay} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500">
                    <option value="8">8 hrs</option>
                    <option value="9">9 hrs</option>
                    <option value="10">10 hrs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Joining Date *</label>
                  <input type="date" name="joiningDate" required value={form.joiningDate} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                  <input type="password" name="password" required={!editingId} value={form.password} onChange={handleChange} placeholder={editingId ? 'New (Optional)' : 'Login Pwd'} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payout Day</label>
                  <input type="number" name="defaultPayoutDay" min="1" max="31" value={form.defaultPayoutDay} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500" />
                </div>
              </div>

              <div className="bg-primary-50 p-4 rounded-xl space-y-3">
                <p className="text-[10px] font-black text-primary-700 uppercase tracking-widest">Shift & Location Controls</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Shift Start *</label>
                    <input type="time" name="shiftStartTime" required value={form.shiftStartTime} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Shift End *</label>
                    <input type="time" name="shiftEndTime" required value={form.shiftEndTime} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Assigned Branch *</label>
                  <select name="assignedLocation" required value={form.assignedLocation} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500 font-medium">
                    <option value="">Select a Branch</option>
                    {locations.map((loc) => (
                      <option key={loc._id} value={loc._id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {editingId && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                    <select name="role" value={(form as any).role} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500">
                      <option value="Employee">Employee</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <select name="status" value={(form as any).status} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {submitting ? 'Saving...' : editingId ? 'Update Employee' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
