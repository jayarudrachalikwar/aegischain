export interface BelDesignation {
  id: number;
  title: string;
  category: 'Engineering & Production' | 'Research & Quality' | 'Management & Leadership' | 'IT & Digital Identity' | 'Business & Administration' | 'External & Other';
  workDescription: string;
  filesUsed: string;
  aegisSystemRole: AegisSystemRoleId;
  clearanceLevel: 'TOP_SECRET' | 'SECRET' | 'CONFIDENTIAL' | 'RESTRICTED' | 'UNCLASSIFIED';
}

export type AegisSystemRoleId = 
  | 'SYSTEM_ADMIN'
  | 'ASSET_OWNER'
  | 'ENGINEER'
  | 'QA_VERIFIER'
  | 'SECURITY_OFFICER'
  | 'AUDITOR'
  | 'DEPT_MANAGER'
  | 'EXTERNAL_COLLABORATOR';

export interface AegisSystemRoleConfig {
  id: AegisSystemRoleId;
  name: string;
  shortCode: string;
  description: string;
  defaultClearance: 'TOP_SECRET' | 'SECRET' | 'CONFIDENTIAL' | 'RESTRICTED';
  badgeColor: string;
  permissions: {
    canUpload: boolean;
    canRequest: boolean;
    canApprove: boolean;
    canDecryptPayload: boolean;
    canViewAuditLedger: boolean;
    canEmergencyFreeze: boolean;
    canManageIdentities: boolean;
  };
  separationOfDutiesGuardrail: string;
  representativeTitles: string[];
}

