import { BaseMetrics } from './BaseMetrics';
/**
 * Metrics Collector - collects metrics for CPU, Memory, Network
 */
export declare class HostMetrics extends BaseMetrics {
    private _batchUpdateCpuUsages;
    private _batchUpdateProcessCpuUsages;
    private _batchUpdateMemUsages;
    private _batchUpdateProcessMemUsage;
    private _batchUpdateNetworkData;
    /**
     * Creates metrics
     */
    protected _createMetrics(): void;
    /**
     * Starts collecting metrics
     */
    start(): void;
    private _cpuTime;
    private _cpuUtilization;
    private _memoryUsage;
    private _memoryUtilization;
    private _processCpuTime;
    private _processCpuUtilization;
    private _processMemoryUsage;
    private _networkDropped;
    private _networkErrors;
    private _networkIo;
}
//# sourceMappingURL=metric.d.ts.map