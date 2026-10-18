import { useId } from "react";
import SvgIcon from "@mui/material/SvgIcon";
import type { SvgIconProps } from "@mui/material/SvgIcon";

// REQ-18.2/18.7: original, hand-drawn silhouettes built from basic
// geometric primitives (circles, ellipses, straight-edged paths) -- never
// traced or adapted from a real animal photo, another icon set, an emoji,
// or any Scouting America / BSA emblem. Each one wraps MUI's `SvgIcon` so
// it takes the same `fontSize`/`htmlColor`/`sx` props as an
// `@mui/icons-material` icon, and the two are interchangeable everywhere
// `lib/patrolIcons.ts` renders one.
//
// Most mammals share one base head shape (a circle) with 1-2 extra
// elements layered on to differentiate the species -- ears, antlers, a
// tail, a snout -- rather than each being independently drawn from
// scratch, the way a real icon family would be built.
//
// A handful of icons (owl's eyes, the bee's stripes) need a true cutout,
// not just a second shape, since these icons render in a single color
// (`currentColor`, driven by `contrastText(patrol.color)` -- REQ-18.4) on
// an arbitrary patrol background color: layering a translucent shape of
// the *same* currentColor on top of itself produces no visible contrast,
// and guessing a fixed white/black accent would look wrong against some
// patrol colors. An SVG `<mask>` instead punches a genuine hole straight
// through to whatever's actually behind the icon -- the real patrol
// color -- so it always looks correct. `useId()` keeps each mask's id
// unique per rendered icon, since the same icon can appear many times on
// one page (the patrols list, a campout's patrol cards) and SVG ids are
// global to the document.

export function FoxIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 4 L8 9 L4 6 L5 12.5 Q6 18 12 20 Q18 18 19 12.5 L20 6 L16 9 Z" />
    </SvgIcon>
  );
}

export function WolfIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 5 L7.5 8.5 L5 5.5 L5.5 11.5 Q5 17.5 12 20 Q19 17.5 18.5 11.5 L19 5.5 L16.5 8.5 Z" />
    </SvgIcon>
  );
}

export function BearIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="7" cy="6.5" r="2.3" />
      <circle cx="17" cy="6.5" r="2.3" />
      <circle cx="12" cy="13" r="8" />
    </SvgIcon>
  );
}

export function DeerIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path
        d="M12 2 L11.3 6.5 M8.6 3.3 L11.3 6.5 M6.6 5.3 L9.6 6.8 M12 2 L12.7 6.5 M15.4 3.3 L12.7 6.5 M17.4 5.3 L14.4 6.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="14" r="7" />
    </SvgIcon>
  );
}

export function RabbitIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <ellipse cx="9" cy="6" rx="1.7" ry="5" transform="rotate(-12 9 6)" />
      <ellipse cx="15" cy="6" rx="1.7" ry="5" transform="rotate(12 15 6)" />
      <circle cx="12" cy="15" r="7" />
    </SvgIcon>
  );
}

export function SquirrelIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M19 20 Q22 13 17 8 Q21 9 21.5 15 Q21.8 18.5 19 20 Z" />
      <circle cx="9" cy="13" r="6" />
    </SvgIcon>
  );
}

export function RaccoonIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="7.5" cy="6.5" r="2.1" />
      <circle cx="16.5" cy="6.5" r="2.1" />
      <path d="M12 19.5 L9.5 16 Q12 14 14.5 16 Z" />
      <circle cx="12" cy="13" r="7.5" />
    </SvgIcon>
  );
}

export function OtterIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="8" cy="8" r="1.6" />
      <circle cx="16" cy="8" r="1.6" />
      <ellipse cx="12" cy="14" rx="8.5" ry="7" />
    </SvgIcon>
  );
}

export function BeaverIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <ellipse cx="18.5" cy="18" rx="4" ry="2.6" transform="rotate(-25 18.5 18)" />
      <circle cx="8" cy="6.5" r="1.8" />
      <circle cx="14.5" cy="6.5" r="1.8" />
      <circle cx="10.5" cy="13" r="7" />
    </SvgIcon>
  );
}

