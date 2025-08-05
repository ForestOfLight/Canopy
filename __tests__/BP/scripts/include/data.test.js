import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import { MC_VERSION } from '../../../../Canopy [BP]/scripts/constants.js';
import { categoryToMobMap, intToBiomeMap } from 'Canopy [BP]/scripts/include/data.js';
import stripJsonComments from 'strip-json-comments';
import fs from 'fs';
import path from 'path';
import { titleCase } from '../../../../Canopy [BP]/scripts/include/utils.js';

vi.mock('@minecraft/server', {
    world: {},
    ItemStack: {},
    DimensionTypes: {}
});

vi.mock("@minecraft/server-ui", () => ({
    ModalFormData: vi.fn()
}));

const bedrockSamplesRawUrl = `https://raw.githubusercontent.com/Mojang/bedrock-samples/refs/tags/v${MC_VERSION}/behavior_pack/spawn_rules/`;

async function fetchBedrockSamplesData(entityType) {
    let response;
    try {
        response = await axios.get(bedrockSamplesRawUrl + entityType + '.json');
    } catch (error) {
        if (error.response.status === 404) {
            return {
                "minecraft:spawn_rules": {
                    "description": {
                        "population_control": "none"
                    }
                }
            };
        }
    }
    if (typeof response.data == 'string') {
        const stringData = stripJsonComments(response.data);
        return JSON.parse(stringData);
    } 
    return response.data;
}

describe.concurrent('categoryToMobMap', () => {
    for (const category in categoryToMobMap) {
        const categoryMobs = categoryToMobMap[category];
        for (const mob of categoryMobs) {

            it(`${mob} population should match bedrock-samples`, async () => {
                const mobData = await fetchBedrockSamplesData(mob);
                let mobCategory = mobData["minecraft:spawn_rules"]["description"]["population_control"];
                if (!mobCategory)
                    mobCategory = 'none';
                expect(mobCategory).toBe(category);
            });
        }
    }
});