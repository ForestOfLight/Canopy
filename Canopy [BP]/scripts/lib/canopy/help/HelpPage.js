class HelpPage {
    entries = [];

    constructor(title, description = '', extensionName = false) {
        if (this.constructor === HelpPage)
            throw new TypeError("HelpPage is an abstract class and cannot be instantiated");
        if (extensionName)
            this.title = extensionName + ':' + title;
        else
            this.title = title;
        if (typeof description === 'string')
            this.description = { text: description };
        else
            this.description = description;
        this.extensionName = extensionName;
    }

    getEntries() {
        return this.entries;
    }

    addEntry() {
        throw new Error('[HelpPage] addEntry must be implemented in subclass');
    }

    hasEntry() {
        throw new Error('[HelpPage] hasEntry must be implemented in subclass');
    }

    toRawMessage() {
        throw new Error('[HelpPage] toRawMessage must be implemented in subclass');
    }

    getPrintStarter() {
        let extensionFormat = '';
        let titleFormat = this.title;
        if (this.extensionName) {
            extensionFormat = '§a' + this.extensionName + '§f:';
            titleFormat = this.title.split(':')[1];
        }
        return { rawtext: [{ translate: 'commands.help.page.header', with: [extensionFormat+titleFormat] }] };
    }
}

export { HelpPage };