export type PagedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed';
export type WorkOrderStatus = 'draft' | 'sent' | 'approved';
export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
export type BillStatus = 'pending' | 'approved' | 'rejected';
export type PaymentMode = 'cash' | 'upi' | 'rtgs' | 'cheque';
export type ExpenseCategory = 'staff' | 'office' | 'transport' | 'travel';
export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export type ExpenseType = {
  id: string;
  name: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type PaymentType = 'material' | 'labour' | 'rent' | 'accommodation' | 'office_maintenance' | 'transport' | 'travel' | 'staff_expense' | 'office_maintenance';
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

export type Project = {
  id: string;
  name: string;
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
  status: WorkOrderStatus;
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

export type PurchaseOrderStatus = 'draft' | 'sent' | 'approved';

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
  createdAt: string;
};

export type DailyWorker = {
  id: string;
  reportId: string;
  name: string;
  phone?: string | null;
  tradeId?: string | null;
  trade: string;
  inTime?: string | null;
  outTime?: string | null;
  remarks?: string | null;
};

export type DailyLabourReport = {
  id: string;
  projectId: string;
  project?: Project;
  reportDate: string;
  remarks?: string | null;
  morningPhoto1Url?: string | null;
  morningPhoto2Url?: string | null;
  eveningPhoto1Url?: string | null;
  eveningPhoto2Url?: string | null;
  workers: DailyWorker[];
  createdById: string;
  createdBy?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
};
