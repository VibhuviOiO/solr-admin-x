import * as fs from 'fs';

export function loadDatacenterConfig() {
  if (process.env.DC_CONFIG_JSON) {
    try {
      return JSON.parse(process.env.DC_CONFIG_JSON);
    } catch (error) {
      throw new Error('Invalid DC_CONFIG_JSON format');
    }
  }
  if (!process.env.DC_CONFIG_PATH) {
    throw new Error('DC_CONFIG_PATH environment variable is required.');
  }
  const configPath = process.env.DC_CONFIG_PATH;
  try {
    const dcDataRaw = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(dcDataRaw);
  } catch (error) {
    throw new Error('Failed to load datacenter config');
  }
}
