import {Chessboard} from "react-chessboard";
import {Piece, Square} from "react-chessboard/dist/chessboard/types";
import {Chess} from "chess.js";
import {useGameState, useTariProvider} from "./game_state.ts";
import {useEffect} from "react";
import {ComponentHeader} from "@tari-project/typescript-bindings";


export default function Board() {
    let {provider} = useTariProvider();
    const gameState = useGameState();

    if (!provider || !gameState.currentGameAddress) {
        return (
            <div id="board">
                <div>No active game</div>
            </div>
        )
    }

    useEffect(() => {
        // Need to load the game state
        provider?.getSubstate(gameState.currentGameAddress!)
            .then((game) => {
                let component = game.value.Component as ComponentHeader;
                cbor(component.body.state)
            })

    }, [provider]);

    function onPieceDrop(sourceSquare: Square, targetSquare: Square, piece: Piece) {
        if (!gameState.fen) {
            console.error("Game is not active");
            return false;
        }

        const game = new Chess(gameState.fen);
        console.log('onPieceDrop', sourceSquare, targetSquare, piece);
        const gameCopy = new Chess(game.fen());
        try {
            const move = gameCopy.move({from: sourceSquare, to: targetSquare, promotion: "q"});
            gameState.setFen(gameCopy.fen());
            return move !== null;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    return (
        <div id="board">
            <Chessboard id="board" position={gameState.fen} onPieceDrop={onPieceDrop}/>
        </div>
    )
}

