import IPC from "../ipc/ipc";
import Extension from "./Extension";

export class Extensions {
    static extensions = {};

    static get(id) {
        return this.extensions[id];
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
        return this.getAll().map(extension => `${extension.getName()} v${extension.getVersion()}`);
    }

    static #setupExtensionRegistration() {
        IPC.on('canopyExtension:registerExtension', (extensionData) => {
            if (typeof extensionData.description === 'string')
                extensionData.description = { text: extensionData.description };
            const extension = new Extension(extensionData);
            this.extensions[extension.getID()] = extension;
        });
    }

    static {
        this.#setupExtensionRegistration();
    }
}

export default Extensions;