export function TurtleIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="4.5" cy="12" r="2.2" />
      <path
        d="M8 18 L5 21 M16 18 L19 21 M8 8 L5 5 M16 8 L19 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <ellipse cx="13" cy="13" rx="8" ry="6.5" />
    </SvgIcon>
  );
}

export function EagleIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4 10 L10 11.5 L8.5 15 Z" />
      <path d="M20 10 L14 11.5 L15.5 15 Z" />
      <circle cx="12" cy="11" r="5.5" />
      <path d="M12 13.5 L15 15.5 L12 17.5 Z" />
    </SvgIcon>
  );
}

export function OwlIcon(props: SvgIconProps) {
  const maskId = useId();
  return (
    <SvgIcon {...props}>
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width="24" height="24" fill="white" />
          <circle cx="9" cy="13" r="2.4" fill="black" />
          <circle cx="15" cy="13" r="2.4" fill="black" />
        </mask>
      </defs>
      <path d="M8 6 L9.5 9.5 L6.5 8.5 Z" />
      <path d="M16 6 L14.5 9.5 L17.5 8.5 Z" />
      <circle cx="12" cy="13.5" r="8.5" mask={`url(#${maskId})`} />
      <circle cx="9" cy="13" r="1" />
      <circle cx="15" cy="13" r="1" />
      <path d="M12 14.5 L10.7 17 L13.3 17 Z" />
    </SvgIcon>
  );
}

export function RavenIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <ellipse cx="13" cy="14" rx="7.5" ry="5.5" transform="rotate(-18 13 14)" />
      <circle cx="7.5" cy="9.5" r="3.4" />
      <path d="M4.3 9 L1.5 8.3 L4.6 7.3 Z" />
      <path d="M18 17 L22 15.5 M18 18.5 L22.5 18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </SvgIcon>
  );
}

export function DuckIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <ellipse cx="11" cy="15" rx="8" ry="5.5" />
      <circle cx="15" cy="8" r="4.2" />
      <path d="M18.5 8.3 L22 7.6 L18.8 10 Z" />
    </SvgIcon>
  );
}

export function FishIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M2 12 Q9.5 4 18 12 Q9.5 20 2 12 Z" />
      <path d="M18 12 L22.5 8.3 L22.5 15.7 Z" />
    </SvgIcon>
  );
}

export function BeeIcon(props: SvgIconProps) {
  const maskId = useId();
  return (
    <SvgIcon {...props}>
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width="24" height="24" fill="white" />
          <rect x="7" y="10.3" width="10" height="1.4" fill="black" />
          <rect x="7" y="13.6" width="10" height="1.4" fill="black" />
          <rect x="7.5" y="16.8" width="9" height="1.2" fill="black" />
        </mask>
      </defs>
      <ellipse cx="5.5" cy="10" rx="4.5" ry="3.2" transform="rotate(-25 5.5 10)" opacity="0.6" />
      <ellipse cx="18.5" cy="10" rx="4.5" ry="3.2" transform="rotate(25 18.5 10)" opacity="0.6" />
      <ellipse cx="12" cy="14" rx="5" ry="6.5" mask={`url(#${maskId})`} />
    </SvgIcon>
  );
}

export function ButterflyIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M11 11 C11 5 3 4 3 9 C3 13 8 13 11 11 Z" />
      <path d="M13 11 C13 5 21 4 21 9 C21 13 16 13 13 11 Z" />
      <path d="M11 13 C11 18 4 20 4 16 C4 13 8 12.5 11 13 Z" />
      <path d="M13 13 C13 18 20 20 20 16 C20 13 16 12.5 13 13 Z" />
      <path d="M12 6 L12 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 6 L10.3 3.3 M12 6 L13.7 3.3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </SvgIcon>
  );
}

export function SnakeIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path
        d="M3 18 Q3 12 8 12 Q13 12 13 7 Q13 3 18 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M16.5 1.5 L21 3 L16.8 5.2 Z" />
    </SvgIcon>
  );
}
