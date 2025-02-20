import {
    Account, Arg,
    ComponentAddress,
    TariProvider,
    TransactionBuilder,
    TransactionStatus,
    UnsignedTransaction
} from "@tari-project/tarijs";
import * as wallet from "./wallet.ts";

export const GAME_TEMPLATE = "ad7eee34e6e373613fb7bd0e51a9d49f425ae6e9b54fa8da7bc8cd20dcf5a425";
export const TCHESS_TEMPLATE = "79f6481ed578b7811b594a3132ab6801d4f81fb88064d9966c4b6cf341f9b11a";

export function newLeague(account: ComponentAddress) {
    return builder().feeTransactionPayFromComponent(account, "2000")
        .callFunction({
                functionName: "new",
                templateAddress: TCHESS_TEMPLATE,
            },
            [GAME_TEMPLATE]
        )
}

export function createGame(account: ComponentAddress, league: ComponentAddress) {
    return builder().feeTransactionPayFromComponent(account, "2000")
        .callMethod({componentAddress: league, methodName: "create_game"}, [])
        .saveVar("player_nft")
        .callMethod({componentAddress: account, methodName: "deposit"}, args({Workspace: "player_nft"}));
}

export function register(account: ComponentAddress, league: ComponentAddress) {
    return builder().feeTransactionPayFromComponent(account, "2000")
        .callMethod({componentAddress: league, methodName: "create_user"}, [])
        .saveVar("player_nft")
        .callMethod({componentAddress: account, methodName: "deposit"}, args({Workspace: "player_nft"}));
}

function args(...args: [any]): Array<Arg> {
    return args.map((a) => {
        if (typeof a === 'object' && 'Workspace' in a) {
            return "Workspace(" + a.Workspace + ")";
        }
        return a;
    });
}

function builder() {
    return new TransactionBuilder();
}

export async function submitTransaction(provider: TariProvider, account: Account, transaction: TransactionBuilder) {
    const result = await wallet.submitTransactionAndWaitForResult(
        {
            provider,
            account,
            builder: transaction,
            requiredSubstates: [],
        }
    );
    if (result.status !== TransactionStatus.Accepted) {
        throw new Error("Transaction failed: " + JSON.stringify(result.result?.result));
    }
    const accept = result.result?.result;
    if (!accept || !('Accept' in accept)) {
        throw new Error("Transaction failed: " + JSON.stringify(accept));
    }

    return accept.Accept;
}