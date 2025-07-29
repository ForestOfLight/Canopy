import { InfoDisplayElement } from './InfoDisplayElement.js'
import { playerChangeSubChunkEvent } from '../../events/PlayerChangeSubChunkEvent.js'

export class SlimeChunk extends InfoDisplayElement {
    player;
    infoMessage = { text: '' };

    constructor(player, displayLine) {
        const ruleData = { identifier: 'slimeChunk', description: { translate: 'rules.infoDisplay.slimeChunk' } };
        super(ruleData, displayLine);
        this.player = player;
        playerChangeSubChunkEvent.subscribe(this.onPlayerChangeSubChunk.bind(this));
    }

    getFormattedDataOwnLine() {
        return this.infoMessage;
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    onPlayerChangeSubChunk(event) {
        if (event.player?.id !== this.player?.id)
            return;
        this.infoMessage = this.isSlime() ? { translate: 'rules.infoDisplay.slimeChunk.display' } : { text: '' };
    }
     
    isSlime() {
        if (this.player.dimension.id !== "minecraft:overworld") 
            return false;
        const chunkX = Math.floor(this.player.location.x / 16) >>> 0;
        const chunkZ = Math.floor(this.player.location.z / 16) >>> 0;
        // optimized by https://github.com/McbeEringi/mcbeeringi.github.io/blob/master/apps/mc/slime.html
        let seed = Math.imul(chunkX, 0x1f1f1f1f) ^ chunkZ;
        const nextSeed = (s, n) => Math.imul(s ^ s >>> 30, 0x6c078965) + n;
        const initial = seed & 0x80000000 | (seed = nextSeed(seed, 1)) & 0x7fffffff;
        for (let i = 2; i < 398; i++)
            seed = nextSeed(seed, i);
        seed ^= initial >>> 1 ^ [0, 0x9908b0df][initial & 1];
        seed ^= seed >>> 11;
        seed ^= seed << 7 & 0x9d2c5680;
        seed ^= seed << 15 & 0xefc60000;
        seed ^= seed >>> 18;
        return !((seed >>> 0) % 10);
    }
}