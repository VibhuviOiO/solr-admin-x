// Interface for Solr Info Properties API response
export interface SolrInfoPropertiesResponse {
  responseHeader: {
    status: number;
  responseHeader: import('./solrResponseHeader').SolrResponseHeader;
  };
  'system.properties': {
    [key: string]: string;
  };
}
