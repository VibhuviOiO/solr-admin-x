// Service to fetch Info Threads from Solr API
import axios from 'axios';
import { InfoThreadsResponse } from '../interfaces/infoThreadsResponse';

const INFO_THREADS_URL = process.env.INFO_THREADS_URL || 'http://localhost:8983/solr/admin/info/threads';

export class InfoThreadsService {
  async getInfoThreads(): Promise<InfoThreadsResponse> {
    const response = await axios.get<InfoThreadsResponse>(INFO_THREADS_URL);
    return response.data;
  }
}

export const infoThreadsService = new InfoThreadsService();
