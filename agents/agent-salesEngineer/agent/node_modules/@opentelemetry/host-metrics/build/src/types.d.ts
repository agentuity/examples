/**
 * CPU usage data
 */
export interface CpuUsageData {
    cpuNumber: string;
    system: number;
    user: number;
    idle: number;
    nice: number;
    interrupt: number;
    systemP: number;
    userP: number;
    idleP: number;
    interruptP: number;
    niceP: number;
}
/**
 * Process CPU usage data
 */
export interface ProcessCpuUsageData {
    system: number;
    user: number;
    systemP: number;
    userP: number;
}
/**
 * Memory data
 */
export interface MemoryData {
    used: number;
    free: number;
    usedP: number;
    freeP: number;
}
//# sourceMappingURL=types.d.ts.map