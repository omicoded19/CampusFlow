export type CampusService = {
  id: string;
  iconKey: string;
  department: string;
  title: string;
  description: string;
  reasons: string[];
  waitTime: number;
  peopleWaiting: number;
  activeCounters: number;
  isOpen: boolean;
};

export type ServicesResponse = {
  success: true;
  data: {
    services: CampusService[];
    count: number;
  };
};

export type ServiceResponse = {
  success: true;
  data: {
    service: CampusService;
  };
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};