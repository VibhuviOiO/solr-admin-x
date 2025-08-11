// Shared types and logic for logging endpoints
import * as fs from 'fs';
import { SolrResponseHeader } from '../interfaces/solrResponseHeader';

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

export interface SolrLogger {
  name: string;
  level: string;
  set: boolean;
}

export interface SolrLoggingResponse {
  responseHeader: SolrResponseHeader;
  levels: string[];
  loggers: SolrLogger[];
  watcher: string;
}

export interface NodeLoggingResponse {
  nodeId: string;
  nodeName: string;
  host: string;
  port: number;
  status: 'online' | 'offline' | 'error';
  loggingInfo?: {
    levels: string[];
    loggers: SolrLogger[];
    watcher: string;
    rootLogger: {
      level: string;
    };
  };
  error?: string;
  timestamp: string;
}

export function getDatacenterConfig(): DatacenterConfig {
  if (!process.env.DC_CONFIG_PATH) {
    throw new Error('DC_CONFIG_PATH environment variable is required. Please set it to point to your datacenter configuration file.');
  }
  const configPath = process.env.DC_CONFIG_PATH;
  try {
    const dcDataRaw = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(dcDataRaw);
  } catch (error) {
    throw new Error(`Failed to load datacenter config from ${configPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
