export class UnderstudyConnectedError extends Error {
    constructor(name) {
        super(`[Canopy] Simulated player '${name}' is already connected.`);
        this.name = 'UnderstudyConnectedError';
    }
}
