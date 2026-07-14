import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, 
  FileText, 
  UploadCloud, 
  Plus, 
  Search, 
  ArrowLeft, 
  Download, 
  FolderPlus, 
  Calendar, 
  File, 
  AlertCircle, 
  CheckCircle,
  Home,
  ChevronRight,
  Eye,
  Archive,
  Layers,
  Sparkles,
  Info,
  Clock,
  X
} from 'lucide-react';
import { ArchivalDocument } from '../types';

interface OfficeFilesProps {
  userRole: 'admin' | 'user';
  userName: string;
  initialViewingArchives?: boolean;
}

export default function OfficeFiles({ userRole, userName, initialViewingArchives }: OfficeFilesProps) {
  const [documents, setDocuments] = useState<ArchivalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hidden Archives Trigger (Ctrl + Shift + A)
  const [showArchivesOption, setShowArchivesOption] = useState(initialViewingArchives || false);
  const [viewingArchives, setViewingArchives] = useState(initialViewingArchives || false);

  useEffect(() => {
    if (initialViewingArchives !== undefined) {
      setViewingArchives(initialViewingArchives);
      if (initialViewingArchives) {
        setShowArchivesOption(true);
      }
    }
  }, [initialViewingArchives]);

  // Directory / Folder state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
  // Search and Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Modals
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<ArchivalDocument | null>(null);

  // Form states - Folder
  const [folderTitle, setFolderTitle] = useState('');
  const [folderDesc, setFolderDesc] = useState('');

  // Form states - File Upload
  const [fileTitle, setFileTitle] = useState('');
  const [fileDate, setFileDate] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileContents, setFileContents] = useState<{ name: string; content: string; size: number }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadingName, setCurrentUploadingName] = useState('');

  // Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Annual Archiving & Reset Workflow states
  const [archiveDownloaded, setArchiveDownloaded] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadArchive = () => {
    window.location.href = '/api/storage/archive-download';
    setArchiveDownloaded(true);
    showNotification('success', 'ZIP Archive download initiated successfully.');
  };

  const handleSystemReset = async () => {
    if (!confirm('CRITICAL SECURITY WARNING:\n\nThis will permanently purge all official office files, folders, cooperative document registers, and farmer profiles\' attachments from the current cycle.\n\nAre you absolutely sure you have securely downloaded and verified the ZIP archive? This action cannot be undone.')) {
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch('/api/storage/reset', {
        method: 'POST'
      });
      if (res.ok) {
        showNotification('success', 'System database & files successfully purged and reset for the new annual cycle.');
        setArchiveDownloaded(false);
        await fetchDocuments();
        window.dispatchEvent(new Event('storage-update'));
      } else {
        showNotification('error', 'Failed to purge database registries.');
      }
    } catch (err) {
      console.error(err);
      showNotification('error', 'Connection to storage purge utility failed.');
    } finally {
      setIsResetting(false);
    }
  };

  // Fetch documents from API
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      } else {
        setError('Failed to retrieve files and folders.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to documents repository failed.');
    } finally {
      setLoading(false);
    }
  };

  // Setup Keyboard shortcut Ctrl+Shift+A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setShowArchivesOption(prev => !prev);
        showNotification('success', `Archives vault toggled! Press Ctrl + Shift + A to hide/unhide.`);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Create Folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderTitle.trim()) {
      showNotification('error', 'Folder title is required.');
      return;
    }

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: folderTitle.trim(),
          description: folderDesc.trim() || 'No description provided.',
          type: 'folder',
          parentId: null,
          tags: ['office-file'],
          summary: [`Created folder for office documents: ${folderTitle.trim()}`],
          fileSize: '--',
          uploadedAt: new Date().toISOString()
        })
      });

      if (res.ok) {
        const newFolder = await res.json();
        setDocuments(prev => [newFolder, ...prev]);
        setFolderTitle('');
        setFolderDesc('');
        setIsFolderModalOpen(false);
        showNotification('success', `Folder "${newFolder.title}" created successfully.`);
      } else {
        showNotification('error', 'Failed to create folder.');
      }
    } catch (err) {
      console.error(err);
      showNotification('error', 'Server error. Failed to save folder.');
    }
  };

  // Export to CSV for Archival document metadata
  const handleExportCSV = () => {
    const archives = documents.filter(doc => isArchivedDoc(doc) && doc.type === 'file');
    if (archives.length === 0) {
      showNotification('error', 'No archival files found to export.');
      return;
    }

    const headers = ['ID', 'Title', 'Description', 'Filename', 'File Size', 'Uploaded At', 'Tags'];
    const rows = archives.map(file => [
      file.id,
      `"${(file.title || '').replace(/"/g, '""')}"`,
      `"${(file.description || '').replace(/"/g, '""')}"`,
      `"${(file.name || '').replace(/"/g, '""')}"`,
      file.fileSize || '',
      file.uploadedAt || '',
      `"${(file.tags || []).join(', ').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `archival_records_report_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('success', 'Archival records metadata CSV report exported successfully.');
  };

  // File select and base64 conversion for multiple files
  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) as File[] : [];
    if (files.length === 0) return;

    setSelectedFiles(files);
    setFileContents([]);

    const loadedContents: { name: string; content: string; size: number }[] = [];
    let loadedCount = 0;

    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        loadedContents.push({
          name: file.name,
          content: event.target?.result as string,
          size: file.size
        });
        loadedCount++;
        if (loadedCount === files.length) {
          setFileContents(loadedContents);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Upload Multiple Files
  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileTitle.trim()) {
      showNotification('error', 'Travel Order/File title subject is required.');
      return;
    }
    if (!fileDate) {
      showNotification('error', 'Travel Order date is required.');
      return;
    }
    if (selectedFiles.length === 0 || fileContents.length === 0) {
      showNotification('error', 'Please choose at least one file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const totalFiles = fileContents.length;
    let uploadedDocs: ArchivalDocument[] = [];
    let hadError = false;

    for (let i = 0; i < totalFiles; i++) {
      const fileData = fileContents[i];
      setCurrentUploadingName(fileData.name);
      
      const baseProgress = (i / totalFiles) * 100;
      setUploadProgress(baseProgress);

      let localProgress = 0;
      const progressInterval = setInterval(() => {
        localProgress += 15;
        if (localProgress <= 85) {
          setUploadProgress(baseProgress + (localProgress / 100) * (100 / totalFiles));
        }
      }, 80);

      const sizeStr = (fileData.size / (1024 * 1024)).toFixed(2) + " MB";
      const titleToUse = totalFiles > 1 
        ? `${fileTitle.trim()} - ${fileData.name.split('.')[0]}`
        : fileTitle.trim();

      try {
        const res = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: titleToUse,
            description: `Travel Order Date: ${fileDate}`,
            type: 'file',
            parentId: currentFolderId,
            name: fileData.name,
            fileSize: sizeStr,
            content: fileData.content,
            tags: ['travel-order', fileDate],
            summary: [`Travel Order: ${titleToUse}`, `Date: ${fileDate}`],
            uploadedAt: new Date().toISOString()
          })
        });

        clearInterval(progressInterval);

        if (res.ok) {
          const newDoc = await res.json();
          uploadedDocs.push(newDoc);
        } else {
          hadError = true;
          try {
            const errBody = await res.json();
            if (errBody && errBody.error) {
              showNotification('error', errBody.error);
            }
          } catch (e) {}
        }
      } catch (err) {
        clearInterval(progressInterval);
        console.error(err);
        hadError = true;
      }

      setUploadProgress(((i + 1) / totalFiles) * 100);
    }

    setIsUploading(false);
    setCurrentUploadingName('');
    
    if (uploadedDocs.length > 0) {
      setDocuments(prev => [...uploadedDocs, ...prev]);
      showNotification('success', `Successfully uploaded ${uploadedDocs.length} file(s).`);
      window.dispatchEvent(new Event('storage-update'));
    }
    if (hadError) {
      showNotification('error', 'Some files failed to upload. Please try again.');
    }

    // Reset fields
    setFileTitle('');
    setFileDate('');
    setSelectedFiles([]);
    setFileContents([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsFileModalOpen(false);
  };

  // Download File Handler
  const handleDownloadFile = (doc: ArchivalDocument) => {
    if (!doc.content) {
      const mockContent = `Official Document: ${doc.title}\nUploaded: ${new Date(doc.uploadedAt).toLocaleDateString()}\nSize: ${doc.fileSize}`;
      const blob = new Blob([mockContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showNotification('success', 'Fallback file generated and downloaded successfully.');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = doc.content;
      link.download = doc.name || `${doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('success', 'File downloaded successfully.');
    } catch (err) {
      console.error(err);
      showNotification('error', 'Failed to download the file.');
    }
  };

  // Check Year Transition logic
  const currentYear = new Date().getFullYear();

  // Helper: determine if a document belongs to Archives (uploaded prior to current year)
  const isArchivedDoc = (doc: ArchivalDocument) => {
    if (!doc.uploadedAt) return false;
    try {
      const uploadYear = new Date(doc.uploadedAt).getFullYear();
      return uploadYear < currentYear;
    } catch (e) {
      return false;
    }
  };

  // Filter out archived vs active based on current year
  const activeDocuments = documents.filter(doc => !isArchivedDoc(doc));
  const archivedDocuments = documents.filter(doc => isArchivedDoc(doc));

  // Count active folders and files for Summary Dashboard
  const activeFoldersCount = activeDocuments.filter(d => d.type === 'folder').length;
  const activeFilesCount = activeDocuments.filter(d => d.type === 'file').length;

  // Find most recently added document in active view
  const activeFilesOnly = activeDocuments.filter(d => d.type === 'file');
  const mostRecentDoc = activeFilesOnly.length > 0 
    ? activeFilesOnly.reduce((latest, current) => {
        return new Date(current.uploadedAt) > new Date(latest.uploadedAt) ? current : latest;
      }, activeFilesOnly[0])
    : null;

  // Filter items based on active folder state, search and date range picker
  const isSearching = searchTerm.trim().length > 0 || filterStartDate || filterEndDate;

  const matchesSearchAndDate = (doc: ArchivalDocument) => {
    // Search filter
    const term = searchTerm.toLowerCase();
    const matchesSearch = searchTerm.trim().length === 0 || (
      doc.title.toLowerCase().includes(term) ||
      (doc.name || '').toLowerCase().includes(term) ||
      (doc.description || '').toLowerCase().includes(term) ||
      (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(term)))
    );

    // Date range filter
    let matchesDate = true;
    if (doc.uploadedAt) {
      const docDate = new Date(doc.uploadedAt);
      if (filterStartDate) {
        const start = new Date(filterStartDate);
        start.setHours(0,0,0,0);
        if (docDate < start) matchesDate = false;
      }
      if (filterEndDate) {
        const end = new Date(filterEndDate);
        end.setHours(23,59,59,999);
        if (docDate > end) matchesDate = false;
      }
    }

    return matchesSearch && matchesDate;
  };

  // Build list of active displayed folders and files
  let displayedFolders: ArchivalDocument[] = [];
  let displayedFiles: ArchivalDocument[] = [];

  if (viewingArchives) {
    // Archives Mode: we show files from previous years. Filtered by search and date range.
    displayedFiles = archivedDocuments.filter(doc => doc.type === 'file' && matchesSearchAndDate(doc));
  } else {
    // Active Files Mode
    if (isSearching) {
      // If user is searching or using date-range picker, search across all active folders (global active search)
      displayedFiles = activeDocuments.filter(doc => doc.type === 'file' && matchesSearchAndDate(doc));
      displayedFolders = activeDocuments.filter(doc => doc.type === 'folder' && matchesSearchAndDate(doc));
    } else {
      // Normal browsing mode: strictly filter by current directory level
      displayedFolders = activeDocuments.filter(doc => doc.type === 'folder' && doc.parentId === currentFolderId);
      displayedFiles = activeDocuments.filter(doc => doc.type === 'file' && doc.parentId === currentFolderId);
    }
  }

  // Count files inside any folder (active files only)
  const getFileCountInFolder = (folderId: string) => {
    return activeDocuments.filter(doc => doc.type === 'file' && doc.parentId === folderId).length;
  };

  const formatDateDisplay = (dateString: string) => {
    try {
      const dateObj = new Date(dateString);
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  const currentFolder = documents.find(doc => doc.id === currentFolderId && doc.type === 'folder');

  return (
    <div className="space-y-6">
      {/* Header and Details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight font-display flex items-center gap-2">
              {viewingArchives ? 'Archived Repository' : 'Office Files'}
            </h1>
            {viewingArchives && (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono">
                <Archive className="h-3 w-3" />
                <span>Historic Records</span>
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {viewingArchives 
              ? 'Browse, search, and retrieve official documents automatically archived from previous calendar years'
              : 'Organize official office files, travel orders, and document registers in secure folders'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Secret Archives Button - only displays if Ctrl+Shift+A clicked */}
          {showArchivesOption && (
            <button
              onClick={() => {
                setViewingArchives(prev => !prev);
                setCurrentFolderId(null);
                setSearchTerm('');
                setFilterStartDate('');
                setFilterEndDate('');
              }}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all shadow-2xs border cursor-pointer ${
                viewingArchives 
                  ? 'bg-slate-800 text-white border-slate-900 hover:bg-slate-700' 
                  : 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
              }`}
            >
              <Archive className="h-4 w-4" />
              <span>{viewingArchives ? 'Back to Office Files' : 'Open Archives Vault'}</span>
            </button>
          )}

          {/* New Folder & Upload File - ONLY in Active View & ONLY for Admin */}
          {!viewingArchives && userRole === 'admin' && (
            <>
              <button
                onClick={() => setIsFolderModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 transition-all cursor-pointer"
              >
                <FolderPlus className="h-4 w-4 text-indigo-600" />
                <span>New Folder</span>
              </button>
              {currentFolderId && (
                <button
                  onClick={() => setIsFileModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-indigo-500 transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Upload File</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top duration-200 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span className="text-xs font-medium">{notification.message}</span>
        </div>
      )}

      {/* Annual Archiving & Reset Workflow Portal */}
      {viewingArchives && userRole === 'admin' && (
        <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Archive className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-black tracking-tight text-white font-display">
                  Annual Archiving & System Reset Workspace
                </h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                As the Municipal Administrative Officer, you are authorized to download a structured, consolidated ZIP archive containing all current cycle's documents (organized neatly by source and folders), then clear the storage to initiate a new calendar year's operational registry.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {/* Step 1: Download Archive Button */}
              <button
                onClick={handleDownloadArchive}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 text-slate-950 px-5 py-3 text-xs font-black hover:bg-amber-400 transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Download Year Archive (ZIP)</span>
              </button>

              {/* Step 2: Confirm Reset Button (Shows up once download initiated/confirmed) */}
              {archiveDownloaded && (
                <button
                  onClick={handleSystemReset}
                  disabled={isResetting}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 text-white px-5 py-3 text-xs font-black hover:bg-rose-500 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>{isResetting ? "Purging System..." : "Confirm Reset & Empty System"}</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-4 space-y-2">
              <span className="text-[10px] text-amber-400 font-bold tracking-wider uppercase font-mono block">📁 Structured Zip Folders</span>
              <p className="text-slate-400 text-[11px] leading-relaxed font-sans">
                Automatically maps database records into clean directories: <code className="text-slate-200">Office Files/</code> with all folder hierachies, plus profile attachment subfolders inside <code className="text-slate-200">Farmer Files/</code> and <code className="text-slate-200">Cooperative Files/</code>.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-4 space-y-2">
              <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase font-mono block">🔒 Decoded Binary Files</span>
              <p className="text-slate-400 text-[11px] leading-relaxed font-sans">
                Translates offline base64 strings back to their original binary format (PDFs, images, spreadsheets) so they open flawlessly on standard computer operating systems.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-4 space-y-2">
              <span className="text-[10px] text-indigo-400 font-bold tracking-wider uppercase font-mono block">🔄 Zero-Downtime Cleared State</span>
              <p className="text-slate-400 text-[11px] leading-relaxed font-sans">
                Purging active files resets the storage consumption to 0 bytes instantly. This frees up capacity for the incoming budget and inputs batch, while preserving profile accounts.
              </p>
            </div>
          </div>

          {archiveDownloaded && (
            <div className="p-3 bg-rose-950/40 border border-rose-900/50 rounded-xl text-[11px] text-rose-300 flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>
                <strong>ZIP Download Initiated!</strong> You can now perform the final system purge. Click the red <strong>Confirm Reset & Empty System</strong> button above to clear all files and start a new annual cycle.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Summary Dashboard Block (Only visible in normal/active view or if archives has records) */}
      {!viewingArchives && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stat 1: Total Folders */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-2xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Directories</span>
              <span className="text-2xl font-black text-gray-950 block">{activeFoldersCount}</span>
              <span className="text-[10px] text-gray-400 block font-semibold">Active directories in {currentYear}</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Folder className="h-6 w-6" />
            </div>
          </div>

          {/* Stat 2: Total Files Uploaded */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-2xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Documents</span>
              <span className="text-2xl font-black text-emerald-950 block">{activeFilesCount}</span>
              <span className="text-[10px] text-gray-400 block font-semibold">Travel orders & files registered</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FileText className="h-6 w-6" />
            </div>
          </div>

          {/* Stat 3: Most Recently Added Document */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-2xs">
            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Latest File Add</span>
              {mostRecentDoc ? (
                <>
                  <span className="text-xs font-bold text-gray-900 block truncate" title={mostRecentDoc.title}>
                    {mostRecentDoc.title}
                  </span>
                  <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>{formatDateDisplay(mostRecentDoc.uploadedAt)}</span>
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs text-gray-400 italic block">No active files found</span>
                  <span className="text-[10px] text-gray-400 block mt-1">Ready to receive uploads</span>
                </>
              )}
            </div>
            <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 ml-3">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filtering Area (Search bar and Date Range Picker) */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
          <Layers className="h-4 w-4 text-indigo-600 shrink-0" />
          <span>Search and Date Range Filters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Search bar (6 cols) */}
          <div className="md:col-span-6 space-y-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Keyword Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={viewingArchives ? "Search archived travel orders, files, tags..." : "Search travel orders, filenames, dates..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white text-gray-900 font-semibold"
              />
            </div>
          </div>

          {/* Start Date (2.5 cols) */}
          <div className="md:col-span-2.5 space-y-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3 w-3 text-indigo-500" />
              <span>Uploaded From</span>
            </label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white text-gray-900 font-semibold"
            />
          </div>

          {/* End Date (2.5 cols) */}
          <div className="md:col-span-2.5 space-y-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3 w-3 text-indigo-500" />
              <span>Uploaded To</span>
            </label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white text-gray-900 font-semibold"
            />
          </div>

          {/* Clear Filters (1 col) */}
          <div className="md:col-span-1">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStartDate('');
                setFilterEndDate('');
              }}
              disabled={!searchTerm && !filterStartDate && !filterEndDate}
              className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                searchTerm || filterStartDate || filterEndDate
                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/50 cursor-pointer'
                  : 'bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed'
              }`}
              title="Reset Search and Date Filters"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Breadcrumbs for navigation (Only in Active View) */}
        {!viewingArchives && (
          <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-slate-200/50 overflow-x-auto">
            <button
              onClick={() => { setCurrentFolderId(null); setSearchTerm(''); }}
              className="flex items-center gap-1.5 font-bold hover:text-indigo-600 text-gray-700 transition-colors shrink-0"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Root Active directories ({currentYear})</span>
            </button>
            
            {currentFolder && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="font-semibold text-gray-900 bg-white border border-gray-200 px-2.5 py-1 rounded-md shadow-2xs shrink-0 max-w-[160px] truncate">
                  {currentFolder.title}
                </span>
              </>
            )}

            {isSearching && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="font-mono text-[9px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-sm font-bold shrink-0">
                  Global Search Active
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-flex rounded-full bg-indigo-50 p-4 text-indigo-600 animate-spin">
            <Folder className="h-8 w-8" />
          </div>
          <p className="text-xs text-gray-500 mt-2 font-medium">Loading files and directories...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-100 rounded-xl text-center text-xs text-rose-700 max-w-md mx-auto space-y-2">
          <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
          <p className="font-bold">{error}</p>
          <button onClick={fetchDocuments} className="text-xs text-indigo-600 underline font-semibold">Retry connection</button>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Section A: Folders Grid (Only visible in active view, when browsing at Root level, and directories exist) */}
          {!viewingArchives && !isSearching && !currentFolderId && displayedFolders.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Directories ({currentYear})</h3>
                <span className="text-[10px] text-gray-400 italic">Click to enter folder and view files</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayedFolders.map(folder => {
                  const count = getFileCountInFolder(folder.id);
                  return (
                    <div 
                      key={folder.id}
                      className="group border border-gray-200 bg-white rounded-xl p-4 flex flex-col justify-between hover:border-indigo-500 hover:shadow-xs transition-all relative overflow-hidden"
                    >
                      {/* Interactive Button Area */}
                      <button
                        onClick={() => setCurrentFolderId(folder.id)}
                        className="w-full text-left flex items-start gap-3.5 cursor-pointer z-10"
                      >
                        <div className="h-11 w-11 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                          <Folder className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 truncate transition-colors">
                            {folder.title}
                          </h4>
                          <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                            {folder.description}
                          </p>
                          <span className="inline-block mt-2 text-[10px] font-bold text-indigo-600 bg-indigo-50/70 px-2 py-0.5 rounded-full font-mono">
                            {count} file{count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section B: Files List / Table */}
          {/* Rule: Files in Directory shows when a folder is clicked OR we are in search OR we are viewing archives. No root-level files table in normal browsing. */}
          {(currentFolderId !== null || isSearching || viewingArchives) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {viewingArchives 
                      ? `Archived Document List (Prior to ${currentYear})` 
                      : isSearching 
                        ? 'Global Search Results' 
                        : `Files inside: ${currentFolder?.title || 'Selected Folder'}`}
                  </h3>
                  {viewingArchives && (
                    <span className="bg-amber-100 text-amber-800 border border-amber-200/50 rounded-sm font-semibold text-[9px] px-1.5 py-0.5 font-mono uppercase">
                      Archived
                    </span>
                  )}
                </div>

                {/* Upload file triggers (Only Active view + Subfolder + Admin) */}
                {!viewingArchives && currentFolderId && userRole === 'admin' && (
                  <button
                    onClick={() => setIsFileModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Upload File</span>
                  </button>
                )}

                {/* Export to CSV trigger (Only in Archives view) */}
                {viewingArchives && (
                  <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export to CSV</span>
                  </button>
                )}
              </div>

              {displayedFiles.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          <th className="p-4">File Title / Travel Order</th>
                          <th className="p-4">Travel Date</th>
                          <th className="p-4">Filename</th>
                          <th className="p-4">Size</th>
                          <th className="p-4">Uploaded At</th>
                          {(isSearching || viewingArchives) && <th className="p-4">Original Folder</th>}
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs">
                        {displayedFiles.map(file => {
                          const parentFld = documents.find(d => d.id === file.parentId);
                          const isTravelOrder = file.tags?.includes('travel-order');
                          const travelDateRaw = isTravelOrder && file.tags?.find(t => t !== 'travel-order' && t.match(/^\d{4}-\d{2}-\d{2}$/));
                          const displayTravelDate = travelDateRaw ? formatDateDisplay(travelDateRaw) : 'N/A';

                          return (
                            <tr key={file.id} className="hover:bg-gray-50/50">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                    <FileText className="h-4.5 w-4.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-gray-900 truncate" title={file.title}>{file.title}</div>
                                    <div className="text-[10px] text-gray-400 mt-0.5 max-w-[200px] truncate">{file.description}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 font-semibold text-gray-700">
                                {displayTravelDate !== 'N/A' ? (
                                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100/55 px-2 py-0.5 rounded-full font-semibold">
                                    <Calendar className="h-3 w-3" />
                                    <span>{displayTravelDate}</span>
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic">No custom date</span>
                                )}
                              </td>
                              <td className="p-4 font-medium text-gray-500 font-mono truncate max-w-[120px]">{file.name || 'document.pdf'}</td>
                              <td className="p-4 text-gray-500 font-mono font-bold">{file.fileSize}</td>
                              <td className="p-4 text-gray-400 font-medium">{formatDateDisplay(file.uploadedAt)}</td>
                              
                              {(isSearching || viewingArchives) && (
                                <td className="p-4">
                                  {parentFld ? (
                                    <button
                                      onClick={() => {
                                        setSearchTerm('');
                                        setFilterStartDate('');
                                        setFilterEndDate('');
                                        if (viewingArchives) {
                                          // Keep in mind folders inside archives may have been old too, but let user view files inside the folder if they switch back
                                        } else {
                                          setCurrentFolderId(parentFld.id);
                                        }
                                      }}
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                    >
                                      <Folder className="h-3 w-3" />
                                      <span>{parentFld.title}</span>
                                    </button>
                                  ) : (
                                    <span className="text-gray-400 italic">Root Directory</span>
                                  )}
                                </td>
                              )}

                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {/* Quick Preview Button */}
                                  <button
                                    onClick={() => setPreviewFile(file)}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer inline-flex"
                                    title="Quick Preview File"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>

                                  {/* Download Button */}
                                  <button
                                    onClick={() => handleDownloadFile(file)}
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer inline-flex"
                                    title="Download File"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-gray-200 bg-white rounded-xl p-16 text-center space-y-3">
                  <div className="rounded-full bg-slate-50 p-4 text-gray-400 inline-flex">
                    <File className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-gray-700">
                      {isSearching ? 'No Search Matches' : 'This Folder is Empty'}
                    </h4>
                    <p className="text-[10px] text-gray-400 max-w-sm mx-auto">
                      {isSearching 
                        ? 'No active travel orders or files match your search keywords or date range.' 
                        : 'There are no active files registered inside this folder. Upload one to get started.'}
                    </p>
                  </div>
                  {!isSearching && currentFolderId && userRole === 'admin' && (
                    <button
                      onClick={() => setIsFileModalOpen(true)}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-indigo-500 cursor-pointer"
                    >
                      <UploadCloud className="h-3.5 w-3.5" />
                      <span>Upload First File</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Root Empty State (No subfolders exist at all and browsing at root) */}
          {!viewingArchives && !isSearching && !currentFolderId && displayedFolders.length === 0 && (
            <div className="border border-dashed border-gray-200 bg-white rounded-xl p-20 text-center space-y-4">
              <div className="rounded-full bg-slate-50 p-4 text-gray-400 inline-flex">
                <Folder className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-800">No Office Files Registered</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Create directories and attach document records like travel orders, reports, and seed registries for quick discovery.
                </p>
              </div>
              {userRole === 'admin' && (
                <button
                  onClick={() => setIsFolderModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-indigo-500 cursor-pointer"
                >
                  <FolderPlus className="h-4 w-4" />
                  <span>Create First Folder</span>
                </button>
              )}
            </div>
          )}

          {/* Guidelines info box reminding how to trigger Archives */}
          {!showArchivesOption && userRole === 'admin' && (
            <div className="bg-blue-50/55 border border-blue-100 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-800">
              <Info className="h-4.5 w-4.5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Pro-Tip for Administrators:</p>
                <p className="mt-0.5 text-blue-900/80">
                  Press <kbd className="bg-white border border-blue-200 px-1.5 py-0.5 rounded-sm font-bold text-[10px] mx-0.5">Ctrl</kbd> + 
                  <kbd className="bg-white border border-blue-200 px-1.5 py-0.5 rounded-sm font-bold text-[10px] mx-0.5">Shift</kbd> + 
                  <kbd className="bg-white border border-blue-200 px-1.5 py-0.5 rounded-sm font-bold text-[10px] mx-0.5">A</kbd> 
                  at any time to reveal the hidden <strong>Archives</strong> button containing historic document records.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Create Folder */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Create Folder Directory</h3>
                <p className="text-[10px] text-gray-500">Group related office documents together</p>
              </div>
              <button onClick={() => setIsFolderModalOpen(false)} className="text-gray-400 hover:text-gray-900 font-bold text-xs">Close</button>
            </div>
            
            <form onSubmit={handleCreateFolder} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Folder Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Travel Orders"
                  value={folderTitle}
                  onChange={(e) => setFolderTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white text-gray-950 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description / Subtext
                </label>
                <textarea
                  placeholder="e.g. Approved and pending travel logs for seed distributions and field checks"
                  value={folderDesc}
                  onChange={(e) => setFolderDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white text-gray-950 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsFolderModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 border border-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Upload File / Travel Order */}
      {isFileModalOpen && currentFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Upload to "{currentFolder.title}"</h3>
                <p className="text-[10px] text-gray-500">Attach and register a scanned travel order or office file</p>
              </div>
              <button onClick={() => setIsFileModalOpen(false)} className="text-gray-400 hover:text-gray-900 font-bold text-xs">Close</button>
            </div>
            
            <form onSubmit={handleUploadFile} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  File Title / Travel Order Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distribution of Seeds in Mapaya"
                  value={fileTitle}
                  onChange={(e) => setFileTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white text-gray-950 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Travel Order Date *
                </label>
                <input
                  type="date"
                  required
                  value={fileDate}
                  onChange={(e) => setFileDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white text-gray-950 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Choose Scanned Document Files *
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100/50 transition-all">
                  <div className="space-y-1 text-center w-full">
                    <UploadCloud className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="flex text-xs text-gray-600 justify-center">
                      <label className="relative cursor-pointer bg-transparent rounded-md font-semibold text-indigo-600 hover:text-indigo-500 focus-within:outline-hidden">
                        <span>Select files (Multiple allowed)</span>
                        <input
                          type="file"
                          ref={fileInputRef}
                          required
                          multiple
                          onChange={handleFileSelection}
                          className="sr-only"
                          accept="application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-gray-400">PDF, PNG, JPG, or DOC up to 10MB each</p>
                    {selectedFiles.length > 0 && (
                      <div className="mt-3 text-left max-h-[140px] overflow-y-auto p-2 bg-white rounded-lg border border-gray-100 space-y-1.5 w-full max-w-[340px] mx-auto shadow-2xs">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Selected Files ({selectedFiles.length}):</span>
                        {selectedFiles.map((f, idx) => (
                          <div key={idx} className="text-[10px] text-gray-600 flex items-center justify-between gap-2 border-b border-gray-50 pb-1 last:border-0">
                            <span className="font-semibold truncate max-w-[180px]">{f.name}</span>
                            <span className="text-gray-400 font-mono">{(f.size / 1024).toFixed(0)} KB</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {isUploading && (
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-indigo-600 truncate max-w-[250px]">
                      Uploading: {currentUploadingName || 'Preparing...'}
                    </span>
                    <span className="text-gray-500 font-mono">
                      {Math.round(uploadProgress)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full transition-all duration-200 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 italic text-center">
                    Please keep this modal open while we process your upload.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setIsFileModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 border border-gray-200 rounded-lg disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Save Files'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: QUICK PREVIEW FILE */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Eye className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase">Quick Document Preview</h3>
                  <p className="text-[9px] text-gray-500">Secure Audit Verification Tool</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* File Visual Representation */}
              <div className="border border-gray-200 rounded-xl bg-slate-50 p-4 flex flex-col items-center justify-center min-h-[180px] relative overflow-hidden">
                {previewFile.content && (previewFile.content.startsWith('data:image/') || previewFile.name?.match(/\.(png|jpe?g|gif|webp)$/i)) ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <img 
                      src={previewFile.content} 
                      alt={previewFile.title} 
                      className="max-h-[220px] object-contain rounded-lg shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="h-16 w-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
                      <FileText className="h-8 w-8" />
                    </div>
                    <p className="text-xs font-bold text-gray-700 font-mono">
                      {previewFile.name || 'document.pdf'}
                    </p>
                    <span className="inline-block px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[9px] font-bold uppercase tracking-wider">
                      Standard Office File
                    </span>
                  </div>
                )}
              </div>

              {/* Metadata list */}
              <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-4 space-y-3">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-slate-200/60 pb-1.5">
                  Document Metadata Records
                </h4>

                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-semibold">Subject / Title</span>
                    <span className="font-bold text-gray-900 break-words">{previewFile.title}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 block font-semibold">Associated File</span>
                    <span className="font-mono text-gray-700 break-all">{previewFile.name || 'document.pdf'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 block font-semibold">Travel Date / Description</span>
                    <span className="font-medium text-gray-700">{previewFile.description}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 block font-semibold">Uploaded Timestamp</span>
                    <span className="font-semibold text-gray-700">{formatDateDisplay(previewFile.uploadedAt)}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 block font-semibold">File Payload Size</span>
                    <span className="font-bold text-emerald-700 font-mono">{previewFile.fileSize}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 block font-semibold">Directory Category</span>
                    <span className="font-semibold text-gray-700">
                      {documents.find(d => d.id === previewFile.parentId)?.title || 'Root Archive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2.5 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-150 border border-gray-200 rounded-lg cursor-pointer"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => handleDownloadFile(previewFile)}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Download className="h-4 w-4" />
                <span>Download Secure File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
