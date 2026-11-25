import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CustomCommandStatus } from '@minecraft/server';
import { scheduler } from '@forestoflight/minecraft-vitest-mocks';
import Understudies from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies';
import { TimelineForm } from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TimelineForm';
import { playertimelineCommand } from '../../../../../../Canopy[BP]/scripts/src/commands/simplayer/playertimeline';

vi.mock('../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies', () => ({
    default: {
        get: vi.fn(),
        getNotOnlineMessage: vi.fn(name => ({ translate: 'simplayer.notonline', with: [name] }))
    }
}));

vi.mock('../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TimelineForm', () => ({
    TimelineForm: vi.fn(function MockTimelineForm(player, understudy) {
        this.player = player;
        this.understudy = understudy;
        this.show = vi.fn();
    })
}));

vi.mock('../../../../../../Canopy[BP]/scripts/lib/canopy/Canopy', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, VanillaCommand: vi.fn() };
});

describe('playertimelineCommand', () => {
    let player;
    let origin;
    let understudy;

    beforeEach(() => {
        vi.clearAllMocks();
        scheduler.reset();
        player = { name: 'Steve' };
        origin = { sendMessage: vi.fn(), getSource: () => player };
        understudy = { name: 'Bot' };
    });

    it('reports a simplayer that is not online', () => {
        vi.mocked(Understudies.get).mockReturnValue(undefined);
        const result = playertimelineCommand.playertimelineCommand(origin, 'Bot');
        expect(result).toBeUndefined();
        expect(origin.sendMessage).toHaveBeenCalledWith({ translate: 'simplayer.notonline', with: ['Bot'] });
        expect(TimelineForm).not.toHaveBeenCalled();
    });

    it('opens the timeline form for the source player on the next tick', () => {
        vi.mocked(Understudies.get).mockReturnValue(understudy);
        const result = playertimelineCommand.playertimelineCommand(origin, 'Bot');
        expect(result).toEqual({ status: CustomCommandStatus.Success });
        expect(TimelineForm).not.toHaveBeenCalled();
        scheduler.advanceTicks(1);
        expect(TimelineForm).toHaveBeenCalledWith(player, understudy);
        expect(vi.mocked(TimelineForm).mock.instances[0].show).toHaveBeenCalled();
    });
});
