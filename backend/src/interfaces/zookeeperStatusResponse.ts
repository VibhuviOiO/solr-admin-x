export interface ZookeeperStatusDetail {
  [key: string]: string | number | boolean | null | undefined;
  role?: string;
  version?: string;
  host?: string;
  serverId?: string;
  ok?: boolean;
  zk_server_state?: string;
}

export interface ZookeeperStatus {
  mode: string;
  dynamicReconfig: boolean;
  ensembleSize: number;
  details: ZookeeperStatusDetail[];
  zkHost: string;
  status: string;
}

export interface ZookeeperStatusResponse {
  responseHeader: {
    status: number;
  responseHeader: import('./solrResponseHeader').SolrResponseHeader;
  };
  zkStatus: ZookeeperStatus;
}
