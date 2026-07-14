import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  X, 
  Layers, 
  User, 
  Phone, 
  MapPin, 
  AlertCircle,
  Paperclip,
  FileText,
  UploadCloud,
  Eye,
  Download,
  Check,
  Building,
  ShieldCheck,
  Award
} from 'lucide-react';
import { Cooperative, CooperativeFile } from '../types';

interface CooperativesListProps {
  cooperatives: Cooperative[];
  onAddCooperative: (coop: Omit<Cooperative, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateCooperative: (id: string, coop: Partial<Cooperative>) => Promise<void>;
  onDeleteCooperative: (id: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
  userRole?: 'admin' | 'user';
}

const BARANGAYS = [
  'Poblacion',
  'San Isidro',
  'Santa Maria',
  'Santo Tomas',
  'Bagong Silang',
  'San Jose',
  'San Juan'
];

const REG_STATUSES = [
  'CDA Registered',
  'SEC Registered',
  'DOLE Registered',
  'Unregistered'
];

export default function CooperativesList({
  cooperatives,
  onAddCooperative,
  onUpdateCooperative,
  onDeleteCooperative,
  onRefresh,
  userRole = 'user'
}: CooperativesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [selectedReg, setSelectedReg] = useState('');

  // Form/Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCoop, setEditingCoop] = useState<Cooperative | null>(null);
  
  // Selected Coop for detailed view and files
  const [selectedCoop, setSelectedCoop] = useState<Cooperative | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'profile' | 'files'>('profile');

  // Input states
  const [name, setName] = useState('');
  const [chairperson, setChairperson] = useState('');
  const [contact, setContact] = useState('');
  const [barangay, setBarangay] = useState(BARANGAYS[0]);
  const [memberCount, setMemberCount] = useState('25');
  const [regStatus, setRegStatus] = useState<any>(REG_STATUSES[0]);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  
  const [validationError, setValidationError] = useState('');

  // File Upload inside Cooperative Detail Modal
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileUploadError, setFileUploadError] = useState('');
  const detailFileInputRef = useRef<HTMLInputElement>(null);
  
  // File Preview Modal
  const [previewFile, setPreviewFile] = useState<CooperativeFile | null>(null);

  const handleOpenAdd = () => {
    setEditingCoop(null);
    setName('');
    setChairperson('');
    setContact('');
    setBarangay(BARANGAYS[0]);
    setMemberCount('25');
    setRegStatus(REG_STATUSES[0]);
    setStatus('Active');
    setValidationError('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (coop: Cooperative) => {
    setEditingCoop(coop);
    setName(coop.name);
    setChairperson(coop.chairperson);
    setContact(coop.contact);
    setBarangay(coop.barangay);
    setMemberCount(String(coop.memberCount));
    setRegStatus(coop.regStatus);
    setStatus(coop.status);
    setValidationError('');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!name.trim() || !chairperson.trim()) {
      setValidationError('Cooperative Name and Chairperson/President name are required.');
      return;
    }

    const membersNum = parseInt(memberCount, 10);
    if (isNaN(membersNum) || membersNum < 0) {
      setValidationError('Member count must be a non-negative integer.');
      return;
    }

    const payload = {
      name: name.trim(),
      chairperson: chairperson.trim(),
      contact: contact.trim(),
      barangay,
      memberCount: membersNum,
      regStatus,
      status
    };

    try {
      if (editingCoop) {
        await onUpdateCooperative(editingCoop.id, payload);
        // If viewing, refresh the detailed panel state
        if (selectedCoop && selectedCoop.id === editingCoop.id) {
          setSelectedCoop(prev => prev ? { ...prev, ...payload } : null);
        }
      } else {
        await onAddCooperative(payload);
      }
      setIsFormOpen(false);
    } catch (err: any) {
      setValidationError('An error occurred. Please try again.');
    }
  };

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCoop) return;