export const AEGIS_SYSTEM_ROLES: Record<AegisSystemRoleId, AegisSystemRoleConfig> = {
  SYSTEM_ADMIN: {
    id: 'SYSTEM_ADMIN',
    name: 'System Administrator',
    shortCode: 'SYS_ADMIN',
    description: 'Authorized platform administrator. Creates accounts, assigns approved roles, and configures the system. Cryptographically blocked from reading encrypted file contents.',
    defaultClearance: 'SECRET',
    badgeColor: 'bg-stone-900 text-white',
    permissions: {
      canUpload: false,
      canRequest: false,
      canApprove: false,
      canDecryptPayload: false, // CRITICAL SEPARATION OF DUTIES
      canViewAuditLedger: true,
      canEmergencyFreeze: true,
      canManageIdentities: true,
    },
    separationOfDutiesGuardrail: 'ZERO PAYLOAD ACCESS: Can register keys & DIDs, but cannot decrypt off-chain AES-256 files.',
    representativeTitles: ['IT Administrator', 'System Administrator', 'IAM Administrator', 'Blockchain Administrator', 'Database Administrator', 'Storage Administrator'],
  },
  ASSET_OWNER: {
    id: 'ASSET_OWNER',
    name: 'Asset Owner / Project Manager',
    shortCode: 'ASSET_OWNER',
    description: 'Project managers and designated document owners. Uploads assets, manages assigned assets, and approves access within their authorized project scope.',
    defaultClearance: 'TOP_SECRET',
    badgeColor: 'bg-emerald-600 text-white',
    permissions: {
      canUpload: true,
      canRequest: true,
      canApprove: true,
      canDecryptPayload: true,
      canViewAuditLedger: true,
      canEmergencyFreeze: false,
      canManageIdentities: false,
    },
    separationOfDutiesGuardrail: 'SCOPE BOUNDARY: Can only approve access for assets within authorized scope; cannot unilaterally alter audit records.',
    representativeTitles: ['Project Manager', 'Project Lead', 'Engineering Manager', 'Chief Architect'],
  },
  ENGINEER: {
    id: 'ENGINEER',
    name: 'Engineer / Technical Employee',
    shortCode: 'TECH_ENG',
    description: 'Design, software, hardware, R&D, and production staff. Accesses assigned files and requests additional permissions under time-bound grants.',
    defaultClearance: 'SECRET',
    badgeColor: 'bg-blue-600 text-white',
    permissions: {
      canUpload: true,
      canRequest: true,
      canApprove: false,
      canDecryptPayload: true, // Only when active grant exists
      canViewAuditLedger: true,
      canEmergencyFreeze: false,
      canManageIdentities: false,
    },
    separationOfDutiesGuardrail: 'NO SELF-APPROVAL: Must authenticate via Passkey + MFA and submit cryptographic justifications for time-bound access.',
    representativeTitles: ['Design Engineer', 'Software Engineer', 'Hardware Engineer', 'Electronics Engineer', 'Embedded Systems Engineer', 'FPGA / VLSI Engineer'],
  },
  QA_VERIFIER: {
    id: 'QA_VERIFIER',
    name: 'QA / Verification Officer',
    shortCode: 'QA_VERIF',
    description: 'QA, QC, and designated testing staff. Verifies hashes, inspects integrity records, and accesses approved test documents. Enforces 1-bit tamper zero tolerance.',
    defaultClearance: 'SECRET',
    badgeColor: 'bg-teal-600 text-white',
    permissions: {
      canUpload: false,
      canRequest: true,
      canApprove: false,
      canDecryptPayload: true,
      canViewAuditLedger: true,
      canEmergencyFreeze: false,
      canManageIdentities: false,
    },
    separationOfDutiesGuardrail: 'INTEGRITY ONLY: Can inspect verification manifests and test logs; cannot modify defence source assets.',
    representativeTitles: ['QA Engineer', 'QC Inspector', 'Reliability Engineer', 'Calibration Engineer', 'Test Engineer'],
  },
  SECURITY_OFFICER: {
    id: 'SECURITY_OFFICER',
    name: 'Security Officer',
    shortCode: 'SEC_SOC',
    description: 'Authorized cybersecurity personnel. Investigates alerts, suspends access when authorized, and monitors security events and velocity anomalies.',
    defaultClearance: 'TOP_SECRET',
    badgeColor: 'bg-rose-600 text-white',
    permissions: {
      canUpload: false,
      canRequest: false,
      canApprove: false,
      canDecryptPayload: false, // Payload isolated
      canViewAuditLedger: true,
      canEmergencyFreeze: true,
      canManageIdentities: true,
    },
    separationOfDutiesGuardrail: 'FORENSIC ISOLATION: Has global revoke & freeze controls, but cannot view classified engineering blueprints.',
    representativeTitles: ['Cybersecurity Officer', 'SOC Analyst', 'Incident Response Specialist', 'Security Operations Lead'],
  },
  AUDITOR: {
    id: 'AUDITOR',
    name: 'Auditor',
    shortCode: 'AUDITOR',
    description: 'Internal or external auditors. Reads approved audit logs and verification evidence with guaranteed immutability.',
    defaultClearance: 'TOP_SECRET',
    badgeColor: 'bg-amber-600 text-white',
    permissions: {
      canUpload: false,
      canRequest: false,
      canApprove: false,
      canDecryptPayload: false,
      canViewAuditLedger: true,
      canEmergencyFreeze: false,
      canManageIdentities: false,
    },
    separationOfDutiesGuardrail: 'READ-ONLY ASSURANCE: Absolute mathematical read-only state. Cannot create, modify, or delete any record or asset.',
    representativeTitles: ['Internal Security Auditor', 'External Auditor', 'Government Inspector', 'Compliance Inspector'],
  },
  DEPT_MANAGER: {
    id: 'DEPT_MANAGER',
    name: 'Department Manager',
    shortCode: 'DEPT_MGR',
    description: 'Authorized departmental leadership. Reviews and approves access requests within the department\'s scope and governs cross-project dual custody.',
    defaultClearance: 'TOP_SECRET',
    badgeColor: 'bg-indigo-600 text-white',
    permissions: {
      canUpload: true,
      canRequest: true,
      canApprove: true,
      canDecryptPayload: true,
      canViewAuditLedger: true,
      canEmergencyFreeze: true,
      canManageIdentities: false,
    },
    separationOfDutiesGuardrail: 'POLICY GOVERNANCE: Approves access based on MoD clearance protocols; subject to immutable ledger audit.',
    representativeTitles: ['Department Head', 'General Manager (GM)', 'Senior Management / Directors', 'Programme Manager'],
  },
  EXTERNAL_COLLABORATOR: {
    id: 'EXTERNAL_COLLABORATOR',
    name: 'External Collaborator',
    shortCode: 'EXT_COLLAB',
    description: 'Vendor, consultant, contractor, customer, or defence representative. Accesses explicitly permitted files until the grant automatically expires.',
    defaultClearance: 'RESTRICTED',
    badgeColor: 'bg-stone-600 text-white',
    permissions: {
      canUpload: false,
      canRequest: true,
      canApprove: false,
      canDecryptPayload: true, // Only strictly granted token
      canViewAuditLedger: false,
      canEmergencyFreeze: false,
      canManageIdentities: false,
    },
    separationOfDutiesGuardrail: 'AIR-GAPPED TIME BOUND: Zero permanent permissions. Permissions automatically expire on block timestamp.',
    representativeTitles: ['Customer / Defence Representative', 'External Vendor', 'Contractor', 'Consultant', 'Intern / Trainee'],
  },
};

