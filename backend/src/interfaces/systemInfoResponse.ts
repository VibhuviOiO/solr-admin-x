
export interface SystemInfoResponse {
  responseHeader: {
    status: number;
  responseHeader: import('./solrResponseHeader').SolrResponseHeader;
  };
  mode: string;
  zkHost?: string;
  solr_home: string;
  core_root?: string;
  lucene: {
    "solr-spec-version": string;
    "solr-impl-version": string;
    "lucene-spec-version": string;
    "lucene-impl-version": string;
  };
  jvm: {
    version: string;
    name: string;
    spec?: {
      vendor: string;
      name: string;
      version: string;
    };
    jre?: {
      vendor: string;
      version: string;
    };
    vm?: {
      vendor: string;
      name: string;
      version: string;
    };
    processors: number;
    memory: {
      free: string;
      total: string;
      max: string;
      used: string;
      raw: {
        free: number;
        total: number;
        max: number;
        used: number;
        "used%": number;
      };
    };
    jmx: {
      classpath?: string;
      commandLineArgs: string[];
      startTime: string;
      upTimeMS: number;
    };
  };
  security: {
    tls: boolean;
  };
  system: {
    name: string;
    arch: string;
    availableProcessors: number;
    systemLoadAverage: number;
    version?: string;
    committedVirtualMemorySize?: number;
    cpuLoad?: number;
    freeMemorySize?: number;
    freePhysicalMemorySize: number;
    freeSwapSpaceSize: number;
    processCpuLoad?: number;
    processCpuTime?: number;
    systemCpuLoad?: number;
    totalMemorySize?: number;
    totalPhysicalMemorySize: number;
    totalSwapSpaceSize: number;
    maxFileDescriptorCount: number;
    openFileDescriptorCount: number;
  };
  node: string;
}
