import {TariConnectButton} from "./connect/TariConnectButton.tsx";
import {useGameState, useTariProvider} from "./game_state.ts";
import Button from "@mui/material/Button";
import {Account, TariProvider} from "@tari-project/tarijs";
import {useEffect, useState} from "react";
import * as transactions from "./transactions.ts";
import {findComponentForTemplate, shortenSubstateId} from "./common.ts";
import {SubstateRequirement} from "@tari-project/tari-provider/dist/types";
import {submitTransaction, TCHESS_TEMPLATE} from "./transactions.ts";
import {substateIdToString} from "@tari-project/typescript-bindings/src/helpers/helpers.ts";

export default function SidePanel() {
    const provider = useTariProvider();

    return (
        <div id="panel">
            <div style={{marginBottom: '10px'}}>
                <TariConnectButton onConnected={(p) => provider.setProvider(p)} provider={provider.provider}/>
            </div>
            {provider.provider ? <Onboarding provider={provider.provider}/> : null}
        </div>
    )
}

function Onboarding({provider}: { provider: TariProvider }) {
    const gameState = useGameState();
    const [error, setError] = useState<Error | undefined>(undefined);
    const [account, setAccount] = useState<Account | undefined>(undefined);
    const [isBusy, setBusy] = useState(false);

    useEffect(() => {
        setBusy(true);
        provider.getAccount()
            .then((account) => setAccount(account))
            .catch((e) => setError(e))
            .finally(() => setBusy(false));
    }, [provider]);

    if (isBusy) {
        return <div>Loading...</div>
    }

    if (error || !account) {
        return <div>No default account set. Please create an account.</div>
    }

    if (!gameState.playerNft) {
        return <Register account={account} provider={provider} onError={setError}/>
    }

    if (!gameState.currentGameAddress) {
        return <CreateGame account={account} provider={provider} onError={setError}/>
    }

    return (
        <div>
            {error ? <div>{error.message}</div> : null}
            <p>Account: {account ? shortenSubstateId(account.address) : null}</p>
            <p>League: {gameState.league ? shortenSubstateId(gameState.league) : "None"}</p>
            <p>PlayerId: {gameState.playerNft ? shortenSubstateId(gameState.playerNft) : "None"}</p>
            <Button>Create game</Button>
        </div>
    )
}

interface Props {
    provider: TariProvider,
    account: Account,
    onError?: (error: Error) => void,
}

function CreateGame({provider, account, onError}: Props) {
    const gameState = useGameState();

    function onCreateGame() {
        if (!account) {
            console.error("Account not loaded");
            return;
        }
        if (!gameState.league) {
            console.error("League not set");
            return;
        }
        if (!gameState.playerNft) {
            console.error("Player NFT not set");
            return;
        }

        const transaction = transactions.createGame(account.address, gameState.league, gameState.playerNft);
        submitTransaction(provider, account, transaction)
            .then((diff) => {
                console.log("Game created", diff);
                const component = findComponentForTemplate(diff, TCHESS_TEMPLATE);
                if (!component) {
                    throw new Error("No game created");
                }
                const [id, _] = component;
                gameState.setCurrentGameAddress(id);

            })
            .catch((e) => onError?.(e));
    }

    return (
        <div>
            <p>Account: {account ? shortenSubstateId(account.address) : null}</p>
            <p>League: {gameState.league ? shortenSubstateId(gameState.league) : "None"}</p>
            <p>PlayerId: {gameState.playerNft ? shortenSubstateId(gameState.playerNft) : "None"}</p>
            <Button onClick={onCreateGame}>Create game</Button>
        </div>
    )
}


function Register({provider, account, onError}: Props) {
    const gameState = useGameState();
    const [isBusy, setBusy] = useState(false);

    function onRegister() {
        if (!account) {
            console.error("Account not loaded");
            return;
        }
        if (!gameState.league) {
            console.error("League not set");
            return;
        }
        const transaction = transactions.register(account.address, gameState.league);
        setBusy(true);
        submitTransaction(provider, account, transaction)
            .then((diff) => {
                console.log("User registration created", diff);
                const substate = diff.up_substates.find(([_, s]) => {
                    if ("NonFungible" in s.substate) {
                        return true;
                    }
                    return false;
                });
                if (!substate) {
                    throw new Error("No NFT created");
                }

                const [id, _] = substate;
                gameState.setPlayerNft(substateIdToString(id));

            })
            .catch((e) => onError?.(e))
            .finally(() => setBusy(false));

    }

    function onNewLeague() {
        if (!account) {
            console.error("Account not loaded");
            return;
        }

        const transaction = transactions.newLeague(account.address);
        setBusy(true);
        submitTransaction(provider, account, transaction)
            .then((diff) => {
                console.log("League created", diff);
                const component = findComponentForTemplate(diff, TCHESS_TEMPLATE);
                if (!component) {
                    throw new Error("No league created");
                }
                const [id, _] = component;
                gameState.setLeague(id);

            })
            .catch((e) => onError?.(e))
            .finally(() => setBusy(false));

    }

    return (
        <div>
            <p>Account: {account ? shortenSubstateId(account.address) : null}</p>
            <p>League: {gameState.league ? shortenSubstateId(gameState.league) : "None"}</p>
            <Button onClick={onNewLeague} disabled={isBusy || !!gameState.league}>Click to create a league</Button>
            <Button onClick={onRegister} disabled={isBusy || !gameState.league}>Click to register</Button>
        </div>
    )
}
