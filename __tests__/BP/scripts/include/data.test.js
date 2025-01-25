import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import { getMinecraftVersion } from '../../../utils';
import { categoryToMobMap, intToBiomeMap } from 'Canopy [BP]/scripts/include/data.js';
import stripJsonComments from 'strip-json-comments';
import fs from 'fs';
import path from 'path';
import Utils from '../../../../Canopy [BP]/scripts/include/utils.js';

vi.mock('@minecraft/server', {
    world: {},
    ItemStack: {},
    DimensionTypes: {}
});

const bedrockSamplesRawUrl = `https://raw.githubusercontent.com/Mojang/bedrock-samples/refs/tags/v${getMinecraftVersion()}/behavior_pack/entities/`;

async function fetchBedrockSamplesData(entityType) {
    const response = await axios.get(bedrockSamplesRawUrl + entityType + '.json');
    if (typeof response.data == 'string') {
        const stringData = stripJsonComments(response.data);
        return JSON.parse(stringData);
    } else {
        return response.data;
    }
}

describe.concurrent('categoryToMobMap', () => {
    for (const category in categoryToMobMap) {
        const categoryMobs = categoryToMobMap[category];
        for (const mob of categoryMobs) {

            it(`${mob} category should match bedrock-samples`, async () => {
                const mobData = await fetchBedrockSamplesData(mob);
                let mobCategory = mobData['minecraft:entity']['description']['spawn_category'];
                if (!mobCategory)
                    mobCategory = 'other';
                expect(mobCategory).toBe(category);
            });

        }
    }
});

const probeEntityPath = path.resolve('Canopy [BP]/entities/probe.json');

describe('intToBiomeMap', () => {
    const probeData = JSON.parse(stripJsonComments(fs.readFileSync(probeEntityPath, 'utf-8')));
    for (const biomeId in probeData['minecraft:entity']['events']) {
        if (!biomeId.startsWith('canopy:') || biomeId.includes('reset_biome_property'))
            continue;

        it(`${biomeId} should be valid in the intToBiomeMap`, () => {
            const biomeName = Utils.titleCase(biomeId.replace('canopy:', ''));
            expect(Object.values(intToBiomeMap)).toContain(biomeName);
            const biomeInt = probeData['minecraft:entity']['events'][biomeId]['set_property']['canopy:biome'];
            expect(intToBiomeMap[biomeInt]).toBe(biomeName);
        });

    }
});