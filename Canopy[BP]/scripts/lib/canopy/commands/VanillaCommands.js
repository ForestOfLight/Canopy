class VanillaCommands {
    static #commands = [];

    static register(command) {
        this.#commands.push(command);
    }

    static getAll() {
        return [...this.#commands];
    }

    static clear() {
        this.#commands = [];
    }
}

export { VanillaCommands };
