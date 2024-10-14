import { HelpPage } from "./HelpPage";
import Utils from "stickycore/utils";

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
            player.sendMessage( await page.toRawMessage());
        }
    }

    async printPage(pageName, player) {
        for (let page of Object.values(this.helpPages)) {
            if (String(page.title).toLowerCase() === String(pageName).toLowerCase()) {
                const message = await page.toRawMessage();
                player.sendMessage(message);
                return;
            }
        }
        throw new Error('[HelpBook] Page does not exist');
    }

    async printSearchResults(searchTerm, player) {
        const results = [];
        for (let page of Object.values(this.helpPages)) {
            for (let entry of page.entries) {
                if (entry.title.toLowerCase().includes(searchTerm.toLowerCase()) || entry.description.toLowerCase().includes(searchTerm.toLowerCase())) {
                    results.push(entry);
                }
            }
        }

        if (results.length === 0) {
            player.sendMessage({ translate: 'commands.help.search.noresult', with: [searchTerm] });
        } else {
            let output = '';
            for (let entry of results) {
                output += '\n  ' + await entry.toString();
            }
            output = Utils.recolor(output, searchTerm, '§a');
            player.sendMessage({ translate: 'commands.help.search.results', with: [searchTerm, output] });
        }
    }
}

export default HelpBook;