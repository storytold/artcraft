//! Production character test data from the test account.

pub struct TestCharacter {
  pub token: &'static str,
  pub name: &'static str,
  pub avatar_cdn_url: &'static str,
}

pub const JIM: TestCharacter = TestCharacter {
  token: "character_9f3sa1qatp1nr3876srm0b",
  name: "Jim",
  avatar_cdn_url: "https://cdn-2.fakeyou.com/media/b/b/w/7/3/bbw7329f04h0zcsyvh5tb908htfvq9fy/artcraft_bbw7329f04h0zcsyvh5tb908htfvq9fy.jpg",
};

pub const FANTASY_RAPTOR: TestCharacter = TestCharacter {
  token: "character_6rhsk8a7twjdnykhw4kr4n",
  name: "Fantasy Raptor",
  avatar_cdn_url: "https://cdn-2.fakeyou.com/media/p/1/q/v/m/p1qvmnh5z637cdpc5m3wr6qmjr77q48f/artcraft_p1qvmnh5z637cdpc5m3wr6qmjr77q48f.png",
};

pub const KNIGHT: TestCharacter = TestCharacter {
  token: "character_6xvgbmm9q79c5ygsj0y4fb",
  name: "Knight",
  avatar_cdn_url: "https://cdn-2.fakeyou.com/media/w/k/j/5/q/wkj5qwnpg9dm5969jbz4vs49xncypq2y/artcraft_wkj5qwnpg9dm5969jbz4vs49xncypq2y.png",
};
