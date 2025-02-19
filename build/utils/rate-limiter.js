export class RateLimiter {
    timestamps = [];
    maxRequests;
    interval;
    constructor(maxRequests, interval) {
        this.maxRequests = maxRequests;
        this.interval = interval;
    }
    async acquire() {
        const now = Date.now();
        this.timestamps = this.timestamps.filter(time => now - time < this.interval);
        if (this.timestamps.length >= this.maxRequests) {
            const oldestTimestamp = this.timestamps[0];
            const waitTime = this.interval - (now - oldestTimestamp);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        this.timestamps.push(now);
    }
}
