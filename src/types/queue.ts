export type QueueStatus =
  | "WAITING"
  | "CALLED"
  | "SERVING"
  | "COMPLETED"
  | "SKIPPED"
  | "CANCELLED";

export type StudentQueue = {
  id: string;
  tokenLabel: string;
  status: QueueStatus;
  reason: string;
  note: string | null;
  peopleAhead: number;
  estimatedWait: number;
  nowServingToken: string | null;
  counterLabel: string | null;
  joinedAt: string;
  calledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  service: {
    id: string;
    title: string;
    department: string;
  };
};

export type ActiveQueueResponse = {
  success: true;
  data: {
    queue: StudentQueue | null;
  };
};

export type QueueHistoryResponse = {
  success: true;
  data: {
    history: StudentQueue[];
    completedCount: number;
  };
};

export type JoinQueueInput = {
  serviceId: string;
  reason: string;
  note: string;
};

export type JoinQueueResponse = {
  success: true;
  data: {
    queue: StudentQueue;
  };
  message: string;
};

export type QueueMessageResponse = {
  success: true;
  message: string;
};

export type QueueErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};
