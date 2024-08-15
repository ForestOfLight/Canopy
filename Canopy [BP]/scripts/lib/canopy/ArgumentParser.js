class ArgumentParser {
    static regex = /(@[aepsr]\[|@"[^"]*"|"[^"]*"|\[[^\]]*\]|\S+)/g;
    static booleans = ['true', 'false'];
    static stringRE = /^"|"$/g;
    static arrayRE = /^\[|\]$/g;
    static entityRE = /@[aepsr]\[/g;

    static parseArgs(text) {
        let args = [];
        let raw = text.match(this.regex);

        raw.forEach((arg, index) => {
            let argData = this.#argParser(arg, index, raw);
            args[index] = argData;
        });

        return args.filter(_ => _ != '$nll_');
    }

    static #argParser(char, idx, raw) {
        let data;

        const isBoolean = this.booleans.includes(char);
        const isNumber = !isNaN(Number(char));
        const isString = this.stringRE.test(char);
        const isArray = idx < raw.length - 1 && this.arrayRE.test(raw[idx + 1]);
        const isEntity = this.entityRE.test(char);

        if (isBoolean) data = char == 'true';
        else if (isNumber) data = Number(char);
        else if (isString) data = char.replace(this.stringRE, '');
        else if (isEntity && isArray) {
            data = raw[idx] += raw[idx + 1];
            raw[idx + 1] = '$nll_';
        }
        else if (char.match(this.arrayRE)) data = JSON.parse(char);
        else data = char.trim();

        return data;
    }
}

export default ArgumentParser;