    setIsUploadingFile(true);
    setFileUploadError('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + " MB";
      
      try {
        const res = await fetch(`/api/cooperatives/${selectedCoop.id}/files`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: sizeStr,
            dataUrl: base64
          })
        });

        if (!res.ok) {
          let errMsg = 'Failed to attach document to cooperative profile.';
          try {
            const data = await res.json();
            if (data && data.error) errMsg = data.error;
          } catch (e) {}
          throw new Error(errMsg);
        }
        const uploaded = await res.json();
        
        // Update local state
        const updatedFiles = [...(selectedCoop.files || []), uploaded];
        setSelectedCoop(prev => prev ? { ...prev, files: updatedFiles } : null);
        
        if (onRefresh) {
          await onRefresh();
        }
        window.dispatchEvent(new Event('storage-update'));
      } catch (err: any) {
        setFileUploadError(err.message || 'Error uploading attachment.');
      } finally {
        setIsUploadingFile(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // File delete handler
  const handleFileDelete = async (fileId: string) => {
    if (!selectedCoop) return;
    if (!confirm('Are you sure you want to permanently detach this official document from this cooperative?')) return;

    try {
      const res = await fetch(`/api/cooperatives/${selectedCoop.id}/files/${fileId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to remove attachment.');
      
      const updatedFiles = (selectedCoop.files || []).filter(f => f.id !== fileId);
      setSelectedCoop(prev => prev ? { ...prev, files: updatedFiles } : null);

      if (onRefresh) {
        await onRefresh();
      }
      window.dispatchEvent(new Event('storage-update'));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filter list
  const filteredCoops = cooperatives.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.chairperson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.contact && c.contact.includes(searchTerm));
    const matchesBarangay = selectedBarangay === '' || c.barangay === selectedBarangay;
    const matchesReg = selectedReg === '' || c.regStatus === selectedReg;
    return matchesSearch && matchesBarangay && matchesReg;
  });

  return (
    <div className="space-y-6" id="cooperatives-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Layers className="h-6 w-6 text-emerald-600" />
            Agricultural Associations & Cooperatives
          </h1>
          <p className="text-sm text-gray-500">
            Monitor registration credentials, active memberships, and leadership rosters of local farming coalitions.
          </p>
        </div>
        {userRole === 'admin' && (
          <button 
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-500 transition-colors cursor-pointer"
            id="btn-add-coop"
          >
            <Plus className="h-4 w-4" /> Add Cooperative
          </button>
        )}
      </div>

      {userRole !== 'admin' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-xs flex items-center gap-2.5 shadow-2xs font-semibold animate-in fade-in duration-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          <span>Read-Only Repository: Staff members can monitor cooperative statuses and rosters, but only Administrative Directors can register new cooperatives or modify profiles.</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="h-5 w-5" />
          </span>
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search cooperatives by name, chairperson..."
            className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden bg-gray-50/50"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 bg-gray-50/50">
            <MapPin className="h-4 w-4 text-gray-500" />
            <select 
              value={selectedBarangay} 
              onChange={(e) => setSelectedBarangay(e.target.value)}
              className="border-none bg-transparent text-sm focus:outline-none focus:ring-0 text-gray-700"
            >
              <option value="">All Barangays</option>
              {BARANGAYS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 bg-gray-50/50">
            <Layers className="h-4 w-4 text-gray-500" />
            <select 
              value={selectedReg} 
              onChange={(e) => setSelectedReg(e.target.value)}
              className="border-none bg-transparent text-sm focus:outline-none focus:ring-0 text-gray-700"
            >
              <option value="">All Registrations</option>
              {REG_STATUSES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Cooperatives */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCoops.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 bg-white border border-gray-100 rounded-xl">
            No matching cooperatives or associations registered.
          </div>
        ) : (
          filteredCoops.map((c) => (
            <div 
              key={c.id}
              onClick={() => {
                setSelectedCoop(c);
                setActiveDetailTab('profile');
              }}
              className="relative overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-emerald-300 cursor-pointer group"
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                  {c.regStatus}
                </span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                  c.status === 'Active' 
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' 
                    : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'
                }`}>
                  {c.status}
                </span>
              </div>

              {/* Cooperative Name */}
              <h3 className="mt-4 text-lg font-bold text-gray-900 leading-tight group-hover:text-emerald-900 transition-colors">
                {c.name}
              </h3>

              {/* Details */}
              <div className="mt-3 space-y-2 text-xs text-gray-600 border-t border-gray-50 pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Chairperson / Lead:</span>
                  <span className="font-bold text-gray-800">{c.chairperson}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Barangay:</span>
                  <span className="font-semibold text-gray-800">{c.barangay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Registered Members:</span>
                  <span className="font-bold text-emerald-700">{c.memberCount} Farmers</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Contact No:</span>
                  <span className="font-medium text-gray-800 font-mono">{c.contact || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Documents Attached:</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <Paperclip className="h-3.5 w-3.5" />
                    {c.files?.length || 0} files
                  </span>
                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-4 flex justify-between items-center border-t border-gray-50 pt-3 text-[11px] font-semibold text-emerald-600">
                <span>Click to View Records & Files</span>
                {userRole === 'admin' && (
                  <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => handleOpenEdit(c)}
                      className="inline-flex h-7 px-2.5 items-center justify-center gap-1 rounded-md border border-gray-200 text-gray-600 hover:text-emerald-600 hover:border-emerald-200 bg-white cursor-pointer text-xs"
                      title="Edit Cooperative Record"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button 
                      onClick={() => {
                        if(confirm(`Are you sure you want to delete ${c.name} and remove its registration records?`)){
                          onDeleteCooperative(c.id);
                        }
                      }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:text-rose-600 hover:border-rose-200 bg-white cursor-pointer"
                      title="Delete Cooperative"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cooperative Detail & Documents Modal */}
      {selectedCoop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="bg-emerald-800 p-6 text-white relative">
              <button 
                onClick={() => setSelectedCoop(null)}
                className="absolute right-4 top-4 text-emerald-200 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
              
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-emerald-700/60 flex items-center justify-center text-white text-2xl font-black shadow-inner">
                  <Building className="h-7 w-7" />
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-emerald-300 uppercase">OFFICIAL REGISTRATION LOG</span>
                  <h2 className="text-xl font-bold tracking-tight">
                    {selectedCoop.name}
                  </h2>
                  <p className="text-xs text-emerald-200/90 font-mono mt-0.5">
                    Registration Authority: {selectedCoop.regStatus} | Members: {selectedCoop.memberCount} active
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Selector */}
            <div className="flex border-b border-gray-100 bg-gray-50/50 px-6">
              <button 
                onClick={() => setActiveDetailTab('profile')}
                className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
                  activeDetailTab === 'profile' 
                    ? 'border-emerald-600 text-emerald-700' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Award className="h-4 w-4" /> Coalition Details
              </button>
              <button 
                onClick={() => setActiveDetailTab('files')}
                className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 relative ${
                  activeDetailTab === 'files' 
                    ? 'border-emerald-600 text-emerald-700' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Paperclip className="h-4 w-4" /> Legal Documents & Certificates
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {selectedCoop.files?.length || 0}
                </span>
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {activeDetailTab === 'profile' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Column 1 */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-gray-400" /> Leadership & Contact
                      </h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                        <div>
                          <span className="text-[10px] font-semibold text-gray-400 uppercase">Chairperson / Lead Officer</span>
                          <div className="text-sm font-bold text-gray-800">{selectedCoop.chairperson}</div>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-gray-400 uppercase">Official Contact Information</span>
                          <div className="text-sm font-medium text-gray-800 flex items-center gap-1.5 font-mono mt-0.5">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            {selectedCoop.contact || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-gray-400 uppercase">Operating Location (Barangay)</span>
                          <div className="text-sm font-semibold text-gray-800 flex items-center gap-1.5 mt-0.5">
                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                            {selectedCoop.barangay}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-gray-400" /> Accreditation Credentials
                      </h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                        <div>
                          <span className="text-[10px] font-semibold text-gray-400 uppercase">Accrediting Authority</span>
                          <div className="text-sm font-bold text-emerald-800 flex items-center gap-1 mt-0.5">
                            <ShieldCheck className="h-4 w-4" />
                            {selectedCoop.regStatus}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-gray-400 uppercase">Active Enrolled Members</span>
                          <div className="text-sm font-bold text-gray-800 mt-0.5">{selectedCoop.memberCount} Registered Practitioners</div>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-gray-400 uppercase">Cooperative Status</span>
                          <div className="mt-1">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              selectedCoop.status === 'Active' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {selectedCoop.status} Operating Status
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Edit action */}
                  {userRole === 'admin' && (
                    <div className="flex gap-2 justify-end border-t border-gray-100 pt-4">
                      <button 
                        onClick={() => {
                          setSelectedCoop(null);
                          handleOpenEdit(selectedCoop);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit Registration Details
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeDetailTab === 'files' && (
                <div className="space-y-6">
                  {/* Alert banner */}
                  <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl p-4 text-xs flex items-start gap-2.5 shadow-2xs">
                    <FileText className="h-5 w-5 shrink-0 text-indigo-600 mt-0.5" />
                    <div>
                      <div className="font-bold">Legal Credential Repository</div>
                      <p className="mt-0.5 text-indigo-800/80 leading-relaxed">
                        These official scanned attachments (CDA Registration Certificates, Articles of Cooperation, Bylaws, and municipal clearances) validate the legal authenticity of this coalition for participating in government-subsidized distribution programs.
                      </p>
                    </div>
                  </div>

                  {/* Upload box (Admin only) */}
                  {userRole === 'admin' && (
                    <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-5 text-center relative hover:border-emerald-500 transition-colors">
                      <input 
                        type="file" 
                        ref={detailFileInputRef}
                        onChange={handleFileUpload}
                        className="hidden" 
                        accept="application/pdf,image/*"
                      />
                      <UploadCloud className="h-8 w-8 text-gray-400 mx-auto" />
                      <h4 className="text-xs font-bold text-gray-700 mt-2">Attach Official Scanned Document Form</h4>
                      <p className="text-[10px] text-gray-400 mt-1">Accepts CDA Certificates, SEC records, or board approvals (PDF or Image under 10MB)</p>
                      
                      {isUploadingFile ? (
                        <div className="mt-3 text-xs font-semibold text-emerald-600 animate-pulse">Uploading file to persistent registry database...</div>
                      ) : (
                        <button 
                          onClick={() => detailFileInputRef.current?.click()}
                          className="mt-3 inline-flex items-center justify-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-3xs hover:bg-emerald-500 transition-colors cursor-pointer"
                        >
                          Select File From Computer
                        </button>
                      )}

                      {fileUploadError && (
                        <div className="mt-2 text-xs text-rose-600 font-medium">{fileUploadError}</div>
                      )}
                    </div>
                  )}

                  {/* Files masterlist */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Attached Certificates & Bylaws</h4>
                    
                    {(!selectedCoop.files || selectedCoop.files.length === 0) ? (
                      <div className="text-center py-8 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-400">
                        No official registration documents have been attached to this profile.
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white overflow-hidden shadow-2xs">
                        {selectedCoop.files.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-4 hover:bg-gray-50/80 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-gray-800 truncate" title={file.name}>{file.name}</div>
                                <div className="text-[10px] text-gray-400 mt-0.5">
                                  Size: {file.size} | Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {file.dataUrl ? (
                                <button 
                                  onClick={() => setPreviewFile(file)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:text-emerald-600 hover:border-emerald-200 bg-white cursor-pointer"
                                  title="Preview Document"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              ) : (
                                <button 
                                  onClick={() => alert('This is a core system registration certificate. High resolution files are backed up securely.')}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:text-emerald-600 hover:border-emerald-200 bg-white cursor-pointer"
                                  title="Preview Document"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              )}
                              
                              {file.dataUrl && (
                                <a 
                                  href={file.dataUrl} 
                                  download={file.name}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:text-emerald-600 hover:border-emerald-200 bg-white"
                                  title="Download File"
                                >
                                  <Download className="h-4 w-4" />
                                </a>
                              )}

                              {userRole === 'admin' && (
                                <button 
                                  onClick={() => handleFileDelete(file.id)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:text-rose-600 hover:border-rose-200 bg-white cursor-pointer"
                                  title="Delete Document"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 bg-gray-50 p-4 flex justify-end">
              <button 
                onClick={() => setSelectedCoop(null)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Scanned Certificate Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-widest">SECURE CREDENTIAL PREVIEW</h3>
                <div className="text-sm font-bold truncate pr-6">{previewFile.name}</div>
              </div>
              <button 
                onClick={() => setPreviewFile(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Simulated Frame */}
            <div className="flex-1 bg-gray-100 overflow-y-auto p-4 flex justify-center items-center">
              {previewFile.type.startsWith('image/') ? (
                <img 
                  src={previewFile.dataUrl} 
                  alt={previewFile.name} 
                  className="max-h-[60vh] max-w-full rounded-md shadow-lg object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="bg-white p-8 max-w-lg rounded-xl shadow-lg border border-gray-200 text-center space-y-4">
                  <div className="h-16 w-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <FileText className="h-10 w-10" />
                  </div>
                  <h4 className="text-base font-bold text-gray-800">Scanned PDF Registration Bylaws</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    This file is a scanned legal cooperative certificate verified and registered with the municipal office. High-security backups are stored in cloud archive structures.
                  </p>
                  <div className="pt-2">
                    <a 
                      href={previewFile.dataUrl} 
                      download={previewFile.name}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500"
                    >
                      <Download className="h-4 w-4" /> Download Original Certificate ({previewFile.size})
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-3 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setPreviewFile(null)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Cooperative Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button 
              onClick={() => setIsFormOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Title */}
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              {editingCoop ? 'Edit Cooperative Record' : 'Accredit New Cooperative'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {editingCoop ? 'Modify the credentials and membership data of a local agricultural association.' : 'Enroll a registered agricultural cooperative or group into the municipal directory.'}
            </p>

            {/* Validation Banner */}
            {validationError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-100">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {validationError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Cooperative Name</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Santa Maria Rice Farmers Association"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Chairperson / President</label>
                  <input 
                    type="text"
                    value={chairperson}
                    onChange={(e) => setChairperson(e.target.value)}
                    placeholder="Full Name"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Number</label>
                  <input 
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="e.g. 0917XXXXXXX"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Barangay Location</label>
                  <select 
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {BARANGAYS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Members Count</label>
                  <input 
                    type="number"
                    value={memberCount}
                    onChange={(e) => setMemberCount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Registration Body</label>
                  <select 
                    value={regStatus}
                    onChange={(e: any) => setRegStatus(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {REG_STATUSES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Accreditation Status</label>
                  <select 
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-gray-50">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-500 transition-colors"
                >
                  {editingCoop ? 'Save Changes' : 'Accredit Cooperative'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
