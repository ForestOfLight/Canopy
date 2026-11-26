export class InvalidPresetError extends Error {
    constructor(reason) {
        super(`[Canopy] Invalid timeline preset: ${reason.translate}.`);
        this.name = 'InvalidPresetError';
        this.reason = reason;
    }
}
