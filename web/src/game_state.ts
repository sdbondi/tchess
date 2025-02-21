import {ComponentAddress, TariProvider} from "@tari-project/tarijs";
import {create} from "zustand/react";
import {devtools, persist} from "zustand/middleware";
import {NonFungibleAddress} from "@tari-project/typescript-bindings";

export interface GameState {
    fen?: string,
    setFen: (fen: string) => void,
    playerNft?: NonFungibleAddress,
    setPlayerNft: (nft: NonFungibleAddress) => void,
    currentGameAddress?: ComponentAddress,
    setCurrentGameAddress: (address: ComponentAddress) => void,
    currentGameOtherPlayer: string,
    setCurrentGameOtherPlayer: (nft: NonFungibleAddress) => void,
    league?: ComponentAddress,
    setLeague: (address: ComponentAddress) => void,
}

export const useGameState = create<GameState>()(
    devtools(
        persist((set) => ({
            fen: undefined,
            setFen: (fen: string) => set({fen}),
            playerNft: undefined,
            setPlayerNft: (nft: NonFungibleAddress) => set({playerNft: nft}),
            currentGameAddress: undefined,
            setCurrentGameAddress: (address: ComponentAddress) => set({currentGameAddress: address}),
            currentGameOtherPlayer: "",
            setCurrentGameOtherPlayer: (nft: string) => set({currentGameOtherPlayer: nft}),
            league: undefined,
            setLeague: (address: ComponentAddress) => set({league: address}),
        }), {name: 'game-state'})
    )
);

export interface TariProviderState {
    provider?: TariProvider,
    setProvider: (provider: TariProvider) => void,
}

export const useTariProvider = create<TariProviderState>()(
    devtools((set) => ({
        provider: undefined,
        setProvider: (provider: TariProvider) => set({provider}),
    }))
)