import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Layers, 
  Check, 
  AlertCircle,
  Clock,
  Printer,
  Download,
  CheckCircle,
  FileText,
  Briefcase
} from 'lucide-react';
import { PPMP, PPMPItem } from '../types';
import { jsPDF } from 'jspdf';

interface PPMPListProps {
  ppmpList: PPMP[];
  onAddPPMP: (ppmp: Omit<PPMP, 'id' | 'createdAt' | 'items' | 'totalBudget'>) => Promise<void>;
  onUpdatePPMP: (id: string, ppmp: Partial<PPMP>) => Promise<void>;
  onDeletePPMP: (id: string) => Promise<void>;
  userRole?: 'admin' | 'user';
}

const MODES_OF_PROCUREMENT = [
  'Public Bidding',
  'SVP',
  'Agency-to-Agency',
  'Direct Contracting',
  'Shopping'
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function PPMPList({
  ppmpList,
  onAddPPMP,
  onUpdatePPMP,
  onDeletePPMP,
  userRole = 'user'
}: PPMPListProps) {
  const [activePPMP, setActivePPMP] = useState<PPMP | null>(null);
  const [isPPMPModalOpen, setIsPPMPModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  
  // PPMP Form States
  const [editingPPMP, setEditingPPMP] = useState<PPMP | null>(null);
  const [ppmpTitle, setPpmpTitle] = useState('');
  const [ppmpYear, setPpmpYear] = useState('2026');
  const [ppmpDept, setPpmpDept] = useState('Municipal Agriculture Office');
  const [ppmpStatus, setPpmpStatus] = useState<PPMP['status']>('Draft');
  const [ppmpDeadline, setPpmpDeadline] = useState('');
  const [ppmpError, setPpmpError] = useState('');
  
  // PPMP Line Item Form States
  const [editingItem, setEditingItem] = useState<PPMPItem | null>(null);
  const [itemCode, setItemCode] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemUnit, setItemUnit] = useState('Bags');
  const [itemBudget, setItemBudget] = useState('0');
  const [itemMode, setItemMode] = useState<PPMPItem['modeOfProcurement']>('Public Bidding');
  const [itemSchedule, setItemSchedule] = useState<{ [month: string]: boolean }>(
    MONTHS.reduce((acc, m) => ({ ...acc, [m]: false }), {})
  );
  const [itemError, setItemError] = useState('');

  // Handle open add PPMP
  const handleOpenAddPPMP = () => {
    setEditingPPMP(null);
    setPpmpTitle('');
    setPpmpYear('2026');
    setPpmpDept('Municipal Agriculture Office');
    setPpmpStatus('Draft');
    setPpmpDeadline('');
    setPpmpError('');
    setIsPPMPModalOpen(true);
  };

  // Handle open edit PPMP
  const handleOpenEditPPMP = (p: PPMP) => {
    setEditingPPMP(p);
    setPpmpTitle(p.title);
    setPpmpYear(String(p.year));
    setPpmpDept(p.department);
    setPpmpStatus(p.status);
    setPpmpDeadline(p.deadline || '');
    setPpmpError('');
    setIsPPMPModalOpen(true);
  };

  // Handle submit PPMP Meta
  const handleSubmitPPMP = async (e: React.FormEvent) => {
    e.preventDefault();
    setPpmpError('');

    if (!ppmpTitle.trim()) {
      setPpmpError('Please provide a descriptive title (e.g. Rice Seed Subsidy Acquisition).');
      return;
    }

    try {
      if (editingPPMP) {
        await onUpdatePPMP(editingPPMP.id, {
          title: ppmpTitle.trim(),
          year: parseInt(ppmpYear) || 2026,
          department: ppmpDept.trim(),
          status: ppmpStatus,
          deadline: ppmpDeadline || undefined
        });
        if (activePPMP && activePPMP.id === editingPPMP.id) {
          setActivePPMP(prev => prev ? {
            ...prev,
            title: ppmpTitle.trim(),
            year: parseInt(ppmpYear) || 2026,
            department: ppmpDept.trim(),
            status: ppmpStatus,
            deadline: ppmpDeadline || undefined
          } : null);
        }
      } else {
        await onAddPPMP({
          title: ppmpTitle.trim(),
          year: parseInt(ppmpYear) || 2026,
          department: ppmpDept.trim(),
          status: ppmpStatus,
          deadline: ppmpDeadline || undefined
        });
      }
      setIsPPMPModalOpen(false);
    } catch (err: any) {
      setPpmpError(err.message || 'Error saving PPMP Meta details.');
    }
  };

  // Handle open Add Line Item
  const handleOpenAddItem = () => {
    setEditingItem(null);
    setItemCode(`M-${activePPMP?.year || 2026}-${Math.floor(100 + Math.random() * 900)}`);
    setItemDesc('');
    setItemQty('100');
    setItemUnit('Bags');
    setItemBudget('50000');
    setItemMode('Public Bidding');
    setItemSchedule(MONTHS.reduce((acc, m) => ({ ...acc, [m]: false }), {}));
    setItemError('');
    setIsItemModalOpen(true);
  };

  // Handle open Edit Line Item
  const handleOpenEditItem = (item: PPMPItem) => {
    setEditingItem(item);
    setItemCode(item.code);
    setItemDesc(item.generalDescription);
    setItemQty(String(item.quantity));
    setItemUnit(item.unit);
    setItemBudget(String(item.estimatedBudget));
    setItemMode(item.modeOfProcurement);
    setItemSchedule({
      ...MONTHS.reduce((acc, m) => ({ ...acc, [m]: false }), {}),
      ...item.schedule
    });
    setItemError('');
    setIsItemModalOpen(true);
  };

  // Handle Submit Line Item
  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setItemError('');

    if (!itemDesc.trim()) {
      setItemError('Item General Description is required.');
      return;
    }

    const qtyNum = parseInt(itemQty);
    const budgetNum = parseFloat(itemBudget);

    if (isNaN(qtyNum) || qtyNum <= 0) {
      setItemError('Quantity must be greater than zero.');
      return;
    }
    if (isNaN(budgetNum) || budgetNum < 0) {
      setItemError('Estimated budget must be zero or a positive value.');
      return;
    }

    if (!activePPMP) return;

    let updatedItems = [...(activePPMP.items || [])];

    const newItemPayload: PPMPItem = {
      id: editingItem ? editingItem.id : "item-" + Date.now(),
      code: itemCode,
      generalDescription: itemDesc.trim(),
      quantity: qtyNum,
      unit: itemUnit.trim(),
      estimatedBudget: budgetNum,
      modeOfProcurement: itemMode,
      schedule: itemSchedule
    };

    if (editingItem) {
      updatedItems = updatedItems.map(it => it.id === editingItem.id ? newItemPayload : it);
    } else {
      updatedItems.push(newItemPayload);
    }

    const totalBudget = updatedItems.reduce((acc, it) => acc + it.estimatedBudget, 0);

    try {
      await onUpdatePPMP(activePPMP.id, {
        items: updatedItems,
        totalBudget
      });
      
      // Update local view cache
      setActivePPMP(prev => prev ? { ...prev, items: updatedItems, totalBudget } : null);
      setIsItemModalOpen(false);
    } catch (err: any) {
      setItemError(err.message || 'Error saving line item to PPMP.');
    }
  };

  // Delete line item
  const handleDeleteItem = async (itemId: string) => {
    if (!activePPMP) return;
    if (!confirm('Are you sure you want to delete this procurement line item?')) return;

    const updatedItems = (activePPMP.items || []).filter(it => it.id !== itemId);
    const totalBudget = updatedItems.reduce((acc, it) => acc + it.estimatedBudget, 0);

    try {
      await onUpdatePPMP(activePPMP.id, {
        items: updatedItems,
        totalBudget
      });
      setActivePPMP(prev => prev ? { ...prev, items: updatedItems, totalBudget } : null);
    } catch (err: any) {
      alert(err.message || 'Error deleting line item.');
    }
  };

  // Update PPMP status
  const handleUpdateStatus = async (newStatus: PPMP['status']) => {
    if (!activePPMP) return;
    try {
      await onUpdatePPMP(activePPMP.id, { status: newStatus });
      setActivePPMP(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err: any) {
      alert(err.message || 'Error updating PPMP status.');
    }
  };

  // Export report as PDF
  const exportPDF = () => {
    if (!activePPMP) return;

    const doc = new jsPDF();
    
    // Add border & header styling
    doc.setFillColor(6, 95, 70); // Emerald 800
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("MUNICIPAL AGRICULTURE OFFICE (MAO)", 15, 14);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Project Procurement Management Plan (PPMP) - FY ${activePPMP.year}`, 15, 21);
    doc.text(`Office of Authority: ${activePPMP.department}`, 15, 26);

    // Reset color to slate
    doc.setTextColor(51, 65, 85);
    
    // Summary info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("PLAN OVERVIEW & PROFILE", 15, 48);
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 51, 195, 51);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Proposal Title:`, 15, 58);
    doc.setFont("helvetica", "bold");
    doc.text(`${activePPMP.title}`, 45, 58);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Current Status:`, 15, 65);
    doc.setFont("helvetica", "bold");
    doc.text(`${activePPMP.status}`, 45, 65);
    
    if (activePPMP.deadline) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(220, 38, 38); // red-600
      doc.text(`Submission Deadline:`, 15, 72);
      doc.setFont("helvetica", "bold");
      
      const dlText = new Date(activePPMP.deadline).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      doc.text(dlText, 55, 72);
      doc.setTextColor(51, 65, 85);
    }
    
    doc.setFont("helvetica", "normal");
    doc.text(`Total Allocated Budget:`, 110, 65);
    doc.setFont("helvetica", "bold");
    doc.text(`Php ${activePPMP.totalBudget.toLocaleString()}`, 150, 65);

    doc.setFont("helvetica", "normal");
    doc.text(`Date of Generation:`, 110, 72);
    doc.text(`${new Date().toLocaleDateString()}`, 150, 72);

    // Items list
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("PROCUREMENT MATRIX LIST", 15, 85);
    doc.line(15, 88, 195, 88);

    let y = 96;
    doc.setFontSize(9);
    
    // Table Headers
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(15, y - 5, 180, 7, 'F');
    doc.setFont("helvetica", "bold");
    doc.text("Code", 17, y);
    doc.text("Description of Materials", 42, y);
    doc.text("Qty / Unit", 112, y);
    doc.text("Est. Budget", 142, y);
    doc.text("Procurement Mode", 167, y);
    
    doc.line(15, y + 3, 195, y + 3);
    y += 9;

    doc.setFont("helvetica", "normal");
    
    if (activePPMP.items && activePPMP.items.length > 0) {
      activePPMP.items.forEach((it) => {
        // Page overflow check
        if (y > 275) {
          doc.addPage();
          y = 20;
          doc.setFillColor(248, 250, 252);
          doc.rect(15, y - 5, 180, 7, 'F');
          doc.setFont("helvetica", "bold");
          doc.text("Code", 17, y);
          doc.text("Description of Materials", 42, y);
          doc.text("Qty / Unit", 112, y);
          doc.text("Est. Budget", 142, y);
          doc.text("Procurement Mode", 167, y);
          doc.line(15, y + 3, 195, y + 3);
          y += 9;
          doc.setFont("helvetica", "normal");
        }

        doc.setFont("helvetica", "bold");
        doc.text(it.code, 17, y);
        doc.setFont("helvetica", "normal");
        
        let desc = it.generalDescription;
        if (desc.length > 35) {
          desc = desc.substring(0, 32) + "...";
        }
        doc.text(desc, 42, y);
        
        doc.text(`${it.quantity} ${it.unit}`, 112, y);
        doc.text(`Php ${it.estimatedBudget.toLocaleString()}`, 142, y);
        doc.text(it.modeOfProcurement, 167, y);
        
        doc.line(15, y + 3, 195, y + 3);
        y += 8;
      });
    } else {
      doc.text("No line items entered in this PPMP proposal.", 17, y);
    }
    
    // Footer notice
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("This document is generated automatically by the Municipal Agriculture Office (MAO) Repository System.", 15, 287);
    
    doc.save(`PPMP_Document_${activePPMP.year}_${activePPMP.id}.pdf`);
  };

  // Export report as Excel-compatible CSV
  const exportExcel = () => {
    if (!activePPMP) return;

    let csvContent = "";
    
    csvContent += `MUNICIPAL AGRICULTURE OFFICE (MAO) REPOSITORY\r\n`;
    csvContent += `PROJECT PROCUREMENT MANAGEMENT PLAN (PPMP) REPORT - FY ${activePPMP.year}\r\n`;
    csvContent += `Department/Office,${activePPMP.department}\r\n`;
    csvContent += `Proposal Title,${activePPMP.title}\r\n`;
    csvContent += `Current Status,${activePPMP.status}\r\n`;
    csvContent += `Submission Deadline,${activePPMP.deadline || "None"}\r\n`;
    csvContent += `Total Budget,Php ${activePPMP.totalBudget}\r\n`;
    csvContent += `Date of Export,${new Date().toLocaleDateString()}\r\n\r\n`;

    csvContent += `Item Code,Description,Quantity,Unit,Estimated Budget,Mode of Procurement,Schedule Months\r\n`;

    if (activePPMP.items && activePPMP.items.length > 0) {
      activePPMP.items.forEach(it => {
        const schedMonths = Object.keys(it.schedule || {})
          .filter(m => it.schedule[m])
          .join(" | ");

        const cleanDesc = it.generalDescription.replace(/,/g, " ");
        csvContent += `${it.code},${cleanDesc},${it.quantity},${it.unit},${it.estimatedBudget},${it.modeOfProcurement},"${schedMonths}"\r\n`;
      });
    } else {
      csvContent += `No procurement items listed in this proposal.,,,,\r\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PPMP_Report_${activePPMP.year}_${activePPMP.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle month in itemSchedule
  const toggleMonth = (m: string) => {
    setItemSchedule(prev => ({
      ...prev,
      [m]: !prev[m]
    }));
  };

  const getStatusBadge = (status: PPMP['status']) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-600/20';
      case 'Submitted':
        return 'bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-600/20';
      case 'Approved':
        return 'bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-600/20';
      case 'Revision Required':
        return 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-600/20';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6" id="ppmp-view">
      
      {/* Upper header block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            Project Procurement Management Plan (PPMP)
          </h1>
          <p className="text-sm text-gray-500">
            Formulate, structure, and verify procurement plans and monthly cashflow schedules for agricultural logistics.
          </p>
        </div>
        {!activePPMP && userRole === 'admin' && (
          <button 
            onClick={handleOpenAddPPMP}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-500 transition-colors cursor-pointer"
            id="btn-add-ppmp"
          >
            <Plus className="h-4 w-4" /> Create PPMP Proposal
          </button>
        )}
      </div>

      {/* Main Container */}
      {!activePPMP ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ppmpList.length === 0 ? (
            <div className="col-span-full text-center py-16 border-2 border-dashed border-gray-200 bg-white rounded-2xl p-6">
              <FileSpreadsheet className="h-12 w-12 text-gray-300 mx-auto" />
              <h3 className="text-sm font-bold text-gray-700 mt-4">No PPMP Proposals Exist</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Municipal procurement operations require PPMP listings. Click 'Create PPMP Proposal' to begin drafting acquisition targets.
              </p>
              {userRole === 'admin' && (
                <button 
                  onClick={handleOpenAddPPMP}
                  className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Create Proposal Now
                </button>
              )}
            </div>
          ) : (
            ppmpList.map((p) => (
              <div 
                key={p.id}
                onClick={() => setActivePPMP(p)}
                className="cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-emerald-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Fiscal Year {p.year}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusBadge(p.status)}`}>
                      {p.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 mt-3 group-hover:text-emerald-700 transition-colors leading-tight">
                    {p.title}
                  </h3>
                  
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                    <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                    <span>{p.department}</span>
                  </div>

                  {p.deadline && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-100/60 rounded-md px-2 py-1 w-fit font-mono font-bold animate-pulse">
                      <Clock className="h-3.5 w-3.5 text-rose-500" />
                      <span>Due: {new Date(p.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase font-bold">Planned Budget</span>
                    <span className="font-bold text-gray-900 text-sm">₱{(p.totalBudget || 0).toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 block text-[9px] uppercase font-bold">Line Items</span>
                    <span className="font-semibold text-emerald-600">{(p.items || []).length} items</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Detailed PPMP view */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-150">
          
          {/* Detailed Header block */}
          <div className="bg-emerald-800 p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <button 
                onClick={() => setActivePPMP(null)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-200 hover:text-white transition-colors border border-emerald-700 bg-emerald-900/40 rounded-lg px-2.5 py-1 mb-3 cursor-pointer"
              >
                ← Back to PPMP List
              </button>
              
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] bg-emerald-700/60 px-2 py-0.5 rounded-md font-bold font-mono tracking-wider">
                  MUNICIPAL PPMP RECORD | FY {activePPMP.year}
                </span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusBadge(activePPMP.status)}`}>
                  {activePPMP.status}
                </span>
                {activePPMP.deadline && (
                  <span className="text-[10px] bg-rose-600 px-2 py-0.5 rounded-md font-bold text-white tracking-wider flex items-center gap-1 animate-pulse">
                    <Clock className="h-3 w-3" />
                    DEADLINE: {new Date(activePPMP.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold tracking-tight mt-1.5">{activePPMP.title}</h2>
              <p className="text-xs text-emerald-200 mt-1 flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5 text-emerald-300" />
                Office of Authority: {activePPMP.department}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 text-right w-full md:w-auto">
              <div>
                <span className="text-[10px] text-emerald-200 uppercase tracking-widest block font-bold">Total Allocated Budget</span>
                <span className="text-3xl font-black tracking-tight text-white">
                  ₱{activePPMP.totalBudget.toLocaleString()}
                </span>
              </div>
              
              {/* Export Actions (PDF / Excel) */}
              <div className="flex gap-1.5 flex-wrap mt-2">
                <button 
                  onClick={exportPDF}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-700 bg-emerald-900/30 px-3 py-1.5 text-xs font-semibold hover:bg-emerald-900/60 hover:text-white transition-colors text-emerald-100 cursor-pointer"
                  title="Export Report to Adobe PDF Document"
                >
                  <FileText className="h-3.5 w-3.5 text-rose-400" /> Export PDF Report
                </button>
                <button 
                  onClick={exportExcel}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-700 bg-emerald-900/30 px-3 py-1.5 text-xs font-semibold hover:bg-emerald-900/60 hover:text-white transition-colors text-emerald-100 cursor-pointer"
                  title="Export Report to Microsoft Excel Spreadsheet"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" /> Export Excel Sheet
                </button>
                <button 
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-700 bg-emerald-900/30 px-3 py-1.5 text-xs font-semibold hover:bg-emerald-900/60 hover:text-white transition-colors text-emerald-100 cursor-pointer"
                  title="Print Official Spreadsheet Record"
                >
                  <Printer className="h-3.5 w-3.5" /> Print
                </button>
              </div>
            </div>
          </div>

          {/* Status Administration Controls */}
          {userRole === 'admin' && (
            <div className="bg-emerald-50 border-b border-emerald-100 p-4 px-6 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold">Workflow Status Control Station:</span>
              </div>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => handleUpdateStatus('Draft')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    activePPMP.status === 'Draft' ? 'bg-emerald-800 text-white' : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  Draft
                </button>
                <button 
                  onClick={() => handleUpdateStatus('Submitted')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    activePPMP.status === 'Submitted' ? 'bg-emerald-800 text-white' : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  Submit
                </button>
                <button 
                  onClick={() => handleUpdateStatus('Approved')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    activePPMP.status === 'Approved' ? 'bg-emerald-800 text-white animate-pulse' : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  Approve
                </button>
                <button 
                  onClick={() => handleUpdateStatus('Revision Required')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    activePPMP.status === 'Revision Required' ? 'bg-emerald-800 text-white' : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  Needs Revision
                </button>
                <button 
                  onClick={() => handleOpenEditPPMP(activePPMP)}
                  className="px-3 py-1.5 rounded-lg font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 cursor-pointer"
                >
                  Edit Details
                </button>
                <button 
                  onClick={async () => {
                    if (confirm('Are you sure you want to permanently delete this entire PPMP proposal and its line items?')) {
                      await onDeletePPMP(activePPMP.id);
                      setActivePPMP(null);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                >
                  Delete Proposal
                </button>
              </div>
            </div>
          )}

          {/* Table Grid list */}
          <div className="p-6 overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                Procurement Items Matrix List ({activePPMP.items?.length || 0} Records)
              </h3>
              {userRole === 'admin' && (
                <button 
                  onClick={handleOpenAddItem}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Procurement Target
                </button>
              )}
            </div>

            {(!activePPMP.items || activePPMP.items.length === 0) ? (
              <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-100">
                <Layers className="h-10 w-10 text-gray-300 mx-auto" />
                <h4 className="text-xs font-bold text-gray-700 mt-3">Procurement Matrix Empty</h4>
                <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
                  Add line item descriptions, units, modes of procurement, and monthly cash flow execution schedules above.
                </p>
                {userRole === 'admin' && (
                  <button 
                    onClick={handleOpenAddItem}
                    className="mt-3 inline-flex items-center justify-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Add First Item
                  </button>
                )}
              </div>
            ) : (
              <table className="min-w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3 border-b">Code</th>
                    <th className="p-3 border-b min-w-[150px]">Description</th>
                    <th className="p-3 border-b">Quantity</th>
                    <th className="p-3 border-b">Procurement Mode</th>
                    <th className="p-3 border-b">Estimated Cost</th>
                    <th className="p-3 border-b text-center" colSpan={12}>Procurement Monthly Schedule Matrix</th>
                    {userRole === 'admin' && <th className="p-3 border-b text-right">Actions</th>}
                  </tr>
                  <tr>
                    <th colSpan={5} className="border-b" />
                    {MONTHS.map(m => (
                      <th key={m} className="p-1 border-b text-center font-mono font-medium text-[9px] w-6">{m}</th>
                    ))}
                    {userRole === 'admin' && <th className="border-b" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {activePPMP.items.map((it) => (
                    <tr key={it.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 font-mono font-semibold text-gray-900 whitespace-nowrap">{it.code}</td>
                      <td className="p-3 font-semibold text-gray-800 leading-snug">{it.generalDescription}</td>
                      <td className="p-3 font-mono whitespace-nowrap">{it.quantity} {it.unit}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                          {it.modeOfProcurement}
                        </span>
                      </td>
                      <td className="p-3 font-bold font-mono whitespace-nowrap">₱{it.estimatedBudget.toLocaleString()}</td>
                      
                      {/* Months matrix */}
                      {MONTHS.map(m => (
                        <td key={m} className="p-1 text-center">
                          <span className={`inline-flex h-4 w-4 rounded-full items-center justify-center text-[8px] font-bold ${
                            it.schedule[m] 
                              ? 'bg-emerald-600 text-white shadow-2xs' 
                              : 'bg-gray-50 border border-gray-100 text-transparent'
                          }`}>
                            ✓
                          </span>
                        </td>
                      ))}

                      {/* Admin Actions */}
                      {userRole === 'admin' && (
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex gap-1.5 justify-end">
                            <button 
                              onClick={() => handleOpenEditItem(it)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:text-emerald-600 bg-white"
                              title="Edit Item Details"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteItem(it.id)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:text-rose-600 bg-white"
                              title="Delete Item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* PPMP Proposal Creation/Edit Modal */}
      {isPPMPModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl relative animate-in zoom-in-95 duration-150">
            <button 
              onClick={() => setIsPPMPModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              {editingPPMP ? 'Edit PPMP Proposal Details' : 'Create PPMP Proposal'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {editingPPMP 
                ? 'Update procurement folder profiles, department authorities, or submission deadlines below.' 
                : 'Initialize a procurement master log folder. You can add distinct materials and scheduling matrices afterward.'}
            </p>

            {ppmpError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-100">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {ppmpError}
              </div>
            )}

            <form onSubmit={handleSubmitPPMP} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Descriptive Proposal Title</label>
                <input 
                  type="text"
                  value={ppmpTitle}
                  onChange={(e) => setPpmpTitle(e.target.value)}
                  placeholder="e.g. Certified Seed & Organic Fertilizer Acquisition"
                  className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Fiscal Year</label>
                  <select 
                    value={ppmpYear}
                    onChange={(e) => setPpmpYear(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  >
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Department/Section</label>
                  <input 
                    type="text"
                    value={ppmpDept}
                    onChange={(e) => setPpmpDept(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-indigo-500" />
                  Submission Deadline (Optional)
                </label>
                <input 
                  type="date"
                  value={ppmpDeadline}
                  onChange={(e) => setPpmpDeadline(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Workflow Status</label>
                <select 
                  value={ppmpStatus}
                  onChange={(e: any) => setPpmpStatus(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="Draft">Draft (Internal formulation)</option>
                  <option value="Submitted">Submitted (To Municipal Mayor/Budget Officer)</option>
                  <option value="Approved">Approved (Sanctioned for procurement)</option>
                  <option value="Revision Required">Revision Required (Returned for refinement)</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsPPMPModalOpen(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
                >
                  {editingPPMP ? 'Save updates' : 'Create proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PPMP Line Item Add/Edit Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-6 shadow-xl relative animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsItemModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              {editingItem ? 'Edit Procurement Line Item' : 'Add Procurement Line Item'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Provide specific details of the procurement target, pricing, and active implementation cashflow periods.
            </p>

            {itemError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-100">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {itemError}
              </div>
            )}

            <form onSubmit={handleSubmitItem} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Line Item Code</label>
                  <input 
                    type="text"
                    value={itemCode}
                    onChange={(e) => setItemCode(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Procurement Mode</label>
                  <select 
                    value={itemMode}
                    onChange={(e: any) => setItemMode(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {MODES_OF_PROCUREMENT.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">General Description of Materials / Supplies</label>
                <textarea 
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="e.g. Scanned Inbred Rice Seeds Certified Class-1 High Yield variety"
                  className="mt-1.5 w-full h-20 rounded-lg border border-gray-200 p-3 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</label>
                  <input 
                    type="number"
                    value={itemQty}
                    onChange={(e) => setItemQty(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</label>
                  <input 
                    type="text"
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    placeholder="Bags, Kits, Units..."
                    className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Estimated Budget (₱)</label>
                  <input 
                    type="number"
                    value={itemBudget}
                    onChange={(e) => setItemBudget(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-hidden font-mono"
                    required
                  />
                </div>
              </div>

              {/* Monthly Calendar Selection Checklist */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Procurement Schedule Calendar Execution Matrix (Check active months)
                </label>
                <div className="grid grid-cols-4 gap-2 border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                  {MONTHS.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMonth(m)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-between transition-all ${
                        itemSchedule[m] 
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' 
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span>{m}</span>
                      <span className={`h-2 w-2 rounded-full ${itemSchedule[m] ? 'bg-white animate-ping' : 'bg-transparent'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
                >
                  {editingItem ? 'Save line item' : 'Add line item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
