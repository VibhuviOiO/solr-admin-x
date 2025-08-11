export interface MetricsResponse {
  responseHeader: {
    status: number;
  responseHeader: import('./solrResponseHeader').SolrResponseHeader;
  };
  metrics: Record<string, any>;
}
