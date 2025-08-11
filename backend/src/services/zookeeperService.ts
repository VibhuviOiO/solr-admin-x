import axios from "axios";
import { ZookeeperTreeResponse } from "../interfaces/zookeeperTreeResponse";

export class ZookeeperService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getZookeeperTree(): Promise<ZookeeperTreeResponse> {
    const response = await axios.get(`${this.baseUrl}/solr/admin/zookeeper`);
    return response.data as ZookeeperTreeResponse;
  }
}