export const BEL_EMPLOYEE_ROLES: BelDesignation[] = [
  // =========================================================================
  // 1. Engineering, technical and production employees (1 - 15)
  // =========================================================================
  {
    id: 1,
    title: 'Design Engineer',
    category: 'Engineering & Production',
    workDescription: 'Designs electronic circuits, radar components, communication equipment and technical systems.',
    filesUsed: 'CAD drawings, circuit diagrams, design documents',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'SECRET',
  },
  {
    id: 2,
    title: 'Software Engineer',
    category: 'Engineering & Production',
    workDescription: 'Develops embedded software, applications and control systems.',
    filesUsed: 'Source code, software builds, technical documents',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'SECRET',
  },
  {
    id: 3,
    title: 'Hardware Engineer',
    category: 'Engineering & Production',
    workDescription: 'Designs and tests electronic hardware and circuit boards.',
    filesUsed: 'Circuit layouts, schematics, hardware specifications',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'SECRET',
  },
  {
    id: 4,
    title: 'Electronics Engineer',
    category: 'Engineering & Production',
    workDescription: 'Works on electronic systems, signal processing and equipment integration.',
    filesUsed: 'Electronics designs, test reports',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'SECRET',
  },
  {
    id: 5,
    title: 'Electrical Engineer',
    category: 'Engineering & Production',
    workDescription: 'Handles electrical systems, power supplies and electrical equipment.',
    filesUsed: 'Electrical diagrams, wiring plans',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'CONFIDENTIAL',
  },
  {
    id: 6,
    title: 'Mechanical Engineer',
    category: 'Engineering & Production',
    workDescription: 'Designs enclosures, mechanical assemblies and equipment structures.',
    filesUsed: 'CAD files, 3D models, mechanical drawings',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'CONFIDENTIAL',
  },
  {
    id: 7,
    title: 'Embedded Systems Engineer',
    category: 'Engineering & Production',
    workDescription: 'Develops firmware and software for hardware devices.',
    filesUsed: 'Firmware, source code, device configurations',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'TOP_SECRET',
  },
  {
    id: 8,
    title: 'FPGA / VLSI Engineer',
    category: 'Engineering & Production',
    workDescription: 'Designs digital logic and integrated circuit systems.',
    filesUsed: 'HDL code, chip designs, verification files',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'TOP_SECRET',
  },
  {
    id: 9,
    title: 'Network Engineer',
    category: 'Engineering & Production',
    workDescription: 'Maintains internal networks, connectivity and network infrastructure.',
    filesUsed: 'Network diagrams, configuration files',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'SECRET',
  },
  {
    id: 10,
    title: 'Systems Engineer',
    category: 'Engineering & Production',
    workDescription: 'Integrates hardware, software and subsystems into a complete product.',
    filesUsed: 'System architecture, interface specifications',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'TOP_SECRET',
  },
  {
    id: 11,
    title: 'Production Engineer',
    category: 'Engineering & Production',
    workDescription: 'Oversees manufacturing processes, assembly and production efficiency.',
    filesUsed: 'Production instructions, assembly documents',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'CONFIDENTIAL',
  },
  {
    id: 12,
    title: 'Technician',
    category: 'Engineering & Production',
    workDescription: 'Assembles, installs, repairs and tests electronic equipment.',
    filesUsed: 'Work instructions, maintenance manuals',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'RESTRICTED',
  },
  {
    id: 13,
    title: 'Engineering Assistant',
    category: 'Engineering & Production',
    workDescription: 'Supports engineers with testing, assembly, measurements and documentation.',
    filesUsed: 'Assigned technical documents, test procedures',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'RESTRICTED',
  },
  {
    id: 14,
    title: 'Field Service Engineer',
    category: 'Engineering & Production',
    workDescription: 'Installs, maintains and troubleshoots equipment at customer sites.',
    filesUsed: 'Service manuals, maintenance reports',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'SECRET',
  },
  {
    id: 15,
    title: 'Maintenance Engineer',
    category: 'Engineering & Production',
    workDescription: 'Maintains factory equipment and production machinery.',
    filesUsed: 'Maintenance schedules, service records',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'CONFIDENTIAL',
  },

  // =========================================================================
  // 2. Research, testing and quality employees (16 - 25)
  // =========================================================================
  {
    id: 16,
    title: 'R&D Scientist',
    category: 'Research & Quality',
    workDescription: 'Researches new technologies, prototypes and advanced defence systems.',
    filesUsed: 'Research papers, experimental data',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'TOP_SECRET',
  },
  {
    id: 17,
    title: 'Research Engineer',
    category: 'Research & Quality',
    workDescription: 'Develops and tests new engineering solutions.',
    filesUsed: 'Prototype designs, research reports',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'TOP_SECRET',
  },
  {
    id: 18,
    title: 'AI / ML Engineer',
    category: 'Research & Quality',
    workDescription: 'Develops AI models for applications such as signal analysis, image processing and detection.',
    filesUsed: 'Datasets, model files, source code',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'TOP_SECRET',
  },
  {
    id: 19,
    title: 'Cybersecurity Researcher',
    category: 'Research & Quality',
    workDescription: 'Studies security vulnerabilities and develops protection methods.',
    filesUsed: 'Security reports, test results',
    aegisSystemRole: 'SECURITY_OFFICER',
    clearanceLevel: 'TOP_SECRET',
  },
  {
    id: 20,
    title: 'Test Engineer',
    category: 'Research & Quality',
    workDescription: 'Tests products against technical and functional requirements.',
    filesUsed: 'Test cases, results, test procedures',
    aegisSystemRole: 'QA_VERIFIER',
    clearanceLevel: 'SECRET',
  },
  {
    id: 21,
    title: 'Quality Assurance (QA) Engineer',
    category: 'Research & Quality',
    workDescription: 'Ensures products and processes meet quality requirements.',
    filesUsed: 'Quality reports, inspection records',
    aegisSystemRole: 'QA_VERIFIER',
    clearanceLevel: 'SECRET',
  },
  {
    id: 22,
    title: 'Quality Control (QC) Inspector',
    category: 'Research & Quality',
    workDescription: 'Inspects components, assemblies and finished products.',
    filesUsed: 'Inspection reports, measurement records',
    aegisSystemRole: 'QA_VERIFIER',
    clearanceLevel: 'CONFIDENTIAL',
  },
  {
    id: 23,
    title: 'Reliability Engineer',
    category: 'Research & Quality',
    workDescription: 'Evaluates product reliability, durability and failure risks.',
    filesUsed: 'Reliability studies, failure reports',
    aegisSystemRole: 'QA_VERIFIER',
    clearanceLevel: 'SECRET',
  },
  {
    id: 24,
    title: 'Calibration Engineer',
    category: 'Research & Quality',
    workDescription: 'Ensures measuring and testing equipment provides accurate readings.',
    filesUsed: 'Calibration certificates, equipment records',
    aegisSystemRole: 'QA_VERIFIER',
    clearanceLevel: 'CONFIDENTIAL',
  },
  {
    id: 25,
    title: 'Documentation Engineer',
    category: 'Research & Quality',
    workDescription: 'Prepares and maintains technical manuals and controlled documents.',
    filesUsed: 'Manuals, specifications, document revisions',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'CONFIDENTIAL',
  },

  // =========================================================================
  // 3. Management and project leadership (26 - 33)
  // =========================================================================
  {
    id: 26,
    title: 'Project Engineer',
    category: 'Management & Leadership',
    workDescription: 'Executes technical tasks, testing and project deliverables.',
    filesUsed: 'Upload or access files according to assigned permissions',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'SECRET',
  },
  {
    id: 27,
    title: 'Project Manager',
    category: 'Management & Leadership',
    workDescription: 'Plans project schedules, resources, deliverables and team activities.',
    filesUsed: 'Approve access requests and manage project assets within scope',
    aegisSystemRole: 'ASSET_OWNER',
    clearanceLevel: 'TOP_SECRET',
  },
  {
    id: 28,
    title: 'Engineering Manager',
    category: 'Management & Leadership',
    workDescription: 'Supervises engineering teams and technical development.',
    filesUsed: 'Authorize access to engineering documents',
    aegisSystemRole: 'DEPT_MANAGER',
    clearanceLevel: 'TOP_SECRET',
  },
  {
    id: 29,
    title: 'Project Lead / Technical Lead',
    category: 'Management & Leadership',
    workDescription: 'Guides technical implementation and reviews engineering work.',
    filesUsed: 'Approve access within the assigned project scope',
    aegisSystemRole: 'ASSET_OWNER',
    clearanceLevel: 'TOP_SECRET',
  },
  {
    id: 30,
    title: 'Department Head',
    category: 'Management & Leadership',
    workDescription: 'Manages a department, its personnel and work priorities.',
    filesUsed: 'Authorize department-level access where permitted',
    aegisSystemRole: 'DEPT_MANAGER',
    clearanceLevel: 'TOP_SECRET',
  },
  {
    id: 31,
    title: 'General Manager (GM)',
    category: 'Management & Leadership',
    workDescription: 'Oversees a major unit, business area or function.',
    filesUsed: 'Review high-level reports and approve designated actions',
    aegisSystemRole: 'DEPT_MANAGER',
    clearanceLevel: 'TOP_SECRET',
  },
  {
    id: 32,
    title: 'Senior Management / Directors',
    category: 'Management & Leadership',
    workDescription: 'Provide strategic direction and oversee organizational functions.',
    filesUsed: 'Access approved management reports and sensitive records',
    aegisSystemRole: 'DEPT_MANAGER',
    clearanceLevel: 'TOP_SECRET',
  },
  {
    id: 33,
    title: 'Programme Manager',
    category: 'Management & Leadership',
    workDescription: 'Coordinates a large programme involving multiple teams or projects.',
    filesUsed: 'Coordinate cross-project access under policy',
    aegisSystemRole: 'DEPT_MANAGER',
    clearanceLevel: 'TOP_SECRET',
  },

  // =========================================================================
  // 4. IT, cybersecurity and digital identity roles (34 - 43)
  // =========================================================================
  {
    id: 34,
    title: 'IT Administrator',
    category: 'IT & Digital Identity',
    workDescription: 'Maintains IT infrastructure, user accounts and technical services.',
    filesUsed: 'Manage authorized accounts and system configuration',
    aegisSystemRole: 'SYSTEM_ADMIN',
    clearanceLevel: 'SECRET',
  },
  {
    id: 35,
    title: 'System Administrator',
    category: 'IT & Digital Identity',
    workDescription: 'Maintains servers, operating systems and system availability.',
    filesUsed: 'Manage technical infrastructure without unrestricted access to encrypted file contents',
    aegisSystemRole: 'SYSTEM_ADMIN',
    clearanceLevel: 'SECRET',
  },
  {
    id: 36,
    title: 'Cybersecurity Officer',
    category: 'IT & Digital Identity',
    workDescription: 'Protects systems against cyber threats and unauthorized activity.',
    filesUsed: 'Investigate alerts and initiate authorized access suspension',
    aegisSystemRole: 'SECURITY_OFFICER',
    clearanceLevel: 'TOP_SECRET',
  },
  {
    id: 37,
    title: 'Security Operations Analyst (SOC)',
    category: 'IT & Digital Identity',
    workDescription: 'Monitors security events and investigates suspicious behaviour.',
    filesUsed: 'Monitor alerts, login events and audit trails',
    aegisSystemRole: 'SECURITY_OFFICER',
    clearanceLevel: 'TOP_SECRET',
  },
  {
    id: 38,
    title: 'Identity and Access Management (IAM) Administrator',
    category: 'IT & Digital Identity',
    workDescription: 'Manages identities, authentication and permissions.',
    filesUsed: 'Manage DIDs, roles, passkeys and access policies',
    aegisSystemRole: 'SYSTEM_ADMIN',
    clearanceLevel: 'TOP_SECRET',
  },
  {
    id: 39,
    title: 'Blockchain Administrator / Engineer',
    category: 'IT & Digital Identity',
    workDescription: 'Maintains blockchain integration, nodes and smart contracts.',
    filesUsed: 'Manage blockchain infrastructure and asset metadata operations',
    aegisSystemRole: 'SYSTEM_ADMIN',
    clearanceLevel: 'SECRET',
  },
  {
    id: 40,
    title: 'Database Administrator (DBA)',
    category: 'IT & Digital Identity',
    workDescription: 'Maintains databases, backups and database availability.',
    filesUsed: 'Maintain PostgreSQL and protect audit records',
    aegisSystemRole: 'SYSTEM_ADMIN',
    clearanceLevel: 'SECRET',
  },
  {
    id: 41,
    title: 'Storage Administrator',
    category: 'IT & Digital Identity',
    workDescription: 'Manages file storage, capacity, availability and backups.',
    filesUsed: 'Maintain MinIO storage and encrypted asset availability',
    aegisSystemRole: 'SYSTEM_ADMIN',
    clearanceLevel: 'CONFIDENTIAL',
  },
  {
    id: 42,
    title: 'Incident Response Specialist',
    category: 'IT & Digital Identity',
    workDescription: 'Investigates and responds to security incidents.',
    filesUsed: 'Investigate suspicious access and preserve evidence',
    aegisSystemRole: 'SECURITY_OFFICER',
    clearanceLevel: 'TOP_SECRET',
  },
  {
    id: 43,
    title: 'Internal Security Auditor',
    category: 'IT & Digital Identity',
    workDescription: 'Reviews security controls and compliance evidence.',
    filesUsed: 'Read audit logs and access histories without modifying them',
    aegisSystemRole: 'AUDITOR',
    clearanceLevel: 'TOP_SECRET',
  },

  // =========================================================================
  // 5. Business, administration and support employees (44 - 55)
  // =========================================================================
  {
    id: 44,
    title: 'Human Resources (HR) Officer',
    category: 'Business & Administration',
    workDescription: 'Handles recruitment, employee records, training and personnel administration.',
    filesUsed: 'Authorized HR documents and personnel records',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'CONFIDENTIAL',
  },
  {
    id: 45,
    title: 'Finance Officer',
    category: 'Business & Administration',
    workDescription: 'Manages accounting, budgets, payments and financial reporting.',
    filesUsed: 'Financial statements, budget files',
    aegisSystemRole: 'AUDITOR',
    clearanceLevel: 'CONFIDENTIAL',
  },
  {
    id: 46,
    title: 'Accounts Officer',
    category: 'Business & Administration',
    workDescription: 'Processes invoices, payments and accounting entries.',
    filesUsed: 'Invoices, vouchers, accounting records',
    aegisSystemRole: 'AUDITOR',
    clearanceLevel: 'CONFIDENTIAL',
  },
  {
    id: 47,
    title: 'Procurement Officer',
    category: 'Business & Administration',
    workDescription: 'Purchases materials, components and services.',
    filesUsed: 'Purchase orders, procurement documents',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'CONFIDENTIAL',
  },
  {
    id: 48,
    title: 'Supply Chain Manager',
    category: 'Business & Administration',
    workDescription: 'Coordinates suppliers, inventory and material delivery.',
    filesUsed: 'Supply schedules, inventory and supplier records',
    aegisSystemRole: 'DEPT_MANAGER',
    clearanceLevel: 'CONFIDENTIAL',
  },
  {
    id: 49,
    title: 'Stores / Inventory Officer',
    category: 'Business & Administration',
    workDescription: 'Maintains stock, materials and inventory records.',
    filesUsed: 'Stock registers, material issue records',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'RESTRICTED',
  },
  {
    id: 50,
    title: 'Contracts Officer',
    category: 'Business & Administration',
    workDescription: 'Handles contracts, terms and contractual documentation.',
    filesUsed: 'Contracts, approved agreements',
    aegisSystemRole: 'AUDITOR',
    clearanceLevel: 'SECRET',
  },
  {
    id: 51,
    title: 'Legal Officer',
    category: 'Business & Administration',
    workDescription: 'Reviews legal documents, compliance and disputes.',
    filesUsed: 'Legal records, agreements',
    aegisSystemRole: 'AUDITOR',
    clearanceLevel: 'SECRET',
  },
  {
    id: 52,
    title: 'Marketing / Sales Officer',
    category: 'Business & Administration',
    workDescription: 'Handles customer relationships, proposals and business development.',
    filesUsed: 'Approved proposals, customer documents',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'CONFIDENTIAL',
  },
  {
    id: 53,
    title: 'Customer Support Engineer',
    category: 'Business & Administration',
    workDescription: 'Supports customers and resolves product-related issues.',
    filesUsed: 'Authorized service and troubleshooting records',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'SECRET',
  },
  {
    id: 54,
    title: 'Safety Officer',
    category: 'Business & Administration',
    workDescription: 'Monitors workplace safety and industrial compliance.',
    filesUsed: 'Safety procedures, incident reports',
    aegisSystemRole: 'QA_VERIFIER',
    clearanceLevel: 'RESTRICTED',
  },
  {
    id: 55,
    title: 'Facilities / Administration Officer',
    category: 'Business & Administration',
    workDescription: 'Manages buildings, facilities and administrative services.',
    filesUsed: 'Facility records, approved administrative files',
    aegisSystemRole: 'ENGINEER',
    clearanceLevel: 'UNCLASSIFIED',
  },

  // =========================================================================
  // 6. Other people who may interact with BEL (56 - 64)
  // =========================================================================
  {
    id: 56,
    title: 'Security Guard',
    category: 'External & Other',
    workDescription: 'Controls physical entry and monitors premises.',
    filesUsed: 'No technical asset access by default',
    aegisSystemRole: 'EXTERNAL_COLLABORATOR',
    clearanceLevel: 'UNCLASSIFIED',
  },
  {
    id: 57,
    title: 'External Vendor',
    category: 'External & Other',
    workDescription: 'Supplies equipment, components or services.',
    filesUsed: 'Access only to specifically approved supplier documents',
    aegisSystemRole: 'EXTERNAL_COLLABORATOR',
    clearanceLevel: 'RESTRICTED',
  },
  {
    id: 58,
    title: 'Contractor',
    category: 'External & Other',
    workDescription: 'Performs assigned technical or non-technical work.',
    filesUsed: 'Limited access for the contract duration',
    aegisSystemRole: 'EXTERNAL_COLLABORATOR',
    clearanceLevel: 'RESTRICTED',
  },
  {
    id: 59,
    title: 'Consultant',
    category: 'External & Other',
    workDescription: 'Provides specialized technical or business expertise.',
    filesUsed: 'Access to approved documents within the assignment',
    aegisSystemRole: 'EXTERNAL_COLLABORATOR',
    clearanceLevel: 'SECRET',
  },
  {
    id: 60,
    title: 'Intern / Trainee',
    category: 'External & Other',
    workDescription: 'Learns and assists under supervision.',
    filesUsed: 'Restricted access to assigned training or project files',
    aegisSystemRole: 'EXTERNAL_COLLABORATOR',
    clearanceLevel: 'UNCLASSIFIED',
  },
  {
    id: 61,
    title: 'Customer / Defence Representative',
    category: 'External & Other',
    workDescription: 'Reviews approved deliverables or participates in acceptance testing.',
    filesUsed: 'Access to explicitly authorized deliverables',
    aegisSystemRole: 'EXTERNAL_COLLABORATOR',
    clearanceLevel: 'TOP_SECRET',
  },
  {
    id: 62,
    title: 'Government / Compliance Inspector',
    category: 'External & Other',
    workDescription: 'Performs authorized inspection or compliance reviews.',
    filesUsed: 'Read-only access to approved evidence and records',
    aegisSystemRole: 'AUDITOR',
    clearanceLevel: 'SECRET',
  },
  {
    id: 63,
    title: 'External Auditor',
    category: 'External & Other',
    workDescription: 'Independently reviews specified records and controls.',
    filesUsed: 'Time-limited, read-only access to the audit scope',
    aegisSystemRole: 'AUDITOR',
    clearanceLevel: 'SECRET',
  },
  {
    id: 64,
    title: 'Retired Employee / Pensioner',
    category: 'External & Other',
    workDescription: 'Uses designated post-employment services, such as pension-related facilities.',
    filesUsed: 'No project asset access by default',
    aegisSystemRole: 'EXTERNAL_COLLABORATOR',
    clearanceLevel: 'UNCLASSIFIED',
  },
];

