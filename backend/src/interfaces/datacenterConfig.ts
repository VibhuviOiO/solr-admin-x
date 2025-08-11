// DatacenterConfig interface for Solr admin backend

export interface ClusterNode {
  name: string;
  host: string;
  port: number;
}

export interface DataCenter {
  name: string;
  default?: boolean;
  zookeeperNodes: Array<{ host: string; port: number }>;
  nodes: ClusterNode[];
}

export interface DatacenterConfig {
  datacenters: DataCenter[];
}
