export interface FarmerFile {
  id: string;
  name: string;
  type: string;
  size: string;
  dataUrl?: string;
  uploadedAt: string;
}

export interface Farmer {
  id: string;
  rsbsaNo: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: 'Male' | 'Female';
  dob: string;
  contact: string;
  barangay: string;
  cropType: 'Rice' | 'Corn' | 'Coconut' | 'Vegetable' | 'High-Value Crops' | 'Livestock' | 'Fishery';
  farmSize: number; // in hectares
  status: 'Active' | 'Inactive';
  files?: FarmerFile[];
  createdAt: string;
}

export interface CooperativeFile {
  id: string;
  name: string;
  type: string;
  size: string;
  dataUrl?: string;
  uploadedAt: string;
}

export interface Cooperative {
  id: string;
  name: string;
  chairperson: string;
  contact: string;
  barangay: string;
  memberCount: number;
  regStatus: 'CDA Registered' | 'SEC Registered' | 'DOLE Registered' | 'Unregistered';
  status: 'Active' | 'Inactive';
  files?: CooperativeFile[];
  createdAt: string;
}

export interface AgriculturalProgram {
  id: string;
  title: string;
  description: string;
  budget: number;
  inputProvided: string;
  startDate: string;
  endDate: string;
  status: 'Upcoming' | 'Active' | 'Completed';
  createdAt: string;
}

export interface DistributionRecord {
  id: string;
  programId: string;
  programTitle: string;
  farmerId: string;
  farmerName: string;
  farmerBarangay: string;
  quantityReceived: string;
  distributedAt: string;
  notes?: string;
}

export interface ArchivalDocument {
  id: string;
  title: string;
  description: string;
  category: 'Policy/Ordinance' | 'Annual Report' | 'Distribution List' | 'Memo/Circular' | 'Farmer Survey';
  tags: string[];
  summary: string[]; // 3-bullet summaries
  fileSize: string;
  uploadedAt: string;
  content?: string;
  name?: string;
  // Google Drive features
  type?: 'file' | 'folder';
  parentId?: string | null;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
  avatar?: string;
  username?: string;
}

export interface BarangayStats {
  name: string;
  totalFarmers: number;
  totalFarmArea: number; // in hectares
  primaryCrop: string;
  totalCoops: number;
}

export interface DistributionBatch {
  id: string;
  programId: string;
  programTitle: string;
  inputProvided: string;
  recipients: {
    farmerId: string;
    farmerName: string;
    rsbsaNo: string;
    barangay: string;
    cropType: string;
    farmSize: number;
    allocatedQuantity: string;
  }[];
  totalRecipients: number;
  criteriaDescription: string;
  generatedAt: string;
}

export interface PPMPItem {
  id: string;
  code: string;
  generalDescription: string;
  quantity: number;
  unit: string;
  estimatedBudget: number;
  modeOfProcurement: 'Public Bidding' | 'SVP' | 'Agency-to-Agency' | 'Direct Contracting' | 'Shopping';
  schedule: { [month: string]: boolean };
}

export interface PPMP {
  id: string;
  year: number;
  title: string;
  department: string;
  items: PPMPItem[];
  totalBudget: number;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Revision Required';
  createdAt: string;
  deadline?: string;
}

export interface CertificateType {
  id: string;
  title: string;
  description: string;
}

export interface IssuedCertificate {
  id: string;
  certNo: string;
  farmerId: string;
  farmerName: string;
  barangay: string;
  type: string;
  purpose: string;
  dateIssued: string;
  issuedBy: string;
  croppingSeason?: string;
  orNo?: string;
  requestorName?: string;
  requestorGender?: string;
}

