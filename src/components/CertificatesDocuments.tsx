import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Printer, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  FileBadge,
  Calendar,
  X,
  Eye,
  FileText,
  Plus,
  Award,
  ChevronRight,
  Info,
  Loader2
} from 'lucide-react';
import { Farmer, CertificateType, IssuedCertificate } from '../types';

interface CertificatesDocumentsProps {
  farmers: Farmer[];
  userRole: 'admin' | 'user';
  userName: string;
}

const BARANGAY_AT_MAP: Record<string, string> = {
  'Poblacion': 'Melina S. Guerrero',
  'San Isidro': 'Melojane V. Aventura',
  'Santa Maria': 'Arnel O. Ramos',
  'Santo Tomas': 'Gina L. Delos Reyes',
  'Bagong Silang': 'Eduardo M. Santos',
  'San Jose': 'Patricia J. Aquino',
  'Murtha': 'Renato P. Cruz',
  'La Curva': 'Sylvia B. Custodio',
  'Camburay': 'Manuel G. Roxas',
  'Bubog': 'Rosario L. Diaz'
};

const getOrdinalSuffix = (day: number) => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1:  return "st";
    case 2:  return "nd";
    case 3:  return "rd";
    default: return "th";
  }
};

const convertFarmSizeToWords = (size: number): string => {
  const rounded = Math.round(size * 10) / 10;
  if (rounded === 0.5) return 'zero point five hectares (0.5 ha.)';
  if (rounded === 1) return 'one hectare (1 ha.)';
  if (rounded === 1.2) return 'one point two hectares (1.2 ha.)';
  if (rounded === 1.5) return 'one point five hectares (1.5 ha.)';
  if (rounded === 1.8) return 'one point eight hectares (1.8 ha.)';
  if (rounded === 2) return 'two hectares (2 ha.)';
  if (rounded === 2.5) return 'two point five hectares (2.5 ha.)';
  if (rounded === 3) return 'three hectares (3 ha.)';
  if (rounded === 3.4) return 'three point four hectares (3.4 ha.)';
  if (rounded === 4) return 'four hectares (4 ha.)';
  if (rounded === 4.5) return 'four point five hectares (4.5 ha.)';
  if (rounded === 5) return 'five hectares (5 ha.)';
  return `${size} hectare${size !== 1 ? 's' : ''} (${size} ha.)`;
};

const getFormattedDateWords = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      const today = new Date();
      const day = today.getDate();
      const suffix = getOrdinalSuffix(day);
      const month = today.toLocaleDateString('en-US', { month: 'long' });
      const year = today.getFullYear();
      return `${day}${suffix} day of ${month}, ${year}`;
    }
    const day = d.getDate();
    const suffix = getOrdinalSuffix(day);
    const month = d.toLocaleDateString('en-US', { month: 'long' });
    const year = d.getFullYear();
    return `${day}${suffix} day of ${month}, ${year}`;
  } catch (e) {
    return dateStr;
  }
};

