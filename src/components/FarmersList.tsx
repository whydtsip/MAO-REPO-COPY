import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  X, 
  Sprout, 
  UserPlus, 
  AlertCircle,
  FileText,
  UploadCloud,
  Download,
  Eye,
  File,
  Paperclip,
  Check,
  User,
  Activity,
  Calendar,
  Phone,
  Layers,
  Sparkles
} from 'lucide-react';
import { Farmer, FarmerFile } from '../types';

interface FarmersListProps {
  farmers: Farmer[];
  onAddFarmer: (farmer: Omit<Farmer, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateFarmer: (id: string, farmer: Partial<Farmer>) => Promise<void>;
  onDeleteFarmer: (id: string) => Promise<void>;
  onBulkAddFarmers?: (farmers: any[]) => Promise<void>;
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

const CROP_TYPES = [
  'Rice',
  'Corn',
  'Coconut',
  'Vegetable',
  'High-Value Crops',
  'Livestock',
  'Fishery'
];

export default function FarmersList({
  farmers,
  onAddFarmer,
  onUpdateFarmer,
  onDeleteFarmer,
  onBulkAddFarmers,
  onRefresh,
  userRole = 'user'
}: FarmersListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  
  // Modals / Panels
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'profile' | 'files'>('profile');
  
  // Edit Form States
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [rsbsaNo, setRsbsaNo] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [dob, setDob] = useState('');
  const [contact, setContact] = useState('');
  const [barangay, setBarangay] = useState(BARANGAYS[0]);
  const [cropType, setCropType] = useState<any>(CROP_TYPES[0]);
  const [farmSize, setFarmSize] = useState('1.0');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  
  const [validationError, setValidationError] = useState('');
  
  // Bulk Upload States
  const [csvText, setCsvText] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [parsedBulkFarmers, setParsedBulkFarmers] = useState<any[]>([]);
  const [isDraggingCSV, setIsDraggingCSV] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // File Upload States (inside details panel)
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileUploadError, setFileUploadError] = useState('');
  const detailFileInputRef = useRef<HTMLInputElement>(null);
  
  // File Preview Modal
  const [previewFile, setPreviewFile] = useState<FarmerFile | null>(null);

  // Handle opening form for addition
  const handleOpenAdd = () => {
    setEditingFarmer(null);
    setRsbsaNo(`04-21-03-00${Math.floor(Math.random() * 9) + 1}-${Math.floor(100000 + Math.random() * 900000)}`);
    setFirstName('');
    setLastName('');
    setMiddleName('');
    setGender('Male');
    setDob('1980-01-01');
    setContact('');
    setBarangay(BARANGAYS[0]);
    setCropType(CROP_TYPES[0]);
    setFarmSize('1.0');
    setStatus('Active');
    setValidationError('');
    setIsFormOpen(true);
  };

  // Handle opening form for editing
  const handleOpenEdit = (farmer: Farmer) => {
    setEditingFarmer(farmer);
    setRsbsaNo(farmer.rsbsaNo);
    setFirstName(farmer.firstName);
    setLastName(farmer.lastName);
    setMiddleName(farmer.middleName || '');
    setGender(farmer.gender);
    setDob(farmer.dob);
    setContact(farmer.contact);
    setBarangay(farmer.barangay);
    setCropType(farmer.cropType);
    setFarmSize(String(farmer.farmSize));
    setStatus(farmer.status);
    setValidationError('');
    setIsFormOpen(true);
  };

  // Handle submission of Add/Edit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!firstName.trim() || !lastName.trim() || !rsbsaNo.trim()) {
      setValidationError('First Name, Last Name, and RSBSA Reference No. are required.');
      return;
    }

    const farmSizeNum = parseFloat(farmSize);
    if (isNaN(farmSizeNum) || farmSizeNum <= 0) {
      setValidationError('Farm size must be a positive number.');
      return;
    }

    const payload = {
      rsbsaNo,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      middleName: middleName.trim() || undefined,
      gender,
      dob,
      contact: contact.trim(),
      barangay,
      cropType,
      farmSize: farmSizeNum,
      status
    };

