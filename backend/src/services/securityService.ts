import axios from 'axios';
import { loadDatacenterConfig } from '../utils/datacenter';

export class SecurityService {
  static async getSecurity(type: 'authentication' | 'authorization', node?: string) {
    const dcData = loadDatacenterConfig();
    for (const dc of dcData.datacenters) {
      for (const n of dc.nodes) {
        if (!node || n.name === node) {
          const nodeUrl = `http://${n.host}:${n.port}/solr`;
          try {
            const solrRes = await axios.get(`${nodeUrl}/admin/${type}?wt=json`);
            return solrRes.data;
          } catch (error: any) {
            continue;
          }
        }
      }
    }
    throw { status: 404, message: 'Node not found or Solr security API unavailable' };
  }

  static async postSecurity(type: 'authentication' | 'authorization', body: any, node?: string) {
    const dcData = loadDatacenterConfig();
    for (const dc of dcData.datacenters) {
      for (const n of dc.nodes) {
        if (!node || n.name === node) {
          const nodeUrl = `http://${n.host}:${n.port}/solr`;
          try {
            const solrRes = await axios.post(`${nodeUrl}/admin/${type}?wt=json`, body);
            return solrRes.data;
          } catch (error: any) {
            if (error.response) {
              throw { status: error.response.status, message: error.response.data };
            }
            continue;
          }
        }
      }
    }
    throw { status: 404, message: 'Node not found or Solr security API unavailable' };
  }
}
