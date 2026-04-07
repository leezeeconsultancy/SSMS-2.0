import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MapPin, Target, Users, 
  RefreshCw, Loader2, Save, Trash2, 
  Building2, Search, Info
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const BranchManager = () => {
  const [locations, setLocations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // New Location Form State
  const [newLoc, setNewLoc] = useState({
    name: '',
    latitude: '',
    longitude: '',
    radius: '200'
  });

  const fetchData = async () => {
    try {
      const [locRes, empRes] = await Promise.all([
        axios.get('/api/attendance/office-locations'),
        axios.get('/api/employees')
      ]);
      setLocations(locRes.data);
      setEmployees(empRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleGetGPS = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewLoc(prev => ({ 
          ...prev, 
          latitude: String(pos.coords.latitude), 
          longitude: String(pos.coords.longitude) 
        }));
        setGpsLoading(false);
        toast.success('Live coordinates captured!');
      },
      (err) => {
        setGpsLoading(false);
        toast.error(`GPS Error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/api/attendance/office-locations', {
        name: newLoc.name,
        latitude: Number(newLoc.latitude),
        longitude: Number(newLoc.longitude),
        radiusMeters: Number(newLoc.radius)
      });
      toast.success('New branch location added!');
      setNewLoc({ name: '', latitude: '', longitude: '', radius: '200' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add location');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async (employeeId: string, locationId: string) => {
    try {
      await axios.put(`/api/employees/${employeeId}`, { assignedLocation: locationId });
      toast.success('Employee assigned successfully');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to update assignment');
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!window.confirm('Delete this office? All assigned employees will lose their geofence!')) return;
    try {
      await axios.delete(`/api/attendance/office-locations/${id}`);
      toast.success('Office removed');
      fetchData();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary-600" /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Toaster position="top-right" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center">
            <Building2 className="mr-2 h-6 w-6 text-primary-600" />
            Branch & Staff Hub
          </h2>
          <p className="text-sm text-gray-500">Capture office GPS and manage employee branch assignments in real-time.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Capture New Branch */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
              <Target className="h-3 w-3 mr-2 text-primary-500" />
              Capture New Office
            </h3>
            
            <form onSubmit={handleAddLocation} className="space-y-4">
              <div className="bg-primary-50/50 p-4 rounded-xl border border-primary-100 mb-4 text-center">
                <button 
                  type="button" 
                  onClick={handleGetGPS}
                  disabled={gpsLoading}
                  className="w-full bg-white text-primary-600 font-bold py-3 px-4 rounded-xl shadow-sm border border-primary-100 hover:bg-primary-50 transition-all flex items-center justify-center gap-2 group"
                >
                  {gpsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />}
                  {gpsLoading ? 'Locking GPS...' : 'GET LIVE GPS NOW'}
                </button>
                <p className="text-[10px] text-primary-400 mt-2 font-bold tracking-tight">STAND AT THE OFFICE ENTRANCE BEFORE CLICKING</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Office Name</label>
                <input type="text" required value={newLoc.name} onChange={e => setNewLoc({...newLoc, name: e.target.value})} placeholder="e.g. Surat Main Branch" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Latitude</label>
                  <input type="text" readOnly value={newLoc.latitude} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-mono text-gray-500" placeholder="Capture to set" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Longitude</label>
                  <input type="text" readOnly value={newLoc.longitude} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-mono text-gray-500" placeholder="Capture to set" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1 flex items-center">
                  Radius (Meters)
                  <Info className="h-3 w-3 ml-1 text-gray-300" />
                </label>
                <input type="number" required value={newLoc.radius} onChange={e => setNewLoc({...newLoc, radius: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>

              <button type="submit" disabled={submitting || !newLoc.latitude} className="w-full bg-primary-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                {submitting ? 'SAVING...' : 'SAVE BRANCH'}
              </button>
            </form>
          </div>

          <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
            <MapPin className="absolute -bottom-4 -right-4 h-32 w-32 opacity-10 group-hover:scale-125 transition-transform duration-500" />
            <h4 className="text-lg font-black leading-tight">Dynamic Geofence Active</h4>
            <p className="text-xs text-indigo-100 mt-2">Any employee assigned below will be restricted to a {newLoc.radius}m bubble around your chosen GPS coordinates.</p>
          </div>
        </div>

        {/* Right Col: Saved Branches & Staff Assignments */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Saved Branches List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
              <Building2 className="h-3 w-3 mr-2 text-primary-500" />
              Active Branches ({locations.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {locations.map(loc => (
                <div key={loc._id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all flex items-center justify-between group">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-black text-gray-900 leading-tight">{loc.name}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter mt-1">{loc.radiusMeters}m Geofence</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteLocation(loc._id)} className="p-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all rounded-lg hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {locations.length === 0 && <p className="text-center py-6 text-gray-400 text-xs font-bold sm:col-span-2">NO BRANCHES ADDED YET</p>}
            </div>
          </div>

          {/* Assignments Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center">
                <Users className="h-3 w-3 mr-2 text-primary-500" />
                Staff Assignment Hub
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Filter staff..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-100 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 outline-none w-full sm:w-64" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase">Employee</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase">Assigned Office / Bubble</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())).map(emp => (
                    <tr key={emp._id} className="hover:bg-gray-50/50 group transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 text-[10px] font-black italic">
                            {emp.name.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <p className="text-xs font-black text-gray-800">{emp.name}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{emp.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <MapPin className={`h-3 w-3 mr-1.5 ${emp.assignedLocation ? 'text-emerald-500' : 'text-rose-400'}`} />
                          <span className={`text-[11px] font-black ${emp.assignedLocation ? 'text-gray-700' : 'text-rose-500 italic uppercase'}`}>
                            {typeof emp.assignedLocation === 'object' ? emp.assignedLocation?.name : (emp.assignedLocation ? locations.find(l => l._id === emp.assignedLocation)?.name : 'Not Tied to Branch')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <select 
                            onChange={(e) => handleAssign(emp._id, e.target.value)}
                            value={typeof emp.assignedLocation === 'object' ? emp.assignedLocation?._id : (emp.assignedLocation || '')}
                            className="bg-gray-50 border border-gray-100 text-[10px] font-black rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary-500 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                          >
                            <option value="">Move Branch...</option>
                            {locations.map(loc => <option key={loc._id} value={loc._id}>{loc.name}</option>)}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BranchManager;
