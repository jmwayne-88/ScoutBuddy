import type { ComponentType } from "react";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import ForestIcon from "@mui/icons-material/Forest";
import TerrainIcon from "@mui/icons-material/Terrain";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import NightsStayIcon from "@mui/icons-material/NightsStay";
import BoltIcon from "@mui/icons-material/Bolt";
import CloudIcon from "@mui/icons-material/Cloud";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import WavesIcon from "@mui/icons-material/Waves";
import LocalFloristIcon from "@mui/icons-material/LocalFlorist";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import GrassIcon from "@mui/icons-material/Grass";
import HikingIcon from "@mui/icons-material/Hiking";
import CabinIcon from "@mui/icons-material/Cabin";
import BackpackIcon from "@mui/icons-material/Backpack";
import ExploreIcon from "@mui/icons-material/Explore";
import MapIcon from "@mui/icons-material/Map";
import KayakingIcon from "@mui/icons-material/Kayaking";
import SailingIcon from "@mui/icons-material/Sailing";
import AnchorIcon from "@mui/icons-material/Anchor";
import FlashlightOnIcon from "@mui/icons-material/FlashlightOn";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import SoupKitchenIcon from "@mui/icons-material/SoupKitchen";
import LocalDrinkIcon from "@mui/icons-material/LocalDrink";
import OutdoorGrillIcon from "@mui/icons-material/OutdoorGrill";
import StarIcon from "@mui/icons-material/Star";
import ShieldIcon from "@mui/icons-material/Shield";
import FlagIcon from "@mui/icons-material/Flag";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import {
  FoxIcon,
  WolfIcon,
  BearIcon,
  DeerIcon,
  RabbitIcon,
  SquirrelIcon,
  RaccoonIcon,
  OtterIcon,
  BeaverIcon,
  TurtleIcon,
  EagleIcon,
  OwlIcon,
  RavenIcon,
  DuckIcon,
  FishIcon,
  BeeIcon,
  ButterflyIcon,
  SnakeIcon,
} from "@/components/icons/PatrolAnimalIcons";

export type PatrolIconCategory = "animal" | "outdoors" | "gear" | "neutral";

export interface PatrolIconDefinition {
  id: string;
  label: string;
  category: PatrolIconCategory;
  keywords: string[];
  Icon: ComponentType<SvgIconProps>;
}

