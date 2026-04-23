export type McItem = {
  id: string;       // snake_case id used in sprite URL
  name: string;     // display name
  category: string;
};

// Sprite URL: https://minecraft.wiki/images/Invicon_{PascalCase}.png
// We store the exact wiki image slug for each item.
export function mcItemIconUrl(itemId: string): string {
  // Convert snake_case to PascalCase for the wiki URL
  const pascal = itemId
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("_");
  return `https://minecraft.wiki/images/Invicon_${pascal}.png`;
}

export const MC_ITEMS: McItem[] = [
  // Netherite
  { id: "netherite_ingot", name: "Netherite Ingot", category: "Materials" },
  { id: "netherite_scrap", name: "Netherite Scrap", category: "Materials" },
  { id: "netherite_block", name: "Block of Netherite", category: "Blocks" },
  { id: "netherite_sword", name: "Netherite Sword", category: "Weapons" },
  { id: "netherite_pickaxe", name: "Netherite Pickaxe", category: "Tools" },
  { id: "netherite_axe", name: "Netherite Axe", category: "Tools" },
  { id: "netherite_shovel", name: "Netherite Shovel", category: "Tools" },
  { id: "netherite_hoe", name: "Netherite Hoe", category: "Tools" },
  { id: "netherite_helmet", name: "Netherite Helmet", category: "Armor" },
  { id: "netherite_chestplate", name: "Netherite Chestplate", category: "Armor" },
  { id: "netherite_leggings", name: "Netherite Leggings", category: "Armor" },
  { id: "netherite_boots", name: "Netherite Boots", category: "Armor" },
  { id: "netherite_upgrade_smithing_template", name: "Netherite Upgrade Template", category: "Materials" },

  // Diamond
  { id: "diamond", name: "Diamond", category: "Materials" },
  { id: "diamond_block", name: "Block of Diamond", category: "Blocks" },
  { id: "diamond_sword", name: "Diamond Sword", category: "Weapons" },
  { id: "diamond_pickaxe", name: "Diamond Pickaxe", category: "Tools" },
  { id: "diamond_axe", name: "Diamond Axe", category: "Tools" },
  { id: "diamond_shovel", name: "Diamond Shovel", category: "Tools" },
  { id: "diamond_hoe", name: "Diamond Hoe", category: "Tools" },
  { id: "diamond_helmet", name: "Diamond Helmet", category: "Armor" },
  { id: "diamond_chestplate", name: "Diamond Chestplate", category: "Armor" },
  { id: "diamond_leggings", name: "Diamond Leggings", category: "Armor" },
  { id: "diamond_boots", name: "Diamond Boots", category: "Armor" },

  // Gold
  { id: "gold_ingot", name: "Gold Ingot", category: "Materials" },
  { id: "gold_nugget", name: "Gold Nugget", category: "Materials" },
  { id: "gold_block", name: "Block of Gold", category: "Blocks" },
  { id: "golden_apple", name: "Golden Apple", category: "Food" },
  { id: "enchanted_golden_apple", name: "Enchanted Golden Apple", category: "Food" },

  // Iron
  { id: "iron_ingot", name: "Iron Ingot", category: "Materials" },
  { id: "iron_nugget", name: "Iron Nugget", category: "Materials" },
  { id: "iron_block", name: "Block of Iron", category: "Blocks" },
  { id: "iron_sword", name: "Iron Sword", category: "Weapons" },
  { id: "iron_pickaxe", name: "Iron Pickaxe", category: "Tools" },
  { id: "iron_axe", name: "Iron Axe", category: "Tools" },

  // Emerald
  { id: "emerald", name: "Emerald", category: "Materials" },
  { id: "emerald_block", name: "Block of Emerald", category: "Blocks" },

  // Redstone
  { id: "redstone", name: "Redstone Dust", category: "Materials" },
  { id: "redstone_block", name: "Block of Redstone", category: "Blocks" },

  // Lapis
  { id: "lapis_lazuli", name: "Lapis Lazuli", category: "Materials" },
  { id: "lapis_block", name: "Lapis Lazuli Block", category: "Blocks" },

  // Quartz
  { id: "quartz", name: "Nether Quartz", category: "Materials" },
  { id: "quartz_block", name: "Block of Quartz", category: "Blocks" },

  // End
  { id: "ender_pearl", name: "Ender Pearl", category: "Materials" },
  { id: "eye_of_ender", name: "Eye of Ender", category: "Materials" },
  { id: "end_crystal", name: "End Crystal", category: "Combat" },
  { id: "elytra", name: "Elytra", category: "Armor" },
  { id: "shulker_shell", name: "Shulker Shell", category: "Materials" },
  { id: "shulker_box", name: "Shulker Box", category: "Blocks" },

  // Nether
  { id: "blaze_rod", name: "Blaze Rod", category: "Materials" },
  { id: "blaze_powder", name: "Blaze Powder", category: "Materials" },
  { id: "ghast_tear", name: "Ghast Tear", category: "Materials" },
  { id: "magma_cream", name: "Magma Cream", category: "Materials" },
  { id: "nether_star", name: "Nether Star", category: "Materials" },
  { id: "beacon", name: "Beacon", category: "Blocks" },
  { id: "crying_obsidian", name: "Crying Obsidian", category: "Blocks" },
  { id: "obsidian", name: "Obsidian", category: "Blocks" },
  { id: "ancient_debris", name: "Ancient Debris", category: "Materials" },

  // Enchanting
  { id: "enchanted_book", name: "Enchanted Book", category: "Enchanting" },
  { id: "experience_bottle", name: "Bottle o' Enchanting", category: "Enchanting" },
  { id: "bookshelf", name: "Bookshelf", category: "Blocks" },

  // Potions
  { id: "potion", name: "Potion", category: "Potions" },
  { id: "splash_potion", name: "Splash Potion", category: "Potions" },
  { id: "lingering_potion", name: "Lingering Potion", category: "Potions" },

  // Food
  { id: "bread", name: "Bread", category: "Food" },
  { id: "cooked_beef", name: "Steak", category: "Food" },
  { id: "cooked_porkchop", name: "Cooked Porkchop", category: "Food" },

  // Misc valuable
  { id: "totem_of_undying", name: "Totem of Undying", category: "Combat" },
  { id: "trident", name: "Trident", category: "Weapons" },
  { id: "mace", name: "Mace", category: "Weapons" },
  { id: "crossbow", name: "Crossbow", category: "Weapons" },
  { id: "bow", name: "Bow", category: "Weapons" },
  { id: "arrow", name: "Arrow", category: "Combat" },
  { id: "spectral_arrow", name: "Spectral Arrow", category: "Combat" },
  { id: "tipped_arrow", name: "Tipped Arrow", category: "Combat" },
  { id: "firework_rocket", name: "Firework Rocket", category: "Misc" },
  { id: "map", name: "Map", category: "Misc" },
  { id: "compass", name: "Compass", category: "Misc" },
  { id: "clock", name: "Clock", category: "Misc" },
  { id: "spyglass", name: "Spyglass", category: "Misc" },
  { id: "saddle", name: "Saddle", category: "Misc" },
  { id: "name_tag", name: "Name Tag", category: "Misc" },
  { id: "lead", name: "Lead", category: "Misc" },
  { id: "turtle_helmet", name: "Turtle Shell", category: "Armor" },
  { id: "heart_of_the_sea", name: "Heart of the Sea", category: "Materials" },
  { id: "nautilus_shell", name: "Nautilus Shell", category: "Materials" },
  { id: "conduit", name: "Conduit", category: "Blocks" },
  { id: "dragon_egg", name: "Dragon Egg", category: "Blocks" },
  { id: "dragon_breath", name: "Dragon's Breath", category: "Materials" },
  { id: "wither_skeleton_skull", name: "Wither Skeleton Skull", category: "Materials" },
  { id: "coal", name: "Coal", category: "Materials" },
  { id: "coal_block", name: "Block of Coal", category: "Blocks" },
  { id: "string", name: "String", category: "Materials" },
  { id: "leather", name: "Leather", category: "Materials" },
  { id: "feather", name: "Feather", category: "Materials" },
  { id: "bone", name: "Bone", category: "Materials" },
  { id: "bone_meal", name: "Bone Meal", category: "Materials" },
  { id: "ink_sac", name: "Ink Sac", category: "Materials" },
  { id: "glow_ink_sac", name: "Glow Ink Sac", category: "Materials" },
  { id: "slimeball", name: "Slimeball", category: "Materials" },
  { id: "honey_bottle", name: "Honey Bottle", category: "Food" },
  { id: "honeycomb", name: "Honeycomb", category: "Materials" },
  { id: "amethyst_shard", name: "Amethyst Shard", category: "Materials" },
  { id: "amethyst_block", name: "Block of Amethyst", category: "Blocks" },
  { id: "raw_iron", name: "Raw Iron", category: "Materials" },
  { id: "raw_gold", name: "Raw Gold", category: "Materials" },
  { id: "raw_copper", name: "Raw Copper", category: "Materials" },
  { id: "copper_ingot", name: "Copper Ingot", category: "Materials" },
  { id: "music_disc_13", name: "Music Disc (13)", category: "Misc" },
  { id: "music_disc_pigstep", name: "Music Disc (Pigstep)", category: "Misc" },
  { id: "music_disc_otherside", name: "Music Disc (Otherside)", category: "Misc" },
  { id: "disc_fragment_5", name: "Disc Fragment (5)", category: "Misc" },
];

export function searchMcItems(query: string): McItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return MC_ITEMS.slice(0, 12);
  return MC_ITEMS.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q),
  ).slice(0, 12);
}
