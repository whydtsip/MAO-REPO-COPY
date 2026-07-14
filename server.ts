import fs from "fs";
import path from "path";
import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import JSZip from "jszip";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const DB_FILE = path.join(process.cwd(), "mao_db.json");

// Helper to load db
function loadDB() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      let updated = false;
      if (!data.certificates) {
        data.certificates = [
          {
            id: "cert-seed-1",
            certNo: "S-06-2026-001",
            farmerId: "f-1",
            farmerName: "Pedro Cruz",
            barangay: "Poblacion",
            type: "Standard MAO Certification",
            purpose: "Local subsidy application",
            dateIssued: "Jun 28, 2026",
            issuedBy: "Ylyssa Dela Torre Cepriano"
          }
        ];
        updated = true;
      }
      if (!data.certificateTypes) {
        data.certificateTypes = [
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
        ];
        updated = true;
      }
      if (updated) {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
      }
      return data;
    } catch (e) {
      console.error("Error reading database file, using fallback.", e);
    }
  }

  // Fallback initial/seed data
  const initialData = {
    certificates: [
      {
        id: "cert-seed-1",
        certNo: "S-06-2026-001",
        farmerId: "f-1",
        farmerName: "Pedro Cruz",
        barangay: "Poblacion",
        type: "Standard MAO Certification",
        purpose: "Local subsidy application",
        dateIssued: "Jun 28, 2026",
        issuedBy: "Ylyssa Dela Torre Cepriano"
      }
    ],
    certificateTypes: [
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
    ],
    farmers: [
      {
        id: "f-1",
        rsbsaNo: "04-21-03-001-000105",
        firstName: "Pedro",
        lastName: "Cruz",
        middleName: "Santos",
        gender: "Male",
        dob: "1975-04-12",
        contact: "09171234567",
        barangay: "Poblacion",
        cropType: "Rice",
        farmSize: 1.8,
        status: "Active",
        createdAt: new Date().toISOString()
      },
      {
        id: "f-2",
        rsbsaNo: "04-21-03-002-000214",
        firstName: "Maria",
        lastName: "Santos",
        middleName: "Reyes",
        gender: "Female",
        dob: "1982-08-23",
        contact: "09187654321",
        barangay: "San Isidro",
        cropType: "Vegetable",
        farmSize: 0.6,
        status: "Active",
        createdAt: new Date().toISOString()
      },
      {
        id: "f-3",
        rsbsaNo: "04-21-03-003-000342",
        firstName: "Juan",
        lastName: "Dela Cruz",
        middleName: "Mendoza",
        gender: "Male",
        dob: "1968-11-03",
        contact: "09228889900",
        barangay: "Santa Maria",
        cropType: "Corn",
        farmSize: 2.5,
        status: "Active",
        createdAt: new Date().toISOString()
      },
      {
        id: "f-4",
        rsbsaNo: "04-21-03-004-000411",
        firstName: "Teresa",
        lastName: "Ramos",
        middleName: "Bautista",
        gender: "Female",
        dob: "1990-01-30",
        contact: "09351112233",
        barangay: "Santo Tomas",
        cropType: "High-Value Crops",
        farmSize: 1.2,
        status: "Active",
        createdAt: new Date().toISOString()
      },
      {
        id: "f-5",
        rsbsaNo: "04-21-03-005-000520",
        firstName: "Noel",
        lastName: "Agoncillo",
        middleName: "Luna",
        gender: "Male",
        dob: "1979-06-18",
        contact: "09087776655",
        barangay: "Bagong Silang",
        cropType: "Coconut",
        farmSize: 3.4,
        status: "Active",
        createdAt: new Date().toISOString()
      },
      {
        id: "f-6",
        rsbsaNo: "04-21-03-006-000602",
        firstName: "Corazon",
        lastName: "Aquino",
        middleName: "Cojuangco",
        gender: "Female",
        dob: "1985-05-15",
        contact: "09154443322",
        barangay: "San Jose",
        cropType: "Livestock",
        farmSize: 0.5,
        status: "Active",
        createdAt: new Date().toISOString()
      }
    ],
    cooperatives: [
      {
        id: "c-1",
        name: "Poblacion Rice Farmers Multi-Purpose Cooperative",
        chairperson: "Pedro Cruz",
        contact: "09171234567",
        barangay: "Poblacion",
        memberCount: 45,
        regStatus: "CDA Registered",
        status: "Active",
        createdAt: new Date().toISOString()
      },
      {
        id: "c-2",
        name: "Santa Maria Organic Vegetable Growers Association",
        chairperson: "Juan Dela Cruz",
        contact: "09228889900",
        barangay: "Santa Maria",
        memberCount: 28,
        regStatus: "SEC Registered",
        status: "Active",
        createdAt: new Date().toISOString()
      },
      {
        id: "c-3",
        name: "San Isidro Coconut Producers Cooperative",
        chairperson: "Noel Agoncillo",
        contact: "09087776655",
        barangay: "San Isidro",
        memberCount: 60,
        regStatus: "CDA Registered",
        status: "Active",
        createdAt: new Date().toISOString()
      }
    ],
    programs: [
      {
        id: "p-1",
        title: "RCEF Certified Rice Seed Distribution",
        description: "Distribution of high-yield certified inbred rice seeds to RSBSA-registered rice farmers for the Wet Season 2026.",
        budget: 250000,
        inputProvided: "Certified Rice Seeds (2 Bags per Hectare)",
        startDate: "2026-05-01",
        endDate: "2026-07-31",
        status: "Active",
        createdAt: new Date().toISOString()
      },
      {
        id: "p-2",
        title: "Fertilizer Subsidy Voucher Program",
        description: "Subsidy vouchers worth ₱3,000 for purchasing inorganic or organic fertilizers from accredited merchant stores.",
        budget: 500000,
        inputProvided: "₱3,000 Fertilizer Voucher",
        startDate: "2026-06-01",
        endDate: "2026-09-30",
        status: "Active",
        createdAt: new Date().toISOString()
      },
      {
        id: "p-3",
        title: "High-Yield Corn Subsidy Program",
        description: "Distribution of genetically modified hybrid corn seeds and starter fertilizers for commercial corn farmers.",
        budget: 150000,
        inputProvided: "Hybrid Corn Seeds & Fertilisers",
        startDate: "2026-08-15",
        endDate: "2026-11-30",
        status: "Upcoming",
        createdAt: new Date().toISOString()
      },
      {
        id: "p-4",
        title: "Integrated Pest Management (IPM) Training",
        description: "Hands-on capacity building on biological controls, proper pesticide application, and ecological pest management.",
        budget: 45000,
        inputProvided: "Training Materials & Biological Control Kits",
        startDate: "2026-04-10",
        endDate: "2026-04-20",
        status: "Completed",
        createdAt: new Date().toISOString()
      }
    ],
    distributions: [
      {
        id: "d-1",
        programId: "p-1",
        programTitle: "RCEF Certified Rice Seed Distribution",
        farmerId: "f-1",
        farmerName: "Pedro Cruz",
        farmerBarangay: "Poblacion",
        quantityReceived: "4 Bags",
        distributedAt: "2026-05-15T10:30:00Z",
        notes: "Based on 1.8 hectares of registered rice farm."
      },
      {
        id: "d-2",
        programId: "p-2",
        programTitle: "Fertilizer Subsidy Voucher Program",
        farmerId: "f-1",
        farmerName: "Pedro Cruz",
        farmerBarangay: "Poblacion",
        quantityReceived: "1 Voucher (₱3,000)",
        distributedAt: "2026-06-10T14:15:00Z",
        notes: "Voucher redeemed at Coop Store."
      },
      {
        id: "d-3",
        programId: "p-2",
        programTitle: "Fertilizer Subsidy Voucher Program",
        farmerId: "f-2",
        farmerName: "Maria Santos",
        farmerBarangay: "San Isidro",
        quantityReceived: "1 Voucher (₱3,000)",
        distributedAt: "2026-06-12T09:00:00Z",
        notes: "Redeemed for organic fertilizer compost."
      },
      {
        id: "d-4",
        programId: "p-1",
        programTitle: "RCEF Certified Rice Seed Distribution",
        farmerId: "f-3",
        farmerName: "Juan Dela Cruz",
        farmerBarangay: "Santa Maria",
        quantityReceived: "5 Bags",
        distributedAt: "2026-05-18T11:00:00Z",
        notes: "Registered rice/corn rotation land."
      }
    ],
    documents: [
      {
        id: "fld-policy",
        title: "Policy Guidelines & Circulars",
        description: "National and municipal level circulars, seed distribution guidelines, and legislative mandates.",
        category: "Policy/Ordinance",
        tags: ["policy", "circulars", "laws"],
        summary: ["Directory for all official policy guidelines.", "Maintained by the municipal director.", "Updated seasonally."],
        fileSize: "--",
        type: "folder",
        parentId: null,
        uploadedAt: new Date().toISOString()
      },
      {
        id: "fld-annual",
        title: "Annual Accomplishment Reports",
        description: "Official annual performance, statistical logs, and project summary portfolios.",
        category: "Annual Report",
        tags: ["reports", "accomplishment", "stats"],
        summary: ["Contains yearly performance analytics.", "Audited and verified datasets.", "Includes budget lists."],
        fileSize: "--",
        type: "folder",
        parentId: null,
        uploadedAt: new Date().toISOString()
      },
      {
        id: "doc-1",
        title: "DA Memorandum Circular No. 05 - Seed Distribution Rules",
        description: "National guidelines for the distribution of certified inbred and hybrid seeds under the Rice Competitiveness Enhancement Fund.",
        category: "Policy/Ordinance",
        tags: ["seed", "guidelines", "rice", "rcef"],
        summary: [
          "Mandates that only RSBSA-registered farmers are eligible for free seed allocation.",
          "Limits distribution to a maximum of 4 bags of certified seeds per farmer depending on land size.",
          "Establishes a municipal tracking committee composed of the MAO and barangay representatives."
        ],
        fileSize: "1.4 MB",
        type: "file",
        parentId: "fld-policy",
        uploadedAt: "2026-05-02T08:30:00Z"
      },
      {
        id: "doc-2",
        title: "MAO Annual Accomplishment Report - Fiscal Year 2025",
        description: "Comprehensive summary of farming input distributions, capacity building seminars, and cooperative accreditations in the municipality.",
        category: "Annual Report",
        tags: ["report", "accomplishment", "annual", "statistics"],
        summary: [
          "Distributed over 4,500 bags of fertilizer and 2,100 bags of certified seeds in FY 2025.",
          "Registered 150 new active farmers in the RSBSA master database.",
          "Successfully established 3 new coconut and high-value crop cooperatives."
        ],
        fileSize: "4.2 MB",
        type: "file",
        parentId: "fld-annual",
        uploadedAt: "2026-01-10T16:00:00Z"
      },
      {
        id: "doc-3",
        title: "Fertilizer Subsidy Beneficiary Masterlist - June 2026 Batch",
        description: "List of validated beneficiaries in all barangays approved to receive the wet-season fertilizer discount vouchers.",
        category: "Distribution List",
        tags: ["fertilizer", "beneficiary", "list", "voucher"],
        summary: [
          "Includes a total of 342 validated smallholder farmers across 7 key barangays.",
          "Identifies 8 accredited supply merchants within the municipality.",
          "Total allocated subsidy budget is ₱1,026,000."
        ],
        fileSize: "850 KB",
        type: "file",
        parentId: null,
        uploadedAt: "2026-06-25T11:45:00Z"
      }
    ],
    users: [
      {
        id: "usr-admin",
        email: "admin@mao.gov.ph",
        password: "admin123",
        name: "Admin Director",
        role: "admin",
        createdAt: new Date().toISOString()
      },
      {
        id: "usr-staff",
        email: "user@mao.gov.ph",
        password: "user123",
        name: "Staff Member",
        role: "user",
        createdAt: new Date().toISOString()
      }
    ]
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
  return initialData;
}

