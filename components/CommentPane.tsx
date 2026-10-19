"use client";

import { useState, type SyntheticEvent } from "react";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import AddCommentIcon from "@mui/icons-material/AddCommentOutlined";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import CloseIcon from "@mui/icons-material/Close";
import type { Actor } from "@/lib/session";
import { unresolvedThreadCount } from "@/lib/comments";
import { CommentThread, type CommentRecord, type CommentTarget } from "@/components/CommentThread";
import { CommentComposer } from "@/components/CommentComposer";
import { ResolvedThreadsToggle } from "@/components/ResolvedThreadsToggle";
import { addComment } from "@/app/(app)/menus/[id]/comment-actions";

// Touch events inside a portal still bubble through the *React* tree, so
// a drawer opened from inside components/SwipeableRow.tsx would otherwise
// drive that row's swipe-to-reveal gesture while someone scrolls the pane.
function stopTouch(e: SyntheticEvent) {
  e.stopPropagation();
}

// REQ-28.1-28.4: the single entry point for viewing and starting comments
// on one area of a menu (the whole menu, a dish, or an ingredient).
//
// - The trigger sits right beside the thing it's about (a dish or
//   ingredient name, or the page header for the whole menu), and its badge
//   is that area's count of *unresolved* threads (REQ-28.2) -- resolved
//   ones don't need attention, so they never inflate the number.
// - Clicking it opens a side pane (bottom sheet on a phone-sized screen)
//   instead of expanding a full thread inline in the middle of the menu,
//   so the menu layout never jumps around and the conversation has room.
// - "New comment" is always available at the top of the pane, so an area
//   can hold any number of separate threads (REQ-28.3). An area with no
//   threads yet opens straight into the composer.
//
// Open/closed is plain client state: comment-actions.ts still redirects to
// this same page with a toast (ADR 0023), and a search-param-only change
// doesn't remount the page, so the pane stays open across a post.
export function CommentPane({
  menuId,
  patrolColor,
  patrolName,
  target,
  title,
  subtitle,
  comments,
  actor,
  variant = "icon",
}: {
  menuId: string;
  patrolColor: string;
  patrolName: string;
  target: CommentTarget;
  title: string;
  subtitle: string;
  comments: CommentRecord[];
  actor: Actor | null;
  variant?: "icon" | "button";
}) {
  const theme = useTheme();
  const isPhoneSized = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(false);
  const [composing, setComposing] = useState(false);

  const openThreads = comments.filter((c) => c.status === "OPEN");
  const resolvedThreads = comments.filter((c) => c.status === "RESOLVED");
  const unresolved = unresolvedThreadCount(comments);
  const hasAny = comments.length > 0;

  const hiddenTargetFields: Record<string, string> = { menuId, target: target.type };
  if (target.type === "DISH") hiddenTargetFields.dishId = target.dishId;
  if (target.type === "INGREDIENT") hiddenTargetFields.ingredientId = target.ingredientId;

  const triggerLabel =
    unresolved > 0
      ? `Comments on ${title} (${unresolved} unresolved)`
      : hasAny
        ? `Comments on ${title} (all resolved)`
        : `Add a comment on ${title}`;

  function handleOpen() {
    setComposing(!hasAny && actor !== null);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setComposing(false);
  }

  const icon = unresolved > 0 || hasAny ? <ChatBubbleIcon fontSize="small" /> : <ChatBubbleOutlineIcon fontSize="small" />;

  const trigger =
    variant === "button" ? (
      <Badge badgeContent={unresolved} color="primary">
        <Button variant="outlined" size="small" onClick={handleOpen} aria-label={triggerLabel} startIcon={icon}>
          Menu comments
        </Button>
      </Badge>
    ) : (
      <Tooltip title={triggerLabel}>
        <IconButton
          size="small"
          onClick={handleOpen}
          aria-label={triggerLabel}
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,
            color: unresolved > 0 ? "primary.main" : "text.secondary",
          }}
        >
          <Badge badgeContent={unresolved} color="primary" sx={{ "& .MuiBadge-badge": { fontSize: 10, height: 16, minWidth: 16 } }}>
            {icon}
          </Badge>
        </IconButton>
      </Tooltip>
    );

  return (
    <>
      {trigger}
      <Drawer
        anchor={isPhoneSized ? "bottom" : "right"}
        open={open}
        onClose={handleClose}
        onTouchStart={stopTouch}
        onTouchMove={stopTouch}
        onTouchEnd={stopTouch}
        slotProps={{
          paper: {
            sx: isPhoneSized
              ? { maxHeight: "85vh", borderTopLeftRadius: 16, borderTopRightRadius: 16 }
              : { width: 420, maxWidth: "100vw" },
          },
        }}
      >
        <Stack sx={{ height: "100%", minHeight: 0 }} role="region" aria-label={`Comments on ${title}`}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", p: 2, pb: 1.5 }}>
            <Stack sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                {subtitle}
              </Typography>
              <Typography variant="h6" component="h2" sx={{ overflowWrap: "anywhere" }}>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {unresolved === 0
                  ? hasAny
                    ? "All comments resolved"
                    : "No comments yet"
                  : `${unresolved} unresolved`}
              </Typography>
            </Stack>
            <IconButton aria-label="Close comments" onClick={handleClose} sx={{ width: 44, height: 44 }}>
              <CloseIcon />
            </IconButton>
          </Stack>

          {actor && (
            <Box sx={{ px: 2, pb: 2 }}>
              {composing ? (
                <CommentComposer
                  action={addComment}
                  hiddenFields={hiddenTargetFields}
                  label="New comment"
                  submitLabel="Comment"
                  onDone={() => setComposing(false)}
                />
              ) : (
                <Button variant="contained" size="small" startIcon={<AddCommentIcon />} onClick={() => setComposing(true)}>
                  New comment
                </Button>
              )}
            </Box>
          )}

          <Divider />

          <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
            <Stack spacing={2} divider={<Divider flexItem />}>
              {openThreads.length === 0 && !composing && (
                <Typography variant="body2" color="text.secondary">
                  {hasAny ? "Nothing open here." : "Start the conversation with “New comment.”"}
                </Typography>
              )}
              {openThreads.map((root) => (
                <CommentThread
                  key={root.id}
                  menuId={menuId}
                  patrolColor={patrolColor}
                  patrolName={patrolName}
                  root={root}
                  actor={actor}
                />
              ))}
            </Stack>

            {resolvedThreads.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <ResolvedThreadsToggle count={resolvedThreads.length}>
                  <Stack spacing={2} divider={<Divider flexItem />}>
                    {resolvedThreads.map((root) => (
                      <CommentThread
                        key={root.id}
                        menuId={menuId}
                        patrolColor={patrolColor}
                        patrolName={patrolName}
                        root={root}
                        actor={actor}
                      />
                    ))}
                  </Stack>
                </ResolvedThreadsToggle>
              </Box>
            )}
          </Box>
        </Stack>
      </Drawer>
    </>
  );
}