// =========================================================================
// 7. 5-Step File Lifecycle in AegisChain
// =========================================================================
export const FILE_LIFECYCLE_STEPS = [
  {
    step: 1,
    name: 'Project Manager uploads a design file',
    description: 'The backend encrypts the file (AES-256-GCM), stores it in MinIO, calculates its cryptographic hash, and records the required metadata on Hyperledger Fabric / Besu.',
    technicalDetails: 'Payload isolated off-chain; only SHA-256 hash and DID anchor are written to smart contract state.',
  },
  {
    step: 2,
    name: 'Design Engineer requests access',
    description: 'The engineer authenticates using a Passkey (FIDO2) and Google Authenticator (TOTP), then requests access to the specific design file with a mission justification.',
    technicalDetails: 'Zero-trust dual factor verification; request signed by requester DID with requested duration (1-8 hours).',
  },
  {
    step: 3,
    name: 'Authorized manager approves the request',
    description: 'The backend checks the manager\'s permissions and grants access for the approved scope and duration under strict separation of duties.',
    technicalDetails: 'Multi-signature smart contract issuance; self-approval is mathematically barred.',
  },
  {
    step: 4,
    name: 'Engineer downloads and verifies the file',
    description: 'The backend checks authorization, retrieves the encrypted asset, permits secure client-side decryption, and verifies integrity against the trusted on-chain hash.',
    technicalDetails: 'Client computes SHA-256 via browser Web Crypto API; if 1 bit differs from on-chain anchor, decryption is aborted.',
  },
  {
    step: 5,
    name: 'The system records the activity',
    description: 'The audit module records the relevant event on the immutable ledger, while security personnel can investigate suspicious activity according to their permissions.',
    technicalDetails: 'Permanent IBFT 2.0 block commit; velocity monitors trigger auto-freeze on rapid download spikes (>3/hr).',
  },
];

