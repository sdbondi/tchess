import {Chessboard} from "react-chessboard";
import {Piece, Square} from "react-chessboard/dist/chessboard/types";
import {Chess} from "chess.js";
import {useGameState} from "./game_state.ts";


export default function Board() {
    const gameState = useGameState();


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
            {gameState.fen ?
                <Chessboard id="board" position={gameState.fen} onPieceDrop={onPieceDrop}/> :
                <div>No active game</div>}
        </div>
    )
}

