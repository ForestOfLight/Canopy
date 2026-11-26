export class InvalidTrackTargetError extends Error {
    constructor(reason) {
        super(`[Canopy] Invalid track target: ${reason.translate}.`);
        this.name = 'InvalidTrackTargetError';
        this.reason = reason;
    }
}
