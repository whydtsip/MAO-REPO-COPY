import React from 'react';
import { 
  Sprout, 
  Users, 
  Layers, 
  FileText, 
  TrendingUp, 
  Coins, 
  MapPin, 
  ClipboardCheck, 
  ChevronRight 
} from 'lucide-react';
import { Farmer, Cooperative, AgriculturalProgram, DistributionRecord, ArchivalDocument } from '../types';

interface DashboardProps {
  farmers: Farmer[];
  cooperatives: Cooperative[];
  programs: AgriculturalProgram[];
  distributions: DistributionRecord[];
  documents: ArchivalDocument[];
  onViewChange: (view: 'dashboard' | 'farmers' | 'cooperatives' | 'programs' | 'documents' | 'profile') => void;
  userRole: 'admin' | 'user';
}

export default function Dashboard({
  farmers,
  cooperatives,
  programs,
  distributions,
  documents,
  onViewChange,
  userRole
}: DashboardProps) {
  
  // Calculate analytics
  const totalFarmers = farmers.length;
  const activeFarmers = farmers.filter(f => f.status === 'Active').length;
  const totalCoops = cooperatives.length;
  const activeCoops = cooperatives.filter(c => c.status === 'Active').length;
  const activePrograms = programs.filter(p => p.status === 'Active').length;
  const totalDocuments = documents.length;

  const totalFarmArea = farmers.reduce((sum, f) => sum + f.farmSize, 0);
  const totalBudget = programs.reduce((sum, p) => sum + p.budget, 0);

  // Barangay calculation
  const barangayCounts: { [key: string]: { farmers: number; area: number } } = {};
  farmers.forEach(f => {
    if (!barangayCounts[f.barangay]) {
      barangayCounts[f.barangay] = { farmers: 0, area: 0 };
    }
    barangayCounts[f.barangay].farmers += 1;
    barangayCounts[f.barangay].area += f.farmSize;
  });

  // Crop calculation
  const cropCounts: { [key: string]: number } = {};
  farmers.forEach(f => {
    cropCounts[f.cropType] = (cropCounts[f.cropType] || 0) + 1;
  });

  return (
    <div className="space-y-8" id="dashboard-view">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block rounded-full bg-emerald-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
            Municipal Agriculture Office
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            MAO Agricultural Repository
          </h1>
          <p className="mt-2 text-emerald-100">
            Welcome to the centralized management system. Access digitized farmer registries, cooperative records, program distribution trackers, and smart-categorized document archives.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 h-48 w-48 opacity-15">
          <Sprout className="h-full w-full" />
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Farmers Card */}
        <div 
          onClick={() => {
            if (userRole === 'admin') onViewChange('farmers');
          }}
          className={`group rounded-xl border border-gray-100 bg-white p-6 shadow-xs transition-all ${
            userRole === 'admin' 
              ? 'cursor-pointer hover:border-emerald-200 hover:shadow-md' 
              : 'cursor-default'
          }`}
          id="stat-card-farmers"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Farmers Registered</p>
              <h3 className={`mt-2 text-3xl font-semibold text-gray-900 ${userRole === 'admin' ? 'group-hover:text-emerald-600' : ''} transition-colors`}>
                {totalFarmers}
              </h3>
            </div>
            <div className={`rounded-lg p-3 transition-colors ${userRole === 'admin' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' : 'bg-slate-50 text-slate-400'}`}>
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-500">
            <span className="font-semibold text-emerald-600 mr-1">{activeFarmers}</span> active in database
          </div>
        </div>

        {/* Cooperatives Card */}
        <div 
          onClick={() => {
            if (userRole === 'admin') onViewChange('cooperatives');
          }}
          className={`group rounded-xl border border-gray-100 bg-white p-6 shadow-xs transition-all ${
            userRole === 'admin' 
              ? 'cursor-pointer hover:border-emerald-200 hover:shadow-md' 
              : 'cursor-default'
          }`}
          id="stat-card-coops"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Cooperatives</p>
              <h3 className={`mt-2 text-3xl font-semibold text-gray-900 ${userRole === 'admin' ? 'group-hover:text-emerald-600' : ''} transition-colors`}>
                {totalCoops}
              </h3>
            </div>
            <div className={`rounded-lg p-3 transition-colors ${userRole === 'admin' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' : 'bg-slate-50 text-slate-400'}`}>
              <Layers className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-500">
            <span className="font-semibold text-emerald-600 mr-1">{activeCoops}</span> CDA/SEC registered
          </div>
        </div>

        {/* Active Programs Card */}
        <div 
          onClick={() => {
            if (userRole === 'admin') onViewChange('programs');
          }}
          className={`group rounded-xl border border-gray-100 bg-white p-6 shadow-xs transition-all ${
            userRole === 'admin' 
              ? 'cursor-pointer hover:border-emerald-200 hover:shadow-md' 
              : 'cursor-default'
          }`}
          id="stat-card-programs"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Programs</p>
              <h3 className={`mt-2 text-3xl font-semibold text-gray-900 ${userRole === 'admin' ? 'group-hover:text-emerald-600' : ''} transition-colors`}>
                {activePrograms}
              </h3>
            </div>
            <div className={`rounded-lg p-3 transition-colors ${userRole === 'admin' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' : 'bg-slate-50 text-slate-400'}`}>
              <ClipboardCheck className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-500">
            Total Budget: <span className="font-semibold text-emerald-600 ml-1">₱{totalBudget.toLocaleString()}</span>
          </div>
        </div>

        {/* Total Documents Card */}
        <div 
          onClick={() => onViewChange('documents')}
          className="group cursor-pointer rounded-xl border border-gray-100 bg-white p-6 shadow-xs transition-all hover:border-emerald-200 hover:shadow-md"
          id="stat-card-docs"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Archived Documents</p>
              <h3 className="mt-2 text-3xl font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                {totalDocuments}
              </h3>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
              <FileText className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-500">
            Intelligent tagging & categories active
          </div>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Crop Diversification & Farms */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-xs lg:col-span-1">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">Crop Distribution</h2>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <p className="mt-2 text-xs text-gray-500">Registered farmers count by primary crop type</p>
          <div className="mt-6 space-y-4">
            {Object.entries(cropCounts).map(([crop, count]) => {
              const percentage = totalFarmers > 0 ? (count / totalFarmers) * 100 : 0;
              return (
                <div key={crop} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{crop}</span>
                    <span className="text-gray-500 font-semibold">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-lg bg-emerald-50/50 p-4 border border-emerald-50 text-center">
            <div className="text-sm font-medium text-emerald-800">Total Cultivated Farm Area</div>
            <div className="mt-1 text-2xl font-bold text-emerald-600">{totalFarmArea.toFixed(1)} Hectares</div>
            <div className="mt-1 text-xs text-emerald-700/70">Average Farm Size: {(totalFarmArea / (totalFarmers || 1)).toFixed(2)} Ha</div>
          </div>
        </div>

        {/* Barangay Agricultural Statistics */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">Barangay Coverage</h2>
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <p className="mt-2 text-xs text-gray-500">Summary of agricultural footprints across municipal barangays</p>
          
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Barangay Name</th>
                  <th className="px-4 py-3 text-center font-semibold">Farmers</th>
                  <th className="px-4 py-3 text-right font-semibold">Total Farm Area</th>
                  <th className="px-4 py-3 text-right font-semibold">Average Area</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(barangayCounts).map(([barangay, data]) => (
                  <tr key={barangay} className="hover:bg-gray-55/30">
                    <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {barangay}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">{data.farmers}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-950">{data.area.toFixed(1)} Ha</td>
                    <td className="px-4 py-3 text-right text-gray-500">{(data.area / data.farmers).toFixed(2)} Ha</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Inputs Distributed Logs */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-lg font-bold text-gray-900">Recent Program Distributions</h2>
          {userRole === 'admin' && (
            <button 
              onClick={() => onViewChange('programs')}
              className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 gap-1"
            >
              Manage Vouchers & Distribution <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500">Real-time log of agricultural inputs distributed to verified farmers</p>

        <div className="mt-6 divide-y divide-gray-100">
          {distributions.length === 0 ? (
            <div className="py-6 text-center text-gray-400">No input distributions recorded yet.</div>
          ) : (
            distributions.slice(-4).reverse().map((record) => (
              <div key={record.id} className="flex flex-col sm:flex-row justify-between py-4 gap-2">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-emerald-50 p-2 text-emerald-600 mt-1">
                    <Coins className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{record.farmerName}</h4>
                    <p className="text-xs text-gray-500">
                      Barangay: <span className="font-medium text-gray-700">{record.farmerBarangay}</span> | Program: <span className="font-medium text-emerald-600">{record.programTitle}</span>
                    </p>
                    {record.notes && <p className="text-xs text-gray-400 mt-0.5">Note: {record.notes}</p>}
                  </div>
                </div>
                <div className="sm:text-right flex sm:flex-col justify-between sm:justify-start items-center sm:items-end mt-1 sm:mt-0">
                  <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                    {record.quantityReceived}
                  </span>
                  <span className="text-xs text-gray-400 mt-1">
                    {new Date(record.distributedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
