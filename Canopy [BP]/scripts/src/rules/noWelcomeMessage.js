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
    if (!Rules.get('noWelcomeMessage') && !hasShownWelcome[player?.id]) return;
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
    if (extensions.length > 0)
        player.sendMessage({ translate: 'generic.welcome.extensions', with: [extensions.join('§r§7, §a§o')] });
}

export { displayWelcome };