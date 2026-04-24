export class GlobalRule {
    static morphOptions(options) {
        options.category = "Rules";
        if (!options.description)
            options.description = { translate: `rules.${options.identifier}` };
        return { ...options };
    }
}