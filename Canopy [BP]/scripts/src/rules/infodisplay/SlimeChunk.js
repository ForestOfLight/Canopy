import { InfoDisplayElement } from './InfoDisplayElement.js';
import MT from 'lib/mt.js';

class SlimeChunk extends InfoDisplayElement {
    player;

    constructor(player, displayLine) {
        const ruleData = { identifier: 'slimeChunk', description: { translate: 'rules.infoDisplay.slimeChunk' } };
        super(ruleData, displayLine);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        return this.isSlime() ? { translate: 'rules.infoDisplay.slimeChunk.display' } : { text: '' };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

     
    isSlime() {
        if (this.player.dimension.id !== "minecraft:overworld") 
            return false;

        const chunkX = Math.floor(this.player.location.x / 16) >>> 0;
        const chunkZ = Math.floor(this.player.location.z / 16) >>> 0;
        const seed = ((a, b) => {
            const a00 = a & 0xffff;
            const a16 = a >>> 16;
            const b00 = b & 0xffff;
            const b16 = b >>> 16;
            const c00 = a00 * b00;
            let c16 = c00 >>> 16; 
            
            c16 += a16 * b00;
            c16 &= 0xffff;
            c16 += a00 * b16; 
            
            const lo = c00 & 0xffff;
            const hi = c16 & 0xffff; 
            
            return((hi << 16) | lo) >>> 0;
        })(chunkX, 0x1f1f1f1f) ^ chunkZ;
    
        const mt = new MT(seed);
        const n = mt.nextInt();
        const isSlime = (n % 10 === 0);
        
        return(isSlime);
    }
}

export default SlimeChunk;