class HelpPage {
    entries = [];

    constructor(title, description = '', extensionName = false) {
        if (extensionName)
            this.title = extensionName + ':' + title;
        else
            this.title = title;
        this.description = description;
        this.extensionName = extensionName;
    }

    getEntries() {
        return this.entries;
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

export default HelpPage;