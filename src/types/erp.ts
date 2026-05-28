export type PagedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed';
export type WorkOrderStatus = 'draft' | 'sent' | 'approved';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type ExpenseCategory = 'staff' | 'office' | 'transport' | 'travel';

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
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

export type Customer = {
  id: string;
  name: string;
  state?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
};

export type LineItem = {
  id?: string;
  description: string;
  quantity: number | string;
  unit: string;
  rate: number | string;
  amount?: number | string;
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
  customerId: string;
  projectId?: string | null;
  customer?: Customer;
  project?: Project;
  status: InvoiceStatus;
  totalAmount: number | string;
  gstAmount: number | string;
  dueDate?: string | null;
  paidAt?: string | null;
  items?: LineItem[];
  createdAt?: string;
};

export type PurchaseOrderStatus = 'draft' | 'sent' | 'approved' | 'cancelled';

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
  category: ExpenseCategory;
  description: string;
  amount: number | string;
  expenseDate: string;
  paidBy?: string | null;
  projectId?: string | null;
  project?: Project;
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
  projectId?: string | null;
  project?: Project;
  amount: number | string;
  billDate: string;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
};
