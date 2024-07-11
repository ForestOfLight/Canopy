import * as mc from '@minecraft/server'

mc.system.runInterval(() => {
    // import spawn tracking var from spawn.js
    owEntites = mc.world.getDimension('overworld').getEntities();
    MobControlCaps.ambient.updateMobs(owEntities); // filter by ambient
});

const MobControlCaps = {
    'ambient': new MobControlCap(2,0,2),
    'animal': new MobControlCap(8,4,4),
    'monster': new MobControlCap(24,16,18),
    'pillager': new MobControlCap(16,0,16),
    'water_animal': new MobControlCap(36,0,36),
}

class MobControlCap {
    overworldMobs = 0;
    netherMobs = 0;
    endMobs = 0;
    mobs = [this.overworldMobs, this.netherMobs, this.endMobs];

    constructor(overworldCap, netherCap, endCap) {
        this.overworldCap = overworldCap;
        this.netherCap = netherCap;
        this.endCap = endCap;
        this.caps = [this.overworldCap, this.netherCap, this.endCap];
    }

    getCap(dimension) {
        return this.caps[dimension];
    }

    getMobs(dimension) {
        return this.mobs[dimension];
    }

    updateMobs(mobs) {
        
    }
}

const MobDensityCaps = {
    'cod': new MobDensityCap(2),
    'creeper': new MobDensityCap(5),
    'dolphin': new MobDensityCap(5),
    'drowned': new MobDensityCap(7, true),
    'ghast': new MobDensityCap(2),
    'phantom': new MobDensityCap(5),
    'pufferfish': new MobDensityCap(3),
    'salmon': new MobDensityCap(14, true),
    'squid': new MobDensityCap(6, true),
    'tropical_fish': new MobDensityCap(40),
}

class MobDensityCap {
    constructor(cap, hasRiverAndOceanCaps = false) {
        this.cap = cap;
        this.hasRiverAndOceanCaps = hasRiverAndOceanCaps;
    }
}
