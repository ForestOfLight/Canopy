import { Rule, Rules, Extensions } from "../../lib/canopy/Canopy";
import { world } from "@minecraft/server";
import { PACK_VERSION } from "../../constants";

new Rule({
    category: 'Rules',
    identifier: 'noWelcomeMessage',
    description: { translate: 'rules.noWelcomeMessage' },
});

const hasShownWelcome = {};

world.afterEvents.playerLeave.subscribe((event) => {
    hasShownWelcome[event.playerId] = false;
});

function displayWelcome(player) {
    if (Rules.getNativeValue('noWelcomeMessage') || hasShownWelcome[player?.id]) return;
    hasShownWelcome[player.id] = true;
    const graphic = [
        '§a   + ----- +\n',
        '§a /          / |\n',
        '§a+ ----- +  |\n',
        '§a |          |  +\n',
        '§a |          | /\n',
        '§a+ ----- +\n'
    ].join('');
    player.sendMessage({ rawtext: [{ text: graphic }, { translate: 'generic.welcome.start', with: [PACK_VERSION] }] });
    
    const extensions = Extensions.getVersionedNames();
    if (extensions.length === 0) return;
    const extensionsMessage = { rawtext: [{ translate: 'generic.welcome.extensions' }] };
    for (let i = 0; i < extensions.length; i++) {
        const extensionName = extensions[i];
        if (i > 0)
            extensionsMessage.rawtext.push({ text: '§r§7,' });
        extensionsMessage.rawtext.push({ text: ` §a§o${extensionName.name} v${extensionName.version}` });
    }
    player.sendMessage(extensionsMessage);
}

export { displayWelcome };