// =========================================================================
// 8. Important Security Rules for a Defence Use Case
// =========================================================================
export const DEFENCE_SECURITY_RULES = [
  {
    rule: 'Least privilege',
    description: 'Employees should receive only the access required for their jobs. Zero default trust across all network nodes.',
  },
  {
    rule: 'Separation of duties',
    description: 'The person uploading a sensitive file should not automatically have unrestricted authority to approve every request for it.',
  },
  {
    rule: 'Passkey + MFA',
    description: 'Require both authentication factors (FIDO2 WebAuthn + RFC 6238 TOTP) according to login policy, with secure revocation.',
  },
  {
    rule: 'Temporary access',
    description: 'Vendor, consultant and contractor permissions should expire automatically on exact block timestamps.',
  },
  {
    rule: 'Integrity verification',
    description: 'A matching hash demonstrates that the checked file matches the trusted reference; aborts immediately on 1-bit discrepancy.',
  },
  {
    rule: 'Blockchain privacy',
    description: 'Store hashes, permission events and suitable metadata on the ledger—not confidential defence documents or secret keys.',
  },
  {
    rule: 'Auditor protection',
    description: 'Audit access should generally be read-only, and audit records should be protected against unauthorized modification.',
  },
  {
    rule: 'Admin protection',
    description: 'Administrative privileges should not automatically grant permission to decrypt every asset or view raw engineering payloads.',
  },
];