    try {
      if (editingFarmer) {
        await onUpdateFarmer(editingFarmer.id, payload);
        // If viewing, refresh the detailed panel state
        if (selectedFarmer && selectedFarmer.id === editingFarmer.id) {
          setSelectedFarmer(prev => prev ? { ...prev, ...payload } : null);
        }
      } else {
        await onAddFarmer(payload);
      }
      setIsFormOpen(false);
    } catch (err: any) {
      setValidationError('An error occurred. Please try again.');
    }
  };

  // CSV Parsing Logic
  const handleParseCSV = (text: string) => {
    setBulkError('');
    if (!text.trim()) {
      setParsedBulkFarmers([]);
      return;
    }

    const lines = text.split("\n");
    const results: any[] = [];
    let lineIdx = 0;

    for (const line of lines) {
      lineIdx++;
      if (!line.trim()) continue;
      
      const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ''));
      // Skip header
      if (lineIdx === 1 && (cols[0].toLowerCase().includes("rsbsa") || cols[1].toLowerCase().includes("first"))) {
        continue;
      }

      if (cols.length < 3) {
        continue; // invalid format
      }

      const rawFarmSize = parseFloat(cols[9]);
      const validFarmSize = isNaN(rawFarmSize) ? 1.0 : rawFarmSize;

      results.push({
        rsbsaNo: cols[0] || `04-21-03-00${Math.floor(Math.random() * 9) + 1}-${Math.floor(100000 + Math.random() * 900000)}`,
        firstName: cols[1] || 'Unknown',
        lastName: cols[2] || 'Farmer',
        middleName: cols[3] || '',
        gender: (cols[4] === 'Female' ? 'Female' : 'Male') as 'Male' | 'Female',
        dob: cols[5] || '1985-05-15',
        contact: cols[6] || '09170000000',
        barangay: BARANGAYS.includes(cols[7]) ? cols[7] : BARANGAYS[0],
        cropType: CROP_TYPES.includes(cols[8]) ? cols[8] : CROP_TYPES[0],
        farmSize: validFarmSize,
        status: 'Active' as 'Active' | 'Inactive'
      });
    }

    setParsedBulkFarmers(results);
  };

  const handleCsvTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCsvText(e.target.value);
    handleParseCSV(e.target.value);
  };

  // CSV Template generation
  const downloadCsvTemplate = () => {
    const headers = "RSBSA No,First Name,Last Name,Middle Name,Gender,Birthdate,Contact,Barangay,Crop Type,Farm Size\n";
    const sample = "04-21-03-005-555555,Juan,Dela Cruz,Santos,Male,1984-06-12,09171234567,Poblacion,Rice,2.5\n04-21-03-002-888888,Maria,Clara,Ibarra,Female,1990-11-23,09189876543,San Isidro,Vegetable,1.2";
    const blob = new Blob([headers + sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'farmers_bulk_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pre-populate sample text
  const loadSampleBulkData = () => {
    const samples = "RSBSA No,First Name,Last Name,Middle Name,Gender,Birthdate,Contact,Barangay,Crop Type,Farm Size\n" +
      "04-21-03-001-112233,Ricardo,Dalisay,Arevalo,Male,1978-02-15,09171231234,Santa Maria,Rice,3.4\n" +
      "04-21-03-004-998877,Teresa,Magbanua,Ferrer,Female,1985-10-10,09187651234,Bagong Silang,Corn,1.8\n" +
      "04-21-03-006-445566,Andres,Bonifacio,Castro,Male,1982-11-30,09094445555,Santo Tomas,Coconut,4.5\n" +
      "04-21-03-003-332211,Gabriela,Silang,Cariño,Female,1991-03-19,09159998888,San Jose,Fishery,0.8";
    setCsvText(samples);
    handleParseCSV(samples);
  };

  const handleBulkSubmit = async () => {
    if (parsedBulkFarmers.length === 0) {
      setBulkError('Please enter or upload valid CSV farmer data first.');
      return;
    }

    try {
      if (onBulkAddFarmers) {
        await onBulkAddFarmers(parsedBulkFarmers);
      } else {
        // Fallback fetch - align with backend body expectations
        const res = await fetch('/api/farmers/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ farmersList: parsedBulkFarmers })
        });
        if (!res.ok) throw new Error('Bulk registration service failed.');
        if (onRefresh) {
          await onRefresh();
        }
      }
      setCsvText('');
      setParsedBulkFarmers([]);
      setIsBulkOpen(false);
    } catch (err: any) {
      setBulkError(err.message || 'An error occurred during bulk registration.');
    }
  };

  // Handle Drag & Drop for Bulk Upload
  const handleDragOverCSV = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingCSV(true);
  };

  const handleDragLeaveCSV = () => {
    setIsDraggingCSV(false);
  };

  const handleDropCSV = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingCSV(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvText(text);
        handleParseCSV(text);
      };
      reader.readAsText(file);
    }
  };

  const handleFileChangeCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvText(text);
        handleParseCSV(text);
      };
      reader.readAsText(file);
    }
  };

  // File Upload inside Farmer Detail Modal
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedFarmer) return;

    setIsUploadingFile(true);
    setFileUploadError('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + " MB";
      
      try {
        const res = await fetch(`/api/farmers/${selectedFarmer.id}/files`, {
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
          let errMsg = 'Failed to attach document to farmer profile.';
          try {
            const data = await res.json();
            if (data && data.error) errMsg = data.error;
          } catch (e) {}
          throw new Error(errMsg);
        }
        const uploaded = await res.json();
        
        // Update local state
        const updatedFiles = [...(selectedFarmer.files || []), uploaded];
        setSelectedFarmer(prev => prev ? { ...prev, files: updatedFiles } : null);
        
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

  // File Deletion inside Farmer Detail Modal
  const handleFileDelete = async (fileId: string) => {
    if (!selectedFarmer) return;
    if (!confirm('Are you sure you want to permanently detach this official document?')) return;

    try {
      const res = await fetch(`/api/farmers/${selectedFarmer.id}/files/${fileId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to remove attachment.');
      
      const updatedFiles = (selectedFarmer.files || []).filter(f => f.id !== fileId);
      setSelectedFarmer(prev => prev ? { ...prev, files: updatedFiles } : null);

      if (onRefresh) {
        await onRefresh();
      }
      window.dispatchEvent(new Event('storage-update'));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filtering
  const filteredFarmers = farmers.filter(f => {
    const matchesSearch = 
      `${f.firstName} ${f.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.rsbsaNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.contact && f.contact.includes(searchTerm));
    const matchesBarangay = selectedBarangay === '' || f.barangay === selectedBarangay;
    const matchesCrop = selectedCrop === '' || f.cropType === selectedCrop;
    return matchesSearch && matchesBarangay && matchesCrop;
  });

  return (
    <div className="space-y-6" id="farmers-view">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Sprout className="h-6 w-6 text-emerald-600" />
            Farmer Registry Repository
          </h1>
          <p className="text-sm text-gray-500">
            Securely maintain and view official profiles of RSBSA registered farming practitioners.
          </p>
        </div>
        {userRole === 'admin' && (
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setIsBulkOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
              id="btn-bulk-farmers"
            >
              <UploadCloud className="h-4 w-4" /> Bulk Import
            </button>
            <button 
              onClick={handleOpenAdd}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-500 transition-colors cursor-pointer"
              id="btn-add-farmer"
            >
              <Plus className="h-4 w-4" /> Add Farmer Profile
            </button>
          </div>
        )}
      </div>

      {userRole !== 'admin' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-xs flex items-center gap-2.5 shadow-2xs font-semibold animate-in fade-in duration-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          <span>Read-Only Registry: Staff accounts may browse registered practitioners and view/download their RSBSA attachment forms, but only Admin Directors can perform modifications.</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="h-5 w-5" />
          </span>
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search farmers by name, RSBSA reference..."
            className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden bg-gray-50/50"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 bg-gray-50/50">
            <Filter className="h-4 w-4 text-gray-500" />
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
            <Sprout className="h-4 w-4 text-gray-500" />
            <select 
              value={selectedCrop} 
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="border-none bg-transparent text-sm focus:outline-none focus:ring-0 text-gray-700"
            >
              <option value="">All Crop Types</option>
              {CROP_TYPES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Farmers */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredFarmers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 bg-white border border-gray-100 rounded-xl">
            No matching farmers found.
          </div>
        ) : (
          filteredFarmers.map((f) => (
            <div 
              key={f.id}
              onClick={() => {
                setSelectedFarmer(f);
                setActiveDetailTab('profile');
              }}
              className="relative overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-emerald-300 cursor-pointer group"
            >
              {/* Header Status Tag */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono tracking-wider text-gray-400 uppercase">RSBSA REF NO:</span>
                  <div className="text-sm font-bold text-emerald-800 font-mono mt-0.5 group-hover:text-emerald-600 transition-colors">{f.rsbsaNo}</div>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                  f.status === 'Active' 
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' 
                    : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'
                }`}>
                  {f.status}
                </span>
              </div>

              {/* Farmer Name */}
              <h3 className="mt-4 text-lg font-bold text-gray-900 leading-tight group-hover:text-emerald-900 transition-colors">
                {f.lastName}, {f.firstName} {f.middleName && `${f.middleName.charAt(0)}.`}
              </h3>

              {/* Profile Details */}
              <div className="mt-3 space-y-2 text-xs text-gray-600 border-t border-gray-50 pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Barangay:</span>
                  <span className="font-semibold text-gray-800">{f.barangay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Primary Crop:</span>
                  <span className="font-semibold text-gray-800 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {f.cropType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Farm Size:</span>
                  <span className="font-semibold text-gray-800">{f.farmSize} Hectares</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Document Attachments:</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <Paperclip className="h-3.5 w-3.5" />
                    {f.files?.length || 0} files
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex justify-between items-center border-t border-gray-50 pt-3 text-[11px] font-medium text-emerald-600">
                <span>Click to View Profile & Files</span>
                {userRole === 'admin' && (
                  <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => handleOpenEdit(f)}
                      className="inline-flex h-7 px-2.5 items-center justify-center gap-1 rounded-md border border-gray-200 text-gray-600 hover:text-emerald-600 hover:border-emerald-200 bg-white shadow-3xs cursor-pointer text-xs"
                      title="Edit Profile"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button 
                      onClick={() => {
                        if(confirm(`Are you sure you want to delete ${f.firstName} ${f.lastName}'s profile from the repository?`)){
                          onDeleteFarmer(f.id);
                        }
                      }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:text-rose-600 hover:border-rose-200 bg-white shadow-3xs cursor-pointer"
                      title="Delete Profile"
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

      {/* Unified Profile & Document Attachments Modal */}
      {selectedFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="bg-emerald-800 p-6 text-white relative">
              <button 
                onClick={() => setSelectedFarmer(null)}
                className="absolute right-4 top-4 text-emerald-200 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
              
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-emerald-700/60 flex items-center justify-center text-white text-2xl font-black shadow-inner">
                  {selectedFarmer.firstName.charAt(0)}{selectedFarmer.lastName.charAt(0)}
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-emerald-300 uppercase">OFFICIAL RSBSA RECORD</span>
                  <h2 className="text-2xl font-bold tracking-tight">
                    {selectedFarmer.firstName} {selectedFarmer.middleName && `${selectedFarmer.middleName} `}{selectedFarmer.lastName}
                  </h2>
                  <p className="text-xs text-emerald-200/90 font-mono mt-0.5">
                    Reference Code: {selectedFarmer.rsbsaNo} | Registered: {new Date(selectedFarmer.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Selectors */}
            <div className="flex border-b border-gray-100 bg-gray-50/50 px-6">
              <button 
                onClick={() => setActiveDetailTab('profile')}
                className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
                  activeDetailTab === 'profile' 
                    ? 'border-emerald-600 text-emerald-700' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <User className="h-4 w-4" /> Personal & Farm Profile
              </button>
              <button 
                onClick={() => setActiveDetailTab('files')}
                className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 relative ${
                  activeDetailTab === 'files' 
                    ? 'border-emerald-600 text-emerald-700' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Paperclip className="h-4 w-4" /> Official Document Attachments
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {selectedFarmer.files?.length || 0}
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
                        <User className="h-3.5 w-3.5 text-gray-400" /> Personal Identity
                      </h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                        <div>
                          <span className="text-[10px] font-semibold text-gray-400 uppercase">Full Legal Name</span>
                          <div className="text-sm font-bold text-gray-800">
                            {selectedFarmer.lastName}, {selectedFarmer.firstName} {selectedFarmer.middleName || ''}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] font-semibold text-gray-400 uppercase">Gender</span>
                            <div className="text-sm font-medium text-gray-800">{selectedFarmer.gender}</div>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-gray-400 uppercase">Birthdate</span>
                            <div className="text-sm font-medium text-gray-800 flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-gray-400" />
                              {selectedFarmer.dob}
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-gray-400 uppercase">Contact Number</span>
                          <div className="text-sm font-medium text-gray-800 flex items-center gap-1 font-mono">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            {selectedFarmer.contact || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-gray-400" /> Agricultural & Farm Specs
                      </h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                        <div>
                          <span className="text-[10px] font-semibold text-gray-400 uppercase">Assigned Barangay</span>
                          <div className="text-sm font-bold text-gray-800">{selectedFarmer.barangay}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] font-semibold text-gray-400 uppercase">Primary Crop / Sector</span>
                            <div className="text-sm font-bold text-emerald-700 flex items-center gap-1">
                              <Sprout className="h-3.5 w-3.5" />
                              {selectedFarmer.cropType}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-gray-400 uppercase">Estimated Farm Size</span>
                            <div className="text-sm font-bold text-gray-800 flex items-center gap-1">
                              <Layers className="h-3.5 w-3.5 text-gray-400" />
                              {selectedFarmer.farmSize} Has.
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-gray-400 uppercase">Database Status</span>
                          <div className="mt-1">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              selectedFarmer.status === 'Active' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {selectedFarmer.status} Verified Status
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Footer inside Tab */}
                  {userRole === 'admin' && (
                    <div className="flex gap-2 justify-end border-t border-gray-100 pt-4">
                      <button 
                        onClick={() => {
                          setSelectedFarmer(null);
                          handleOpenEdit(selectedFarmer);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit Personal details
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeDetailTab === 'files' && (
                <div className="space-y-6">
                  {/* Info alert */}
                  <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl p-4 text-xs flex items-start gap-2.5 shadow-2xs">
                    <FileText className="h-5 w-5 shrink-0 text-indigo-600 mt-0.5" />
                    <div>
                      <div className="font-bold">RSBSA Verification Repository</div>
                      <p className="mt-0.5 text-indigo-800/80 leading-relaxed">
                        These official scanned form attachments (RSBSA application form, certificates of land title, municipal agricultural certifications) serve as the legal audit trail validating this practitioner's claims for subsidy allocations.
                      </p>
                    </div>
                  </div>

                  {/* File Upload Box (Only Admin) */}
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
                      <p className="text-[10px] text-gray-400 mt-1">Accepts signed RSBSA forms, land titles, and clearances (PDF or Image under 10MB)</p>
                      
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

                  {/* List of Files */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Attached Documents Masterlist</h4>
                    
                    {(!selectedFarmer.files || selectedFarmer.files.length === 0) ? (
                      <div className="text-center py-8 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-400">
                        No official verification documents have been attached to this profile.
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white overflow-hidden shadow-2xs">
                        {selectedFarmer.files.map((file) => (
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
                                  onClick={() => alert('This is a core system verification attachment. High resolution files are backed up securely.')}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:text-emerald-600 hover:border-emerald-200 bg-white cursor-pointer"
                                  title="Preview Document"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              )}
                              
                              {/* Direct download trigger */}
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
                onClick={() => setSelectedFarmer(null)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CSV File Reader / Bulk Add Modal */}
      {isBulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-xl relative flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            {/* Close */}
            <button 
              onClick={() => setIsBulkOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Title */}
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-emerald-600" />
              Bulk Enroll Farmers Registry
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Quickly import multiple farmer records simultaneously into the database using a CSV format file or pasting the contents below.
            </p>

            {bulkError && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-100">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {bulkError}
              </div>
            )}

            {/* Upload Area / Form */}
            <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
              
              {/* Actions Header */}
              <div className="flex flex-wrap justify-between gap-2">
                <button 
                  onClick={downloadCsvTemplate}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> Download CSV Template
                </button>
                <button 
                  onClick={loadSampleBulkData}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Load Mock Sandbox Data
                </button>
              </div>

              {/* Drag & Drop File */}
              <div 
                onDragOver={handleDragOverCSV}
                onDragLeave={handleDragLeaveCSV}
                onDrop={handleDropCSV}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors relative ${
                  isDraggingCSV ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-200 hover:border-emerald-500'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChangeCSV}
                  className="hidden" 
                  accept=".csv,.txt"
                />
                <FileText className="h-8 w-8 text-gray-400 mx-auto" />
                <h4 className="text-xs font-bold text-gray-700 mt-2">Drag & Drop Farmers CSV file here</h4>
                <p className="text-[10px] text-gray-400 mt-1">Or click to browse your computer filesystem</p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 inline-flex items-center justify-center gap-1 rounded-md bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white shadow-3xs hover:bg-emerald-500 transition-colors cursor-pointer"
                >
                  Browse File
                </button>
              </div>

              {/* Textarea */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Or Paste Raw CSV Text Contents</label>
                <textarea 
                  value={csvText}
                  onChange={handleCsvTextChange}
                  placeholder="RSBSA No,First Name,Last Name,MiddleName,Gender,Birthdate,Contact,Barangay,Crop Type,Farm Size&#10;04-21-03-005-111111,Pedro,Cruz,Santos,Male,1975-04-12,09171234567,Poblacion,Rice,1.8"
                  className="mt-1.5 w-full h-32 rounded-lg border border-gray-200 p-3 text-xs text-gray-800 font-mono focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Live parsed summary list */}
              {parsedBulkFarmers.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Successfully Parsed Preview ({parsedBulkFarmers.length} Farmers)
                    </h4>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Valid format</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-lg bg-gray-50/50 divide-y divide-gray-100 text-xs">
                    {parsedBulkFarmers.map((f, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-gray-800">{f.lastName}, {f.firstName}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{f.rsbsaNo} | {f.barangay}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-emerald-700">{f.cropType}</div>
                          <div className="text-[10px] text-gray-400">{f.farmSize} Hectares</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 pt-4 flex gap-2 justify-end">
              <button 
                type="button"
                onClick={() => setIsBulkOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleBulkSubmit}
                disabled={parsedBulkFarmers.length === 0}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" /> Register {parsedBulkFarmers.length || ''} Farmers
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded File Previewer Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-widest">SECURE DOCUMENT PREVIEW</h3>
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
                  <h4 className="text-base font-bold text-gray-800">Scanned PDF Verification Form</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    This file is a scanned official signature sheet for RSBSA enrollment verified by the Municipal Agriculture Office. High-security cryptographically-signed details are embedded in the local file system.
                  </p>
                  <div className="pt-2">
                    <a 
                      href={previewFile.dataUrl} 
                      download={previewFile.name}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500"
                    >
                      <Download className="h-4 w-4" /> Download Original PDF ({previewFile.size})
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

      {/* Add/Edit Farmer Modal */}
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
              {editingFarmer ? 'Edit Farmer Profile' : 'Enroll New Practitioner'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {editingFarmer ? 'Modify the demographic and agriculture parameters of a registered farmer.' : 'Register a new farming practitioner into the RSBSA municipal directory.'}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">First Name</label>
                  <input 
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Pedro"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Name</label>
                  <input 
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Cruz"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Middle Name (Optional)</label>
                  <input 
                    type="text"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    placeholder="e.g. Santos"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">RSBSA Reference Number</label>
                  <input 
                    type="text"
                    value={rsbsaNo}
                    onChange={(e) => setRsbsaNo(e.target.value)}
                    placeholder="04-21-03-XXX-XXXXXX"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Gender</label>
                  <select 
                    value={gender}
                    onChange={(e: any) => setGender(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Birthdate</label>
                  <input 
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Number</label>
                  <input 
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="0917XXXXXXX"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Barangay</label>
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Primary Crop Type</label>
                  <select 
                    value={cropType}
                    onChange={(e: any) => setCropType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {CROP_TYPES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Farm Size (Hectares)</label>
                  <input 
                    type="number"
                    step="0.1"
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Verification Status</label>
                <select 
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
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
                  {editingFarmer ? 'Save Changes' : 'Enroll Practitioner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
