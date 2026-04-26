import { beforeEach, describe, expect, it } from 'vitest';
import { EndGatewayExits } from '../../../../../Canopy[BP]/scripts/src/classes/EndGatewayExits';
import { world } from '@minecraft/server';

describe('EndGatewayExits', () => {
    beforeEach(() => {
        world.setDynamicProperty('end_gateway_exit_locations', undefined);
    });

    describe('getLocations', () => {
        it('returns empty array when no data exists', () => {
            expect(EndGatewayExits.getLocations()).toEqual([]);
        });

        it('returns parsed locations when data exists', () => {
            const locations = [{ dimension: { id: 'minecraft:the_end' }, x: 1, y: 64, z: 1 }];
            world.setDynamicProperty('end_gateway_exit_locations', JSON.stringify(locations));
            expect(EndGatewayExits.getLocations()).toEqual(locations);
        });

        it('returns empty array when stored data parses to null', () => {
            world.setDynamicProperty('end_gateway_exit_locations', 'null');
            expect(EndGatewayExits.getLocations()).toEqual([]);
        });
    });

    describe('setLocations', () => {
        it('stores formatted locations', () => {
            const locations = [{ dimension: { id: 'minecraft:the_end' }, x: 1, y: 64, z: 1 }];
            EndGatewayExits.setLocations(locations);
            expect(EndGatewayExits.getLocations()).toEqual(locations);
        });

        it('stores an empty array when passed null', () => {
            EndGatewayExits.setLocations(null);
            expect(EndGatewayExits.getLocations()).toEqual([]);
        });
    });

    describe('addLocation', () => {
        it('adds a location to the list', () => {
            EndGatewayExits.addLocation({ id: 'minecraft:the_end' }, { x: 1, y: 64, z: 1 });
            expect(EndGatewayExits.getLocations()).toEqual([
                { dimension: { id: 'minecraft:the_end' }, x: 1, y: 64, z: 1 }
            ]);
        });

        it('appends to existing locations', () => {
            const dimension = { id: 'minecraft:the_end' };
            EndGatewayExits.addLocation(dimension, { x: 1, y: 64, z: 1 });
            EndGatewayExits.addLocation(dimension, { x: 2, y: 64, z: 2 });
            expect(EndGatewayExits.getLocations()).toHaveLength(2);
        });
    });

    describe('removeLocation', () => {
        it('removes a matching location', () => {
            const dimension = { id: 'minecraft:the_end' };
            EndGatewayExits.addLocation(dimension, { x: 1, y: 64, z: 1 });
            EndGatewayExits.removeLocation(dimension, { x: 1, y: 64, z: 1 });
            expect(EndGatewayExits.getLocations()).toEqual([]);
        });

        it('keeps non-matching locations', () => {
            const dimension = { id: 'minecraft:the_end' };
            EndGatewayExits.addLocation(dimension, { x: 1, y: 64, z: 1 });
            EndGatewayExits.removeLocation(dimension, { x: 2, y: 64, z: 2 });
            expect(EndGatewayExits.getLocations()).toHaveLength(1);
        });

        it('keeps locations from other dimensions', () => {
            EndGatewayExits.addLocation({ id: 'minecraft:the_end' }, { x: 1, y: 64, z: 1 });
            EndGatewayExits.removeLocation({ id: 'minecraft:overworld' }, { x: 1, y: 64, z: 1 });
            expect(EndGatewayExits.getLocations()).toHaveLength(1);
        });
    });
});
