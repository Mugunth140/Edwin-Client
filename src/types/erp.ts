export type PagedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed';
export type ProjectNature = 'brownfield' | 'greenfield';
export type JobType = 'contracting' | 'design_build' | 'design';
export type JobStatus = 'bidding' | 'awarded';
export type WorkOrderStatus = 'draft' | 'sent' | 'approved';
export type SubcontractWorkOrderStatus = 'pending' | 'admin_approved' | 'approved' | 'rejected';
export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
export type BillStatus = 'pending' | 'admin_approved' | 'approved' | 'rejected';
export type PaymentMode = 'cash' | 'upi' | 'rtgs' | 'cheque';
export type ExpenseCategory = 'staff' | 'office' | 'transport' | 'travel';
export type ExpenseStatus = 'pending' | 'admin_approved' | 'approved' | 'rejected';

export type ExpenseType = {
  id: string;
  name: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type PaymentType = 'material' | 'labour' | 'rent' | 'accommodation' | 'office_maintenance' | 'transport' | 'travel' | 'staff_expense';
export type TimesheetStatus = 'pending' | 'verified' | 'admin_approved' | 'approved' | 'rejected';
export type ItemDescription = {
  id: string;
  name: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type WorkCategory = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Trade = {
  id: string;
  name: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectCategory = {
  id: string;
  name: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type Project = {
  id: string;
  name: string;
  projectCode: string;
  description?: string | null;
  location?: string | null;
  email?: string | null;
  phone1?: string | null;
  phone2?: string | null;
  clientName?: string | null;
  status: ProjectStatus;
  completionPct: number | string;
  estimatedBudget: number | string;
  startDate?: string | null;
  endDate?: string | null;
  projectCategoryId?: string | null;
  projectCategory?: ProjectCategory | null;
  projectNature?: ProjectNature | null;
  jobType?: JobType | null;
  jobStatus?: JobStatus;
  financialYear?: string | null;
  dateOfCreation?: string | null;
  resources?: AppUser[];
  createdAt?: string;
  updatedAt?: string;
};

export type Vendor = {
  id: string;
  name: string;
  address?: string | null;
  gstNumber?: string | null;
  state?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Subcontractor = {
  id: string;
  name: string;
  gstNumber?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  workCategory: WorkCategory;
  createdAt?: string;
  updatedAt?: string;
};

export type SubcontractWorkOrder = {
  id: string;
  woNumber: string;
  projectId: string;
  subcontractorId: string;
  workCategoryId: string;
  project?: Project;
  subcontractor?: Subcontractor;
  workCategory?: WorkCategory;
  description?: string | null;
  quantity: number | string;
  unit: string;
  rate: number | string;
  amount: number | string;
  gstPercentage: number | string;
  gstAmount: number | string;
  totalAmount: number | string;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
  status: SubcontractWorkOrderStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type SiteEngineer = {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  employeeId?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  salaryGradeId?: string | null;
  salaryGrade?: Salary | null;
  projects?: Project[];
  createdAt?: string;
};

export type AccountsManager = {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  employeeId?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  salaryGradeId?: string | null;
  salaryGrade?: Salary | null;
  projects?: Project[];
  createdAt?: string;
};

export type PurchaseTeamMember = {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  employeeId?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  projects?: Project[];
  salaryGradeId?: string | null;
  salaryGrade?: Salary | null;
  createdAt?: string;
};

export type LineItem = {
  id?: string;
  description: string;
  quantity: number | string;
  unit: string;
  rate: number | string;
  amount?: number | string;
  billedQuantity?: number | string;
};

export type WorkOrder = {
  id: string;
  woNumber: string;
  vendorId: string;
  projectId: string;
  vendor?: Vendor;
  project?: Project;
  status: WorkOrderStatus;
  terms?: string | null;
  totalAmount: number | string;
  gstAmount: number | string;
  cgstAmount: number | string;
  sgstAmount: number | string;
  igstAmount: number | string;
  items?: LineItem[];
  createdAt?: string;
};

export type SalesInvoice = {
  id: string;
  invoiceNumber: string;
  projectId?: string | null;
  project?: Project;
  status: InvoiceStatus;
  totalAmount: number | string;
  paidAmount: number | string;
  gstAmount: number | string;
  dueDate?: string | null;
  paidAt?: string | null;
  items?: LineItem[];
  payments?: Payment[];
  createdAt?: string;
};

export type PurchaseOrderStatus = 'draft' | 'sent' | 'pending' | 'admin_approved' | 'approved' | 'rejected';

export type EnquiryItem = {
  description: string;
  quantity: number;
};

export type PurchaseEnquiry = {
  id: string;
  enquiryNo: string;
  vendorId: string;
  projectId: string;
  vendor?: Vendor;
  project?: Project;
  notes?: string | null;
  items: EnquiryItem[];
  status: string;
  createdAt?: string;
};

export type PurchaseOrder = {
  id: string;
  poNumber: string;
  vendorId: string;
  projectId: string;
  vendor?: Vendor;
  project?: Project;
  paymentTerms?: string | null;
  status: PurchaseOrderStatus;
  totalAmount: number | string;
  items?: LineItem[];
  billFileUrl?: string | null;
  billFileKey?: string | null;
  createdAt?: string;
};

export type Expense = {
  id: string;
  category?: ExpenseCategory | null;
  expenseTypeId?: string | null;
  expenseType?: ExpenseType | null;
  description: string;
  amount: number | string;
  expenseDate: string;
  paidBy?: string | null;
  projectId?: string | null;
  project?: Project;
  tradeId?: string | null;
  trade?: Trade;
  remarks?: string | null;
  receiptUrls?: string[] | null;
  sitePhotoUrls?: string[] | null;
  status?: ExpenseStatus;
  createdBy?: string | null;
  creator?: { id: string; name: string; role: string };
  createdAt?: string;
};

export type DashboardProject = {
  id: string;
  name: string;
  completionPct: number | string;
};

export type DashboardData = {
  totalProjects: number;
  projects: DashboardProject[];
  revenueVsCost: {
    totalRevenue: number;
    totalCost: number;
    totalInflow?: number;
  };
  weeklyLabour: Array<{
    weekStart: string;
    headcount: number;
  }>;
  criticalActions: unknown[];
};

export type AccountsDashboardData = {
  kpis: {
    totalReceivable: number;
    pendingInvoiceCount: number;
    totalPayable: number;
    pendingBillCount: number;
    monthInflow: number;
    monthOutflow: number;
  };
  recentPayments: Array<{
    id: string;
    amount: number | string;
    date: string;
    mode: string;
    type: string;
    party: string;
  }>;
};

export type ExpenseSummary = {
  category: ExpenseCategory;
  total: number | string;
};

export type DrawingCategory = 'structural' | 'as_built' | 'general_arrangement' | 'architectural' | 'hvac' | 'mep';

export type Drawing = {
  id: string;
  projectId: string;
  project?: Project;
  title: string;
  category: DrawingCategory;
  revision: string;
  fileUrl: string;
  fileKey: string;
  uploadedBy?: string | null;
  createdAt: string;
};

export type DprReport = {
  id: string;
  projectId: string;
  project?: Project;
  reportDate: string;
  fileUrl: string;
  fileType: string;
  fileKey: string;
  uploadedBy?: string | null;
  createdAt: string;
};

export type BillItem = {
  id: string;
  billId: string;
  poItemId: string;
  description: string;
  quantity: number | string;
  unit: string;
  rate: number | string;
  orderedQty: number | string;
  billedQty: number | string;
};

export type PurchaseBill = {
  id: string;
  billNumber: string;
  vendorId: string;
  vendor?: Vendor;
  purchaseOrderId?: string | null;
  purchaseOrder?: PurchaseOrder;
  projectId?: string | null;
  project?: Project;
  amount: number | string;
  status: BillStatus;
  paidAmount: number | string;
  billDate: string;
  dueDate?: string | null;
  billFileUrl?: string | null;
  billFileKey?: string | null;
  notes?: string | null;
  billItems?: BillItem[];
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
};

export type Payment = {
  id: string;
  paymentType: PaymentType;
  purchaseBillId?: string | null;
  purchaseBill?: PurchaseBill;
  salesInvoiceId?: string | null;
  salesInvoice?: SalesInvoice;
  expenseId?: string | null;
  expense?: Expense;
  vendorId?: string | null;
  vendor?: Vendor;
  payeeName?: string | null;
  amount: number | string;
  paymentDate: string;
  paymentMode: PaymentMode;
  referenceNumber?: string | null;
  projectId?: string | null;
  project?: Project;
  notes?: string | null;
  timesheetId?: string | null;
  createdAt: string;
};

export type DailyWorker = {
  id: string;
  reportId: string;
  tradeId?: string | null;
  trade: string;
  count: number;
  shift: string;
  inTime?: string | null;
  outTime?: string | null;
  remarks?: string | null;
  morningPhoto1Url?: string | null;
  morningPhoto2Url?: string | null;
  eveningPhoto1Url?: string | null;
  eveningPhoto2Url?: string | null;
};

export type DailyLabourReport = {
  id: string;
  projectId: string;
  project?: Project;
  reportDate: string;
  remarks?: string | null;
  workers: DailyWorker[];
  status: string;
  createdById: string;
  createdBy?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
};

export type TimesheetRow = {
  id?: string;
  projectId?: string | null;
  entryType: string;
  remark?: string | null;
  monHours: number;
  tueHours: number;
  wedHours: number;
  thuHours: number;
  friHours: number;
  satHours: number;
  sunHours: number;
  amount?: number;
};

export type WeeklyTimesheet = {
  id: string;
  siteEngineerId: string;
  weekStart: string;
  weekEnd: string;
  totalHours: number;
  status: TimesheetStatus;
  approvedById?: string | null;
  approvedAt?: string | null;
  rows: TimesheetRow[];
  createdAt?: string;
  updatedAt?: string;
  siteEngineer?: {
    id: string;
    name: string;
    email: string;
    employeeId?: string | null;
    phone?: string | null;
    role?: string;
    salaryGrade?: Salary | null;
  };
};

export type Salary = {
  id: string;
  grades: string;
  expInYears: string;
  monthlySalary: number;
  avgCostPerHr: number;
  bookingCost: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectDetails = {
  project: Project;
  expenses: Expense[];
  subcontractWorkOrders: SubcontractWorkOrder[];
  purchaseBills: PurchaseBill[];
  invoices: SalesInvoice[];
  payments: Payment[];
};
