export enum ArtStyle {
  Anime2_5D = "anime_2_5d",
  Anime2DFlat = "anime_2d_flat",
  Cartoon3D = "cartoon_3d",
  ComicBook = "comic_book",
  AnimeGhibli = "anime_ghibli",
  InkPunk = "ink_punk",
  InkSplash = "ink_splash",
  InkBWStyle = "ink_bw_style",
  JojoStyle = "jojo_style",
  PaperOrigami = "paper_origami",
  PixelArt = "pixel_art",
  PopArt = "pop_art",
  Realistic1 = "realistic_1",
  Realistic2 = "realistic_2",
  AnimeRetroNeon = "anime_retro_neon",
  AnimeStandard = "anime_standard",
  HRGiger = "hr_giger",
  Simpsons = "simpsons",
  Carnage = "carnage",
  PastelCuteAnime = "pastel_cute_anime",
  Bloom = "bloom_lighting",
  Horror2_5D = "25d_horror",
  Creepy = "creepy",
  CreepyVHS = "creepy_vhs",
  TrailCamFootage = "trail_cam_footage",
  OldBWMovie = "old_black_white_movie",
  HorrorNoirBW = "horror_noir_black_white",
  TechnoNoirBW = "techno_noir_black_white",
  BW20s = "black_white_20s",
  AnimeCyberpunk = "cyberpunk_anime",
  Dragonball = "dragonball",
  RealisticMatrix = "realistic_matrix",
  RealisticCyberpunk = "realistic_cyberpunk",
}

export function getArtStyle(styleString: string): ArtStyle {
  switch (styleString.toLowerCase()) {
    case "anime_2_5d":
      return ArtStyle.Anime2_5D;
    case "anime_2d_flat":
      return ArtStyle.Anime2DFlat;
    case "cartoon_3d":
      return ArtStyle.Cartoon3D;
    case "comic_book":
      return ArtStyle.ComicBook;
    case "anime_ghibli":
      return ArtStyle.AnimeGhibli;
    case "ink_punk":
      return ArtStyle.InkPunk;
    case "ink_splash":
      return ArtStyle.InkSplash;
    case "ink_bw_style":
      return ArtStyle.InkBWStyle;
    case "jojo_style":
      return ArtStyle.JojoStyle;
    case "paper_origami":
      return ArtStyle.PaperOrigami;
    case "pixel_art":
      return ArtStyle.PixelArt;
    case "pop_art":
      return ArtStyle.PopArt;
    case "realistic_1":
      return ArtStyle.Realistic1;
    case "realistic_2":
      return ArtStyle.Realistic2;
    case "anime_retro_neon":
      return ArtStyle.AnimeRetroNeon;
    case "anime_standard":
      return ArtStyle.AnimeStandard;
    case "hr_giger":
      return ArtStyle.HRGiger;
    case "simpsons":
      return ArtStyle.Simpsons;
    case "carnage":
      return ArtStyle.Carnage;
    case "pastel_cute_anime":
      return ArtStyle.PastelCuteAnime;
    case "bloom_lighting":
      return ArtStyle.Bloom;
    case "25d_horror":
      return ArtStyle.Horror2_5D;
    case "creepy":
      return ArtStyle.Creepy;
    case "creepy_vhs":
      return ArtStyle.CreepyVHS;
    case "trail_cam_footage":
      return ArtStyle.TrailCamFootage;
    case "old_black_white_movie":
      return ArtStyle.OldBWMovie;
    case "horror_noir_black_white":
      return ArtStyle.HorrorNoirBW;
    case "techno_noir_black_white":
      return ArtStyle.TechnoNoirBW;
    case "black_white_20s":
      return ArtStyle.BW20s;
    case "cyberpunk_anime":
      return ArtStyle.AnimeCyberpunk;
    case "dragonball":
      return ArtStyle.Dragonball;
    case "realistic_matrix":
      return ArtStyle.RealisticMatrix;
    case "realistic_cyberpunk":
      return ArtStyle.RealisticCyberpunk;
    default:
      throw new Error(`Unknown art style: ${styleString}`);
  }
}