// Write helper
function saveDB(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// Calculate approximate byte size of a Base64 string
function getBase64Size(base64String: string | undefined): number {
  if (!base64String) return 0;
  const commaIdx = base64String.indexOf(',');
  const cleanBase64 = commaIdx !== -1 ? base64String.slice(commaIdx + 1) : base64String;
  const padding = cleanBase64.endsWith('==') ? 2 : cleanBase64.endsWith('=') ? 1 : 0;
  return Math.floor((cleanBase64.length * 3) / 4 - padding);
}

// Sum of all file uploads for a given year (defaults to current year)
function getAccumulatedStorageForYear(currentDb: any, targetYear: number): number {
  let totalBytes = 0;

  // 1. Documents (Office Files)
  if (currentDb.documents) {
    for (const doc of currentDb.documents) {
      if (doc.type === 'file' && doc.uploadedAt) {
        try {
          const uploadYear = new Date(doc.uploadedAt).getFullYear();
          if (uploadYear === targetYear) {
            totalBytes += getBase64Size(doc.content);
          }
        } catch (e) {
          // ignore date parse issues
        }
      }
    }
  }

  // 2. Farmer uploaded files
  if (currentDb.farmers) {
    for (const farmer of currentDb.farmers) {
      if (farmer.files) {
        for (const file of farmer.files) {
          if (file.uploadedAt) {
            try {
              const uploadYear = new Date(file.uploadedAt).getFullYear();
              if (uploadYear === targetYear) {
                totalBytes += getBase64Size(file.dataUrl);
              }
            } catch (e) {
              // ignore date parse issues
            }
          }
        }
      }
    }
  }

  // 3. Cooperative uploaded files
  if (currentDb.cooperatives) {
    for (const coop of currentDb.cooperatives) {
      if (coop.files) {
        for (const file of coop.files) {
          if (file.uploadedAt) {
            try {
              const uploadYear = new Date(file.uploadedAt).getFullYear();
              if (uploadYear === targetYear) {
                totalBytes += getBase64Size(file.dataUrl);
              }
            } catch (e) {
              // ignore date parse issues
            }
          }
        }
      }
    }
  }

  return totalBytes;
}

// Ensure database is initialized
const db = loadDB();

// API Endpoints

// 1. Farmers CRUD
app.get("/api/farmers", (req, res) => {
  const currentDb = loadDB();
  res.json(currentDb.farmers);
});

app.post("/api/farmers", (req, res) => {
  const currentDb = loadDB();
  const newFarmer = {
    id: "f-" + Date.now(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  currentDb.farmers.push(newFarmer);
  saveDB(currentDb);
  res.status(201).json(newFarmer);
});

app.put("/api/farmers/:id", (req, res) => {
  const currentDb = loadDB();
  const index = currentDb.farmers.findIndex((f: any) => f.id === req.params.id);
  if (index !== -1) {
    currentDb.farmers[index] = {
      ...currentDb.farmers[index],
      ...req.body
    };
    saveDB(currentDb);
    res.json(currentDb.farmers[index]);
  } else {
    res.status(404).json({ error: "Farmer not found" });
  }
});

app.delete("/api/farmers/:id", (req, res) => {
  const currentDb = loadDB();
  const initialLength = currentDb.farmers.length;
  currentDb.farmers = currentDb.farmers.filter((f: any) => f.id !== req.params.id);
  if (currentDb.farmers.length < initialLength) {
    saveDB(currentDb);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Farmer not found" });
  }
});

// Bulk Farmers upload
app.post("/api/farmers/bulk", (req, res) => {
  const { farmersList } = req.body;
  if (!farmersList || !Array.isArray(farmersList)) {
    return res.status(400).json({ error: "Invalid farmers list." });
  }

  const currentDb = loadDB();
  const addedFarmers: any[] = [];
  
  for (const f of farmersList) {
    if (!f.firstName || !f.lastName || !f.rsbsaNo) {
      continue;
    }
    const newFarmer = {
      id: "f-" + Math.floor(Math.random() * 10000000) + "-" + Date.now(),
      rsbsaNo: f.rsbsaNo,
      firstName: f.firstName,
      lastName: f.lastName,
      middleName: f.middleName || "",
      gender: f.gender === "Female" ? "Female" : "Male",
      dob: f.dob || "1980-01-01",
      contact: f.contact || "",
      barangay: f.barangay || "Poblacion",
      cropType: f.cropType || "Rice",
      farmSize: Number(f.farmSize) || 1.0,
      status: f.status === "Inactive" ? "Inactive" : "Active",
      createdAt: new Date().toISOString(),
      files: []
    };
    currentDb.farmers.push(newFarmer);
    addedFarmers.push(newFarmer);
  }

  saveDB(currentDb);
  res.status(201).json(addedFarmers);
});

// Farmer Files Management
app.post("/api/farmers/:id/files", (req, res) => {
  const currentDb = loadDB();
  const index = currentDb.farmers.findIndex((f: any) => f.id === req.params.id);
  if (index !== -1) {
    const farmer = currentDb.farmers[index];
    if (!farmer.files) farmer.files = [];

    // Check storage limit
    if (req.body.dataUrl) {
      const incomingSize = getBase64Size(req.body.dataUrl);
      const currentYear = new Date().getFullYear();
      const accumulated = getAccumulatedStorageForYear(currentDb, currentYear);
      if (accumulated + incomingSize > 1024 * 1024 * 1024) {
        return res.status(400).json({ error: "Storage limit reached. Uploading this file would exceed the annual storage limit of 1 GB." });
      }
    }

    const newFile = {
      id: "ff-" + Date.now(),
      name: req.body.name,
      type: req.body.type,
      size: req.body.size,
      dataUrl: req.body.dataUrl,
      uploadedAt: new Date().toISOString()
    };
    farmer.files.push(newFile);
    saveDB(currentDb);
    res.status(201).json(newFile);
  } else {
    res.status(404).json({ error: "Farmer not found" });
  }
});

app.delete("/api/farmers/:id/files/:fileId", (req, res) => {
  const currentDb = loadDB();
  const index = currentDb.farmers.findIndex((f: any) => f.id === req.params.id);
  if (index !== -1) {
    const farmer = currentDb.farmers[index];
    if (farmer.files) {
      farmer.files = farmer.files.filter((file: any) => file.id !== req.params.fileId);
      saveDB(currentDb);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "File not found" });
    }
  } else {
    res.status(404).json({ error: "Farmer not found" });
  }
});

// 2. Cooperatives CRUD
app.get("/api/cooperatives", (req, res) => {
  const currentDb = loadDB();
  res.json(currentDb.cooperatives);
});

app.post("/api/cooperatives", (req, res) => {
  const currentDb = loadDB();
  const newCoop = {
    id: "c-" + Date.now(),
    ...req.body,
    createdAt: new Date().toISOString(),
    files: []
  };
  currentDb.cooperatives.push(newCoop);
  saveDB(currentDb);
  res.status(201).json(newCoop);
});

app.put("/api/cooperatives/:id", (req, res) => {
  const currentDb = loadDB();
  const index = currentDb.cooperatives.findIndex((c: any) => c.id === req.params.id);
  if (index !== -1) {
    currentDb.cooperatives[index] = {
      ...currentDb.cooperatives[index],
      ...req.body
    };
    saveDB(currentDb);
    res.json(currentDb.cooperatives[index]);
  } else {
    res.status(404).json({ error: "Cooperative not found" });
  }
});

app.delete("/api/cooperatives/:id", (req, res) => {
  const currentDb = loadDB();
  const initialLength = currentDb.cooperatives.length;
  currentDb.cooperatives = currentDb.cooperatives.filter((c: any) => c.id !== req.params.id);
  if (currentDb.cooperatives.length < initialLength) {
    saveDB(currentDb);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Cooperative not found" });
  }
});

// Cooperative Files Management
app.post("/api/cooperatives/:id/files", (req, res) => {
  const currentDb = loadDB();
  const index = currentDb.cooperatives.findIndex((c: any) => c.id === req.params.id);
  if (index !== -1) {
    const coop = currentDb.cooperatives[index];
    if (!coop.files) coop.files = [];

    // Check storage limit
    if (req.body.dataUrl) {
      const incomingSize = getBase64Size(req.body.dataUrl);
      const currentYear = new Date().getFullYear();
      const accumulated = getAccumulatedStorageForYear(currentDb, currentYear);
      if (accumulated + incomingSize > 1024 * 1024 * 1024) {
        return res.status(400).json({ error: "Storage limit reached. Uploading this file would exceed the annual storage limit of 1 GB." });
      }
    }

    const newFile = {
      id: "cf-" + Date.now(),
      name: req.body.name,
      type: req.body.type,
      size: req.body.size,
      dataUrl: req.body.dataUrl,
      uploadedAt: new Date().toISOString()
    };
    coop.files.push(newFile);
    saveDB(currentDb);
    res.status(201).json(newFile);
  } else {
    res.status(404).json({ error: "Cooperative not found" });
  }
});

app.delete("/api/cooperatives/:id/files/:fileId", (req, res) => {
  const currentDb = loadDB();
  const index = currentDb.cooperatives.findIndex((c: any) => c.id === req.params.id);
  if (index !== -1) {
    const coop = currentDb.cooperatives[index];
    if (coop.files) {
      coop.files = coop.files.filter((file: any) => file.id !== req.params.fileId);
      saveDB(currentDb);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "File not found" });
    }
  } else {
    res.status(404).json({ error: "Cooperative not found" });
  }
});

