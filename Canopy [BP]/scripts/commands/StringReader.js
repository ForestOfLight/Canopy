import CommandSyntaxError from 'commands/errors/CommandSyntaxError';

class StringReader {
    #SYNTAX_ESCAPE = '\\';
    #SYNTAX_DOUBLE_QUOTE = '"';
    #SYNTAX_SINGLE_QUOTE = "'";

    string;
    cursor;

    constructor(string) {
        this.string = String(string);
        this.cursor = 0;
    }

    getString() {
        return this.string;
    }

    getRemainingLength() {
        return this.string.length - this.cursor;
    }

    getTotalLength() {
        return this.string.length;
    }

    getCursor() {
        return this.cursor;
    }

    setCursor(cursor) {
        this.cursor = cursor;
    }

    getRead() {
        return this.string.substring(0, this.cursor);
    }

    getRemaining() {
        return this.string.substring(this.cursor);
    }

    canRead(length = 1) {
        return this.cursor + length <= this.string.length;
    }

    peek(offset = 0) {
        return this.string.charAt(this.cursor + offset);
    }

    read() {
        return this.string.charAt(this.cursor++);
    }

    skip() {
        this.cursor++;
    }

    isWhitespace(c) {
        return c === ' ' || c === '\t' || c === '\n';
    }

    isAllowedNumber(c) {
        return c >= '0' && c <= '9' || c === '.' || c === '-';
    }

    isQuotedStringStart(c) {
        return c == this.#SYNTAX_DOUBLE_QUOTE || c == this.#SYNTAX_SINGLE_QUOTE;
    }

    skipWhitespace() {
        while (this.canRead() && this.isWhitespace(this.peek())) {
            this.skip();
        }
    }

    readInteger() {
        let start = this.cursor;
        while (this.canRead() && this.isAllowedNumber(this.peek())) {
            this.skip();
        }
        const number = this.string.substring(start, this.cursor);
        if (number.length === 0) {
            throw new CommandSyntaxError('Expected number', this.cursor);
        }
        try {
            return parseInt(number);
        } catch (error) {
            this.cursor = start;
            throw new CommandSyntaxError('Invalid number', this.cursor);
        }
    }

    readFloat() {
        let start = this.cursor;
        while (this.canRead() && this.isAllowedNumber(this.peek())) {
            this.skip();
        }
        const number = this.string.substring(start, this.cursor);
        if (number.length === 0) {
            throw new CommandSyntaxError('Expected number', this.cursor);
        }
        try {
            return parseFloat(number);
        } catch (error) {
            this.cursor = start;
            throw new CommandSyntaxError('Invalid number', this.cursor);
        }
    }
}