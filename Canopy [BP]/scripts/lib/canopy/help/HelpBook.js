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
            player.sendMessage(await page.toRawMessage());
        }
    }

    async printPage(pageName, player) {
        for (let page of Object.values(this.helpPages)) {
            if (String(page.title).toLowerCase() === String(pageName).toLowerCase()) {
                player.sendMessage(await page.toRawMessage());
                return;
            }
        }
        throw new Error('[HelpBook] Page does not exist');
    }

    async printSearchResults(searchTerm, player) {
        const results = [];
        for (let page of Object.values(this.helpPages)) {
            for (let entry of page.entries) {
                if (entry.title.toLowerCase().includes(searchTerm.toLowerCase())) {
                    results.push(entry);
                }
            }
        }

        if (results.length === 0) {
            player.sendMessage({ translate: 'commands.help.search.noresult', with: [searchTerm] });
        } else {
            const message = { rawtext: [{ translate: 'commands.help.search.results', with: [searchTerm] }] };
            for (let entry of results) {
                const entryRawMessage = await entry.toRawMessage();
                const newEntryTitle = Utils.recolor(entryRawMessage.rawtext[0].text, searchTerm, '§a');
                message.rawtext.push({ 
                    rawtext: [
                        { text: '\n  ' }, { text: newEntryTitle },
                        { translate: entryRawMessage.rawtext[1].translate, with: entryRawMessage.rawtext[1].with }
                    ]
                });
            }
            player.sendMessage(message);
        }
    }
}

export default HelpBook;