import { Rule } from "./Rule";

class GlobalRule extends Rule {
    constructor(options) {
        options.category = "Rules";
        if (!options.description)
            options.description = { translate: `rules.${options.identifier}` };
        super({ ...options });
    }
}

export { GlobalRule };