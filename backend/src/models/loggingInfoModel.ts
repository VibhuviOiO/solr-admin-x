import { getDatacenterConfig, ClusterNode } from '../utils/loggingShared';

// Returns the Solr node URL for a given node name (e.g., 'solr1')
export function getNodeUrl(node: string): string {
  const config = getDatacenterConfig();
  for (const dc of config.datacenters) {
    const found = dc.nodes.find((n: ClusterNode) => n.name === node);
    if (found) {
      return `http://${found.host}:${found.port}/solr`;
    }
  }
  throw new Error(`Node '${node}' not found in datacenter config`);
}
