import axios from 'axios';
import { LoggingInfoResponse } from '../interfaces/loggingInfoResponse';
import { LoggingLevelDefinition } from '../interfaces/loggingLevelDefinition';

export class Service {
  static async getLoggingInfo(nodeUrl: string, since: number): Promise<LoggingInfoResponse> {
    const url = `${nodeUrl}/admin/info/logging?wt=json&since=${since}`;
    const response = await axios.get<LoggingInfoResponse>(url);
    return response.data;
  }

  static async getLogLevels(nodeUrl: string): Promise<LoggingLevelDefinition> {
    const url = `${nodeUrl}/admin/info/logging?wt=json`;
    const response = await axios.get<LoggingLevelDefinition>(url);
    return response.data;
  }
}
