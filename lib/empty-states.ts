import type { ComponentType } from "react";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";

export type EmptyStateCopy = {
  Icon: ComponentType<SvgIconProps>;
  message: string;
};

// REQ-19.5: every "nothing here yet" message and its icon lives here, keyed
// by context, so a future page reuses the troop's established voice instead
// of inventing a new "No X yet." sentence. REQ-19.6: this module only
// changes what an empty state says and shows -- never whether one appears.
export const EMPTY_STATES = {
  mealNoDishes(occasionLabel: string, canEdit: boolean): EmptyStateCopy {
    return {
      Icon: RestaurantIcon,
      message: canEdit
        ? `Nothing planned for ${occasionLabel} yet — add your patrol's first dish below.`
        : `Nothing planned for ${occasionLabel} yet.`,
    };
  },

  noCampouts(): EmptyStateCopy {
    return {
      Icon: CalendarMonthIcon,
      message: "No campouts yet — use New above to plan your first one.",
    };
  },

  noMenuAssigned(): EmptyStateCopy {
    return {
      Icon: AssignmentOutlinedIcon,
      message:
        "Your patrol doesn't have a campout menu to plan yet — check back once the ASPL of Camping assigns one.",
    };
  },

  noPatrolsAssignedToCampout(): EmptyStateCopy {
    return {
      Icon: GroupAddOutlinedIcon,
      message: "No patrols assigned to this campout yet — use Add patrol above to bring one in.",
    };
  },

  noIngredientsInShoppingList(): EmptyStateCopy {
    return {
      Icon: ShoppingCartOutlinedIcon,
      message: "No ingredients listed yet — add dishes and ingredients to the menu before printing.",
    };
  },
} as const;