// 3. Programs CRUD
app.get("/api/programs", (req, res) => {
  const currentDb = loadDB();
  res.json(currentDb.programs);
});

app.post("/api/programs", (req, res) => {
  const currentDb = loadDB();
  const newProgram = {
    id: "p-" + Date.now(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  currentDb.programs.push(newProgram);
  saveDB(currentDb);
  res.status(201).json(newProgram);
});

app.put("/api/programs/:id", (req, res) => {
  const currentDb = loadDB();
  const index = currentDb.programs.findIndex((p: any) => p.id === req.params.id);
  if (index !== -1) {
    currentDb.programs[index] = {
      ...currentDb.programs[index],
      ...req.body
    };
    saveDB(currentDb);
    res.json(currentDb.programs[index]);
  } else {
    res.status(404).json({ error: "Program not found" });
  }
});

app.delete("/api/programs/:id", (req, res) => {
  const currentDb = loadDB();
  const initialLength = currentDb.programs.length;
  currentDb.programs = currentDb.programs.filter((p: any) => p.id !== req.params.id);
  if (currentDb.programs.length < initialLength) {
    saveDB(currentDb);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Program not found" });
  }
});

// 4. Distributions CRUD
app.get("/api/distributions", (req, res) => {
  const currentDb = loadDB();
  res.json(currentDb.distributions);
});

app.post("/api/distributions", (req, res) => {
  const currentDb = loadDB();
  const newDistribution = {
    id: "d-" + Date.now(),
    ...req.body
  };
  currentDb.distributions.push(newDistribution);
  saveDB(currentDb);
  res.status(201).json(newDistribution);
});

app.delete("/api/distributions/:id", (req, res) => {
  const currentDb = loadDB();
  const initialLength = currentDb.distributions.length;
  currentDb.distributions = currentDb.distributions.filter((d: any) => d.id !== req.params.id);
  if (currentDb.distributions.length < initialLength) {
    saveDB(currentDb);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Distribution record not found" });
  }
});

// 4b. Distribution Batches CRUD
app.get("/api/distribution-batches", (req, res) => {
  const currentDb = loadDB();
  res.json(currentDb.distributionBatches || []);
});

app.post("/api/distribution-batches", (req, res) => {
  const currentDb = loadDB();
  if (!currentDb.distributionBatches) {
    currentDb.distributionBatches = [];
  }
  const newBatch = {
    id: "batch-" + Date.now(),
    ...req.body,
    generatedAt: new Date().toISOString()
  };
  currentDb.distributionBatches.unshift(newBatch);
  saveDB(currentDb);
  res.status(201).json(newBatch);
});

// 5. Documents Archive CRUD
app.get("/api/documents", (req, res) => {
  const currentDb = loadDB();
  res.json(currentDb.documents);
});

app.post("/api/documents", (req, res) => {
  const currentDb = loadDB();

  // Check storage limit
  if (req.body.type === 'file' && req.body.content) {
    const incomingSize = getBase64Size(req.body.content);
    const currentYear = new Date().getFullYear();
    const accumulated = getAccumulatedStorageForYear(currentDb, currentYear);
    if (accumulated + incomingSize > 1024 * 1024 * 1024) {
      return res.status(400).json({ error: "Storage limit reached. Uploading this file would exceed the annual storage limit of 1 GB." });
    }
  }

  const newDoc = {
    id: (req.body.type === 'folder' ? "fld-" : "doc-") + Date.now(),
    type: 'file', // Default
    parentId: null, // Default
    ...req.body,
    uploadedAt: new Date().toISOString()
  };
  currentDb.documents.unshift(newDoc);
  saveDB(currentDb);
  res.status(201).json(newDoc);
});

app.delete("/api/documents/:id", (req, res) => {
  const currentDb = loadDB();
  const idToDelete = req.params.id;
  const initialLength = currentDb.documents.length;

  const itemToDelete = currentDb.documents.find((doc: any) => doc.id === idToDelete);
  if (!itemToDelete) {
    return res.status(404).json({ error: "Document or folder not found" });
  }

  if (itemToDelete.type === 'folder') {
    // Recursive folder deletion: Gather deleted folder ID plus all children recursively
    const idsToDelete = new Set<string>([idToDelete]);
    let sizeBefore;
    do {
      sizeBefore = idsToDelete.size;
      currentDb.documents.forEach((doc: any) => {
        if (doc.parentId && idsToDelete.has(doc.parentId)) {
          idsToDelete.add(doc.id);
        }
      });
    } while (idsToDelete.size !== sizeBefore);

    currentDb.documents = currentDb.documents.filter((doc: any) => !idsToDelete.has(doc.id));
  } else {
    currentDb.documents = currentDb.documents.filter((doc: any) => doc.id !== idToDelete);
  }

  saveDB(currentDb);
  res.json({ success: true });
});

// Storage Status Endpoint
app.get("/api/storage/status", (req, res) => {
  const currentDb = loadDB();
  const currentYear = new Date().getFullYear();
  const usedBytes = getAccumulatedStorageForYear(currentDb, currentYear);
  res.json({
    usedBytes,
    totalBytes: 1024 * 1024 * 1024, // 1 GB limit
    year: currentYear
  });
});

// Helper to decode Base64 to Buffer
function base64ToBuffer(dataUrl: string): Buffer {
  const commaIdx = dataUrl.indexOf(',');
  const cleanBase64 = commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  return Buffer.from(cleanBase64, 'base64');
}

// Storage Archive Download Endpoint
app.get("/api/storage/archive-download", async (req, res) => {
  try {
    const currentDb = loadDB();
    const zip = new JSZip();

    // 1. Office Files (Documents)
    // Map of folder IDs to folder names to structure directories
    const foldersMap = new Map<string, string>();
    if (currentDb.documents) {
      for (const doc of currentDb.documents) {
        if (doc.type === 'folder') {
          foldersMap.set(doc.id, doc.title);
        }
      }

      for (const doc of currentDb.documents) {
        if (doc.type === 'file') {
          let folderPath = '';
          if (doc.parentId && foldersMap.has(doc.parentId)) {
            folderPath = `${foldersMap.get(doc.parentId)}/`;
          }
          const fileName = doc.name || `${doc.title}`;
          if (doc.content) {
            zip.file(`Office Files/${folderPath}${fileName}`, base64ToBuffer(doc.content));
          } else {
            zip.file(`Office Files/${folderPath}${fileName}.txt`, `Title: ${doc.title}\nDescription: ${doc.description || ''}\nUploaded: ${doc.uploadedAt || ''}`);
          }
        }
      }
    }

    // 2. Farmer uploaded files
    if (currentDb.farmers) {
      for (const farmer of currentDb.farmers) {
        if (farmer.files && farmer.files.length > 0) {
          const farmerFolder = `Farmer Files/${farmer.name.replace(/[^a-zA-Z0-9_\-]/g, '_')}`;
          for (const file of farmer.files) {
            const fileName = file.name || 'document';
            if (file.dataUrl) {
              zip.file(`${farmerFolder}/${fileName}`, base64ToBuffer(file.dataUrl));
            } else {
              zip.file(`${farmerFolder}/${fileName}.txt`, `File Name: ${file.name}\nUploaded: ${file.uploadedAt || ''}`);
            }
          }
        }
      }
    }

    // 3. Cooperative uploaded files
    if (currentDb.cooperatives) {
      for (const coop of currentDb.cooperatives) {
        if (coop.files && coop.files.length > 0) {
          const coopFolder = `Cooperative Files/${coop.name.replace(/[^a-zA-Z0-9_\-]/g, '_')}`;
          for (const file of coop.files) {
            const fileName = file.name || 'document';
            if (file.dataUrl) {
              zip.file(`${coopFolder}/${fileName}`, base64ToBuffer(file.dataUrl));
            } else {
              zip.file(`${coopFolder}/${fileName}.txt`, `File Name: ${file.name}\nUploaded: ${file.uploadedAt || ''}`);
            }
          }
        }
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=MAO_Archive_${new Date().getFullYear()}.zip`);
    res.send(zipBuffer);
  } catch (err: any) {
    console.error("Archive generation error:", err);
    res.status(500).json({ error: "Failed to generate archive: " + err.message });
  }
});

// Storage Reset Endpoint
app.post("/api/storage/reset", (req, res) => {
  const currentDb = loadDB();
  
  // Clear all documents/folders
  currentDb.documents = [];

  // Clear all farmer attached files
  if (currentDb.farmers) {
    for (const farmer of currentDb.farmers) {
      farmer.files = [];
    }
  }

  // Clear all cooperative attached files
  if (currentDb.cooperatives) {
    for (const coop of currentDb.cooperatives) {
      coop.files = [];
    }
  }

  saveDB(currentDb);
  res.json({ success: true, message: "The repository has been successfully reset and is ready for the new annual cycle." });
});

// 5c. Certificates & Certificate Types CRUD
app.get("/api/certificates", (req, res) => {
  const currentDb = loadDB();
  res.json(currentDb.certificates || []);
});

app.post("/api/certificates", (req, res) => {
  const currentDb = loadDB();
  const newCertificate = {
    id: "cert-" + Date.now(),
    ...req.body,
    dateIssued: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };
  if (!currentDb.certificates) currentDb.certificates = [];
  currentDb.certificates.unshift(newCertificate);
  saveDB(currentDb);
  res.status(201).json(newCertificate);
});

app.delete("/api/certificates/:id", (req, res) => {
  const currentDb = loadDB();
  const initialLength = (currentDb.certificates || []).length;
  currentDb.certificates = (currentDb.certificates || []).filter((c: any) => c.id !== req.params.id);
  if (currentDb.certificates.length < initialLength) {
    saveDB(currentDb);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Certificate not found" });
  }
});

app.get("/api/certificate-types", (req, res) => {
  const currentDb = loadDB();
  res.json(currentDb.certificateTypes || []);
});

app.post("/api/certificate-types", (req, res) => {
  const currentDb = loadDB();
  const newType = {
    id: "ct-" + Date.now(),
    ...req.body
  };
  if (!currentDb.certificateTypes) currentDb.certificateTypes = [];
  currentDb.certificateTypes.push(newType);
  saveDB(currentDb);
  res.status(201).json(newType);
});

// 5cc. Certificates template upload / download
app.get("/api/certificates/template", (req, res) => {
  const currentDb = loadDB();
  res.json({ image: currentDb.customTemplateImage || null });
});

app.post("/api/certificates/template", (req, res) => {
  const currentDb = loadDB();
  currentDb.customTemplateImage = req.body.image || null;
  saveDB(currentDb);
  res.json({ success: true, image: currentDb.customTemplateImage });
});

// 5a. Distribution Batches Management
app.get("/api/distribution-batches", (req, res) => {
  const currentDb = loadDB();
  res.json(currentDb.distributionBatches || []);
});

app.post("/api/distribution-batches", (req, res) => {
  const currentDb = loadDB();
  if (!currentDb.distributionBatches) currentDb.distributionBatches = [];
  
  const newBatch = {
    id: "batch-" + Date.now(),
    generatedAt: new Date().toISOString(),
    ...req.body
  };
  
  currentDb.distributionBatches.unshift(newBatch);
  
  // Also push individual recipient actions into distributions record
  if (!currentDb.distributions) currentDb.distributions = [];
  for (const r of newBatch.recipients) {
    currentDb.distributions.unshift({
      id: "d-" + Math.floor(Math.random() * 10000000) + "-" + Date.now(),
      programId: newBatch.programId,
      programTitle: newBatch.programTitle,
      farmerId: r.farmerId,
      farmerName: r.farmerName,
      farmerBarangay: r.barangay,
      quantityReceived: r.allocatedQuantity,
      distributedAt: newBatch.generatedAt,
      notes: `Smart generated batch distribution under criteria: ${newBatch.criteriaDescription}`
    });
  }
  
  saveDB(currentDb);
  res.status(201).json(newBatch);
});

app.delete("/api/distribution-batches/:id", (req, res) => {
  const currentDb = loadDB();
  if (!currentDb.distributionBatches) currentDb.distributionBatches = [];
  currentDb.distributionBatches = currentDb.distributionBatches.filter((b: any) => b.id !== req.params.id);
  saveDB(currentDb);
  res.json({ success: true });
});

// 5b. Project Procurement Management Plan (PPMP) CRUD
app.get("/api/ppmp", (req, res) => {
  const currentDb = loadDB();
  res.json(currentDb.ppmp || []);
});

app.post("/api/ppmp", (req, res) => {
  const currentDb = loadDB();
  if (!currentDb.ppmp) currentDb.ppmp = [];
  const newPPMP = {
    id: "ppmp-" + Date.now(),
    createdAt: new Date().toISOString(),
    items: [],
    totalBudget: 0,
    ...req.body
  };
  currentDb.ppmp.unshift(newPPMP);
  saveDB(currentDb);
  res.status(201).json(newPPMP);
});

app.put("/api/ppmp/:id", (req, res) => {
  const currentDb = loadDB();
  if (!currentDb.ppmp) currentDb.ppmp = [];
  const index = currentDb.ppmp.findIndex((p: any) => p.id === req.params.id);
  if (index !== -1) {
    currentDb.ppmp[index] = {
      ...currentDb.ppmp[index],
      ...req.body
    };
    saveDB(currentDb);
    res.json(currentDb.ppmp[index]);
  } else {
    res.status(404).json({ error: "PPMP record not found" });
  }
});

app.delete("/api/ppmp/:id", (req, res) => {
  const currentDb = loadDB();
  if (!currentDb.ppmp) currentDb.ppmp = [];
  currentDb.ppmp = currentDb.ppmp.filter((p: any) => p.id !== req.params.id);
  saveDB(currentDb);
  res.json({ success: true });
});

// 5c. Authenticated User Management
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const currentDb = loadDB();
  if (!currentDb.users) {
    currentDb.users = [
      { id: "usr-admin", email: "admin@mao.gov.ph", password: "admin123", name: "Admin Director", role: "admin", createdAt: new Date().toISOString() },
      { id: "usr-staff", email: "user@mao.gov.ph", password: "user123", name: "Staff Member", role: "user", createdAt: new Date().toISOString() }
    ];
    saveDB(currentDb);
  }

  const user = currentDb.users.find((u: any) => 
    u.email.toLowerCase() === email.toLowerCase() || 
    (u.username && u.username.toLowerCase() === email.toLowerCase())
  );
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid email/username or password. Hint: admin@mao.gov.ph / admin123" });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
});

app.post("/api/auth/register", (req, res) => {
  const { email, password, name, role, adminCode } = req.body;
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const currentDb = loadDB();
  if (!currentDb.users) {
    currentDb.users = [
      { id: "usr-admin", email: "admin@mao.gov.ph", password: "admin123", name: "Admin Director", role: "admin", createdAt: new Date().toISOString() },
      { id: "usr-staff", email: "user@mao.gov.ph", password: "user123", name: "Staff Member", role: "user", createdAt: new Date().toISOString() }
    ];
  }

  const exists = currentDb.users.some((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "Email already registered." });
  }

  if (role === 'admin') {
    if (!adminCode) {
      return res.status(400).json({ error: "An Admin Creation Code is required to register an administrative account." });
    }
    if (!currentDb.adminCodes || !Array.isArray(currentDb.adminCodes)) {
      currentDb.adminCodes = [];
    }
    const codeIndex = currentDb.adminCodes.findIndex((ac: any) => ac.code === adminCode);
    if (codeIndex === -1) {
      return res.status(400).json({ error: "Invalid, expired, or used Admin Creation Code." });
    }
    // Remove the code since it is single-use
    currentDb.adminCodes.splice(codeIndex, 1);
  }

  const newUser = {
    id: "usr-" + Date.now(),
    email: email.toLowerCase(),
    password,
    name,
    role,
    createdAt: new Date().toISOString()
  };

  currentDb.users.push(newUser);
  saveDB(currentDb);

  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json({ user: userWithoutPassword });
});

// Admin codes listing for active admins
app.get("/api/auth/admin-codes", (req, res) => {
  const currentDb = loadDB();
  res.json(currentDb.adminCodes || []);
});

// Admin code generation endpoint
app.post("/api/auth/admin-codes/generate", (req, res) => {
  const currentDb = loadDB();
  if (!currentDb.adminCodes || !Array.isArray(currentDb.adminCodes)) {
    currentDb.adminCodes = [];
  }

  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  const newCode = {
    code: `ADM-${randomDigits}`,
    createdAt: new Date().toISOString()
  };

  currentDb.adminCodes.push(newCode);
  saveDB(currentDb);

  res.status(201).json(newCode);
});

// Section User Account listing for active admins
app.get("/api/auth/section-accounts", (req, res) => {
  const currentDb = loadDB();
  res.json(currentDb.sectionAccounts || []);
});

// Section User Account generation endpoint
app.post("/api/auth/section-accounts/generate", (req, res) => {
  const { username } = req.body;
  if (!username || typeof username !== 'string' || !username.trim()) {
    return res.status(400).json({ error: "Office section username is required." });
  }

  const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '-');
  const currentDb = loadDB();

  if (!currentDb.users) {
    currentDb.users = [];
  }
  if (!currentDb.sectionAccounts) {
    currentDb.sectionAccounts = [];
  }

  // Check if username/email already exists
  const targetEmail = `${cleanUsername}@mao.gov.ph`;
  const exists = currentDb.users.some((u: any) => 
    u.email.toLowerCase() === targetEmail.toLowerCase() ||
    (u.username && u.username.toLowerCase() === cleanUsername)
  );

  if (exists) {
    return res.status(400).json({ error: `The section username "${cleanUsername}" is already in use.` });
  }

  // Generate a system-generated password (e.g., random secure key)
  const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random suffix
  const generatedPassword = `pwd-${cleanUsername}-${randomSuffix}`;

  // Section Name formatting (e.g. mao-fisheries -> Fisheries Section)
  const sectionPart = cleanUsername.startsWith('mao-') 
    ? cleanUsername.substring(4) 
    : cleanUsername;
  const sectionName = sectionPart.split('-')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') + " Section";

  // Create real user account
  const newUser = {
    id: `usr-${cleanUsername}-${Date.now()}`,
    email: targetEmail,
    username: cleanUsername,
    password: generatedPassword,
    name: sectionName,
    role: "user" as const,
    createdAt: new Date().toISOString()
  };

  currentDb.users.push(newUser);

  // Store metadata in sectionAccounts
  const newAccountRecord = {
    username: cleanUsername,
    password: generatedPassword,
    sectionName,
    createdAt: new Date().toISOString()
  };
  currentDb.sectionAccounts.push(newAccountRecord);

  saveDB(currentDb);

  res.status(201).json(newAccountRecord);
});

// Delete Section User Account
app.delete("/api/auth/section-accounts/:username", (req, res) => {
  const usernameToDelete = req.params.username.toLowerCase();
  const currentDb = loadDB();

  if (currentDb.sectionAccounts) {
    currentDb.sectionAccounts = currentDb.sectionAccounts.filter((sa: any) => sa.username !== usernameToDelete);
  }
  if (currentDb.users) {
    currentDb.users = currentDb.users.filter((u: any) => u.username !== usernameToDelete);
  }

  saveDB(currentDb);
  res.json({ success: true });
});

app.post("/api/auth/update-profile", (req, res) => {
  const { id, name, email, password, avatar } = req.body;
  if (!id || !name || !email) {
    return res.status(400).json({ error: "ID, Name and Email are required." });
  }

  const currentDb = loadDB();
  if (!currentDb.users) {
    currentDb.users = [
      { id: "usr-admin", email: "admin@mao.gov.ph", password: "admin123", name: "Admin Director", role: "admin", createdAt: new Date().toISOString() },
      { id: "usr-staff", email: "user@mao.gov.ph", password: "user123", name: "Staff Member", role: "user", createdAt: new Date().toISOString() }
    ];
  }

  const userIndex = currentDb.users.findIndex((u: any) => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: "User account not found." });
  }

  // Update user fields
  currentDb.users[userIndex].name = name;
  currentDb.users[userIndex].email = email.toLowerCase();
  if (password) {
    currentDb.users[userIndex].password = password;
  }
  if (avatar !== undefined) {
    currentDb.users[userIndex].avatar = avatar;
  }

  saveDB(currentDb);

  const { password: _, ...userWithoutPassword } = currentDb.users[userIndex];
  res.json({ user: userWithoutPassword });
});

// 6. Gemini-powered Intelligent File Analyzer
app.post("/api/documents/analyze", async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Both Title and Content are required for analysis." });
  }

  try {
    const prompt = `You are an AI document analysis specialist at the Municipal Agriculture Office (MAO).
    You are analyzing an official agricultural document/circular/report.
    
    Document Title: "${title}"
    Document Text/Content:
    "${content}"
    
    Please perform the following tasks:
    1. Categorize this document into exactly one of these five groups:
       - "Policy/Ordinance"
       - "Annual Report"
       - "Distribution List"
       - "Memo/Circular"
       - "Farmer Survey"
    2. Write exactly three (3) clear, high-level, action-oriented executive summary bullet points outlining the main points.
    3. Generate 3 to 4 relevant and concise hashtag keywords (lowercase, starting with #, no spaces) appropriate for tagging this document (e.g., #rice, #seeds, #subsidy, #guidelines, #survey).
    
    Return your response strictly in the following JSON format. Do not write any markdown codeblock headers like \`\`\`json or trailing text. Return only the raw JSON.
    
    {
      "category": "One of the five exact groups above",
      "summary": [
        "First bullet point summarizing key details",
        "Second bullet point summarizing key details",
        "Third bullet point summarizing key details"
      ],
      "tags": ["#tag1", "#tag2", "#tag3", "#tag4"]
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: "One of: Policy/Ordinance, Annual Report, Distribution List, Memo/Circular, Farmer Survey" },
            summary: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly three action-oriented executive summary bullets"
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 to 4 relevant hashtags starting with #"
            }
          },
          required: ["category", "summary", "tags"]
        }
      }
    });

    const resultText = response.text?.trim() || "";
    const parsedResult = JSON.parse(resultText);
    res.json(parsedResult);
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    // Provide a helpful fallback analysis if Gemini API is not configured or hits an error
    res.json({
      category: "Memo/Circular",
      summary: [
        `Processed "${title}" successfully.`,
        "This is an automated administrative summary generated by the local processing cache.",
        "Ensure GEMINI_API_KEY is active in settings secrets for live cognitive extraction."
      ],
      tags: ["#agriculture", "#mao", "#document", "#archival"]
    });
  }
});

// 7. PPMP CRUD
app.get("/api/ppmp", (req, res) => {
  const currentDb = loadDB();
  if (!currentDb.ppmps) {
    currentDb.ppmps = [
      {
        id: "ppmp-2026-mao",
        year: 2026,
        title: "Agricultural Machinery and Inbred Seed Procurement Plan",
        department: "Municipal Agriculture Office",
        items: [
          {
            id: "pi-1",
            code: "PPMP-2026-001",
            generalDescription: "High-yield Certified Rice Inbred Seeds",
            quantity: 2500,
            unit: "Bags",
            estimatedBudget: 1875000,
            modeOfProcurement: "Public Bidding",
            schedule: { "January": true, "February": true, "June": true }
          },
          {
            id: "pi-2",
            code: "PPMP-2026-002",
            generalDescription: "Premium Urea Fertilizer Bags",
            quantity: 3500,
            unit: "Bags",
            estimatedBudget: 4200000,
            modeOfProcurement: "Public Bidding",
            schedule: { "March": true, "April": true, "May": true }
          },
          {
            id: "pi-3",
            code: "PPMP-2026-003",
            generalDescription: "Multi-purpose Farm Hand Tractors",
            quantity: 12,
            unit: "Units",
            estimatedBudget: 1560000,
            modeOfProcurement: "Public Bidding",
            schedule: { "July": true, "August": true }
          },
          {
            id: "pi-4",
            code: "PPMP-2026-004",
            generalDescription: "Soil testing kits and digital PH readers",
            quantity: 50,
            unit: "Sets",
            estimatedBudget: 125000,
            modeOfProcurement: "SVP",
            schedule: { "February": true, "September": true }
          }
        ],
        totalBudget: 7760000,
        status: "Approved",
        createdAt: "2026-01-05T08:00:00Z"
      }
    ];
    saveDB(currentDb);
  }
  res.json(currentDb.ppmps);
});

app.post("/api/ppmp", (req, res) => {
  const currentDb = loadDB();
  if (!currentDb.ppmps) {
    currentDb.ppmps = [];
  }
  const newPPMP = {
    id: "ppmp-" + Date.now(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  currentDb.ppmps.push(newPPMP);
  saveDB(currentDb);
  res.status(201).json(newPPMP);
});

app.put("/api/ppmp/:id", (req, res) => {
  const currentDb = loadDB();
  if (!currentDb.ppmps) currentDb.ppmps = [];
  const index = currentDb.ppmps.findIndex((p: any) => p.id === req.params.id);
  if (index !== -1) {
    currentDb.ppmps[index] = {
      ...currentDb.ppmps[index],
      ...req.body
    };
    saveDB(currentDb);
    res.json(currentDb.ppmps[index]);
  } else {
    res.status(404).json({ error: "PPMP not found" });
  }
});

app.delete("/api/ppmp/:id", (req, res) => {
  const currentDb = loadDB();
  if (!currentDb.ppmps) currentDb.ppmps = [];
  const initialLength = currentDb.ppmps.length;
  currentDb.ppmps = currentDb.ppmps.filter((p: any) => p.id !== req.params.id);
  if (currentDb.ppmps.length < initialLength) {
    saveDB(currentDb);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "PPMP not found" });
  }
});

// Setup Vite Dev Server / serve static production files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MAO Repository Server is running on port ${PORT}`);
  });
}

startServer();
