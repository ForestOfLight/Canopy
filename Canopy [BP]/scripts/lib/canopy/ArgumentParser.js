import { Commands } from "./Commands";

class ArgumentParser {
    static regex = /(@[aepsr]\[|@"[^"]*"|"[^"]*"|\[[^\]]*\]|\S+)/g;
    static booleans = ['true', 'false'];
    static stringRegEx = /^"|"$/g;
    static arrayRegEx = /^\[|\]$/g;
    static entityRegEx = /@[aepsr]\[/g;

    static parseCommandString(text) {
        const parsedArgs = [];
        const rawArguments = text.match(this.regex);
        if (!rawArguments)
            throw new Error('Invalid command string');

        rawArguments.forEach((arg, currIdx) => {
            const argData = this.#argParser(arg, currIdx, rawArguments);
            parsedArgs[currIdx] = argData;
        });

        return {
            name: this.#extractName(parsedArgs),
            args: parsedArgs.filter(_ => _ !== '$nll_')
        };
    }

    static #extractName(args) {
        let name = String(args.shift());
        name = name.replace(Commands.getPrefix(), '');
        return name;
    }

    static #argParser(arg, currIdx, rawArguments) {
        const isBoolean = this.booleans.includes(arg);
        const isNumber = !isNaN(Number(arg));
        const isString = this.stringRegEx.test(arg);
        const isArray = this.arrayRegEx.test(arg);
        const isEntity = this.entityRegEx.test(arg);
        
        let data;
        if (isBoolean) {
            data = arg === 'true';
        } else if (isNumber) {
            data = Number(arg);
        } else if (isString) {
            data = arg.replace(this.stringRegEx, '');
        } else if (isEntity && this.arrayRegEx.test(rawArguments[currIdx+1])) {
            rawArguments[currIdx] += rawArguments[currIdx + 1];
            rawArguments[currIdx + 1] = '$nll_';
            data = rawArguments[currIdx];
        } else if (isArray) {
            const array = [];
            const arrayData = arg.replace(this.arrayRegEx, '');
            const arrayValues = arrayData.split(',');
            for (const value of arrayValues)
                array.push(this.#argParser(value, currIdx, rawArguments));
            data = array;
        } else {
            data = arg.trim();
        }
        return data;
    }
}

export { ArgumentParser };