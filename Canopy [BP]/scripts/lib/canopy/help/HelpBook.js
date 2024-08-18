import { HelpPage } from "./HelpPage";

class HelpBook {
    constructor() {
        this.helpPages = [];
        this.numNativeCommandPages = 0;
    }

    newPage(page) {
        if (!page instanceof HelpPage) {
            throw new Error('[HelpBook] Page must be an instance of HelpPage');
        }
        this.helpPages[page.title] = page;
    }

    getPage(pageName) {
        if (!this.helpPages[pageName]) {
            throw new Error('[HelpBook] Page does not exist');
        }
        return this.helpPages[pageName];
    }

    addEntry(pageName, entry, player = false) {
        if (!this.helpPages[pageName]) {
            throw new Error('[HelpBook] Page does not exist');
        }
        if (pageName === 'InfoDisplay')
            this.helpPages[pageName].addEntry(entry, player);
        else
            this.helpPages[pageName].addEntry(entry);
    }

    getPages() {
        return Object.values(this.helpPages);
    }

    getPageNames() {
        return Object.keys(this.helpPages);
    }

    getNumPages() {
        return Object.keys(this.helpPages).length;
    }

    async print(player) {
        for (let page of Object.values(this.helpPages)) {
            player.sendMessage( await page.toString());
        }
    }

    async printPage(pageName, player) {
        if (!this.helpPages[pageName]) {
            throw new Error('[HelpBook] Page does not exist');
        }
        player.sendMessage( await this.helpPages[pageName].toString());
    }
}

export default HelpBook;