// REQ-18.2/18.8: the single source of truth for "what patrol icons exist
// and what they're called" -- both `components/PatrolIconField.tsx` (the
// picker grid) and `suggestPatrolIconId` below read from this one table,
// so they can never drift out of sync with each other.
//
// REQ-18.2: considerably broader than the five current default patrols'
// own namesakes, since an ASPL can name a patrol anything (ADR 0018).
// This list is a floor, not a ceiling -- more icons can be added within
// these same categories later without touching anything else, since every
// consumer just maps over this array.
export const PATROL_ICONS: PatrolIconDefinition[] = [
  // Animals
  { id: "fox", label: "Fox", category: "animal", keywords: ["fox"], Icon: FoxIcon },
  { id: "wolf", label: "Wolf", category: "animal", keywords: ["wolf", "wolves", "coyote"], Icon: WolfIcon },
  { id: "bear", label: "Bear", category: "animal", keywords: ["bear", "grizzly"], Icon: BearIcon },
  { id: "deer", label: "Deer", category: "animal", keywords: ["deer", "buck", "stag", "elk", "moose"], Icon: DeerIcon },
  { id: "rabbit", label: "Rabbit", category: "animal", keywords: ["rabbit", "bunny", "hare"], Icon: RabbitIcon },
  { id: "squirrel", label: "Squirrel", category: "animal", keywords: ["squirrel", "chipmunk"], Icon: SquirrelIcon },
  {
    id: "raccoon",
    label: "Raccoon",
    category: "animal",
    keywords: ["raccoon", "badger", "opossum", "possum"],
    Icon: RaccoonIcon,
  },
  { id: "otter", label: "Otter", category: "animal", keywords: ["otter", "seal"], Icon: OtterIcon },
  { id: "beaver", label: "Beaver", category: "animal", keywords: ["beaver"], Icon: BeaverIcon },
  { id: "turtle", label: "Turtle", category: "animal", keywords: ["turtle", "tortoise"], Icon: TurtleIcon },
  {
    id: "eagle",
    label: "Eagle",
    category: "animal",
    keywords: ["eagle", "hawk", "falcon", "osprey"],
    Icon: EagleIcon,
  },
  { id: "owl", label: "Owl", category: "animal", keywords: ["owl"], Icon: OwlIcon },
  { id: "raven", label: "Raven", category: "animal", keywords: ["raven", "crow", "blackbird"], Icon: RavenIcon },
  { id: "duck", label: "Duck", category: "animal", keywords: ["duck", "goose", "mallard", "heron"], Icon: DuckIcon },
  { id: "fish", label: "Fish", category: "animal", keywords: ["fish", "trout", "bass", "salmon"], Icon: FishIcon },
  { id: "bee", label: "Bee", category: "animal", keywords: ["bee", "wasp", "hornet"], Icon: BeeIcon },
  { id: "butterfly", label: "Butterfly", category: "animal", keywords: ["butterfly", "moth"], Icon: ButterflyIcon },
  {
    id: "snake",
    label: "Snake",
    category: "animal",
    keywords: ["snake", "serpent", "viper", "rattlesnake"],
    Icon: SnakeIcon,
  },

  // Outdoors & nature
  { id: "tree", label: "Tree", category: "outdoors", keywords: ["tree", "pine", "forest", "woods"], Icon: ForestIcon },
  {
    id: "mountain",
    label: "Mountain",
    category: "outdoors",
    keywords: ["mountain", "peak", "summit", "ridge"],
    Icon: TerrainIcon,
  },
  { id: "sun", label: "Sun", category: "outdoors", keywords: ["sun", "sunshine", "solar"], Icon: WbSunnyIcon },
  { id: "moon", label: "Moon", category: "outdoors", keywords: ["moon", "night", "star", "stars"], Icon: NightsStayIcon },
  {
    id: "lightning",
    label: "Lightning",
    category: "outdoors",
    keywords: ["lightning", "thunder", "storm", "bolt"],
    Icon: BoltIcon,
  },
  { id: "cloud", label: "Cloud", category: "outdoors", keywords: ["cloud", "sky"], Icon: CloudIcon },
  {
    id: "waterdrop",
    label: "Water Drop",
    category: "outdoors",
    keywords: ["water", "drop", "rain", "spring"],
    Icon: WaterDropIcon,
  },
  {
    id: "waves",
    label: "River",
    category: "outdoors",
    keywords: ["river", "wave", "stream", "creek", "lake"],
    Icon: WavesIcon,
  },
  { id: "leaf", label: "Leaf", category: "outdoors", keywords: ["leaf", "flower", "bloom", "garden"], Icon: LocalFloristIcon },
  {
    id: "flame",
    label: "Campfire",
    category: "outdoors",
    keywords: ["fire", "flame", "campfire", "ember"],
    Icon: LocalFireDepartmentIcon,
  },
  { id: "grass", label: "Grass", category: "outdoors", keywords: ["grass", "meadow", "field", "prairie"], Icon: GrassIcon },
  { id: "trail", label: "Trail", category: "outdoors", keywords: ["trail", "hike", "hiking", "path"], Icon: HikingIcon },

  // Camping & Scoutcraft gear
  { id: "tent", label: "Tent", category: "gear", keywords: ["tent", "cabin", "shelter", "camp"], Icon: CabinIcon },
  { id: "backpack", label: "Backpack", category: "gear", keywords: ["backpack", "pack", "gear"], Icon: BackpackIcon },
  {
    id: "compass",
    label: "Compass",
    category: "gear",
    keywords: ["compass", "explore", "navigate", "scout"],
    Icon: ExploreIcon,
  },
  { id: "map", label: "Map", category: "gear", keywords: ["map", "route"], Icon: MapIcon },
  { id: "canoe", label: "Canoe", category: "gear", keywords: ["canoe", "kayak", "paddle"], Icon: KayakingIcon },
  { id: "sail", label: "Sailboat", category: "gear", keywords: ["sail", "boat", "sailing"], Icon: SailingIcon },
  { id: "anchor", label: "Anchor", category: "gear", keywords: ["anchor", "ship", "sea"], Icon: AnchorIcon },
  {
    id: "lantern",
    label: "Lantern",
    category: "gear",
    keywords: ["lantern", "light", "flashlight", "torch"],
    Icon: FlashlightOnIcon,
  },
  {
    id: "firstaid",
    label: "First Aid",
    category: "gear",
    keywords: ["first aid", "medic", "health", "safety"],
    Icon: MedicalServicesIcon,
  },
  {
    id: "cookingpot",
    label: "Cooking Pot",
    category: "gear",
    keywords: ["pot", "cook", "stew", "chili", "kitchen"],
    Icon: SoupKitchenIcon,
  },
  {
    id: "waterbottle",
    label: "Water Bottle",
    category: "gear",
    keywords: ["bottle", "canteen", "hydrate"],
    Icon: LocalDrinkIcon,
  },
  { id: "grill", label: "Campfire Grill", category: "gear", keywords: ["grill", "barbecue", "bbq", "cookout"], Icon: OutdoorGrillIcon },

  // Neutral fallback shapes -- troop-neutral, no animal/theme implied, for
  // a patrol name with no obvious match (e.g. "Joe Patrol").
  { id: "star", label: "Star", category: "neutral", keywords: ["star"], Icon: StarIcon },
  { id: "shield", label: "Shield", category: "neutral", keywords: ["shield", "guard", "defend"], Icon: ShieldIcon },
  { id: "banner", label: "Banner", category: "neutral", keywords: ["flag", "banner", "pennant"], Icon: FlagIcon },
  { id: "arrow", label: "Arrow", category: "neutral", keywords: ["arrow", "forward"], Icon: ArrowForwardIcon },
  { id: "badge", label: "Badge", category: "neutral", keywords: ["badge", "medal", "award"], Icon: WorkspacePremiumIcon },
];

const PATROL_ICON_MAP = new Map(PATROL_ICONS.map((icon) => [icon.id, icon]));

export function getPatrolIcon(iconId: string | null | undefined): PatrolIconDefinition | undefined {
  if (!iconId) return undefined;
  return PATROL_ICON_MAP.get(iconId);
}

export function isValidPatrolIconId(iconId: string): boolean {
  return PATROL_ICON_MAP.has(iconId);
}

// REQ-18.9: a plain, deterministic local keyword lookup -- no fuzzy/AI
// matching, no network call. Returns the first icon whose keyword list
// contains the patrol name (case-insensitive substring match, so a
// multi-word keyword like "first aid" or a name like "Silver Fox Patrol"
// both still match), or null when nothing matches -- callers fall back to
// REQ-18.3's existing unset default rather than guessing.
export function suggestPatrolIconId(name: string): string | null {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return null;

  for (const icon of PATROL_ICONS) {
    if (icon.keywords.some((keyword) => normalized.includes(keyword))) {
      return icon.id;
    }
  }
  return null;
}
