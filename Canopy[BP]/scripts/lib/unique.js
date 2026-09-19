const ONE = BigInt(1);

class Unique {
    #value
    constructor() {
        this.#value = BigInt(0);
    }

    next() {
        this.#value += ONE;
        return `U${this.#value}`;
    }
}

export const unique = (new Unique()).next;