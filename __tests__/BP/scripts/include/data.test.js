import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import { MC_VERSION } from '../../../../Canopy [BP]/scripts/constants.js';
import { categoryToMobMap, meleeMobs } from '../../../../Canopy [BP]/scripts/include/data.js';
import stripJsonComments from 'strip-json-comments';

vi.mock('@minecraft/server', {
    world: {},
    ItemStack: {},
    DimensionTypes: {}
});

vi.mock("@minecraft/server-ui", () => ({
    ModalFormData: vi.fn()
}));

const bedrockSamplesRawUrl = `https://raw.githubusercontent.com/Mojang/bedrock-samples/refs/tags/v${MC_VERSION}/`;

describe.concurrent('categoryToMobMap', () => {
    for (const category in categoryToMobMap) {
        const categoryMobs = categoryToMobMap[category];
        for (const mob of categoryMobs) {
            it(`${mob} population should match bedrock-samples`, async () => {
                const mobData = await fetchBedrockSamplesSpawnData(mob);
                let mobCategory = mobData["minecraft:spawn_rules"]["description"]["population_control"];
                if (!mobCategory)
                    mobCategory = 'none';
                expect(mobCategory).toBe(category);
            });
        }
    }
});

async function fetchBedrockSamplesSpawnData(entityType) {
    let response;
    try {
        response = await axios.get(bedrockSamplesRawUrl + 'behavior_pack/spawn_rules/' + entityType + '.json');
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

describe.concurrent('meleeMobs', async () => {
    const entityFiles = await fetchAllFilesInRepoPath(
        'Mojang',
        'bedrock-samples',
        'behavior_pack/entities',
        `v${MC_VERSION}`
    );
    for (const entityFile of entityFiles) {
        const mobType = entityFile.path.substring(entityFile.path.lastIndexOf('/') + 1, entityFile.path.length - 5);
        it(`${mobType} melee attack component should be in bedrock-samples`, () => {
            expect(entityFile.content.includes(`"minecraft:attack"`)).toEqual(meleeMobs.includes(mobType));
        });
    }
});

async function fetchAllFilesInRepoPath(owner, repo, path, ref = 'main') {
  const results = [];

  async function walk(dirPath) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}`;
    const res = await axios.get(url, { params: { ref } });
    for (const item of res.data) {
      if (item.type === 'file') {
        const fileResponse = await axios.get(item.download_url);
        const fileResponseData = typeof fileResponse.data === 'string' ? JSON.parse(stripJsonComments(fileResponse.data)) : fileResponse.data;
        results.push({ 
            path: item.path,
            downloadUrl: item.download_url,
            content: JSON.stringify(fileResponseData)
        });
      } else if (item.type === 'dir') {
        await walk(item.path);
      }
    }
  }

  await walk(path);
  return results;
}