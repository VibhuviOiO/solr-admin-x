// Interface for Logging Info API (with history)
export interface LoggingInfoResponse {
  responseHeader: import('./solrResponseHeader').SolrResponseHeader;
  info: {
    levels: string[];
    last: number;
    buffer: number;
  };
  history: {
    numFound: number;
    start: number;
    numFoundExact: boolean;
    docs: Array<{
      time: string;
      level: string;
      logger: string;
      message: string;
      node_name?: string;
      core: string;
    }>;
  };
  watcher: string;
}
