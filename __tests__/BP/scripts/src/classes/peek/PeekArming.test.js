import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Entity, Player } from '@minecraft/server';
import { PeekArming } from '../../../../../../Canopy[BP]/scripts/src/classes/peek/PeekArming';

describe('PeekArming', () => {
    let arming;
    let player;
    let spawnedEntity;

    beforeEach(() => {
        arming = new PeekArming();
        spawnedEntity = new Entity();
        spawnedEntity.typeId = 'canopy:peek_capture';
        spawnedEntity.teleport = vi.fn();
        player = new Player();
        player.id = 'player-1';
        player.getHeadLocation.mockReturnValue({ x: 1, y: 66, z: 2 });
        player.dimension.spawnEntity = vi.fn(() => spawnedEntity);
    });

    describe('arm', () => {
        it('arms the player', () => {
            arming.arm(player);

            expect(arming.isArmed(player.id)).toBe(true);
        });

        it('ignores a player without an id', () => {
            expect(() => arming.arm(void 0)).not.toThrow();
        });
    });

    describe('countDown', () => {
        it('runs out only after the full timeout', () => {
            arming.arm(player);

            for (let tick = 0; tick < PeekArming.TIMEOUT_TICKS - 1; tick++)
                expect(arming.countDown(player.id)).toBe(false);

            expect(arming.countDown(player.id)).toBe(true);
        });

        it('restarts when the player arms again', () => {
            arming.arm(player);
            for (let tick = 0; tick < PeekArming.TIMEOUT_TICKS - 1; tick++)
                arming.countDown(player.id);

            arming.arm(player);

            expect(arming.countDown(player.id)).toBe(false);
        });

        it('never runs out for a player who is not armed', () => {
            expect(arming.countDown('nobody')).toBe(false);
        });
    });

    describe('captures', () => {
        it('parks a capture entity for the player', () => {
            arming.parkCapture(player);

            expect(arming.isCapture(player.id, spawnedEntity)).toBe(true);
        });

        it('follows the player head instead of parking a second entity', () => {
            arming.parkCapture(player);
            player.getHeadLocation.mockReturnValue({ x: 3, y: 70, z: 4 });

            arming.parkCapture(player);

            expect(player.dimension.spawnEntity).toHaveBeenCalledTimes(1);
            expect(spawnedEntity.teleport).toHaveBeenCalledWith({ x: 3, y: 70, z: 4 }, { dimension: player.dimension });
        });

        it('parks a fresh entity once the parked one is gone', () => {
            arming.parkCapture(player);
            spawnedEntity.isValid = false;

            arming.parkCapture(player);

            expect(player.dimension.spawnEntity).toHaveBeenCalledTimes(2);
        });

        it('does not claim an entity it never parked', () => {
            arming.parkCapture(player);

            expect(arming.isCapture(player.id, new Entity())).toBe(false);
            expect(arming.isCapture('someone-else', spawnedEntity)).toBe(false);
        });
    });

    describe('clearing', () => {
        it('disarms the player and removes the capture entity', () => {
            arming.arm(player);
            arming.parkCapture(player);

            arming.clear(player.id);

            expect(arming.isArmed(player.id)).toBe(false);
            expect(spawnedEntity.remove).toHaveBeenCalled();
        });

        it('keeps the player armed when only the capture entity is cleared', () => {
            arming.arm(player);
            arming.parkCapture(player);

            arming.clearCapture(player.id);

            expect(arming.isArmed(player.id)).toBe(true);
            expect(spawnedEntity.remove).toHaveBeenCalled();
        });

        it('clears every armed player at once', () => {
            arming.arm(player);
            arming.parkCapture(player);

            arming.clearAll();

            expect(arming.isArmed(player.id)).toBe(false);
            expect(spawnedEntity.remove).toHaveBeenCalled();
        });
    });
});
