import { performance } from 'perf_hooks';
class Telemetry {
    events = [];
    maxEvents = 1000;
    record(event) {
        this.events.push(event);
        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }
        this.logEvent(event);
    }
    logEvent(event) {
        const { tool, operation, metrics, error } = event;
        const status = metrics.success ? 'SUCCESS' : 'FAILED';
        const cached = metrics.cached ? '[CACHED]' : '';
        const rateLimited = metrics.rateLimited ? '[RATE_LIMITED]' : '';
        console.log(`[${new Date(event.timestamp).toISOString()}] ${status} ${tool}:${operation} ` +
            `${cached} ${rateLimited} (${metrics.duration}ms)` +
            (error ? `\nError: ${error.message}` : ''));
    }
    getMetrics() {
        const now = Date.now();
        const last5Minutes = this.events.filter(e => now - e.timestamp < 5 * 60 * 1000);
        return {
            totalRequests: last5Minutes.length,
            successRate: this.calculateSuccessRate(last5Minutes),
            averageDuration: this.calculateAverageDuration(last5Minutes),
            cacheHitRate: this.calculateCacheHitRate(last5Minutes),
            rateLimitHitRate: this.calculateRateLimitHitRate(last5Minutes),
        };
    }
    calculateSuccessRate(events) {
        if (events.length === 0)
            return 1;
        return events.filter(e => e.metrics.success).length / events.length;
    }
    calculateAverageDuration(events) {
        if (events.length === 0)
            return 0;
        return events.reduce((sum, e) => sum + e.metrics.duration, 0) / events.length;
    }
    calculateCacheHitRate(events) {
        if (events.length === 0)
            return 0;
        return events.filter(e => e.metrics.cached).length / events.length;
    }
    calculateRateLimitHitRate(events) {
        if (events.length === 0)
            return 0;
        return events.filter(e => e.metrics.rateLimited).length / events.length;
    }
}
export const telemetry = new Telemetry();
export function withTelemetry(tool, operation, fn) {
    const start = performance.now();
    const timestamp = Date.now();
    return fn()
        .then((result) => {
        telemetry.record({
            timestamp,
            tool,
            operation,
            metrics: {
                duration: performance.now() - start,
                success: true,
                cached: false,
                rateLimited: false,
            },
        });
        return result;
    })
        .catch((error) => {
        telemetry.record({
            timestamp,
            tool,
            operation,
            metrics: {
                duration: performance.now() - start,
                success: false,
                cached: false,
                rateLimited: error.code === 'rate_limited',
            },
            error,
        });
        throw error;
    });
}
