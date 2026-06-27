import type { QueueStatus } from "./queue";

export type StaffServiceSummary = {
  id: string;
  title: string;
  department: string;
  isOpen: boolean;
  activeCounters: number;
  activeQueueCount: number;
};

export type StaffQueueEntry = {
  id: string;
  tokenLabel: string;
  status: Extract<QueueStatus, "WAITING" | "CALLED" | "SERVING">;
  reason: string;
  note: string | null;
  joinedAt: string;
  student: {
    fullName: string;
    studentId: string | null;
  };
  service: {
    id: string;
    title: string;
    department: string;
  };
  counterLabel: string | null;
};

export type AnalyticsPoint = {
  label: string;
  value: number;
};

export type ServiceAnalytics = {
  id: string;
  title: string;
  visits: number;
  percentage: number;
};

export type SystemLogEntry = {
  id: string;
  tokenLabel: string;
  serviceTitle: string;
  studentName: string;
  status: QueueStatus;
  message: string;
  timestamp: string;
};

export type StaffAnalyticsData = {
  summary: {
    totalStudentsServed: number;
    averageWaitTime: number;
    averageServiceTime: number;
    noShowRate: number;
    activeCounters: number;
    totalCounters: number;
  };
  visitorsOverTime: AnalyticsPoint[];
  averageWaitTrend: AnalyticsPoint[];
  topServices: ServiceAnalytics[];
  peakHours: AnalyticsPoint[];
  logs: SystemLogEntry[];
};

export type StaffDashboardResponse = {
  success: true;
  data: {
    services: StaffServiceSummary[];
    queueEntries: StaffQueueEntry[];
  };
};

export type StaffAnalyticsResponse = {
  success: true;
  data: StaffAnalyticsData;
};

export type StaffQueueAction = "CALLED" | "SERVING" | "COMPLETED" | "SKIPPED";

export type StaffMessageResponse = {
  success: true;
  message: string;
};

export type StaffErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type AdminCounter = {
  id: string;
  label: string;
  isActive: boolean;
  staff: {
    id: string;
    fullName: string;
    email: string;
    isActive: boolean;
  } | null;
};

export type AdminService = StaffServiceSummary & {
  description: string;
  averageServiceMinutes: number;
  counters: AdminCounter[];
};

export type AdminDepartment = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  serviceCount: number;
  activeQueueCount: number;
};

export type AdminStaffCounter = {
  id: string;
  label: string;
  isActive: boolean;
  service: {
    id: string;
    title: string;
  };
};

export type AdminStaffUser = {
  id: string;
  fullName: string;
  email: string;
  role: "STAFF" | "ADMIN";
  isActive: boolean;
  assignedCounters: AdminStaffCounter[];
  createdAt: string;
};

export type CreateStaffMemberInput = {
  fullName: string;
  email: string;
  password: string;
  counterIds: string[];
};

export type CreateStaffMemberResponse = {
  success: true;
  data: {
    staff: {
      id: string;
      fullName: string;
      email: string;
    };
  };
  message: string;
};

export type AdminData = {
  departments: AdminDepartment[];
  services: AdminService[];
  staff: AdminStaffUser[];
};

export type AdminDataResponse = {
  success: true;
  data: AdminData;
};
