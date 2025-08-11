// Minimal interface for Solr security authentication/authorization response
export interface SecurityAuthResponse {
  responseHeader: {
    status: number;
  responseHeader: import('./solrResponseHeader').SolrResponseHeader;
  };
  [key: string]: any;
}
