import {SubstateId} from "@tari-project/typescript-bindings/src/types/SubstateId.ts";
import {shortenString, substateIdToString} from "@tari-project/typescript-bindings/src/helpers/helpers.ts";
import {ComponentAddress, SubstateDiff, TemplateAddress} from "@tari-project/tarijs";
import {
    ComponentHeader,
    NonFungible,
    Resource,
    SubstateType,
    SubstateValue,
    Vault
} from "@tari-project/typescript-bindings";

export function shortenSubstateId(substateId: SubstateId | string | null | undefined, start: number = 4, end: number = 4) {
    if (substateId === null || substateId === undefined) {
        return "";
    }
    const string = substateIdToString(substateId);
    const parts = string.split("_", 2);
    if (parts.length < 2) {
        return string;
    }
    return parts[0] + "_" + shortenString(parts[1], start, end);
}

export function findComponentForTemplate(diff: SubstateDiff, template: TemplateAddress): [ComponentAddress, ComponentHeader] | undefined {
    const substate = diff.up_substates.find(([_, s]) => {
        if ('Component' in s.substate) {
            console.log("Component", s);
            return s.substate.Component.template_address.toString() === template;
        }
        console.log("No", s);
        return false
    });
    if (!substate) {
        console.log("No substate!");
        return undefined;
    }
    const [substateId, s] = substate;
    console.log("Substate", substateId);
    const ss = 'Component' in s.substate ? s.substate.Component : null;
    if (!ss) {
        return undefined;
    }
    return [substateId as unknown as string, ss]
}

export function extractSubstate(type: SubstateType, diff: SubstateDiff): [string, ComponentHeader | Resource | NonFungible | Vault] | undefined {
    const substate = diff.up_substates.find(([_, s]) => {
        if (type in s.substate) {
            console.log(type, s);
            return s.substate[type as keyof SubstateValue];
        }
        console.log("No", s);
        return false
    });
    if (!substate) {
        console.log("No substate!");
        return undefined;
    }
    const [substateId, s] = substate;
    console.log("Substate", substateId);
    const ss = s.substate[type as keyof SubstateValue];
    if (!ss) {
        console.log("No substate!");
        return undefined;
    }
    return [substateIdToString(substateId), ss]
}