export class UnknownRepeatingActionError extends Error {
    constructor(name, type) {
        super(`[Canopy] Unknown repeating action '${type}' for simulated player '${name}'.`);
        this.name = 'UnknownRepeatingActionError';
    }
}
