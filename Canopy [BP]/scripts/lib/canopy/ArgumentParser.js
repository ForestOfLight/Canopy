class ArgumentParser {
    static regex = /(@[aepsr]\[|@"[^"]*"|"[^"]*"|\[[^\]]*\]|\S+)/g;
    static booleans = ['true', 'false'];
    static stringRegEx = /^"|"$/g;
    static arrayRegEx = /^\[|\]$/g;
    static entityRegEx = /@[aepsr]\[/g;

    static parseArgs(text) {
        const args = [];
        const raw = text.match(this.regex);

        if (!raw) return [];
        raw.forEach((arg, index) => {
            const argData = this.#argParser(arg, index, raw);
            args[index] = argData;
        });

        return args.filter(_ => _ !== '$nll_');
    }

    static #argParser(char, idx, raw) {
        const isBoolean = this.booleans.includes(char);
        const isNumber = !isNaN(Number(char));
        const isString = this.stringRegEx.test(char);
        const isArray = idx < raw.length - 1 && this.arrayRegEx.test(raw[idx + 1]);
        const isEntity = this.entityRegEx.test(char);
        
        let data;
        if (isBoolean) {
            data = char === 'true';
        } else if (isNumber) {
            data = Number(char);
        } else if (isString) {
            data = char.replace(this.stringRegEx, '');
        } else if (isEntity && isArray) {
            data = raw[idx] += raw[idx + 1];
            raw[idx + 1] = '$nll_';
        } else if (char.match(this.arrayRegEx)) {
            data = JSON.parse(char);
        } else {
            data = char.trim();
        }
        return data;
    }
}

export default ArgumentParser;