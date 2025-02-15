class HelpEntry {
    constructor(title, description) {
        if (this.constructor === HelpEntry) 
            throw new TypeError('HelpEntry is an abstract class and cannot be instantiated.');
        this.title = title;
        if (typeof description === 'string')
            this.description = { text: description };
        else
            this.description = description;
    }

    toRawMessage() {
        throw new TypeError('Method "toRawMessage" must be implemented.');
    }
}

export { HelpEntry };