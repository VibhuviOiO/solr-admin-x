import { loadDatacenterConfig } from '../utils/datacenter';
import axios from 'axios';
import { DataCenter, ClusterNode } from '../interfaces/datacenterConfig';

interface GetCoresOptions {
  datacenter?: string;
  node?: string;
  query?: any;
}

export async function getCores({ datacenter, node, query }: GetCoresOptions) {
  // Load datacenter config
  const dcData = loadDatacenterConfig();
  let nodesToTry: { host: string; port: number }[] = [];

  if (datacenter) {
    const dc: DataCenter | undefined = dcData.datacenters.find((dc: DataCenter) => dc.name === datacenter);
    if (!dc) throw new Error('Datacenter not found');
    if (node) {
      const n: ClusterNode | undefined = dc.nodes.find((n: ClusterNode) => n.name === node);
      if (!n) throw new Error('Node not found');
      nodesToTry = [n];
    } else {
      nodesToTry = dc.nodes;
    }
  } else if (node) {
    for (const dc of dcData.datacenters) {
      const n: ClusterNode | undefined = dc.nodes.find((n: ClusterNode) => n.name === node);
      if (n) {
        nodesToTry = [n];
        break;
      }
    }
    if (nodesToTry.length === 0) throw new Error('Node not found');
  } else {
    // Try all nodes in all datacenters
    for (const dc of dcData.datacenters) {
      nodesToTry.push(...dc.nodes);
    }
  }

  if (nodesToTry.length === 0) throw new Error('No Solr node found');

  // Build query string
  let queryString = 'indexInfo=false&wt=json';
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (key !== 'datacenter' && key !== 'node' && value !== undefined) {
        queryString += `&${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`;
      }
    }
  }

  // Try each node until one responds successfully
  let lastError: Error | null = null;
  for (const n of nodesToTry) {
    const solrUrl = `http://${n.host}:${n.port}/solr`;
    const url = `${solrUrl}/admin/cores?${queryString}`;
    try {
      const resp = await axios.get(url, { timeout: 4000 });
      if (resp.status === 200) {
        return resp.data;
      } else {
        lastError = new Error(`Solr API error: ${resp.status}`);
      }
    } catch (err: any) {
      lastError = err;
    }
  }
  throw lastError || new Error('All Solr nodes failed');
}
