import { vi, describe, it, expect, beforeEach } from 'vitest';
import { system, Entity, CustomCommandStatus } from '@minecraft/server';
import Understudies from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies';
import { playermoveCommand, MOVE_OPTIONS } from '../../../../../../Canopy[BP]/scripts/src/commands/simplayer/playermove';
import { ServerCommandOrigin } from '../../../../../../Canopy[BP]/scripts/lib/canopy/commands/ServerCommandOrigin';

vi.mock('../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies', () => ({
    default: {
        get: vi.fn(),
        getNotOnlineMessage: vi.fn(name => ({ translate: 'simplayer.notonline', with: [name] })),
    }
}));

vi.mock('../../../../../../Canopy[BP]/scripts/lib/canopy/Canopy', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, VanillaCommand: vi.fn() };
});

describe('playermoveCommand', () => {
    let mockTimeline;
    let mockUnderstudy;
    let mockEntityOrigin;

    beforeEach(() => {
        vi.clearAllMocks();
        mockTimeline = { addOneShot: vi.fn(), setLooping: vi.fn(), removeType: vi.fn() };
        mockUnderstudy = { moveRelative: vi.fn(), moveLocation: vi.fn(), stopMoving: vi.fn(), name: 'TestBot', actions: { timeline: mockTimeline } };
        const mockEntity = new Entity();
        mockEntity.getBlockFromViewDirection = vi.fn(() => ({ block: { location: { x: 0, y: 64, z: 0 } } }));
        mockEntity.getEntitiesFromViewDirection = vi.fn(() => [{ entity: new Entity() }]);
        mockEntityOrigin = { getSource: vi.fn(() => mockEntity), sendMessage: vi.fn() };
    });

    it('returns failure when the simplayer is not online', () => {
        vi.mocked(Understudies.get).mockReturnValue(undefined);
        const result = playermoveCommand.playermoveCommand(mockEntityOrigin, 'TestBot', MOVE_OPTIONS.FORWARD);
        expect(result).toBeUndefined();
        expect(mockEntityOrigin.sendMessage).toHaveBeenCalledWith({ translate: 'simplayer.notonline', with: ['TestBot'] });
    });

    it.each([MOVE_OPTIONS.FORWARD, MOVE_OPTIONS.BACKWARD, MOVE_OPTIONS.LEFT, MOVE_OPTIONS.RIGHT])(
        'returns success for relative direction: %s',
        (direction) => {
            vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
            const result = playermoveCommand.playermoveCommand(mockEntityOrigin, 'TestBot', direction);
            expect(result.status).toBe(CustomCommandStatus.Success);
            expect(mockTimeline.setLooping).toHaveBeenCalledWith('move', { direction }, { length: 1, ticks: [0] });
        }
    );

    it('returns failure for BLOCK option from a non-entity source', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const serverOrigin = new ServerCommandOrigin({ sourceType: 'Server' });
        const result = playermoveCommand.playermoveCommand(serverOrigin, 'TestBot', MOVE_OPTIONS.BLOCK);
        expect(result.status).toBe(CustomCommandStatus.Failure);
    });

    it('returns failure for BLOCK option when no block is in view', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        mockEntityOrigin.getSource().getBlockFromViewDirection.mockReturnValue(undefined);
        const result = playermoveCommand.playermoveCommand(mockEntityOrigin, 'TestBot', MOVE_OPTIONS.BLOCK);
        expect(result.status).toBe(CustomCommandStatus.Failure);
    });

    it('returns success for BLOCK option when a block is in view', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playermoveCommand.playermoveCommand(mockEntityOrigin, 'TestBot', MOVE_OPTIONS.BLOCK);
        expect(result.status).toBe(CustomCommandStatus.Success);
    });

    it('returns failure for ENTITY option from a non-entity source', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const serverOrigin = new ServerCommandOrigin({ sourceType: 'Server' });
        const result = playermoveCommand.playermoveCommand(serverOrigin, 'TestBot', MOVE_OPTIONS.ENTITY);
        expect(result.status).toBe(CustomCommandStatus.Failure);
    });

    it('returns failure for ENTITY option when no entity is in view', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        mockEntityOrigin.getSource().getEntitiesFromViewDirection.mockReturnValue([]);
        const result = playermoveCommand.playermoveCommand(mockEntityOrigin, 'TestBot', MOVE_OPTIONS.ENTITY);
        expect(result.status).toBe(CustomCommandStatus.Failure);
    });

    it('returns success for ENTITY option when an entity is in view', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playermoveCommand.playermoveCommand(mockEntityOrigin, 'TestBot', MOVE_OPTIONS.ENTITY);
        expect(result.status).toBe(CustomCommandStatus.Success);
    });

    it('returns failure for ME option from server origin', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const serverOrigin = new ServerCommandOrigin({ sourceType: 'Server' });
        const result = playermoveCommand.playermoveCommand(serverOrigin, 'TestBot', MOVE_OPTIONS.ME);
        expect(result.status).toBe(CustomCommandStatus.Failure);
    });

    it('returns success for ME option from entity origin', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playermoveCommand.playermoveCommand(mockEntityOrigin, 'TestBot', MOVE_OPTIONS.ME);
        expect(result.status).toBe(CustomCommandStatus.Success);
    });

    it('returns success for TO option', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playermoveCommand.playermoveCommand(mockEntityOrigin, 'TestBot', MOVE_OPTIONS.TO, { x: 0, y: 64, z: 0 });
        expect(result.status).toBe(CustomCommandStatus.Success);
    });

    it('returns success for STOP option', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playermoveCommand.playermoveCommand(mockEntityOrigin, 'TestBot', MOVE_OPTIONS.STOP);
        expect(result.status).toBe(CustomCommandStatus.Success);
    });

    it('returns failure for invalid move option', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playermoveCommand.playermoveCommand(mockEntityOrigin, 'TestBot', 'invalid');
        expect(result).toBeUndefined();
        expect(mockEntityOrigin.sendMessage).toHaveBeenCalledWith({ translate: 'commands.playermove.invalidoption', with: ['invalid'] });
    });

    it('adds a moveto event to the viewed block', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const block = { location: { x: 1, y: 64, z: 2 } };
        mockEntityOrigin.getSource().getBlockFromViewDirection.mockReturnValue({ block });
        playermoveCommand.playermoveCommand(mockEntityOrigin, 'TestBot', MOVE_OPTIONS.BLOCK);
        expect(mockTimeline.addOneShot).toHaveBeenCalledWith('moveto', { target: { kind: 'block', block } }, { delay: 0 });
    });

    it('adds a moveto event to the viewed entity', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const entity = new Entity();
        mockEntityOrigin.getSource().getEntitiesFromViewDirection.mockReturnValue([{ entity }]);
        playermoveCommand.playermoveCommand(mockEntityOrigin, 'TestBot', MOVE_OPTIONS.ENTITY);
        expect(mockTimeline.addOneShot).toHaveBeenCalledWith('moveto', { target: { kind: 'entity', entity } }, { delay: 0 });
    });

    it('adds a moveto event to the command source for ME', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        playermoveCommand.playermoveCommand(mockEntityOrigin, 'TestBot', MOVE_OPTIONS.ME);
        expect(mockTimeline.addOneShot).toHaveBeenCalledWith('moveto', { target: { kind: 'entity', entity: mockEntityOrigin.getSource() } }, { delay: 0 });
    });

    it('adds a moveto event to a location for TO', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        playermoveCommand.playermoveCommand(mockEntityOrigin, 'TestBot', MOVE_OPTIONS.TO, { x: 3, y: 64, z: 4 });
        expect(mockTimeline.addOneShot).toHaveBeenCalledWith('moveto', { target: { kind: 'location', location: { x: 3, y: 64, z: 4 } } }, { delay: 0 });
    });

    it('removes move tracks and stops moving for STOP', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        playermoveCommand.playermoveCommand(mockEntityOrigin, 'TestBot', MOVE_OPTIONS.STOP);
        expect(mockTimeline.removeType).toHaveBeenCalledWith('move');
        expect(mockTimeline.removeType).toHaveBeenCalledWith('moveto');
        system.run.mock.calls.at(-1)[0]();
        expect(mockUnderstudy.stopMoving).toHaveBeenCalled();
    });
});
