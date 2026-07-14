import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Calendar, 
  FileSpreadsheet, 
  PlusCircle, 
  AlertCircle,
  Check,
  Briefcase,
  TrendingUp,
  DollarSign,
  Layers,
  CheckCircle2,
  Clock,
  Download,
  Percent
} from 'lucide-react';
import { PPMP, PPMPItem } from '../types';

interface ProcurementPlanProps {
  ppmps: PPMP[];
  onAddPPMP: (plan: Omit<PPMP, 'id' | 'createdAt'>) => Promise<void>;
  onUpdatePPMP: (id: string, plan: Partial<PPMP>) => Promise<void>;
  onDeletePPMP: (id: string) => Promise<void>;
  userRole?: 'admin' | 'user';
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MODES = ['Public Bidding', 'SVP', 'Agency-to-Agency', 'Direct Contracting', 'Shopping'];

export default function ProcurementPlan({
  ppmps = [],
  onAddPPMP,
  onUpdatePPMP,
  onDeletePPMP,
  userRole = 'user'
}: ProcurementPlanProps) {
  const [activeTab, setActiveTab] = useState<'plans' | 'allItems'>('plans');
  const [selectedPlan, setSelectedPlan] = useState<PPMP | null>(null);

  // PPMP Master Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PPMP | null>(null);
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('2026');
  const [department, setDepartment] = useState('Municipal Agriculture Office');
  const [status, setStatus] = useState<PPMP['status']>('Draft');
  const [validationError, setValidationError] = useState('');

  // Item Form Inside Selected PPMP
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PPMPItem | null>(null);
  const [itemCode, setItemCode] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState('100');
  const [itemUnit, setItemUnit] = useState('Bags');
  const [itemBudget, setItemBudget] = useState('150000');
  const [itemProcMode, setItemProcMode] = useState<PPMPItem['modeOfProcurement']>('Public Bidding');
  const [itemSchedule, setItemSchedule] = useState<{ [month: string]: boolean }>({});

  // Summary Metrics
  const totalBudget = ppmps.reduce((acc, curr) => acc + (curr.totalBudget || 0), 0);
  const approvedBudget = ppmps
    .filter(p => p.status === 'Approved')
    .reduce((acc, curr) => acc + (curr.totalBudget || 0), 0);
  const totalItemsCount = ppmps.reduce((acc, curr) => acc + (curr.items?.length || 0), 0);

  // Mode Distribution
  const modeCounts = ppmps.reduce((acc: { [key: string]: number }, plan) => {
    (plan.items || []).forEach(item => {
      acc[item.modeOfProcurement] = (acc[item.modeOfProcurement] || 0) + item.estimatedBudget;
    });
    return acc;
  }, {});

  // Open PPMP form for add
  const handleOpenAddPlan = () => {
    setEditingPlan(null);
    setTitle('');
    setYear('2026');
    setDepartment('Municipal Agriculture Office');
    setStatus('Draft');
    setValidationError('');
    setIsFormOpen(true);
  };

  // Open PPMP form for edit
  const handleOpenEditPlan = (plan: PPMP) => {
    setEditingPlan(plan);
    setTitle(plan.title);
    setYear(String(plan.year));
    setDepartment(plan.department);
    setStatus(plan.status);
    setValidationError('');
    setIsFormOpen(true);
  };

  // Submit PPMP master form
  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!title.trim() || !department.trim()) {
      setValidationError('Title and Department are required.');
      return;
    }

    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2040) {
      setValidationError('Please enter a valid fiscal year (e.g., 2026).');
      return;
    }

    const payload = {
      title: title.trim(),
      year: yearNum,
      department: department.trim(),
      status,
      items: editingPlan ? editingPlan.items : [],
      totalBudget: editingPlan ? editingPlan.totalBudget : 0
    };

    try {
      if (editingPlan) {
        await onUpdatePPMP(editingPlan.id, payload);
      } else {
        await onAddPPMP(payload);
      }
      setIsFormOpen(false);
    } catch (err) {
      setValidationError('Failed to save Procurement Plan.');
    }
  };

  // Open item form inside selected PPMP
  const handleOpenAddItem = () => {
    if (!selectedPlan) return;
    setEditingItem(null);
    setItemCode(`PPMP-${selectedPlan.year}-00${(selectedPlan.items?.length || 0) + 1}`);
    setItemDesc('');
    setItemQty('100');
    setItemUnit('Bags');
    setItemBudget('150000');
    setItemProcMode('Public Bidding');
    
    // Clear schedule
    const initialSched: { [month: string]: boolean } = {};
    MONTHS.forEach(m => { initialSched[m] = false; });
    setItemSchedule(initialSched);
    
    setValidationError('');
    setIsItemFormOpen(true);
  };

  // Open item form for edit inside selected PPMP
  const handleOpenEditItem = (item: PPMPItem) => {
    setEditingItem(item);
    setItemCode(item.code);
    setItemDesc(item.generalDescription);
    setItemQty(String(item.quantity));
    setItemUnit(item.unit);
    setItemBudget(String(item.estimatedBudget));
    setItemProcMode(item.modeOfProcurement);
    
    const sched: { [month: string]: boolean } = {};
    MONTHS.forEach(m => {
      sched[m] = !!item.schedule?.[m];
    });
    setItemSchedule(sched);
    
    setValidationError('');
    setIsItemFormOpen(true);
  };

  // Submit Item Form
  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    if (!selectedPlan) return;

    if (!itemCode.trim() || !itemDesc.trim() || !itemUnit.trim()) {
      setValidationError('Item Code, Description, and Unit fields are required.');
      return;
    }

    const qtyVal = parseInt(itemQty);
    const budgetVal = parseFloat(itemBudget);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      setValidationError('Quantity must be a positive integer.');
      return;
    }
    if (isNaN(budgetVal) || budgetVal <= 0) {
      setValidationError('Estimated budget cost must be positive.');
      return;
    }

    // Check if at least one month is checked
    const hasMonth = Object.values(itemSchedule).some(v => v);
    if (!hasMonth) {
      setValidationError('Please schedule the procurement target in at least one milestone month.');
      return;
    }

    const itemPayload: PPMPItem = {
      id: editingItem ? editingItem.id : 'item-' + Date.now(),
      code: itemCode.trim(),
      generalDescription: itemDesc.trim(),
      quantity: qtyVal,
      unit: itemUnit.trim(),
      estimatedBudget: budgetVal,
      modeOfProcurement: itemProcMode,
      schedule: itemSchedule
    };

    let updatedItems = [...(selectedPlan.items || [])];
    if (editingItem) {
      updatedItems = updatedItems.map(i => i.id === editingItem.id ? itemPayload : i);
    } else {
      updatedItems.push(itemPayload);
    }

    // Recalculate total budget
    const updatedTotalBudget = updatedItems.reduce((acc, curr) => acc + curr.estimatedBudget, 0);

    try {
      await onUpdatePPMP(selectedPlan.id, {
        items: updatedItems,
        totalBudget: updatedTotalBudget
      });

      // Update local view-only state
      const updatedPlan = { ...selectedPlan, items: updatedItems, totalBudget: updatedTotalBudget };
      setSelectedPlan(updatedPlan);
      setIsItemFormOpen(false);
    } catch (err) {
      setValidationError('Failed to update project items.');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!selectedPlan) return;
    if (!confirm('Are you sure you want to remove this item from the procurement plan?')) return;

    const updatedItems = (selectedPlan.items || []).filter(i => i.id !== itemId);
    const updatedTotalBudget = updatedItems.reduce((acc, curr) => acc + curr.estimatedBudget, 0);

    try {
      await onUpdatePPMP(selectedPlan.id, {
        items: updatedItems,
        totalBudget: updatedTotalBudget
      });

      const updatedPlan = { ...selectedPlan, items: updatedItems, totalBudget: updatedTotalBudget };
      setSelectedPlan(updatedPlan);
    } catch (err) {
      alert('Failed to delete item.');
    }
  };

  // Toggle single month in form schedule
  const toggleMonth = (m: string) => {
    setItemSchedule(prev => ({
      ...prev,
      [m]: !prev[m]
    }));
  };

  // CSV Exporter for single PPMP plan
  const downloadPlanCSV = (plan: PPMP) => {
    const headers = 'Item Code,General Description,Quantity,Unit,Estimated Budget,Procurement Mode,Milestones\n';
    const rows = (plan.items || []).map(item => {
      const activeMonths = MONTHS.filter(m => item.schedule?.[m]).join(' | ');
      return `"${item.code}","${item.generalDescription.replace(/"/g, '""')}",${item.quantity},"${item.unit}",${item.estimatedBudget},"${item.modeOfProcurement}","${activeMonths}"`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ppmp_${plan.year}_${plan.title.toLowerCase().replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-350" id="procurement-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-emerald-600" />
            Project Procurement Management Plan (PPMP)
          </h1>
          <p className="text-sm text-gray-500">
            Orchestrate yearly budget provisions, schedule machinery acquisitions, and secure official municipal supply authorizations.
          </p>
        </div>
        {userRole === 'admin' && (
          <button 
            onClick={handleOpenAddPlan}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-500 transition-colors cursor-pointer"
            id="btn-add-ppmp"
          >
            <Plus className="h-4 w-4" /> Add Procurement Plan
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Allocated Budget</span>
            <span className="text-lg font-black text-gray-900">₱{totalBudget.toLocaleString()}</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Approved Funding</span>
            <span className="text-lg font-black text-indigo-700">₱{approvedBudget.toLocaleString()}</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Active Plan Projects</span>
            <span className="text-lg font-black text-gray-900">{ppmps.length} Plans Enrolled</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Detailed Line Items</span>
            <span className="text-lg font-black text-rose-700">{totalItemsCount} Rows Registered</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white p-1 rounded-t-xl border-x border-t">
        <button 
          onClick={() => {
            setActiveTab('plans');
            setSelectedPlan(null);
          }}
          className={`py-2.5 px-4 font-bold text-xs rounded-md transition-all flex items-center gap-2 ${
            activeTab === 'plans' 
              ? 'bg-emerald-50 text-emerald-800' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers className="h-4 w-4" /> PPMP Projects Folder
        </button>
        <button 
          onClick={() => {
            setActiveTab('allItems');
            setSelectedPlan(null);
          }}
          className={`py-2.5 px-4 font-bold text-xs rounded-md transition-all flex items-center gap-2 ${
            activeTab === 'allItems' 
              ? 'bg-emerald-50 text-emerald-800' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" /> Unified Items Worksheet
        </button>
      </div>

      {/* Panel 1: Plans List */}
      {activeTab === 'plans' && !selectedPlan && (
        <div className="grid gap-4 md:grid-cols-2">
          {ppmps.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-400 bg-white border border-gray-100 rounded-xl text-xs">
              No registered procurement plans found. Complete budget plans first.
            </div>
          ) : (
            ppmps.map((plan) => (
              <div 
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className="rounded-xl border border-gray-100 bg-white p-5 shadow-2xs relative flex flex-col justify-between hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group"
              >
                <div>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                    <span>FISCAL YEAR: {plan.year}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      plan.status === 'Approved' 
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' 
                        : plan.status === 'Submitted'
                          ? 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20'
                          : plan.status === 'Revision Required'
                            ? 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20'
                            : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'
                    }`}>
                      {plan.status}
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-gray-900 leading-tight group-hover:text-emerald-800 transition-colors">
                    {plan.title}
                  </h3>
                  <p className="mt-1 text-xs text-gray-400 font-medium">LGU Sector: {plan.department}</p>
                  
                  {/* Info Blocks */}
                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-50 pt-3 text-xs">
                    <div>
                      <span className="block text-gray-400 font-medium">Estimated Project Budget</span>
                      <span className="block font-black text-emerald-700 mt-0.5">₱{(plan.totalBudget || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 font-medium">Procurement Rows</span>
                      <span className="block font-bold text-gray-800 mt-0.5">{plan.items?.length || 0} Registered Items</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-50 flex justify-between items-center text-[11px] font-bold text-emerald-600">
                  <span>Click to Manage Itemized Lines & Schedule</span>
                  {userRole === 'admin' && (
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleOpenEditPlan(plan)}
                        className="inline-flex h-8 px-2.5 items-center justify-center gap-1 rounded-md border border-gray-200 text-gray-600 hover:text-emerald-600 hover:border-emerald-200 bg-white cursor-pointer"
                        title="Edit Project Details"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Are you sure you want to permanently delete PPMP program "${plan.title}"?`)) {
                            onDeletePPMP(plan.id);
                          }
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:text-rose-600 hover:border-rose-200 bg-white cursor-pointer"
                        title="Delete Project Plan"
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
      )}

      {/* Expanded single PPMP management view */}
      {activeTab === 'plans' && selectedPlan && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-150">
          {/* Back Nav bar */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <button 
              onClick={() => setSelectedPlan(null)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer"
            >
              ← Back to Plans Folders
            </button>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => downloadPlanCSV(selectedPlan)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-3xs cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" /> Export Excel CSV
              </button>
              {userRole === 'admin' && (
                <button 
                  onClick={handleOpenAddItem}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 shadow-3xs cursor-pointer"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Append Item Row
                </button>
              )}
            </div>
          </div>

          {/* Project Plan Title Summary Card */}
          <div className="bg-emerald-800 text-white p-6 rounded-2xl relative overflow-hidden shadow-xs">
            <div className="relative z-10">
              <span className="text-[10px] font-mono tracking-widest text-emerald-200 bg-emerald-700/50 px-2 py-0.5 rounded-md uppercase">ACTIVE DETAILED WORKSHEET | FY {selectedPlan.year}</span>
              <h2 className="text-xl font-bold mt-2 tracking-tight">{selectedPlan.title}</h2>
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-xs text-emerald-100/95 font-medium">
                <span>LGU Department: {selectedPlan.department}</span>
                <span>•</span>
                <span>Items: {selectedPlan.items?.length || 0} rows</span>
                <span>•</span>
                <span>Fiscal Status: <strong className="underline">{selectedPlan.status}</strong></span>
              </div>
            </div>
            {/* Visual background pattern */}
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 opacity-10 text-9xl font-black">PPMP</div>
          </div>

          {/* Items detailed breakdown table */}
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xs">
            <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-gray-400">Code</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-gray-400">General Specification / Item Description</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-gray-400 text-center">Qty / Unit</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-gray-400">Estimated Budget</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-gray-400">Procurement Mode</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-gray-400">Milestone (Monthly Target)</th>
                  {userRole === 'admin' && <th className="px-4 py-3 text-xs font-bold uppercase text-gray-400 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {(!selectedPlan.items || selectedPlan.items.length === 0) ? (
                  <tr>
                    <td colSpan={userRole === 'admin' ? 7 : 6} className="py-12 text-center text-gray-400 bg-gray-50/50">
                      This procurement project doesn't have item details registered. Append itemized lines to configure.
                    </td>
                  </tr>
                ) : (
                  selectedPlan.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-700">{item.code}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{item.generalDescription}</td>
                      <td className="px-4 py-3 text-center font-medium">
                        {item.quantity} <span className="text-gray-400">{item.unit}</span>
                      </td>
                      <td className="px-4 py-3 font-black text-emerald-800">₱{item.estimatedBudget.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                          {item.modeOfProcurement}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {MONTHS.map(m => item.schedule?.[m] && (
                            <span key={m} className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-50 text-indigo-700 rounded-sm">
                              {m.substring(0, 3)}
                            </span>
                          ))}
                        </div>
                      </td>
                      {userRole === 'admin' && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button 
                              onClick={() => handleOpenEditItem(item)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-100 text-gray-600 hover:text-emerald-600 hover:border-emerald-200 bg-white cursor-pointer"
                              title="Edit Line Item"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteItem(item.id)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-100 text-gray-500 hover:text-rose-600 hover:border-rose-200 bg-white cursor-pointer"
                              title="Delete Line Item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Panel 2: Unified Worksheet Table */}
      {activeTab === 'allItems' && (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xs">
          <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-xs font-bold uppercase text-gray-400">Code</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-gray-400">Parent Project Program</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-gray-400">Specification Description</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-gray-400 text-center">Qty / Unit</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-gray-400">Estimated Budget</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-gray-400">Procurement Method</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-gray-400 text-right">Fiscal Year</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {ppmps.length === 0 || totalItemsCount === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No procurement items registered across active projects.
                  </td>
                </tr>
              ) : (
                ppmps.flatMap(plan => 
                  (plan.items || []).map(item => ({
                    ...item,
                    planTitle: plan.title,
                    planYear: plan.year
                  }))
                ).map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-700">{item.code}</td>
                    <td className="px-4 py-3 font-bold text-gray-800 truncate max-w-xs" title={item.planTitle}>{item.planTitle}</td>
                    <td className="px-4 py-3 font-semibold text-gray-600">{item.generalDescription}</td>
                    <td className="px-4 py-3 text-center font-medium">
                      {item.quantity} <span className="text-gray-400">{item.unit}</span>
                    </td>
                    <td className="px-4 py-3 font-black text-emerald-800">₱{item.estimatedBudget.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-slate-700">{item.modeOfProcurement}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-400 font-semibold">{item.planYear}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit PPMP Project Dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => setIsFormOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-600" />
              {editingPlan ? 'Edit Procurement Folder Details' : 'Register Procurement Project'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Initialize a procurement program folder inside the municipal registry for annual planning and budget oversight.
            </p>

            {validationError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-100">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {validationError}
              </div>
            )}

            <form onSubmit={handlePlanSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Procurement Program Title</label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Rice Seeds and Urea Fertilizer Annual Rollout"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Fiscal Year</label>
                  <input 
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Approval Status</label>
                  <select 
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Approved">Approved</option>
                    <option value="Revision Required">Revision Required</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Responsible LGU Department</label>
                <input 
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden bg-gray-100"
                  readOnly
                />
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
                  {editingPlan ? 'Save Changes' : 'Initialize Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit PPMP Line Item Dialog */}
      {isItemFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl relative flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => setIsItemFormOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-emerald-600" />
              {editingItem ? 'Edit Procurement Line Item' : 'Append New Specification Row'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Add granular parameters including specifications, quantities, budget metrics, and milestone months.
            </p>

            {validationError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-100">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {validationError}
              </div>
            )}

            <form onSubmit={handleItemSubmit} className="mt-4 space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">PPMP Reference Code</label>
                  <input 
                    type="text"
                    value={itemCode}
                    onChange={(e) => setItemCode(e.target.value)}
                    placeholder="PPMP-2026-XXX"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Procurement Mode Method</label>
                  <select 
                    value={itemProcMode}
                    onChange={(e: any) => setItemProcMode(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {MODES.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">General Specification Description</label>
                <textarea 
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="Provide explicit sizes, materials, grades, colors, or package requirements..."
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden min-h-16"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Target Quantity</label>
                  <input 
                    type="number"
                    value={itemQty}
                    onChange={(e) => setItemQty(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Packaging Unit</label>
                  <input 
                    type="text"
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    placeholder="e.g. Bags, Units, Sets"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Estimated Budget cost (PHP)</label>
                  <input 
                    type="number"
                    value={itemBudget}
                    onChange={(e) => setItemBudget(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden font-mono"
                    required
                  />
                </div>
              </div>

              {/* Month scheduling matrix checkboxes */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Target Procurement Schedule Milestones</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  {MONTHS.map(m => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => toggleMonth(m)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold border transition-all text-left ${
                        itemSchedule[m] 
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-3xs' 
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${itemSchedule[m] ? 'bg-white' : 'bg-gray-300'}`} />
                      {m.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-gray-50">
                <button 
                  type="button"
                  onClick={() => setIsItemFormOpen(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-500 transition-colors"
                >
                  {editingItem ? 'Save Item Row' : 'Append Item Row'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
