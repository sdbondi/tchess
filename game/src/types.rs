#[derive(Debug, Clone, Copy, serde::Serialize, serde::Deserialize, PartialEq, Eq)]
pub enum Player {
    White,
    Black,
}

impl Player {
    pub fn other(self) -> Self {
        match self {
            Player::White => Player::Black,
            Player::Black => Player::White,
        }
    }
}

#[derive(Debug, Clone, Copy, serde::Serialize, serde::Deserialize)]
pub enum Outcome {
    Checkmate(Player),
    Resignation(Player),
    Stalemate,
    Draw,
}

impl Outcome {
    pub fn winner(&self) -> Option<Player> {
        match self {
            Outcome::Checkmate(player) => Some(*player),
            Outcome::Resignation(player) => Some(*player),
            _ => None,
        }
    }
}
