class HelpEntry {
    constructor(title, description) {
        if (this.constructor === HelpEntry) 
            throw new TypeError('HelpEntry is an abstract class and cannot be instantiated.');
        this.title = title;
        this.description = description;
    }

    toRawMessage() {
        throw new TypeError('Method "toRawMessage" must be implemented.');
    }
}

export default HelpEntry;