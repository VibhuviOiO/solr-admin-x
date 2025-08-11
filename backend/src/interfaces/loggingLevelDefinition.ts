// Interface for Solr logging levels response
export interface LoggingLevelDefinition {
  responseHeader: import('./solrResponseHeader').SolrResponseHeader;
  levels: string[];
  loggers: Array<{
    name: string;
    level: string;
    set: boolean;
  }>;
  watcher: string;
}
