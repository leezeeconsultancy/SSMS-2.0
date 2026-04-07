import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, MapPin, Building, Search, 
  Filter, ChevronRight, Loader2, ArrowRightLeft,
  CheckCircle2, Info, Building2
} from 'lucide-react';
import Tooltip from '../../components/Tooltip';
import toast from 'react-hot-toast';

const Assignments = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [empRes, locRes] = await Promise.all([
        axios.get('/api/employees'),
        axios.get('/api/attendance/office-locations')
      ]);
      setEmployees(empRes.data);
      setLocations(locRes.data);
    } catch (error) {
      toast.error('Failed to load assignment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateAssignment = async (employeeId: string, locationId: string) => {
    setUpdatingId(employeeId);
    try {
      await axios.put(`/api/employees/${employeeId}`, { assignedLocation: locationId });
      toast.success('Location assignment updated');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation === 'all' || 
                            (emp.assignedLocation?._id || emp.assignedLocation) === selectedLocation;
    return matchesSearch && matchesLocation;
  });

  const locationStats = locations.map(loc => ({
    ...loc,
    count: employees.filter(emp => (emp.assignedLocation?._id || emp.assignedLocation) === loc._id).length
  }));

  const unassignedCount = employees.filter(emp => !emp.assignedLocation).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Building className="mr-2 h-6 w-6 text-primary-500" />
            Branch Assignments
        </h2>
        <p className="text-sm text-gray-500 mt-1">Manage and monitor employee placement across all registered office branches.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="bg-primary-50 p-2 rounded-lg"><Users className="h-5 w-5 text-primary-600" /></div>
            <span className="text-[10px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-bold">TOTAL</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-3">{employees.length}</p>
          <p className="text-xs text-gray-500 mt-1">Active Employees</p>
        </div>

        {locationStats.slice(0, 2).map((loc, i) => (
          <div key={loc._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="bg-emerald-50 p-2 rounded-lg"><MapPin className="h-5 w-5 text-emerald-600" /></div>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">{loc.name.toUpperCase()}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-3">{loc.count}</p>
            <p className="text-xs text-gray-500 mt-1">Assigned Staff</p>
          </div>
        ))}

        <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm bg-orange-50/10">
          <div className="flex items-center justify-between">
            <div className="bg-orange-50 p-2 rounded-lg"><Building2 className="h-5 w-5 text-orange-600" /></div>
            <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">PENDING</span>
          </div>
          <p className="text-2xl font-bold text-orange-600 mt-3">{unassignedCount}</p>
          <p className="text-xs text-orange-500 mt-1">Unassigned Employees</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-sm transition-all"
          />
        </div>
        <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400 ml-2 mr-1 hidden md:block" />
            <select 
                value={selectedLocation} 
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 shadow-sm font-medium"
            >
                <option value="all">All Locations</option>
                {locations.map(loc => (
                    <option key={loc._id} value={loc._id}>{loc.name}</option>
                ))}
            </select>
        </div>
      </div>

      {/* User Assignment Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Department</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Branch Assignment</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Quick Re-assign</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEmployees.length > 0 ? filteredEmployees.map((emp) => (
                <tr key={emp._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-9 w-9 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                        {emp.name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-bold text-gray-900">{emp.name}</p>
                        <p className="text-[10px] text-gray-400 font-medium">#{emp.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                        {emp.department}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`p-1.5 rounded-lg mr-2.5 ${emp.assignedLocation ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                      <span className={`text-sm font-bold ${emp.assignedLocation ? 'text-gray-700' : 'text-red-500'}`}>
                        {typeof emp.assignedLocation === 'object' ? emp.assignedLocation?.name : (emp.assignedLocation ? locations.find(l => l._id === emp.assignedLocation)?.name : 'Unassigned')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {locations.map(loc => {
                        const isCurrent = (emp.assignedLocation?._id || emp.assignedLocation) === loc._id;
                        return (
                          <button
                            key={loc._id}
                            disabled={updatingId === emp._id || isCurrent}
                            onClick={() => handleUpdateAssignment(emp._id, loc._id)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isCurrent 
                                ? 'bg-primary-600 text-white border-primary-600' 
                                : 'bg-white text-gray-400 border-gray-100 hover:border-primary-200 hover:text-primary-600'
                            }`}
                          >
                            <Tooltip content={`Assign to ${loc.name}`} position="top">
                                {updatingId === emp._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            </Tooltip>
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end">
                      {emp.assignedLocation ? (
                        <div className="flex items-center text-emerald-600">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          <span className="text-[10px] font-black uppercase">Secured</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-500">
                          <ArrowRightLeft className="h-4 w-4 mr-1 animate-pulse" />
                          <span className="text-[10px] font-black uppercase">Needed</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="bg-gray-50 p-4 rounded-full mb-3"><Users className="h-8 w-8 text-gray-300" /></div>
                      <p className="text-sm font-bold text-gray-900">No matching employees found</p>
                      <p className="text-xs text-gray-500 mt-1">Try adjusting your search or location filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex items-start">
        <div className="bg-indigo-100 p-2.5 rounded-xl mr-4 shrink-0"><Info className="h-5 w-5 text-indigo-600" /></div>
        <div>
          <h4 className="text-sm font-bold text-indigo-900">Location Enforcement is LIVE</h4>
          <p className="text-xs text-indigo-700 mt-1.5 leading-relaxed">
            Changing an employee's assignment here takes effect <strong>instantly</strong>. The user's mobile app will automatically lock attendance unless they are within the 200m radius of the new branch coordinates you set. No server restart is required.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Assignments;
