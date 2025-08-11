// Interface for Info Threads API response
export interface InfoThreadsResponse {
  responseHeader: {
    status: number;
  responseHeader: import('./solrResponseHeader').SolrResponseHeader;
  };
  system: {
    threadCount: {
      current: number;
      peak: number;
      daemon: number;
    };
    threadDump: Array<string | ThreadDumpEntry>;
  };
}

export interface ThreadDumpEntry {
  id: number;
  name: string;
  state: string;
  cpuTime: string;
  userTime: string;
  stackTrace: string[];
  lock?: string;
  'lock-waiting'?: {
    name: string;
    owner: string | null;
  };
  'synchronizers-locked'?: string[];
  'monitors-locked'?: string[];
  native?: boolean;
}
