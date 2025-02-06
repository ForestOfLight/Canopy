import Commands from "./Commands";

class ArgumentParser {
    static regex = /(@[aepsr]\[|@"[^"]*"|"[^"]*"|\[[^\]]*\]|\S+)/g;
    static booleans = ['true', 'false'];
    static stringRegEx = /^"|"$/g;
    static arrayRegEx = /^\[|\]$/g;
    static entityRegEx = /@[aepsr]\[/g;

    static parseCommandString(text) {
        const args = [];
        const raw = text.match(this.regex);
        if (!raw)
            throw new Error('Invalid command string');

        raw.forEach((arg, index) => {
            const argData = this.#argParser(arg, index, raw);
            args[index] = argData;
        });

        return {
            name: this.#extractName(args),
            args: args.filter(_ => _ !== '$nll_')
        };
    }

    static #extractName(args) {
        let name = String(args.shift());
        name = name.replace(Commands.getPrefix(), '');
        return name;
    }

    static #argParser(char, idx, raw) {
        const isBoolean = this.booleans.includes(char);
        const isNumber = !isNaN(Number(char));
        const isString = this.stringRegEx.test(char);
        const isArray = this.arrayRegEx.test(char);
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
        } else if (isArray) {
            const array = [];
            const arrayData = char.replace(this.arrayRegEx, '');
            const arrayValues = arrayData.split(',');
            for (const value of arrayValues)
                array.push(this.#argParser(value, idx, raw));
            data = array;
        } else {
            data = char.trim();
        }
        return data;
    }
}

export default ArgumentParser;