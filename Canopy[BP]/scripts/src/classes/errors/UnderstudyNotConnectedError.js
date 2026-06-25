export class UnderstudyNotConnectedError extends Error {
    constructor(name) {
        super(`[Canopy] Simulated player '${name}' is not connected.`);
        this.name = 'UnderstudyNotConnectedError';
    }
}