export default function CertificatesDocuments({
  farmers,
  userRole,
  userName
}: CertificatesDocumentsProps) {
  const [certificates, setCertificates] = useState<IssuedCertificate[]>([]);
  const [certificateTypes, setCertificateTypes] = useState<CertificateType[]>([
    {
      id: "ct-1",
      title: "CERTIFICATION (Standard MAO)",
      description: "RSBSA, farm area, cropping season"
    },
    {
      id: "ct-2",
      title: "GOOD AGRICULTURAL PRACTICES (GAP)",
      description: "Verification of organic farming practices and standards"
    }
  ]);
  
  const [activeTab, setActiveTab] = useState<'generate' | 'logs'>(userRole === 'admin' ? 'logs' : 'generate');

  // Search and custom date filtering states for the ledger
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Selected certificate for preview modal
  const [selectedCert, setSelectedCert] = useState<IssuedCertificate | null>(null);

  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Generator states
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [selectedType, setSelectedType] = useState<CertificateType | null>(null);
  const [croppingSeason, setCroppingSeason] = useState('Dry Season 2025-2026');
  const [purpose, setPurpose] = useState('');
  const [orNo, setOrNo] = useState('');
  const [requestorName, setRequestorName] = useState('');
  const [requestorGender, setRequestorGender] = useState<'Male' | 'Female'>('Male');
  
  // Local filters for finding farmer in Step 1
  const [farmerSearch, setFarmerSearch] = useState('');
  const [farmerBarangayFilter, setFarmerBarangayFilter] = useState('');

  // Add certificate type modal
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newTypeTitle, setNewTypeTitle] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');
  const [isSavingType, setIsSavingType] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [printWithLetterhead, setPrintWithLetterhead] = useState(true);

  // Custom template state
  const [customTemplateImage, setCustomTemplateImage] = useState<string | null>(null);
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);

  // Fetch custom template background
  const fetchCustomTemplate = async () => {
    try {
      const res = await fetch('/api/certificates/template');
      if (res.ok) {
        const data = await res.json();
        if (data.image) {
          setCustomTemplateImage(data.image);
        }
      }
    } catch (err) {
      console.error("Error fetching custom template:", err);
    }
  };

  // Handle template image upload
  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Only image files are supported as certificate templates.');
      return;
    }

    setIsUploadingTemplate(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const res = await fetch('/api/certificates/template', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 })
        });
        if (res.ok) {
          setCustomTemplateImage(base64);
          showNotification('success', 'Custom certificate template uploaded and applied successfully.');
        } else {
          showNotification('error', 'Failed to save template on server.');
        }
      } catch (err) {
        showNotification('error', 'Network error. Upload failed.');
      } finally {
        setIsUploadingTemplate(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove custom template background
  const handleRemoveTemplate = async () => {
    if (!window.confirm('Are you sure you want to remove the custom certificate template?')) return;
    setIsUploadingTemplate(true);
    try {
      const res = await fetch('/api/certificates/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: null })
      });
      if (res.ok) {
        setCustomTemplateImage(null);
        showNotification('success', 'Custom certificate template removed.');
      } else {
        showNotification('error', 'Failed to remove template from server.');
      }
    } catch (err) {
      showNotification('error', 'Error removing template.');
    } finally {
      setIsUploadingTemplate(false);
    }
  };

  // Fetch issued certificates on mount
  const fetchCertificates = async () => {
    try {
      const res = await fetch('/api/certificates');
      if (res.ok) {
        const certsData = await res.json();
        setCertificates(certsData);
      }
    } catch (err) {
      console.error("Error fetching certificates logs:", err);
    }
  };

  // Fetch custom certificate types from db
  const fetchCertificateTypes = async () => {
    try {
      const res = await fetch('/api/certificate-types');
      if (res.ok) {
        const typesData = await res.json();
        if (typesData && typesData.length > 0) {
          setCertificateTypes(typesData);
          if (!selectedType) {
            setSelectedType(typesData[0]);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching certificate types:", err);
    }
  };

  useEffect(() => {
    fetchCertificates();
    fetchCertificateTypes();
    fetchCustomTemplate();
  }, []);

  // Pre-select first type on load if available
  useEffect(() => {
    if (certificateTypes.length > 0 && !selectedType) {
      setSelectedType(certificateTypes[0]);
    }
  }, [certificateTypes]);

  // Synchronize requestor details to selected farmer
  useEffect(() => {
    if (selectedFarmer) {
      setRequestorName(`${selectedFarmer.firstName} ${selectedFarmer.middleName ? selectedFarmer.middleName + ' ' : ''}${selectedFarmer.lastName}`);
      setRequestorGender(selectedFarmer.gender);
    } else {
      setRequestorName('');
      setRequestorGender('Male');
    }
  }, [selectedFarmer]);

  // Format YYYY-MM-DD input date to string matching stored date (e.g., "Jun 28, 2026")
  const formatDateToCompare = (dateString: string) => {
    if (!dateString) return '';
    try {
      const dateObj = new Date(dateString);
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  // Delete Certificate Record
  const handleDeleteCertificate = async (id: string, certNo: string) => {
    if (!window.confirm(`Are you sure you want to delete certificate ${certNo} from the system logs?`)) return;
    
    try {
      const res = await fetch(`/api/certificates/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setCertificates(prev => prev.filter(c => c.id !== id));
        showNotification('success', `Certificate record ${certNo} deleted successfully.`);
        if (selectedCert?.id === id) {
          setSelectedCert(null);
        }
      } else {
        showNotification('error', 'Failed to delete certificate record.');
      }
    } catch (err) {
      showNotification('error', 'Server error. Failed to delete.');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Add Certificate Type
  const handleAddCertificateType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeTitle.trim()) return;
    setIsSavingType(true);
    try {
      const res = await fetch('/api/certificate-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTypeTitle.trim(),
          description: newTypeDesc.trim()
        })
      });
      if (res.ok) {
        const savedType = await res.json();
        setCertificateTypes(prev => [...prev, savedType]);
        setSelectedType(savedType);
        setNewTypeTitle('');
        setNewTypeDesc('');
        setShowAddTypeModal(false);
        showNotification('success', 'Certification type added successfully.');
      } else {
        showNotification('error', 'Failed to add certification type.');
      }
    } catch (err) {
      showNotification('error', 'Failed to connect to the server.');
    } finally {
      setIsSavingType(false);
    }
  };

  // Record issued certificate and trigger preview print
  const handleRecordAndPrint = async () => {
    if (!selectedFarmer || !selectedType || !croppingSeason.trim() || !purpose.trim() || !orNo.trim()) {
      showNotification('error', 'Please complete all steps and required fields.');
      return;
    }

    setIsRecording(true);
    const liveCertNo = getLiveCertificateNo();

    const payload = {
      certNo: liveCertNo,
      farmerId: selectedFarmer.id,
      farmerName: `${selectedFarmer.lastName}, ${selectedFarmer.firstName}${selectedFarmer.middleName ? ' ' + selectedFarmer.middleName : ''}`.toUpperCase(),
      barangay: selectedFarmer.barangay,
      type: selectedType.title,
      croppingSeason: croppingSeason.trim(),
      orNo: orNo.trim(),
      purpose: purpose.trim(),
      issuedBy: userName || 'Ylyssa Dela Torre Cepriano',
      requestorName: requestorName.trim() || `${selectedFarmer.firstName} ${selectedFarmer.lastName}`,
      requestorGender: requestorGender
    };

    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedCert = await res.json();
        await fetchCertificates(); // Reload logs

        // Open beautiful Print Preview Modal directly with this certificate
        setSelectedCert(savedCert);

        // Reset generator fields
        setSelectedFarmer(null);
        setPurpose('');
        setOrNo('');

        showNotification('success', `Certificate ${liveCertNo} issued and recorded successfully!`);
      } else {
        showNotification('error', 'Failed to save certificate record on server.');
      }
    } catch (err) {
      showNotification('error', 'Server error. Failed to save certification.');
    } finally {
      setIsRecording(false);
    }
  };

  // Helper to determine prefix based on user section name
  const getSectionPrefix = (name: string): string => {
    const normalized = (name || '').toLowerCase();
    if (normalized.includes('crops')) return 'CRP';
    if (normalized.includes('hvcdp')) return 'HVC';
    if (normalized.includes('fisheries')) return 'FSH';
    if (normalized.includes('livestock')) return 'LVS';
    return 'S'; // Default standard prefix
  };

  // Filter issued certificates for ledger logs
  const filteredCerts = certificates.filter(c => {
    // Non-admin section users can only view their own generated certificates
    if (userRole !== 'admin' && c.issuedBy !== userName) {
      return false;
    }

    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      c.farmerName.toLowerCase().includes(term) ||
      c.certNo.toLowerCase().includes(term) ||
      c.barangay.toLowerCase().includes(term) ||
      (c.purpose || '').toLowerCase().includes(term) ||
      (c.type || '').toLowerCase().includes(term)
    );

    // Date comparison
    let matchesDate = true;
    if (filterDate) {
      const queryDateStr = formatDateToCompare(filterDate);
      matchesDate = c.dateIssued === queryDateStr;
    }

    return matchesSearch && matchesDate;
  });

  // Trigger print logic for the currently opened certificate modal
  const handlePrint = () => {
    window.print();
  };

  // Helper variables for modal display (associated farmer details)
  const linkedFarmer = selectedCert ? farmers.find(f => f.id === selectedCert.farmerId) : null;
  const farmSizeWords = linkedFarmer ? convertFarmSizeToWords(linkedFarmer.farmSize) : 'one hectare (1.0 ha.)';
  const cropType = linkedFarmer ? linkedFarmer.cropType : 'Rice';
  const rsbsaNo = linkedFarmer ? linkedFarmer.rsbsaNo : (selectedCert?.farmerId || '17-51-10-038-00056');
  const validatingAT = selectedCert ? (BARANGAY_AT_MAP[selectedCert.barangay] || 'Melojane V. Aventura') : '';

  // Modal gender and pronoun mappings
  const certFarmerGender = linkedFarmer?.gender || 'Male';
  const certIsFemale = certFarmerGender === 'Female';
  const certTitlePrefix = certIsFemale ? 'MS.' : 'MR.';
  const certSubjectPronoun = certIsFemale ? 'She' : 'He';
  
  // Modal requestor details (fallbacks for existing certificates with no saved requestor)
  const certRequestorName = selectedCert?.requestorName || (linkedFarmer ? `${linkedFarmer.firstName} ${linkedFarmer.lastName}` : 'ERMA A. AUSAN');
  const certRequestorGender = selectedCert?.requestorGender || certFarmerGender;
  const certRequestorIsFemale = certRequestorGender === 'Female';
  const certRequestorPrefix = certRequestorIsFemale ? 'MS.' : 'MR.';
  const certRequestorPossessive = certRequestorIsFemale ? 'her' : 'his';

  // Calculate dynamic sequential Certificate No
  const getLiveCertificateNo = () => {
    const today = new Date();
    const MM = String(today.getMonth() + 1).padStart(2, '0');
    const YYYY = today.getFullYear();
    const prefix = getSectionPrefix(userName);
    const suffix = `-${YYYY}-`;
    const countThisYear = certificates.filter(c => {
      const matchesYear = c.certNo && c.certNo.includes(suffix);
      const certPrefix = c.certNo ? c.certNo.split('-')[0] : '';
      const matchesPrefix = certPrefix === prefix;
      return matchesYear && matchesPrefix;
    }).length;
    const seq = String(countThisYear + 1).padStart(3, '0');
    return `${prefix}-${MM}-${YYYY}-${seq}`;
  };

  const activeLiveCertNo = getLiveCertificateNo();

  // Filtered farmers list for Step 1
  const filteredFarmersForStep1 = farmers.filter(f => {
    const term = farmerSearch.toLowerCase();
    const matchesSearch = (
      f.lastName.toLowerCase().includes(term) ||
      f.firstName.toLowerCase().includes(term) ||
      (f.middleName || '').toLowerCase().includes(term) ||
      f.rsbsaNo.toLowerCase().includes(term)
    );
    const matchesBarangay = !farmerBarangayFilter || f.barangay === farmerBarangayFilter;
    return matchesSearch && matchesBarangay;
  });

  const isFormValid = !!selectedFarmer && !!selectedType && !!croppingSeason.trim() && !!purpose.trim() && !!orNo.trim() && !!requestorName.trim();

  // Generator live preview values
  const previewFarmSizeWords = selectedFarmer ? convertFarmSizeToWords(selectedFarmer.farmSize) : '';
  const previewCropType = selectedFarmer ? selectedFarmer.cropType : '';
  const previewRsbsaNo = selectedFarmer ? selectedFarmer.rsbsaNo : '';
  const previewValidatingAT = selectedFarmer ? (BARANGAY_AT_MAP[selectedFarmer.barangay] || 'Melojane V. Aventura') : '';
  const previewDateWords = getFormattedDateWords(new Date().toLocaleDateString());

  // Live preview gender and pronoun mappings
  const previewFarmerGender = selectedFarmer?.gender || 'Male';
  const previewIsFemale = previewFarmerGender === 'Female';
  const previewTitlePrefix = previewIsFemale ? 'MS.' : 'MR.';
  const previewSubjectPronoun = previewIsFemale ? 'She' : 'He';

  // Live preview requestor details
  const previewRequestorNameStr = requestorName.trim() || (selectedFarmer ? `${selectedFarmer.firstName} ${selectedFarmer.lastName}` : '');
  const previewRequestorIsFemale = requestorGender === 'Female';
  const previewRequestorPrefix = previewRequestorIsFemale ? 'MS.' : 'MR.';
  const previewRequestorPossessive = previewRequestorIsFemale ? 'her' : 'his';

  return (
    <div className="space-y-6">
      {/* Dynamic Printing Style Tag - Ensures ONLY the certificate preview container prints with full colors and absolutely no clipping */}
      <style>{`
        @media print {
          @page {
            size: portrait;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
          }
          /* Strip out any max-height or scroll containers during printing */
          div, section, main, article, [role="dialog"] {
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            min-height: 0 !important;
          }
          body * {
            visibility: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-certificate-container, #printable-certificate-container * {
            visibility: visible !important;
          }
          #printable-certificate-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 100vh !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background-color: white !important;
            color: black !important;
            overflow: visible !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          ${!printWithLetterhead ? `
            .print-letterhead {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              height: 0 !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            #printable-certificate-container {
              padding-top: 2.2in !important; /* Elegant blank margin matching physical top letterhead */
              padding-bottom: 1.5in !important; /* Elegant blank margin matching physical bottom letterhead */
              padding-left: 1.2in !important;
              padding-right: 1.2in !important;
              justify-content: flex-start !important;
            }
          ` : ''}
        }
      `}</style>

      {/* Header */}
      <div className="border-b border-gray-100 pb-5 no-print flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight font-display flex items-center gap-2">
            Certificates
          </h1>
          <p className="text-sm text-gray-500">
            Generate, print, and track official MAO certifications
          </p>
        </div>
        
        {/* Add Certificate Type Button (Only for Section Users) */}
        {userRole !== 'admin' && (
          <button
            onClick={() => setShowAddTypeModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-bold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="h-4 w-4 text-indigo-600" />
            <span>Add Certificate Type</span>
          </button>
        )}
      </div>

      {/* Tabs Switcher - Visible only to regular Section Users */}
      {userRole !== 'admin' && (
        <div className="flex items-center gap-2 pb-2 no-print text-left">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold border transition-all cursor-pointer ${
              activeTab === 'generate'
                ? 'bg-white border-gray-200 text-gray-900 shadow-2xs font-bold'
                : 'bg-transparent border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Award className="h-4 w-4 text-indigo-600" />
            <span>Generate</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold border transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-white border-gray-200 text-gray-900 shadow-2xs font-bold'
                : 'bg-transparent border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileText className="h-4 w-4 text-emerald-600" />
            <span>Issued Log</span>
            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-slate-100 rounded-md font-mono text-gray-600 font-semibold">
              {certificates.filter(c => c.issuedBy === userName).length}
            </span>
          </button>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top duration-200 no-print ${
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

      {/* GENERATE TAB CONTENT */}
      {userRole !== 'admin' && activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start no-print">
          
          {/* Left Column: Form Steps (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* STEP 1 - SELECT FARMER */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-2xs space-y-3">
              <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest block">
                Step 1 — Select Farmer
              </span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or LGU ref..."
                    value={farmerSearch}
                    onChange={(e) => setFarmerSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white text-gray-900 font-medium"
                  />
                </div>

                <select
                  value={farmerBarangayFilter}
                  onChange={(e) => setFarmerBarangayFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white text-gray-700 font-semibold"
                >
                  <option value="">All Barangays</option>
                  {Object.keys(BARANGAY_AT_MAP).map(brgy => (
                    <option key={brgy} value={brgy}>{brgy}</option>
                  ))}
                </select>
              </div>

              {/* Scrollable list of matched farmers */}
              <div className="border border-gray-100 rounded-lg max-h-52 overflow-y-auto divide-y divide-gray-50 bg-slate-50/30">
                {filteredFarmersForStep1.length > 0 ? (
                  filteredFarmersForStep1.map(farmer => {
                    const fullName = `${farmer.lastName}, ${farmer.firstName}${farmer.middleName ? ' ' + farmer.middleName : ''}`.toUpperCase();
                    const isSelected = selectedFarmer?.id === farmer.id;
                    const atTechnologist = BARANGAY_AT_MAP[farmer.barangay] || 'N/A';

                    return (
                      <button
                        key={farmer.id}
                        type="button"
                        onClick={() => setSelectedFarmer(farmer)}
                        className={`w-full text-left p-3 flex flex-col transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50/90 border-l-4 border-indigo-600'
                            : 'hover:bg-gray-50/80 border-l-4 border-transparent'
                        }`}
                      >
                        <span className="text-xs font-bold text-gray-900 truncate">
                          {fullName}
                        </span>
                        <span className="text-[10px] text-gray-500 flex justify-between mt-0.5">
                          <span>{farmer.barangay} - {farmer.rsbsaNo || 'No Ref'}</span>
                        </span>
                        <span className="text-[9px] text-indigo-600 font-semibold mt-1">
                          AT: {atTechnologist}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-xs text-gray-400">
                    No farmers found matching query.
                  </div>
                )}
              </div>
            </div>

            {/* STEP 2 - CERTIFICATE TYPE */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-2xs space-y-3">
              <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest block">
                Step 2 — Certificate Type
              </span>

              <div className="space-y-2">
                {certificateTypes.map(type => {
                  const isSelected = selectedType?.id === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={`w-full text-left p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/40 shadow-xs'
                          : 'border-gray-200 hover:bg-gray-50/70 bg-white'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-950 uppercase truncate">
                          {type.title}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                          {type.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="h-4 w-4 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 3 - CERTIFICATE DETAILS */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-2xs space-y-4">
              <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest block">
                Step 3 — Certificate Details
              </span>

              {/* Certificate No */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">
                  Certificate No. <span className="text-[9px] text-indigo-600 normal-case font-semibold">(system-controlled)</span>
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={activeLiveCertNo}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-semibold font-mono"
                />
              </div>

              {/* Cropping Season */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">
                  Cropping Season *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dry Season 2025-2026"
                  value={croppingSeason}
                  onChange={(e) => setCroppingSeason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white text-gray-900 font-medium"
                />
              </div>

              {/* Requestor Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-1">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">
                    Requestor Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MR. GEORGE D. ROBLES"
                    value={requestorName}
                    onChange={(e) => setRequestorName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white text-gray-900 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">
                    Requestor Gender *
                  </label>
                  <div className="flex gap-1.5 h-8">
                    <button
                      type="button"
                      onClick={() => setRequestorGender('Male')}
                      className={`flex-1 text-center text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        requestorGender === 'Male'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                          : 'border-gray-200 hover:bg-gray-50 bg-white text-gray-600'
                      }`}
                    >
                      Male (MR / his)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestorGender('Female')}
                      className={`flex-1 text-center text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        requestorGender === 'Female'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                          : 'border-gray-200 hover:bg-gray-50 bg-white text-gray-600'
                      }`}
                    >
                      Female (MS / her)
                    </button>
                  </div>
                </div>
              </div>

              {/* Purpose */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">
                  Purpose *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. loan application with OMCB"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white text-gray-900 font-medium"
                />
              </div>

              {/* O.R. No */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">
                  O.R. No. *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OR-8726152"
                  value={orNo}
                  onChange={(e) => setOrNo(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white text-gray-900 font-mono font-medium"
                />
              </div>
            </div>

          </div>

          {/* Right Column: Visual Live Preview & Actions (7 cols) */}
          <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase">Certificate Preview</h3>
                <p className="text-[10px] text-gray-500">
                  {isFormValid ? "Ready to print and save" : "Complete all steps & required fields to print"}
                </p>
              </div>

              <button
                type="button"
                disabled={!isFormValid || isRecording}
                onClick={handleRecordAndPrint}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isRecording ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Recording...</span>
                  </>
                ) : (
                  <>
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print & Record</span>
                  </>
                )}
              </button>
            </div>



            {/* Physical Frame Preview */}
            {!isFormValid ? (
              <div className="border border-dashed border-gray-300 rounded-xl bg-gray-50/50 p-12 text-center text-gray-400 space-y-3">
                <FileText className="h-10 w-10 mx-auto text-gray-300" />
                <p className="text-sm font-semibold text-gray-700">Awaiting Information</p>
                <p className="text-xs max-w-xs mx-auto text-gray-400">
                  Select a practitioner from Step 1, verify the certificate type, and complete all required inputs to render the formal certificate layout.
                </p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl bg-gray-50 p-6 shadow-sm flex justify-center max-h-[85vh] overflow-y-auto">
                <div 
                  className="w-full max-w-[620px] bg-white text-gray-950 flex flex-col justify-between font-serif relative shadow-md overflow-hidden min-h-[920px] text-left border border-gray-200 transition-all duration-300"
                  style={
                    customTemplateImage
                      ? {
                          backgroundImage: `url(${customTemplateImage})`,
                          backgroundSize: '100% 100%',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                        }
                      : {}
                  }
                >
                  {/* 1. OFFICIAL LETTERHEAD HEADER */}
                  <div className={`w-full relative pt-10 pb-4 px-10 text-center select-none print-letterhead transition-all duration-300 ${
                    customTemplateImage ? 'bg-transparent' : 'bg-white'
                  } ${
                    !printWithLetterhead ? 'opacity-25 border-b border-dashed border-gray-250 bg-slate-50/50' : ''
                  }`}>
                    {!printWithLetterhead && (
                      <div className="absolute inset-0 bg-gray-50/5 backdrop-blur-[0.5px] flex items-center justify-center z-20 pointer-events-none no-print">
                        <span className="bg-slate-200/95 text-slate-700 text-[9px] font-bold px-2.5 py-1 rounded-full border border-slate-300 uppercase tracking-wider shadow-2xs">
                          Pre-printed Template Space (Hidden on Print)
                        </span>
                      </div>
                    )}
                    {/* Official Letterhead Curved Top Banner matching uploaded template */}
                    {!customTemplateImage && (
                      <div className="absolute top-0 inset-x-0 h-28 overflow-hidden pointer-events-none z-0 select-none">
                        <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="mao-header-green-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#ffffff" />
                              <stop offset="35%" stopColor="#a3e635" />
                              <stop offset="75%" stopColor="#22c55e" />
                              <stop offset="100%" stopColor="#15803d" />
                            </linearGradient>
                          </defs>
                          {/* Elegant sweep from top left (white) dipping down and covering top-right */}
                          <path d="M 0,0 L 1000,0 L 1000,90 C 850,55 600,60 0,10 Z" fill="url(#mao-header-green-gradient)" />
                          <path d="M 0,0 L 1000,0 L 1000,50 C 750,25 550,40 0,5 Z" fill="#ffffff" opacity="0.12" />
                        </svg>
                        {/* Smooth top bar overlay */}
                        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-lime-400 to-emerald-500 opacity-90" />
                      </div>
                    )}

                    {/* Header Items */}
                    {!customTemplateImage ? (
                      <div className="relative z-10 flex items-center justify-between gap-4">
                      {/* Left Seal: BAYAN NG SAN JOSE */}
                      <div className="shrink-0">
                        <svg className="w-16 h-16 drop-shadow-xs" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="46" fill="#1e3a8a" />
                          <circle cx="50" cy="50" r="43" fill="#ffffff" />
                          <circle cx="50" cy="50" r="39" fill="#16a34a" />
                          <circle cx="50" cy="50" r="36" fill="#fbbf24" />
                          <circle cx="50" cy="50" r="33" fill="#ffffff" />
                          <path d="M 33 50 C 33 42, 67 42, 67 50 C 67 58, 33 58, 33 50 Z" fill="#1d4ed8" opacity="0.85" />
                          <circle cx="50" cy="46" r="5" fill="#eab308" />
                          <path d="M 38 60 L 62 60 L 50 48 Z" fill="#15803d" />
                          <path d="M 50 63 Q 45 53, 47 48 Q 50 46, 53 48 Q 55 53, 50 63 Z" fill="#eab308" opacity="0.5" />
                          <defs>
                            <path id="pathTop-preview" d="M 17 50 A 33 33 0 1 1 83 50" />
                            <path id="pathBottom-preview" d="M 83 50 A 34 34 0 1 1 17 50" />
                          </defs>
                          <text className="font-sans font-extrabold text-[7.5px] fill-white" tracking-wider="true">
                            <textPath href="#pathTop-preview" startOffset="50%" textAnchor="middle">
                              BAYAN NG SAN JOSE
                            </textPath>
                          </text>
                          <text className="font-sans font-bold text-[6.5px] fill-white">
                            <textPath href="#pathBottom-preview" startOffset="50%" textAnchor="middle">
                              OCCIDENTAL MINDORO
                            </textPath>
                          </text>
                          <text x="13" y="52" fontSize="5" fill="white" fontWeight="bold" textAnchor="middle">★</text>
                          <text x="87" y="52" fontSize="5" fill="white" fontWeight="bold" textAnchor="middle">★</text>
                        </svg>
                      </div>

                      {/* Central Text Details */}
                      <div className="flex-1 text-center font-sans">
                        <p className="text-[10px] uppercase leading-tight text-gray-500 font-semibold tracking-wider">
                          Republic of the Philippines
                        </p>
                        <p className="text-[10px] uppercase leading-tight text-gray-500 font-semibold">
                          Province of Occidental Mindoro
                        </p>
                        <p className="text-[12px] font-extrabold uppercase tracking-wide text-gray-900 mt-0.5">
                          MUNICIPALITY OF SAN JOSE
                        </p>
                        <p className="text-sm font-black tracking-wide uppercase text-gray-950 mt-0.5">
                          MUNICIPAL AGRICULTURE OFFICE
                        </p>
                      </div>

                      {/* Right Seal: MUNICIPAL AGRICULTURE OFFICE */}
                      <div className="shrink-0">
                        <svg className="w-16 h-16 drop-shadow-xs" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="46" fill="#047857" />
                          <circle cx="50" cy="50" r="43" fill="#ffffff" />
                          <circle cx="50" cy="50" r="39" fill="#fbbf24" />
                          <circle cx="50" cy="50" r="36" fill="#1e3a8a" />
                          <circle cx="50" cy="50" r="33" fill="#ffffff" />
                          <path d="M 33 50 Q 50 39 67 50 Q 50 61 33 50 Z" fill="#10b981" />
                          <circle cx="50" cy="44" r="4.5" fill="#facc15" />
                          <path d="M 34 52 Q 50 63 66 52 L 66 64 Q 50 67 34 64 Z" fill="#1d4ed8" />
                          <path d="M 38 52 C 42 46, 46 54, 50 48 C 54 54, 58 46, 62 52" stroke="#eab308" strokeWidth="1" fill="none" />
                          <defs>
                            <path id="pathRightTop-preview" d="M 16 50 A 34 34 0 1 1 84 50" />
                            <path id="pathRightBottom-preview" d="M 84 50 A 34 34 0 1 1 16 50" />
                          </defs>
                          <text className="font-sans font-extrabold text-[6px] fill-white" tracking-wider="true">
                            <textPath href="#pathRightTop-preview" startOffset="50%" textAnchor="middle">
                              MUNICIPAL AGRICULTURE OFFICE
                            </textPath>
                          </text>
                          <text className="font-sans font-bold text-[5px] fill-white">
                            <textPath href="#pathRightBottom-preview" startOffset="50%" textAnchor="middle">
                              * San Jose, Occidental Mindoro *
                            </textPath>
                          </text>
                        </svg>
                      </div>
                    </div>
                    ) : (
                      customTemplateImage && <div className="h-16" />
                    )}

                    {/* Golden Yellow Dividing Accent Line */}
                    {!customTemplateImage && (
                      <div className="w-full h-1 bg-[#fbbf24] mt-3 rounded-full z-10 relative" />
                    )}
                  </div>

                  {/* 2. MAIN CERTIFICATE CONTENT AREA */}
                  <div className="px-14 py-2 flex-1 flex flex-col justify-center space-y-5">
                    {/* Title & Ref */}
                    <div className="text-center space-y-1 font-sans">
                      <h2 className="text-xl font-extrabold uppercase tracking-widest text-gray-900">
                        CERTIFICATION
                      </h2>
                      <p className="text-[10px] font-bold font-mono text-gray-700 tracking-wider">
                        {activeLiveCertNo}
                      </p>
                    </div>

                    {/* Body Text paragraphs */}
                    <div className="text-xs leading-relaxed space-y-5 text-justify font-serif text-gray-950">
                      <p className="font-bold font-sans tracking-wide mb-3 text-xs">
                        TO WHOM IT MAY CONCERN:
                      </p>
                      
                      <p className="indent-10">
                        This is to certify that <strong className="font-sans font-extrabold uppercase">{previewTitlePrefix} {`${selectedFarmer.firstName} ${selectedFarmer.middleName ? selectedFarmer.middleName + ' ' : ''}${selectedFarmer.lastName}`.toUpperCase()}</strong> a bonafide resident of Barangay <strong className="font-sans font-bold">{selectedFarmer.barangay}</strong>, San Jose, Occidental Mindoro and is cultivating a farm area of <strong className="font-sans font-bold">{previewFarmSizeWords}</strong> located at Barangay <strong className="font-sans font-bold">{selectedFarmer.barangay}</strong>, San Jose, Occidental Mindoro.
                      </p>

                      <p className="indent-10">
                        <strong className="font-sans font-extrabold">{previewSubjectPronoun}</strong> is duly registered in the Registry System for Basic Sectors in Agriculture (RSBSA) with Reference Number <strong className="font-mono font-bold">{previewRsbsaNo || 'N/A'}</strong>.
                      </p>

                      <p className="indent-10">
                        This also certifies that the aforementioned farm area is intended for <strong className="font-sans font-bold">{previewCropType.toLowerCase() === 'rice' ? 'Palay' : previewCropType}</strong> cultivation for this cropping season (<strong className="font-sans font-bold">{croppingSeason}</strong>)
                      </p>

                      <p className="indent-10">
                        Issued on this <strong className="font-sans font-bold">{previewDateWords}</strong>, upon the request <strong className="font-sans font-extrabold uppercase">{previewRequestorPrefix} {previewRequestorNameStr.toUpperCase()}</strong> that support of <strong className="font-sans font-semibold">{previewRequestorPossessive}</strong> <strong className="font-sans font-bold">{purpose}</strong>.
                      </p>
                    </div>

                    {/* Signatures stack on left */}
                    <div className="pt-4 space-y-5 font-sans max-w-xs text-left">
                      {/* AT Validation Signature */}
                      <div className="space-y-0.5">
                        <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">Validated by:</p>
                        <div className="pt-2">
                          <p className="text-xs font-bold uppercase underline underline-offset-4 decoration-gray-900 decoration-1 text-gray-900">
                            {previewValidatingAT}
                          </p>
                          <p className="text-[10px] text-gray-600 font-medium">Agricultural Technologist</p>
                          <p className="text-[9px] text-gray-400">Barangay {selectedFarmer.barangay}</p>
                        </div>
                      </div>

                      {/* MAO Noted Signature */}
                      <div className="space-y-0.5">
                        <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">Noted by:</p>
                        <div className="pt-2">
                          <p className="text-xs font-bold uppercase underline underline-offset-4 decoration-gray-900 decoration-1 text-gray-900">
                            ROMEL B. CALINGASAN
                          </p>
                          <p className="text-[10px] text-gray-600 font-medium">Municipal Agriculturist I</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. OFFICIAL LETTERHEAD FOOTER */}
                  <div className={`w-full relative mt-4 pt-4 pb-6 px-8 select-none print-letterhead transition-all duration-300 ${
                    customTemplateImage ? 'bg-transparent' : 'bg-white'
                  } ${
                    !printWithLetterhead ? 'opacity-25 border-t border-dashed border-gray-250 bg-slate-50/50' : ''
                  }`}>
                    {!printWithLetterhead && (
                      <div className="absolute inset-0 bg-gray-50/5 backdrop-blur-[0.5px] flex items-center justify-center z-20 pointer-events-none no-print">
                        <span className="bg-slate-200/95 text-slate-700 text-[9px] font-bold px-2.5 py-1 rounded-full border border-slate-300 uppercase tracking-wider shadow-2xs">
                          Pre-printed Template Space (Hidden on Print)
                        </span>
                      </div>
                    )}
                    {/* Official Letterhead Curved Bottom Banner matching uploaded template */}
                    {!customTemplateImage && (
                      <div className="absolute bottom-0 inset-x-0 h-24 overflow-hidden pointer-events-none z-0 select-none">
                        <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="mao-footer-green-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#15803d" />
                              <stop offset="30%" stopColor="#22c55e" />
                              <stop offset="65%" stopColor="#a3e635" />
                              <stop offset="100%" stopColor="#ffffff" />
                            </linearGradient>
                          </defs>
                          {/* Sweeping curve starting high on the left, dipping in the center, and fading to white/light on the right */}
                          <path d="M 0,40 C 250,75 750,55 1000,95 L 1000,100 L 0,100 Z" fill="url(#mao-footer-green-gradient)" />
                          <path d="M 0,65 C 300,85 700,75 1000,98 L 1000,100 L 0,100 Z" fill="#22c55e" opacity="0.15" />
                        </svg>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 via-lime-500 to-transparent opacity-90" />
                      </div>
                    )}

                    {/* Golden Yellow Dividing Line */}
                    {!customTemplateImage && (
                      <div className="w-full h-1 bg-[#fbbf24] mb-3 rounded-full z-10 relative" />
                    )}

                    {/* Bottom logos and text row */}
                    {!customTemplateImage ? (
                      <div className="relative z-10 flex items-center justify-between gap-3 font-sans">
                      {/* Left Side: Seals & Slogan */}
                      <div className="flex items-center gap-2">
                        {/* Bagong Pilipinas */}
                        <div className="shrink-0 flex flex-col items-center">
                          <svg className="w-8 h-8" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="46" fill="#1e3a8a" />
                            <circle cx="50" cy="50" r="42" fill="#ffffff" />
                            <circle cx="50" cy="50" r="38" fill="#ef4444" />
                            <path d="M 12 50 A 38 38 0 0 1 88 50 Z" fill="#1e40af" />
                            <circle cx="50" cy="50" r="10" fill="#facc15" />
                            <path d="M 50 18 L 50 32 M 50 68 L 50 82 M 18 50 L 32 50 M 68 50 L 82 50" stroke="#facc15" strokeWidth="3" />
                            <path d="M 28 28 L 38 38 M 62 62 L 72 72 M 28 72 L 38 62 M 62 28 L 72 38" stroke="#facc15" strokeWidth="3" />
                          </svg>
                          <span className="text-[4px] font-black text-blue-900 uppercase mt-0.5 leading-none">BAGONG PILIPINAS</span>
                        </div>

                        {/* Angat Kabuhayan */}
                        <div className="shrink-0 flex flex-col items-center">
                          <svg className="w-8 h-8" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="46" fill="#f59e0b" />
                            <circle cx="50" cy="50" r="42" fill="#ffffff" />
                            <circle cx="50" cy="50" r="38" fill="#16a34a" />
                            <path d="M 35 60 C 35 45, 45 40, 50 40 C 55 40, 65 45, 65 60" fill="#facc15" opacity="0.9" />
                            <circle cx="50" cy="32" r="6" fill="#ffffff" />
                            <path d="M 32 60 L 68 60" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                          </svg>
                          <span className="text-[4.5px] font-extrabold text-emerald-800 uppercase mt-0.5 leading-none">ANGAT KABUHAYAN</span>
                        </div>

                        {/* Slogan Text */}
                        <div className="text-left leading-tight pl-1.5 border-l border-gray-200">
                          <p className="text-[9px] font-bold italic text-emerald-800 font-serif leading-none">
                            Masaganang Agrikultura,
                          </p>
                          <p className="text-[9px] font-bold italic text-emerald-800 font-serif leading-none mt-0.5">
                            Maunlad na Ekonomiya
                          </p>
                        </div>
                      </div>

                      {/* Center Column: Contact Information */}
                      <div className="flex flex-col items-center gap-0.5 text-center text-gray-800">
                        {/* Email info */}
                        <div className="flex items-center gap-1">
                          <svg className="w-2.5 h-2.5 text-blue-800 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                          <span className="text-[8px] font-semibold text-gray-800">
                            lgu_mao_sjom@yahoo.com.ph
                          </span>
                        </div>

                        {/* Phone info */}
                        <div className="flex items-center gap-1">
                          <svg className="w-2.5 h-2.5 text-emerald-800 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.3 11.3 0 005.455 5.454l.774-1.548a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                          <span className="text-[8px] font-semibold text-gray-800">
                            0966-695-8003 / 0939-481-2395
                          </span>
                        </div>
                      </div>

                      {/* Right Column: Sa SAN JOSE ngat KA! */}
                      <div className="text-right flex items-center gap-2">
                        <div className="leading-none text-right">
                          <div className="flex items-end justify-end gap-0.5">
                            <div className="shrink-0 flex items-center mb-0.5">
                              <svg className="w-3 h-3 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 5c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z" />
                              </svg>
                            </div>
                            <div className="text-left">
                              <span className="text-[7.5px] font-extrabold text-amber-600 block uppercase tracking-tighter leading-none">Sa SAN JOSE</span>
                              <span className="text-[9px] font-black text-rose-600 block uppercase tracking-tighter leading-none">ngat KA!</span>
                            </div>
                          </div>
                          {/* Ancient Baybayin Characters */}
                          <div className="text-[6px] text-orange-700 font-mono font-bold tracking-wider mt-0.5 uppercase text-right opacity-80 leading-none">
                            ᜐ ᜎ ᜋ ᜆ᜔ ᜉᜓ
                          </div>
                        </div>
                      </div>
                    </div>
                    ) : (
                      customTemplateImage && <div className="h-10" />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ISSUED LOG TAB CONTENT FOR SECTION USERS */}
      {userRole !== 'admin' && activeTab === 'logs' && (
        <div className="space-y-4 no-print text-left">
          {/* Search bar & badge count */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, cert no, or barangay..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white text-gray-950 font-medium"
              />
            </div>
            
            <div className="flex items-center">
              <span className="px-2.5 py-1 text-xs font-bold text-gray-800 bg-slate-100 border border-gray-200 rounded-lg">
                {filteredCerts.length} certificates
              </span>
            </div>
          </div>

          {/* Simple Clean Table matching the image */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-4 font-semibold text-gray-600">Cert No.</th>
                    <th className="p-4 font-semibold text-gray-600">Farmer</th>
                    <th className="p-4 font-semibold text-gray-600">Barangay</th>
                    <th className="p-4 font-semibold text-gray-600">Type</th>
                    <th className="p-4 font-semibold text-gray-600">Purpose</th>
                    <th className="p-4 font-semibold text-gray-600">Date Issued</th>
                    <th className="p-4 font-semibold text-gray-600">Issued By</th>
                    <th className="p-4 text-center font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredCerts.length > 0 ? (
                    filteredCerts.map(c => (
                      <tr 
                        key={c.id} 
                        className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedCert(c)}
                      >
                        <td className="p-4 font-mono font-bold text-gray-700">{c.certNo}</td>
                        <td className="p-4 font-bold text-gray-900 uppercase">{c.farmerName}</td>
                        <td className="p-4 text-gray-600 font-medium">{c.barangay}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100/60 uppercase">
                            {c.type}
                          </span>
                        </td>
                        <td className="p-4 text-gray-600 max-w-[150px] truncate" title={c.purpose}>
                          {c.purpose}
                        </td>
                        <td className="p-4 text-gray-500 font-semibold">{c.dateIssued}</td>
                        <td className="p-4 text-gray-600 font-medium">{c.issuedBy}</td>
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedCert(c)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer inline-flex"
                              title="View and Download / Print"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCertificate(c.id, c.certNo)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer inline-flex"
                              title="Delete certificate log"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-xs text-gray-400 font-medium">
                        No issued certificates match your search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ISSUED LOG TAB CONTENT (Also default view for Admin) */}
      {userRole === 'admin' && (
        <>
          {/* Custom Template Upload & Settings Panel (Admin Only) */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-2xs space-y-3.5 no-print mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-3">
              <div>
                <h4 className="text-xs font-bold text-gray-950 uppercase flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-indigo-600" />
                  Certificate Design Template (Admin Settings)
                </h4>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {customTemplateImage 
                    ? "Active Background: Custom Uploaded Template image." 
                    : "Active Background: Default Vector Template."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="cert-template-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleTemplateUpload}
                  disabled={isUploadingTemplate}
                />
                <label
                  htmlFor="cert-template-upload"
                  className="inline-flex items-center gap-1.5 cursor-pointer rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition-all"
                >
                  {isUploadingTemplate ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Upload Template</span>
                    </>
                  )}
                </label>
                {customTemplateImage && (
                  <button
                    type="button"
                    onClick={handleRemoveTemplate}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove Template</span>
                  </button>
                )}
              </div>
            </div>

            {/* Print Visibility */}
            <div className="space-y-1 text-left">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Print Mode
              </span>
              <div className="flex gap-1 max-w-[320px]">
                <button
                  type="button"
                  onClick={() => setPrintWithLetterhead(true)}
                  className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-md border transition-all cursor-pointer ${
                    printWithLetterhead
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:bg-gray-50 bg-white text-gray-600'
                  }`}
                >
                  Plain Paper (Show Background)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintWithLetterhead(false)}
                  className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-md border transition-all cursor-pointer ${
                    !printWithLetterhead
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:bg-gray-50 bg-white text-gray-600'
                  }`}
                >
                  Pre-Printed (Hide BG)
                </button>
              </div>
            </div>

            {customTemplateImage && (
              <div className="text-xs text-indigo-600 font-semibold flex items-center gap-1.5 pt-1.5 border-t border-gray-100 text-left">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                <span>The uploaded custom template is active. Default letterhead styles, curved SVGs, and municipal seals are disabled.</span>
              </div>
            )}
          </div>

          {/* Filtering Options Box */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-2xs space-y-4 no-print">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              
              {/* Keyword Search (6 cols) */}
              <div className="md:col-span-6 space-y-1 text-left">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Search Practitioner
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, barangay, purpose, or certificate number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white text-gray-900 font-medium"
                  />
                </div>
              </div>

              {/* Date Query Filter (4 cols) */}
              <div className="md:col-span-4 space-y-1 text-left">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Filter by Date Issued</span>
                </label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white text-gray-900 font-semibold"
                />
              </div>

              {/* Clear Filters (2 cols) */}
              <div className="md:col-span-2">
                <button
                  onClick={() => { setSearchTerm(''); setFilterDate(''); }}
                  disabled={!searchTerm && !filterDate}
                  className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    searchTerm || filterDate
                      ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/50 cursor-pointer'
                      : 'bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed'
                  }`}
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Reset Filters</span>
                </button>
              </div>

            </div>
          </div>

          {/* Main logs Table */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden no-print">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/40">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Issued Certifications Ledger
              </span>
              <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/60 px-2.5 py-1 rounded-full shrink-0">
                {filteredCerts.length} record{filteredCerts.length !== 1 ? 's' : ''} found
              </span>
            </div>

            {/* Table layout */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-4">Cert No.</th>
                    <th className="p-4">Farmer</th>
                    <th className="p-4">Barangay</th>
                    <th className="p-4">Certification Type</th>
                    <th className="p-4">Cropping Season</th>
                    <th className="p-4">O.R. No.</th>
                    <th className="p-4">Purpose</th>
                    <th className="p-4">Date Issued</th>
                    <th className="p-4">Issued By</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredCerts.length > 0 ? (
                    filteredCerts.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50/50">
                        <td className="p-4 font-mono font-semibold text-gray-900">{c.certNo}</td>
                        <td className="p-4 font-bold text-gray-950 uppercase">{c.farmerName}</td>
                        <td className="p-4 text-gray-600">{c.barangay}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100/60 uppercase">
                            {c.type}
                          </span>
                        </td>
                        <td className="p-4 text-gray-600 font-semibold">{c.croppingSeason || 'N/A'}</td>
                        <td className="p-4 text-gray-700 font-mono font-bold">{c.orNo || 'N/A'}</td>
                        <td className="p-4 text-gray-600 font-medium max-w-[150px] truncate" title={c.purpose}>
                          {c.purpose}
                        </td>
                        <td className="p-4 text-gray-500 font-semibold">{c.dateIssued}</td>
                        <td className="p-4 text-gray-600 font-medium">{c.issuedBy}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* View & Download Button */}
                            <button
                              onClick={() => setSelectedCert(c)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer inline-flex"
                              title="View and Download / Print"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {/* Delete Button (Only Admin) */}
                            {userRole === 'admin' && (
                              <button
                                onClick={() => handleDeleteCertificate(c.id, c.certNo)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer inline-flex"
                                title="Delete certificate log"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-12 text-center text-xs text-gray-400">
                        No issued certificates match your search query or selected date.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* DYNAMIC NEW CERTIFICATE TYPE MODAL */}
      {showAddTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150 text-left">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-600" />
                <h3 className="text-xs font-bold text-gray-900 uppercase">Add Certificate Type</h3>
              </div>
              <button
                onClick={() => setShowAddTypeModal(false)}
                className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleAddCertificateType} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">
                  Certificate Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CERTIFICATE OF SEED ELIGIBILITY"
                  value={newTypeTitle}
                  onChange={(e) => setNewTypeTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white text-gray-900 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">
                  Description / Subtext
                </label>
                <input
                  type="text"
                  placeholder="e.g. Subsidy authorization, farm coordinates, or organic validation"
                  value={newTypeDesc}
                  onChange={(e) => setNewTypeDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white text-gray-900 font-medium"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTypeModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 border border-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingType}
                  className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs"
                >
                  {isSavingType ? 'Saving...' : 'Add Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT PREVIEW OVERLAY MODAL */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto no-print animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 my-8 animate-in zoom-in-95 duration-200 text-left">
            
            {/* Modal Header Controls */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileBadge className="h-5 w-5 text-indigo-600 shrink-0" />
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase">Document Print Preview</h3>
                  <p className="text-[9px] text-gray-500 font-mono">Certificate No: {selectedCert.certNo}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-500 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print / Download PDF</span>
                </button>
                <button
                  onClick={() => setSelectedCert(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Certificate Stage */}
            <div className="p-8 max-h-[70vh] overflow-y-auto bg-gray-100 flex justify-center">
              <div 
                id="printable-certificate-container"
                className="w-full max-w-[680px] bg-white text-gray-950 flex flex-col justify-between font-serif relative shadow-md overflow-hidden min-h-[920px] transition-all duration-300"
                style={
                  customTemplateImage
                    ? {
                        backgroundImage: `url(${customTemplateImage})`,
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                      }
                    : {}
                }
              >
                {/* 1. OFFICIAL LETTERHEAD HEADER */}
                <div className={`w-full relative pt-10 pb-4 px-10 text-center select-none print-letterhead transition-all duration-300 ${
                  customTemplateImage ? 'bg-transparent' : 'bg-white'
                } ${
                  !printWithLetterhead ? 'opacity-25 border-b border-dashed border-gray-250 bg-slate-50/50' : ''
                }`}>
                  {!printWithLetterhead && (
                    <div className="absolute inset-0 bg-gray-50/5 backdrop-blur-[0.5px] flex items-center justify-center z-20 pointer-events-none no-print">
                      <span className="bg-slate-200/95 text-slate-700 text-[9px] font-bold px-2.5 py-1 rounded-full border border-slate-300 uppercase tracking-wider shadow-2xs">
                        Pre-printed Template Space (Hidden on Print)
                      </span>
                    </div>
                  )}
                  {/* Official Letterhead Curved Top Banner matching uploaded template */}
                  {!customTemplateImage && (
                    <div className="absolute top-0 inset-x-0 h-28 overflow-hidden pointer-events-none z-0 select-none">
                      <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="mao-header-green-gradient-modal" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="35%" stopColor="#a3e635" />
                            <stop offset="75%" stopColor="#22c55e" />
                            <stop offset="100%" stopColor="#15803d" />
                          </linearGradient>
                        </defs>
                        {/* Elegant sweep from top left (white) dipping down and covering top-right */}
                        <path d="M 0,0 L 1000,0 L 1000,90 C 850,55 600,60 0,10 Z" fill="url(#mao-header-green-gradient-modal)" />
                        <path d="M 0,0 L 1000,0 L 1000,50 C 750,25 550,40 0,5 Z" fill="#ffffff" opacity="0.12" />
                      </svg>
                      {/* Smooth top bar overlay */}
                      <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-lime-400 to-emerald-500 opacity-90" />
                    </div>
                  )}

                  {/* Header Items */}
                  {!customTemplateImage ? (
                    <div className="relative z-10 flex items-center justify-between gap-4">
                    {/* Left Seal: BAYAN NG SAN JOSE */}
                    <div className="shrink-0">
                      <svg className="w-16 h-16 drop-shadow-xs" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="46" fill="#1e3a8a" />
                        <circle cx="50" cy="50" r="43" fill="#ffffff" />
                        <circle cx="50" cy="50" r="39" fill="#16a34a" />
                        <circle cx="50" cy="50" r="36" fill="#fbbf24" />
                        <circle cx="50" cy="50" r="33" fill="#ffffff" />
                        {/* Custom visual landscape of San Jose */}
                        <path d="M 33 50 C 33 42, 67 42, 67 50 C 67 58, 33 58, 33 50 Z" fill="#1d4ed8" opacity="0.85" />
                        <circle cx="50" cy="46" r="5" fill="#eab308" />
                        <path d="M 38 60 L 62 60 L 50 48 Z" fill="#15803d" />
                        <path d="M 50 63 Q 45 53, 47 48 Q 50 46, 53 48 Q 55 53, 50 63 Z" fill="#eab308" opacity="0.5" />
                        <defs>
                          <path id="pathTop" d="M 17 50 A 33 33 0 1 1 83 50" />
                          <path id="pathBottom" d="M 83 50 A 33 33 0 1 1 17 50" />
                        </defs>
                        <text className="font-sans font-extrabold text-[7.5px] fill-white" tracking-wider="true">
                          <textPath href="#pathTop" startOffset="50%" textAnchor="middle">
                            BAYAN NG SAN JOSE
                          </textPath>
                        </text>
                        <text className="font-sans font-bold text-[6.5px] fill-white">
                          <textPath href="#pathBottom" startOffset="50%" textAnchor="middle">
                            OCCIDENTAL MINDORO
                          </textPath>
                        </text>
                        <text x="13" y="52" fontSize="5" fill="white" fontWeight="bold" textAnchor="middle">★</text>
                        <text x="87" y="52" fontSize="5" fill="white" fontWeight="bold" textAnchor="middle">★</text>
                      </svg>
                    </div>

                    {/* Central Text Details */}
                    <div className="flex-1 text-center font-sans">
                      <p className="text-[10px] uppercase leading-tight text-gray-500 font-semibold tracking-wider">
                        Republic of the Philippines
                      </p>
                      <p className="text-[10px] uppercase leading-tight text-gray-500 font-semibold">
                        Province of Occidental Mindoro
                      </p>
                      <p className="text-[12px] font-extrabold uppercase tracking-wide text-gray-900 mt-0.5">
                        MUNICIPALITY OF SAN JOSE
                      </p>
                      <p className="text-sm font-black tracking-wide uppercase text-gray-950 mt-0.5">
                        MUNICIPAL AGRICULTURE OFFICE
                      </p>
                    </div>

                    {/* Right Seal: MUNICIPAL AGRICULTURE OFFICE */}
                    <div className="shrink-0">
                      <svg className="w-16 h-16 drop-shadow-xs" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="46" fill="#047857" />
                        <circle cx="50" cy="50" r="43" fill="#ffffff" />
                        <circle cx="50" cy="50" r="39" fill="#fbbf24" />
                        <circle cx="50" cy="50" r="36" fill="#1e3a8a" />
                        <circle cx="50" cy="50" r="33" fill="#ffffff" />
                        {/* Custom agriculture graphic */}
                        <path d="M 33 50 Q 50 39 67 50 Q 50 61 33 50 Z" fill="#10b981" />
                        <circle cx="50" cy="44" r="4.5" fill="#facc15" />
                        <path d="M 34 52 Q 50 63 66 52 L 66 64 Q 50 67 34 64 Z" fill="#1d4ed8" />
                        <path d="M 38 52 C 42 46, 46 54, 50 48 C 54 54, 58 46, 62 52" stroke="#eab308" strokeWidth="1" fill="none" />
                        <defs>
                          <path id="pathRightTop" d="M 16 50 A 34 34 0 1 1 84 50" />
                          <path id="pathRightBottom" d="M 84 50 A 34 34 0 1 1 16 50" />
                        </defs>
                        <text className="font-sans font-extrabold text-[6px] fill-white" tracking-wider="true">
                          <textPath href="#pathRightTop" startOffset="50%" textAnchor="middle">
                            MUNICIPAL AGRICULTURE OFFICE
                          </textPath>
                        </text>
                        <text className="font-sans font-bold text-[5px] fill-white">
                          <textPath href="#pathRightBottom" startOffset="50%" textAnchor="middle">
                            * San Jose, Occidental Mindoro *
                          </textPath>
                        </text>
                      </svg>
                    </div>
                  </div>
                  ) : (
                    customTemplateImage && <div className="h-16" />
                  )}

                  {/* Golden Yellow Dividing Accent Line */}
                  {!customTemplateImage && (
                    <div className="w-full h-1 bg-[#fbbf24] mt-3 rounded-full z-10 relative" />
                  )}
                </div>

                {/* 2. MAIN CERTIFICATE CONTENT AREA */}
                <div className="px-14 py-4 flex-1 flex flex-col justify-center space-y-6">
                  {/* Title & Ref */}
                  <div className="text-center space-y-1 font-sans">
                    <h2 className="text-xl font-extrabold uppercase tracking-widest text-gray-900">
                      CERTIFICATION
                    </h2>
                    <p className="text-[10px] font-bold font-mono text-gray-700 tracking-wider">
                      {selectedCert.certNo}
                    </p>
                  </div>

                  {/* Body Text paragraphs */}
                  <div className="text-xs leading-relaxed space-y-5 text-justify font-serif text-gray-950">
                    <p className="font-bold font-sans tracking-wide mb-3 text-xs">
                      TO WHOM IT MAY CONCERN:
                    </p>
                    
                    <p className="indent-10">
                      This is to certify that <strong className="font-sans font-extrabold uppercase">{certTitlePrefix} {selectedCert.farmerName}</strong> a bonafide resident of Barangay <strong className="font-sans font-bold">{selectedCert.barangay}</strong>, San Jose, Occidental Mindoro and is cultivating a farm area of <strong className="font-sans font-bold">{farmSizeWords}</strong> located at Barangay <strong className="font-sans font-bold">{selectedCert.barangay}</strong>, San Jose, Occidental Mindoro.
                    </p>

                    <p className="indent-10">
                      <strong className="font-sans font-extrabold">{certSubjectPronoun}</strong> is duly registered in the Registry System for Basic Sectors in Agriculture (RSBSA) with Reference Number <strong className="font-mono font-bold">{rsbsaNo}</strong>.
                    </p>

                    <p className="indent-10">
                      This also certifies that the aforementioned farm area is intended for <strong className="font-sans font-bold">{cropType.toLowerCase() === 'rice' ? 'Palay' : cropType}</strong> cultivation for this cropping season (<strong className="font-sans font-bold">{selectedCert.croppingSeason || 'Dry Season 2025-2026'}</strong>)
                    </p>

                    <p className="indent-10">
                      Issued on this <strong className="font-sans font-bold">{getFormattedDateWords(selectedCert.dateIssued)}</strong>, upon the request <strong className="font-sans font-extrabold uppercase">{certRequestorPrefix} {certRequestorName.toUpperCase()}</strong> that support of <strong className="font-sans font-semibold">{certRequestorPossessive}</strong> <strong className="font-sans font-bold">{selectedCert.purpose}</strong>.
                    </p>
                  </div>

                  {/* Signatures stack on left */}
                  <div className="pt-4 space-y-6 font-sans max-w-xs text-left">
                    {/* AT Validation Signature */}
                    <div className="space-y-0.5">
                      <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">Validated by:</p>
                      <div className="pt-3">
                        <p className="text-xs font-bold uppercase underline underline-offset-4 decoration-gray-900 decoration-1 text-gray-900">
                          {validatingAT}
                        </p>
                        <p className="text-[10px] text-gray-600 font-medium">Agricultural Technologist</p>
                        <p className="text-[9px] text-gray-400">Barangay {selectedCert.barangay}</p>
                      </div>
                    </div>

                    {/* MAO Noted Signature */}
                    <div className="space-y-0.5">
                      <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">Noted by:</p>
                      <div className="pt-3">
                        <p className="text-xs font-bold uppercase underline underline-offset-4 decoration-gray-900 decoration-1 text-gray-900">
                          ROMEL B. CALINGASAN
                        </p>
                        <p className="text-[10px] text-gray-600 font-medium">Municipal Agriculturist I</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. OFFICIAL LETTERHEAD FOOTER */}
                <div className={`w-full relative mt-4 pt-4 pb-6 px-8 select-none print-letterhead transition-all duration-300 ${
                  customTemplateImage ? 'bg-transparent' : 'bg-white'
                } ${
                  !printWithLetterhead ? 'opacity-25 border-t border-dashed border-gray-250 bg-slate-50/50' : ''
                }`}>
                  {!printWithLetterhead && (
                    <div className="absolute inset-0 bg-gray-50/5 backdrop-blur-[0.5px] flex items-center justify-center z-20 pointer-events-none no-print">
                      <span className="bg-slate-200/95 text-slate-700 text-[9px] font-bold px-2.5 py-1 rounded-full border border-slate-300 uppercase tracking-wider shadow-2xs">
                        Pre-printed Template Space (Hidden on Print)
                      </span>
                    </div>
                  )}
                  {/* Official Letterhead Curved Bottom Banner matching uploaded template */}
                  {!customTemplateImage && (
                    <div className="absolute bottom-0 inset-x-0 h-24 overflow-hidden pointer-events-none z-0 select-none">
                      <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="mao-footer-green-gradient-modal" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#15803d" />
                            <stop offset="30%" stopColor="#22c55e" />
                            <stop offset="65%" stopColor="#a3e635" />
                            <stop offset="100%" stopColor="#ffffff" />
                          </linearGradient>
                        </defs>
                        {/* Sweeping curve starting high on the left, dipping in the center, and fading to white/light on the right */}
                        <path d="M 0,40 C 250,75 750,55 1000,95 L 1000,100 L 0,100 Z" fill="url(#mao-footer-green-gradient-modal)" />
                        <path d="M 0,65 C 300,85 700,75 1000,98 L 1000,100 L 0,100 Z" fill="#22c55e" opacity="0.15" />
                      </svg>
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 via-lime-500 to-transparent opacity-90" />
                    </div>
                  )}

                  {/* Golden Yellow Dividing Line */}
                  {!customTemplateImage && (
                    <div className="w-full h-1 bg-[#fbbf24] mb-3 rounded-full z-10 relative" />
                  )}

                  {/* Bottom logos and text row */}
                  {!customTemplateImage ? (
                    <div className="relative z-10 flex items-center justify-between gap-3 font-sans">
                    {/* Left Side: Seals & Slogan */}
                    <div className="flex items-center gap-2">
                      {/* Bagong Pilipinas */}
                      <div className="shrink-0 flex flex-col items-center">
                        <svg className="w-8 h-8" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="46" fill="#1e3a8a" />
                          <circle cx="50" cy="50" r="42" fill="#ffffff" />
                          <circle cx="50" cy="50" r="38" fill="#ef4444" />
                          <path d="M 12 50 A 38 38 0 0 1 88 50 Z" fill="#1e40af" />
                          <circle cx="50" cy="50" r="10" fill="#facc15" />
                          <path d="M 50 18 L 50 32 M 50 68 L 50 82 M 18 50 L 32 50 M 68 50 L 82 50" stroke="#facc15" strokeWidth="3" />
                          <path d="M 28 28 L 38 38 M 62 62 L 72 72 M 28 72 L 38 62 M 62 28 L 72 38" stroke="#facc15" strokeWidth="3" />
                        </svg>
                        <span className="text-[4px] font-black text-blue-900 uppercase mt-0.5 leading-none">BAGONG PILIPINAS</span>
                      </div>

                      {/* Angat Kabuhayan */}
                      <div className="shrink-0 flex flex-col items-center">
                        <svg className="w-8 h-8" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="46" fill="#f59e0b" />
                          <circle cx="50" cy="50" r="42" fill="#ffffff" />
                          <circle cx="50" cy="50" r="38" fill="#16a34a" />
                          <path d="M 35 60 C 35 45, 45 40, 50 40 C 55 40, 65 45, 65 60" fill="#facc15" opacity="0.9" />
                          <circle cx="50" cy="32" r="6" fill="#ffffff" />
                          <path d="M 32 60 L 68 60" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                        </svg>
                        <span className="text-[4.5px] font-extrabold text-emerald-800 uppercase mt-0.5 leading-none">ANGAT KABUHAYAN</span>
                      </div>

                      {/* Slogan Text */}
                      <div className="text-left leading-tight pl-1.5 border-l border-gray-200">
                        <p className="text-[9px] font-bold italic text-emerald-800 font-serif leading-none">
                          Masaganang Agrikultura,
                        </p>
                        <p className="text-[9px] font-bold italic text-emerald-800 font-serif leading-none mt-0.5">
                          Maunlad na Ekonomiya
                        </p>
                      </div>
                    </div>

                    {/* Center Column: Contact Information */}
                    <div className="flex flex-col items-center gap-1 text-center text-gray-800">
                      {/* Email info */}
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-blue-800 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        <span className="text-[8.5px] font-semibold text-gray-800">
                          lgu_mao_sjom@yahoo.com.ph
                        </span>
                      </div>

                      {/* Phone info */}
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-emerald-800 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.3 11.3 0 005.455 5.454l.774-1.548a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        <span className="text-[8.5px] font-semibold text-gray-800">
                          0966-695-8003 / 0939-481-2395
                        </span>
                      </div>
                    </div>

                    {/* Right Column: Sa SAN JOSE ngat KA! */}
                    <div className="text-right flex items-center gap-2">
                      <div className="leading-none text-right">
                        <div className="flex items-end justify-end gap-0.5">
                          <div className="shrink-0 flex items-center mb-0.5">
                            <svg className="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 5c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z" />
                            </svg>
                          </div>
                          <div className="text-left">
                            <span className="text-[7.5px] font-extrabold text-amber-600 block uppercase tracking-tighter leading-none">Sa SAN JOSE</span>
                            <span className="text-[9px] font-black text-rose-600 block uppercase tracking-tighter leading-none">ngat KA!</span>
                          </div>
                        </div>
                        {/* Ancient Baybayin Characters */}
                        <div className="text-[6px] text-orange-700 font-mono font-bold tracking-wider mt-0.5 uppercase text-right opacity-80 leading-none">
                          ᜐ ᜎ ᜋ ᜆ᜔ ᜉᜓ
                        </div>
                      </div>
                    </div>
                  </div>
                  ) : (
                    customTemplateImage && <div className="h-10" />
                  )}
                </div>

              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setSelectedCert(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-150 border border-gray-200 rounded-lg cursor-pointer"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                <span>Print Certificate</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
