import axios from 'axios';
import { ZookeeperTreeResponse } from '../interfaces/zookeeperTreeResponse';

export class ZookeeperTreeService {
  constructor(private baseUrl: string) {}

  async getZookeeperTree(params?: Record<string, string | boolean>): Promise<any> {
    let url = `${this.baseUrl}/solr/admin/zookeeper?wt=json`;
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url += `&${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
        }
      }
    }
    const response = await axios.get(url);
    return response.data;
  }
}
