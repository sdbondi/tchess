mod types;

//   Copyright 2022. The Tari Project
//
//   Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
//   following conditions are met:
//
//   1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
//   disclaimer.
//
//   2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
//   following disclaimer in the documentation and/or other materials provided with the distribution.
//
//   3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote
//   products derived from this software without specific prior written permission.
//
//   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
//   INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
//   DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
//   SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
//   SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
//   WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
//   USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
use tari_template_lib::prelude::*;

#[template]
mod tchess {
    use super::*;
    use crate::types::{Outcome, Player};
    use pleco::{BitMove, Board};

    pub struct TchessGame {
        black: NonFungibleId,
        white: NonFungibleId,
        board_state: String,
        outcome: Option<Outcome>,
        player_badge: ResourceAddress,
    }

    impl TchessGame {
        pub fn new(white: NonFungibleAddress, black: NonFungibleAddress) -> Component<Self> {
            // Initial positions taken from pleco::board::Board::start_pos()
            let resource = white.resource_address();
            assert_eq!(
                resource,
                black.resource_address(),
                "White and black badge resources do not match"
            );

            let board_state =
                "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1".to_string();
            Component::new(Self {
                black: black.id().clone(),
                white: white.id().clone(),
                board_state,
                outcome: None,
                player_badge: *resource,
            })
            .with_access_rules(
                ComponentAccessRules::new()
                    .add_method_rule("validate_winner", rule!(allow_all))
                    .add_method_rule("make_move", rule!(allow_all))
                    .add_method_rule("resign", rule!(allow_all)),
            )
            .create()
        }

        pub fn make_move(&mut self, proof: Proof, int_move: u16) {
            if self.is_game_over() {
                panic!("Cannot make a move, the game is over");
            }

            let player = self.check_proof_is_player(&proof);

            let mut board = self.get_board();
            let tchess_move = BitMove::new(int_move);
            // log!(LogLevel::Info, "{} Move {}", player, tchess_move);
            if !board.legal_move(tchess_move) {
                panic!("Not a legal move");
            }
            board.apply_move(tchess_move);
            self.board_state = board.to_string();
            if board.checkmate() {
                // log!(LogLevel::Info, "{:?} Checkmate!", player);
                self.outcome = Some(Outcome::Checkmate(player));
                return;
            }
            if board.stalemate() {
                // log!(LogLevel::Info, "{:?} Stalemate!", player);
                self.outcome = Some(Outcome::Stalemate);
                return;
            }
        }

        fn check_proof_is_player(&self, proof: &Proof) -> Player {
            proof.assert_resource(self.player_badge);
            let id = proof
                .get_non_fungibles()
                .pop_first()
                .expect("Proof has no badge");

            // will panic if id isnt a player
            self.get_player_nf_id(&id)
        }

        fn get_board(&self) -> Board {
            Board::from_fen(&self.board_state).expect("Failed to load board")
        }

        pub fn resign(&mut self, proof: Proof) {
            if self.is_game_over() {
                panic!("Cannot resign, game is over");
            }
            proof.assert_resource(self.player_badge);
            let id = proof
                .get_non_fungibles()
                .pop_first()
                .expect("Proof has no badge");

            let player = self.get_player_nf_id(&id);
            // log!(LogLevel::Info, "{:?} resigned", player);
            self.outcome = Some(Outcome::Resignation(player.other()));
        }

        fn get_player_nf_id(&self, id: &NonFungibleId) -> Player {
            if self.white == *id {
                Player::White
            } else if self.black == *id {
                Player::Black
            } else {
                panic!("The player {id} is not part of this game");
            }
        }

        fn is_game_over(&self) -> bool {
            self.outcome.is_some()
        }

        pub fn validate_winner(&self, id: NonFungibleId) {
            let player = self.get_player_nf_id(&id);
            if self
                .outcome
                .as_ref()
                .is_some_and(|o| o.winner() == Some(player))
            {
                return;
            }
            panic!("Player {player:?} is not the winner of this game");
        }
    }
}
