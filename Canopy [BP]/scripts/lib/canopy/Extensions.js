import { Extension } from "./Extension";
import IPC from "../MCBE-IPC/ipc";
import { Ready, RegisterExtension } from "./extension.ipc";

class Extensions {
    static extensions = {};

    static get(id) {
        return this.extensions[id];
    }

    static getFromName(name) {
        return Object.values(this.extensions).find(extension => extension.getName() === name);
    }

    static remove(id) {
        delete this.extensions[id];
    }

    static clear() {
        this.extensions = {};
    }

    static getAll() {
        return Object.values(this.extensions);
    }

    static exists(id) {
        return this.extensions[id] !== undefined;
    }

    static getIds() {
        return Object.keys(this.extensions);
    }

    static getNames() {
        return this.getAll().map(extension => extension.getName());
    }

    static getVersionedNames() {
        return this.getAll().map(extension => ({ name: extension.getName(), version: extension.getVersion() }));
    }

    static #setupExtensionRegistration() {
        IPC.on('canopyExtension:registerExtension', RegisterExtension, (extensionData) => {
            const extension = new Extension(extensionData);
            this.extensions[extension.getID()] = extension;
            console.info(`[Canopy] Registered ${extensionData.name} v${extensionData.version}.`);
        });
        IPC.send('canopyExtension:ready', Ready, {});
    }

    static {
        this.#setupExtensionRegistration();
    }
}

export { Extensions };