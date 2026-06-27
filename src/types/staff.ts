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
  status: Extract<
    QueueStatus,
    "WAITING" | "CALLED" | "SERVING"
  >;
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

export type StaffDashboardResponse = {
  success: true;
  data: {
    services: StaffServiceSummary[];
    queueEntries: StaffQueueEntry[];
  };
};

export type StaffQueueAction =
  | "CALLED"
  | "SERVING"
  | "COMPLETED"
  | "SKIPPED";

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
