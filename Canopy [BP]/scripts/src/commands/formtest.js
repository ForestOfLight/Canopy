import { Command } from "../../lib/canopy/Canopy";
import { system } from "@minecraft/server";
import { FormCancelationReason, ModalFormData } from "@minecraft/server-ui";

new Command({
    name: 'formtest',
    description: { text: "Tests the form UI." },
    usage: 'formtest',
    callback: formtestCommand
});

function formtestCommand(sender) {
    const form = new ModalFormData().title("Canopy Rules")
    form.toggle("Tester Toggle", true)
    form.toggle("Tester Toggle 2", false)
    form.submitButton("Submit")

    forceShow(sender, form, 1000)
        .then(response => {
            if (response.canceled) 
                sender.sendMessage("Canceled");
            else
                sender.sendMessage(`Selected: ${JSON.stringify(response.formValues)}`);
        })
        .catch(error => {
            sender.sendMessage(`Error: ${error.message}`);
        });
}

export async function forceShow(player, form, timeout = Infinity) {
    const startTick = system.currentTick;
    while ((system.currentTick - startTick) < timeout) {
        const response = await form.show(player);
        if (startTick + 1 === system.currentTick && response.cancelationReason === FormCancelationReason.UserBusy) 
            player.sendMessage("§8Close your menu to access the form.")
        if (response.cancelationReason !== FormCancelationReason.UserBusy) 
            return response;
    }
    throw new Error(`Timed out after ${timeout} ticks`);
};