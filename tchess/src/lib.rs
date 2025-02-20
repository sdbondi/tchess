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
    use std::collections::HashSet;
    use tari_template_lib::rand::random_u32;

    pub struct Tchess {
        token: ResourceAddress,
        player_badge: ResourceAddress,
        claimed_games: HashSet<ComponentAddress>,
        game_template: TemplateAddress,
    }

    impl Tchess {
        pub fn new(game_template: TemplateAddress) -> Component<Self> {
            let signer = CallerContext::transaction_signer_public_key();
            let owner_key = NonFungibleAddress::from_public_key(signer);
            let player_badges = ResourceBuilder::non_fungible()
                .with_access_rules(
                    ResourceAccessRules::new().mintable(rule!(non_fungible(owner_key.clone()))),
                )
                .with_owner_rule(OwnerRule::OwnedBySigner)
                .build();

            let token = ResourceBuilder::fungible()
                .with_token_symbol("TCHESS")
                .with_access_rules(ResourceAccessRules::new().mintable(AccessRule::Restricted(
                    Require(RequireRule::Require(RuleRequirement::NonFungibleAddress(
                        owner_key.clone(),
                    ))),
                )))
                .with_owner_rule(OwnerRule::OwnedBySigner)
                .build();

            Component::new(Self {
                token,
                player_badge: player_badges,
                claimed_games: HashSet::new(),
                game_template,
            })
            .with_access_rules(ComponentAccessRules::allow_all())
            .create()
        }

        pub fn create_user(&mut self) -> Bucket {
            let signer = CallerContext::transaction_signer_public_key();
            let id = NonFungibleId::U256(signer.into_array());
            self.badge_manager()
                .mint_non_fungible(id, &Metadata::new(), &())
        }

        pub fn create_game(&mut self, player_a: Proof, player_b: Proof) -> ComponentAddress {
            player_a.assert_resource(self.player_badge);
            player_b.assert_resource(self.player_badge);
            let player_a_id = player_a
                .get_non_fungibles()
                .pop_first()
                .expect("No badge in proof");
            let player_b_id = player_b
                .get_non_fungibles()
                .pop_first()
                .expect("No badge in proof");

            let player_a_addr = NonFungibleAddress::new(self.player_badge, player_a_id);
            let player_b_addr = NonFungibleAddress::new(self.player_badge, player_b_id);

            let args = if random_u32() % 2 == 0 {
                args![player_a_addr, player_b_addr]
            } else {
                args![player_b_addr, player_a_addr]
            };

            TemplateManager::get(self.game_template).call("new_game", args)
        }

        pub fn claim_reward(&mut self, proof: Proof, game: ComponentAddress) -> Bucket {
            if self.claimed_games.contains(&game) {
                panic!("Already claimed reward for this game");
            }
            proof.assert_resource(self.player_badge);
            let id = proof
                .get_non_fungibles()
                .pop_first()
                .expect("No badge in proof");
            let _auth = proof.authorize();
            let manager = ComponentManager::get(game);
            if manager.get_template_address() != self.game_template {
                panic!("Invalid game component. Must be {}", self.game_template);
            }
            manager.invoke("validate_winner", args![id]);
            self.claimed_games.insert(game);
            self.token().mint_fungible(100.into())
        }

        fn token(&self) -> ResourceManager {
            ResourceManager::get(self.token)
        }

        fn badge_manager(&self) -> ResourceManager {
            ResourceManager::get(self.player_badge)
        }
    }
}
