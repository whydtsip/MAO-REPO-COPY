import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  ClipboardList, 
  Gift, 
  Calendar, 
  Users, 
  FileSpreadsheet, 
  PlusCircle, 
  AlertCircle,
  Filter,
  Download,
  Check,
  Award,
  Sparkles,
  Info,
  Layers,
  FileText,
  Eye
} from 'lucide-react';
import { AgriculturalProgram, Farmer, DistributionRecord, DistributionBatch } from '../types';

interface ProgramsListProps {
  programs: AgriculturalProgram[];
  farmers: Farmer[];
  distributions: DistributionRecord[];
  onAddProgram: (p: Omit<AgriculturalProgram, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateProgram: (id: string, p: Partial<AgriculturalProgram>) => Promise<void>;
  onDeleteProgram: (id: string) => Promise<void>;
  onAddDistribution: (d: Omit<DistributionRecord, 'id'>) => Promise<void>;
  onDeleteDistribution: (id: string) => Promise<void>;
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

export default function ProgramsList({
  programs,
  farmers,
  distributions,
  onAddProgram,
  onUpdateProgram,
  onDeleteProgram,
  onAddDistribution,
  onDeleteDistribution,
  onRefresh,
  userRole = 'user'
}: ProgramsListProps) {
  
  // Tabs: 'programs', 'distributions' (for individual/batches)
  const [activeTab, setActiveTab] = useState<'programs' | 'distributions'>('programs');
  const [archiveSubTab, setArchiveSubTab] = useState<'individual' | 'batches'>('individual');

  // Search/Filter states
  const [progSearch, setProgSearch] = useState('');
  const [distSearch, setDistSearch] = useState('');
  const [selectedDistBarangay, setSelectedDistBarangay] = useState('');

  // Local Distribution Batches State
  const [distributionBatches, setDistributionBatches] = useState<DistributionBatch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Modals
  const [isProgFormOpen, setIsProgFormOpen] = useState(false);
  const [isDistFormOpen, setIsDistFormOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [editingProg, setEditingProg] = useState<AgriculturalProgram | null>(null);
  
  // Selected Batch for View Modal
  const [viewingBatch, setViewingBatch] = useState<DistributionBatch | null>(null);
  const [batchBarangayFilter, setBatchBarangayFilter] = useState('All');

  // Program Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('100000');
  const [inputProvided, setInputProvided] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'Upcoming' | 'Active' | 'Completed'>('Active');
  
  // Individual Distribution Form States
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [quantityReceived, setQuantityReceived] = useState('');
  const [notes, setNotes] = useState('');

  // Batch Generator Form States
  const [genProgramId, setGenProgramId] = useState('');
  const [genCropType, setGenCropType] = useState('Rice');
  const [genBarangay, setGenBarangay] = useState('All');
  const [genMinFarmSize, setGenMinFarmSize] = useState('0.0');
  const [genAllocFormula, setGenAllocFormula] = useState<'fixed_2' | 'proportional_2_per_ha' | 'proportional_1_per_ha'>('fixed_2');
  
  // Generated recipients preview
  const [previewRecipients, setPreviewRecipients] = useState<any[]>([]);

  const [validationError, setValidationError] = useState('');

  // Load Distribution Batches
  const loadBatches = async () => {
    setLoadingBatches(true);
    try {
      const res = await fetch('/api/distribution-batches');
      if (res.ok) {
        const data = await res.json();
        setDistributionBatches(data);
      }
    } catch (err) {
      console.error("Failed loading distribution batches", err);
    } finally {
      setLoadingBatches(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, [distributions]); // reload batches when distributions change

  // Smart program suitability matcher
  useEffect(() => {
    if (!genProgramId) return;
    const prog = programs.find(p => p.id === genProgramId);
    if (!prog) return;
    
    const titleLower = prog.title.toLowerCase();
    const descLower = prog.description.toLowerCase();
    const inputLower = prog.inputProvided.toLowerCase();
    
    if (titleLower.includes('rice') || descLower.includes('rice') || inputLower.includes('rice')) {
      setGenCropType('Rice');
    } else if (titleLower.includes('corn') || descLower.includes('corn') || inputLower.includes('corn')) {
      setGenCropType('Corn');
    } else if (titleLower.includes('coconut') || descLower.includes('coconut') || inputLower.includes('coconut')) {
      setGenCropType('Coconut');
    } else if (titleLower.includes('vegetable') || descLower.includes('vegetable') || inputLower.includes('vegetable')) {
      setGenCropType('Vegetable');
    } else if (titleLower.includes('high-value') || descLower.includes('high-value') || inputLower.includes('high-value') || titleLower.includes('crop') || descLower.includes('crop')) {
      setGenCropType('High-Value Crops');
    } else if (titleLower.includes('livestock') || descLower.includes('livestock') || inputLower.includes('livestock')) {
      setGenCropType('Livestock');
    } else if (titleLower.includes('fishery') || descLower.includes('fishery') || inputLower.includes('fishery') || titleLower.includes('fish') || descLower.includes('fish')) {
      setGenCropType('Fishery');
    }
  }, [genProgramId, programs]);

  const handleOpenAddProg = () => {
    setEditingProg(null);
    setTitle('');
    setDescription('');
    setBudget('100000');
    setInputProvided('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setStatus('Active');
    setValidationError('');
    setIsProgFormOpen(true);
  };

  const handleOpenEditProg = (p: AgriculturalProgram) => {
    setEditingProg(p);
    setTitle(p.title);
    setDescription(p.description);
    setBudget(String(p.budget));
    setInputProvided(p.inputProvided);
    setStartDate(p.startDate);
    setEndDate(p.endDate);
    setStatus(p.status);
    setValidationError('');
    setIsProgFormOpen(true);
  };

  const handleOpenDistForm = () => {
    const activeProgs = programs.filter(p => p.status === 'Active');
    setSelectedProgramId(activeProgs[0]?.id || programs[0]?.id || '');
    setSelectedFarmerId(farmers[0]?.id || '');
    setQuantityReceived('');
    setNotes('');
    setValidationError('');
    setIsDistFormOpen(true);
  };

  const handleOpenGenerator = () => {
    const activeProgs = programs.filter(p => p.status === 'Active');
    setGenProgramId(activeProgs[0]?.id || programs[0]?.id || '');
    setGenCropType('Rice');
    setGenBarangay('All');
    setGenMinFarmSize('0.0');
    setGenAllocFormula('fixed_2');
    setPreviewRecipients([]);
    setValidationError('');
    setIsGeneratorOpen(true);
  };

  const handleProgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!title.trim() || !inputProvided.trim()) {
      setValidationError('Program Title and Input Provided details are required.');
      return;
    }

    const budgetNum = parseFloat(budget);
    if (isNaN(budgetNum) || budgetNum < 0) {
      setValidationError('Budget must be a non-negative number.');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      budget: budgetNum,
      inputProvided: inputProvided.trim(),
      startDate,
      endDate,
      status
    };

    try {
      if (editingProg) {
        await onUpdateProgram(editingProg.id, payload);
      } else {
        await onAddProgram(payload);
      }
      setIsProgFormOpen(false);
    } catch (err: any) {
      setValidationError('An error occurred. Please try again.');
    }
  };

  const handleDistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!selectedProgramId || !selectedFarmerId || !quantityReceived.trim()) {
      setValidationError('Please select a program, a farmer, and provide the quantity distributed.');
      return;
    }

    const prog = programs.find(p => p.id === selectedProgramId);
    const farmer = farmers.find(f => f.id === selectedFarmerId);

    if (!prog || !farmer) {
      setValidationError('Invalid program or farmer selection.');
      return;
    }

    const payload = {
      programId: selectedProgramId,
      programTitle: prog.title,
      farmerId: selectedFarmerId,
      farmerName: `${farmer.firstName} ${farmer.lastName}`,
      farmerBarangay: farmer.barangay,
      quantityReceived: quantityReceived.trim(),
      distributedAt: new Date().toISOString(),
      notes: notes.trim() || undefined
    };

    try {
      await onAddDistribution(payload);
      setIsDistFormOpen(false);
    } catch (err: any) {
      setValidationError('An error occurred while saving distribution.');
    }
  };

  // Suitable Recipient Generator Logic
  const handleGeneratePreview = () => {
    setValidationError('');
    const prog = programs.find(p => p.id === genProgramId);
    if (!prog) {
      setValidationError('Please select an active program.');
      return;
    }

    const minSize = parseFloat(genMinFarmSize) || 0.0;

    // Filter suitable farmers
    const suitable = farmers.filter(f => {
      // Must be active status
      if (f.status !== 'Active') return false;
      // Must match crop type
      if (f.cropType !== genCropType) return false;
      // Must match barangay if specified
      if (genBarangay !== 'All' && f.barangay !== genBarangay) return false;
      // Must meet farm size
      if (f.farmSize < minSize) return false;

      return true;
    });

    // Map to allocated items
    const results = suitable.map(f => {
      let qty = '2 Bags'; // Default

      if (genAllocFormula === 'proportional_2_per_ha') {
        qty = `${Math.max(1, Math.round(f.farmSize * 2))} Bags`;
      } else if (genAllocFormula === 'proportional_1_per_ha') {
        qty = `${Math.max(1, Math.round(f.farmSize * 1))} Bags`;
      } else {
        qty = '2 Bags'; // fixed_2
      }

      return {
        farmerId: f.id,
        farmerName: `${f.firstName} ${f.lastName}`,
        rsbsaNo: f.rsbsaNo,
        barangay: f.barangay,
        cropType: f.cropType,
        farmSize: f.farmSize,
        allocatedQuantity: qty
      };
    });

    setPreviewRecipients(results);
    if (results.length === 0) {
      setValidationError('No active farmers in the registry meet the selected suitability criteria.');
    }
  };

  const handleSaveGeneratedBatch = async () => {
    if (previewRecipients.length === 0) {
      setValidationError('Please generate suitable recipients before approving.');
      return;
    }

    const prog = programs.find(p => p.id === genProgramId);
    if (!prog) return;

    const criteriaDesc = `Active ${genCropType} farmers in ${genBarangay === 'All' ? 'all barangays' : 'Brgy. ' + genBarangay} with farm size >= ${genMinFarmSize} Has. Formula: ${
      genAllocFormula === 'fixed_2' 
        ? 'Fixed 2 bags each' 
        : genAllocFormula === 'proportional_2_per_ha' 
          ? '2 bags per Hectare' 
          : '1 bag per Hectare'
    }`;

    const payload = {
      programId: genProgramId,
      programTitle: prog.title,
      inputProvided: prog.inputProvided,
      recipients: previewRecipients,
      totalRecipients: previewRecipients.length,
      criteriaDescription: criteriaDesc
    };

    try {
      const res = await fetch('/api/distribution-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to register batch run.');
      
      setIsGeneratorOpen(false);
      setPreviewRecipients([]);
      
      // Refresh parent to sync everything
      if (onRefresh) {
        await onRefresh();
      }
      await loadBatches();
    } catch (err: any) {
      setValidationError(err.message || 'Error occurred while saving batch log.');
    }
  };

  // CSV Report Download Logic
  const handleDownloadCSV = (batch: DistributionBatch, barangayFilter: string) => {
    const filtered = barangayFilter === 'All' 
      ? batch.recipients
      : batch.recipients.filter(r => r.barangay === barangayFilter);
      
    const csvHeaders = "Farmer ID,Farmer Name,RSBSA No,Barangay,Crop Type,Farm Size,Allocated Quantity\n";
    const csvRows = filtered.map(r => 
      `"${r.farmerId}","${r.farmerName}","${r.rsbsaNo}","${r.barangay}","${r.cropType}",${r.farmSize},"${r.allocatedQuantity}"`
    ).join("\n");
    
    const blob = new Blob([csvHeaders + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `distribution_${batch.programTitle.toLowerCase().replace(/\s+/g, '_')}_${barangayFilter.toLowerCase().replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered lists
  const filteredPrograms = programs.filter(p => 
    p.title.toLowerCase().includes(progSearch.toLowerCase()) ||
    p.inputProvided.toLowerCase().includes(progSearch.toLowerCase())
  );

  const filteredDistributions = distributions.filter(d => {
    const matchesSearch = 
      d.farmerName.toLowerCase().includes(distSearch.toLowerCase()) ||
      d.programTitle.toLowerCase().includes(distSearch.toLowerCase()) ||
      d.farmerBarangay.toLowerCase().includes(distSearch.toLowerCase());
    const matchesBarangay = selectedDistBarangay === '' || d.farmerBarangay === selectedDistBarangay;
    return matchesSearch && matchesBarangay;
  });

  return (
    <div className="space-y-6" id="programs-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-emerald-600" />
            Agricultural Programs & Input Distribution
          </h1>
          <p className="text-sm text-gray-500">
            Provision relief support assistance, manage materials rollouts, and archive verified distribution listings.
          </p>
        </div>
        {userRole === 'admin' && (
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={handleOpenGenerator}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
              id="btn-gen-recipients"
            >
              <Sparkles className="h-4 w-4" /> Recipient Generator
            </button>
            <button 
              onClick={handleOpenAddProg}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-500 transition-colors cursor-pointer"
              id="btn-add-program"
            >
              <Plus className="h-4 w-4" /> Establish Program
            </button>
          </div>
        )}
      </div>

      {/* Main Tab Controls */}
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('programs')}
          className={`py-3.5 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'programs' 
              ? 'border-emerald-600 text-emerald-700' 
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Award className="h-4 w-4" /> Established Agricultural Programs ({programs.length})
        </button>
        <button 
          onClick={() => setActiveTab('distributions')}
          className={`py-3.5 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'distributions' 
              ? 'border-emerald-600 text-emerald-700' 
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Gift className="h-4 w-4" /> Distribution Logs Archive ({distributions.length})
        </button>
      </div>

      {/* Content Panels */}
      {activeTab === 'programs' && (
        <div className="space-y-6">
          {/* Program Search & Filter */}
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs flex items-center">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search className="h-5 w-5" />
              </span>
              <input 
                type="text"
                value={progSearch}
                onChange={(e) => setProgSearch(e.target.value)}
                placeholder="Search programs by title or material input details..."
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden bg-gray-50/50"
              />
            </div>
          </div>

          {/* Grid list of programs */}
          <div className="grid gap-6 md:grid-cols-2">
            {filteredPrograms.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-400 bg-white border border-gray-100 rounded-xl text-sm">
                No registered agricultural programs found.
              </div>
            ) : (
              filteredPrograms.map((p) => (
                <div 
                  key={p.id}
                  className="rounded-xl border border-gray-100 bg-white p-6 shadow-xs relative flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    {/* Status badge */}
                    <div className="flex justify-between items-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        p.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                          : p.status === 'Upcoming'
                            ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20'
                            : 'bg-gray-50 text-gray-600 ring-1 ring-gray-500/10'
                      }`}>
                        {p.status}
                      </span>
                      <span className="text-xs font-bold text-gray-400 font-mono">ID: {p.id}</span>
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-gray-900 leading-tight">{p.title}</h3>
                    <p className="mt-2 text-xs text-gray-500 leading-relaxed min-h-[40px]">{p.description}</p>
                    
                    <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-50 pt-4 text-xs">
                      <div>
                        <span className="block text-gray-400 font-medium">Provision Materials</span>
                        <span className="block font-bold text-emerald-700 mt-0.5">{p.inputProvided}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-medium">Budget Funding</span>
                        <span className="block font-extrabold text-gray-900 mt-0.5">₱{p.budget.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4">
                    <div className="text-[10px] text-gray-400 font-semibold flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{p.startDate} to {p.endDate || 'Ongoing'}</span>
                    </div>

                    {userRole === 'admin' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleOpenEditProg(p)}
                          className="inline-flex h-8 px-2.5 items-center justify-center gap-1 rounded-md border border-gray-200 text-gray-600 hover:text-emerald-600 hover:border-emerald-200 bg-white"
                          title="Edit Program"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete agricultural program "${p.title}"?`)) {
                              onDeleteProgram(p.id);
                            }
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:text-rose-600 hover:border-rose-200 bg-white"
                          title="Delete Program"
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
        </div>
      )}

      {/* Distribution Logs Archive Tab Panel */}
      {activeTab === 'distributions' && (
        <div className="space-y-6">
          
          {/* Sub Tab Controls */}
          <div className="flex gap-2 bg-gray-50 p-1.5 rounded-lg w-max border border-gray-100">
            <button 
              onClick={() => setArchiveSubTab('individual')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                archiveSubTab === 'individual' 
                  ? 'bg-white text-emerald-800 shadow-2xs' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Individual Log Records
            </button>
            <button 
              onClick={() => setArchiveSubTab('batches')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                archiveSubTab === 'batches' 
                  ? 'bg-white text-emerald-800 shadow-2xs' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Archived Batch Allocations
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold">
                {distributionBatches.length}
              </span>
            </button>
          </div>

          {archiveSubTab === 'individual' && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center">
                <div className="relative w-full md:flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Search className="h-5 w-5" />
                  </span>
                  <input 
                    type="text"
                    value={distSearch}
                    onChange={(e) => setDistSearch(e.target.value)}
                    placeholder="Search logs by farmer name, program, barangay..."
                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden bg-gray-50/50"
                  />
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 bg-gray-50/50 w-full md:w-auto">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select 
                    value={selectedDistBarangay} 
                    onChange={(e) => setSelectedDistBarangay(e.target.value)}
                    className="border-none bg-transparent text-sm focus:outline-none focus:ring-0 text-gray-700 w-full"
                  >
                    <option value="">All Barangays</option>
                    {BARANGAYS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* View Only Alert */}
              <div className="bg-amber-50 border border-amber-100 text-amber-800 rounded-xl p-4 text-xs flex items-center gap-2.5 shadow-3xs font-semibold">
                <Info className="h-5 w-5 shrink-0 text-amber-600" />
                <span>Auditing Security: Distribution records serve as financial evidence of crop subsidies. Once logged, individual logs are permanently archived as view-only entries and cannot be modified.</span>
              </div>

              {/* Records Table */}
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xs">
                <table className="min-w-full divide-y divide-gray-100 text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Recipient Farmer</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Barangay</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Subsidy Program</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Materials Received</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 text-right">Logged At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredDistributions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-400">
                          No logged distribution events matching filters.
                        </td>
                      </tr>
                    ) : (
                      filteredDistributions.map((d) => (
                        <tr key={d.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-800">{d.farmerName}</div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">Ref: {d.farmerId}</div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-700">{d.farmerBarangay}</td>
                          <td className="px-6 py-4 font-medium text-gray-600">{d.programTitle}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-600/15">
                              {d.quantityReceived}
                            </span>
                            {d.notes && <p className="text-[10px] text-gray-400 mt-1 italic">Note: {d.notes}</p>}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-500 font-mono font-medium">
                            {new Date(d.distributedAt).toLocaleDateString()} {new Date(d.distributedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {archiveSubTab === 'batches' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-xl p-4 text-xs flex items-center gap-2.5 shadow-3xs font-semibold">
                <FileText className="h-5 w-5 shrink-0 text-indigo-600" />
                <span>Verified Batch runs generated by the Suitability Engine. Select View to preview recipients, filter by Barangay, and download reports.</span>
              </div>

              {loadingBatches ? (
                <div className="py-12 text-center text-xs text-gray-400 animate-pulse">Loading archived batches...</div>
              ) : distributionBatches.length === 0 ? (
                <div className="py-12 text-center text-gray-400 bg-white border border-gray-100 rounded-xl text-xs">
                  No generated batch allocation logs currently archived.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {distributionBatches.map((batch) => (
                    <div key={batch.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div>
                        <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                          <span>BATCH ID: {batch.id}</span>
                          <span>{new Date(batch.generatedAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="mt-3 text-base font-bold text-gray-900 leading-tight">{batch.programTitle}</h3>
                        <p className="mt-2 text-xs text-emerald-700 font-bold">Input: {batch.inputProvided}</p>
                        
                        <div className="bg-gray-50 border border-gray-100 p-3 rounded-lg mt-3 text-[11px] text-gray-600 leading-relaxed">
                          <span className="font-bold block text-gray-500 text-[10px] uppercase">Engine Criteria Used:</span>
                          {batch.criteriaDescription}
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-gray-50 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                          <Users className="h-4 w-4 text-emerald-600" />
                          {batch.totalRecipients} Enrolled Recipients
                        </span>
                        
                        <button 
                          onClick={() => {
                            setViewingBatch(batch);
                            setBatchBarangayFilter('All');
                          }}
                          className="inline-flex h-8 px-3 items-center justify-center gap-1.5 rounded-lg border border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" /> View & Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* Program Add/Edit Modal */}
      {isProgFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => setIsProgFormOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-emerald-600" />
              {editingProg ? 'Edit Program Parameters' : 'Launch New Assistance Program'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Configure budgeting and subsidy criteria details for a registered agricultural relief program.
            </p>

            {validationError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-100">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {validationError}
              </div>
            )}

            <form onSubmit={handleProgSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Program Title Name</label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Certified Seed Wet-Season Distribution 2026"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Operational Description & Scope</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide brief goals or parameters of the rollout..."
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden min-h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Funding Budget (PHP)</label>
                  <input 
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Operational Status</label>
                  <select 
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Material Assistance Provided</label>
                <input 
                  type="text"
                  value={inputProvided}
                  onChange={(e) => setInputProvided(e.target.value)}
                  placeholder="e.g. Certified Inbred Seeds (2 bags/hectare)"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Start Date</label>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">End Date</label>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-gray-50">
                <button 
                  type="button"
                  onClick={() => setIsProgFormOpen(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-500 transition-colors"
                >
                  {editingProg ? 'Save Changes' : 'Establish Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Smart Recipient Batch Generator Modal */}
      {isGeneratorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            <button 
              onClick={() => setIsGeneratorOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              Smart Subsidy Recipient Generator
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Select eligibility criteria. The generator scans the Farmer Registry to compile compliant beneficiaries automatically.
            </p>

            {validationError && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700 border border-amber-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {validationError}
              </div>
            )}

            {/* Generator Form */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-100 pb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Subsidy Program</label>
                <select 
                  value={genProgramId}
                  onChange={(e) => setGenProgramId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-500 bg-gray-50"
                  required
                >
                  {programs.filter(p => p.status === 'Active').map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Target Crop Type</label>
                <select 
                  value={genCropType}
                  onChange={(e) => setGenCropType(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-500 bg-gray-50"
                >
                  <option value="Rice">Rice Practitioners</option>
                  <option value="Corn">Corn Practitioners</option>
                  <option value="Coconut">Coconut Practitioners</option>
                  <option value="Vegetable">Vegetable Growers</option>
                  <option value="High-Value Crops">High-Value Crops</option>
                  <option value="Livestock">Livestock Raisers</option>
                  <option value="Fishery">Fishery Cooperatives</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Target Barangay Sector</label>
                <select 
                  value={genBarangay}
                  onChange={(e) => setGenBarangay(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-500 bg-gray-50"
                >
                  <option value="All">All Barangays (Municipality)</option>
                  {BARANGAYS.map(b => (
                    <option key={b} value={b}>Brgy. {b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Min Farm Area Size (Hectares)</label>
                <input 
                  type="number"
                  step="0.1"
                  value={genMinFarmSize}
                  onChange={(e) => setGenMinFarmSize(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-500 bg-gray-50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Allocation Quantity Formula</label>
                <select 
                  value={genAllocFormula}
                  onChange={(e: any) => setGenAllocFormula(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-500 bg-gray-50"
                >
                  <option value="fixed_2">Standard Allocation: Fixed 2 Bags Assistance Each</option>
                  <option value="proportional_2_per_ha">Proportional allocation: 2 bags per Hectare (rounded)</option>
                  <option value="proportional_1_per_ha">Proportional allocation: 1 bag per Hectare (rounded)</option>
                </select>
              </div>
            </div>

            <div className="py-2.5 flex justify-end">
              <button 
                type="button"
                onClick={handleGeneratePreview}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors cursor-pointer"
              >
                <Sparkles className="h-4 w-4" /> Run Eligibility Scan
              </button>
            </div>

            {/* Generated results Preview */}
            <div className="flex-1 overflow-y-auto mt-2 min-h-[200px] space-y-2">
              {previewRecipients.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-xs">
                    <span className="font-bold text-emerald-800">SCAN SUCCESSFUL: {previewRecipients.length} eligible recipients matching parameters</span>
                    <span className="font-mono text-emerald-700 font-extrabold text-[11px]">Formula: {genAllocFormula.toUpperCase()}</span>
                  </div>

                  <div className="border border-gray-100 rounded-lg overflow-hidden max-h-56 overflow-y-auto bg-white">
                    <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
                      <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400">
                        <tr>
                          <th className="px-4 py-2.5">Beneficiary Farmer</th>
                          <th className="px-4 py-2.5">Barangay</th>
                          <th className="px-4 py-2.5">Farm Size</th>
                          <th className="px-4 py-2.5 text-right">Computed Assistance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {previewRecipients.map((rec, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="px-4 py-2">
                              <div className="font-bold text-gray-800">{rec.farmerName}</div>
                              <div className="text-[9px] text-gray-400 font-mono">RSBSA: {rec.rsbsaNo}</div>
                            </td>
                            <td className="px-4 py-2">{rec.barangay}</td>
                            <td className="px-4 py-2 font-mono">{rec.farmSize} Has.</td>
                            <td className="px-4 py-2 text-right">
                              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                {rec.allocatedQuantity}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl text-xs space-y-2">
                  <ClipboardList className="h-10 w-10 text-gray-300" />
                  <p>Configure parameters above and click "Run Scan" to see preview.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 pt-4 flex gap-2 justify-end">
              <button 
                type="button"
                onClick={() => setIsGeneratorOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSaveGeneratedBatch}
                disabled={previewRecipients.length === 0}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" /> Save & Log Batch Allocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch View and Download Modal */}
      {viewingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
            <button 
              onClick={() => setViewingBatch(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors animate-in duration-75"
            >
              <X className="h-6 w-6" />
            </button>

            <div>
              <h3 className="text-xs font-bold font-mono text-emerald-600 uppercase tracking-wider">ARCHIVED BATCH ALLOCATION RECORD</h3>
              <h2 className="text-xl font-extrabold text-gray-900 mt-0.5 leading-tight">{viewingBatch.programTitle}</h2>
              <p className="text-xs text-gray-500 font-medium mt-1">Assistance Material Provided: {viewingBatch.inputProvided}</p>
            </div>

            {/* Filter and Download Header */}
            <div className="mt-4 bg-gray-50 border border-gray-100 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-gray-500 shrink-0">Filter Barangay:</span>
                <select 
                  value={batchBarangayFilter}
                  onChange={(e) => setBatchBarangayFilter(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-800 focus:outline-hidden focus:border-emerald-500 bg-white shadow-3xs"
                >
                  <option value="All">All Barangays represented</option>
                  {/* Derive distinct barangays from the recipients */}
                  {Array.from(new Set(viewingBatch.recipients.map(r => r.barangay))).map(b => (
                    <option key={b} value={b}>Brgy. {b}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={() => handleDownloadCSV(viewingBatch, batchBarangayFilter)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors cursor-pointer w-full sm:w-auto"
              >
                <Download className="h-4 w-4" /> Download Filtered CSV Report
              </button>
            </div>

            {/* Recipients Table */}
            <div className="flex-1 overflow-y-auto mt-4 border border-gray-100 rounded-lg bg-white overflow-hidden max-h-[45vh]">
              <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
                <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Beneficiary Farmer</th>
                    <th className="px-4 py-3">Barangay Sector</th>
                    <th className="px-4 py-3">Farm Area Size</th>
                    <th className="px-4 py-3 text-right">Material Allocated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {viewingBatch.recipients
                    .filter(r => batchBarangayFilter === 'All' || r.barangay === batchBarangayFilter)
                    .map((rec, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/30">
                        <td className="px-4 py-2.5">
                          <div className="font-bold text-gray-800">{rec.farmerName}</div>
                          <div className="text-[10px] text-gray-400 font-mono">RSBSA: {rec.rsbsaNo}</div>
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-gray-600">{rec.barangay}</td>
                        <td className="px-4 py-2.5 font-mono">{rec.farmSize} Hectares</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                            {rec.allocatedQuantity}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-4 flex justify-between items-center text-xs">
              <span className="font-semibold text-gray-400">Saved Log: {new Date(viewingBatch.generatedAt).toLocaleString()}</span>
              <button 
                onClick={() => setViewingBatch(null)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Close Batch Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
