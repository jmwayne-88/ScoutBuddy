"use client";

import { useState, useTransition } from "react";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import PersonIcon from "@mui/icons-material/Person";
import ReplyIcon from "@mui/icons-material/Reply";
import CheckIcon from "@mui/icons-material/Check";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import type { CommentActorRole, CommentStatus, MealOccasion } from "@prisma/client";
import { formatEventDate } from "@/lib/dates";
import { actorLabel } from "@/lib/comments";
import { contrastText } from "@/lib/colors";
import { isCommentAuthor } from "@/lib/permissions";
import type { Actor } from "@/lib/session";
import { RelativeDate } from "@/components/RelativeDate";
import { SubmitButton } from "@/components/SubmitButton";
import { RemoveIconButton } from "@/components/RemoveIconButton";
import { CommentComposer } from "@/components/CommentComposer";
import {
  assignComment,
  deleteComment,
  replyToComment,
  reopenComment,
  resolveComment,
} from "@/app/(app)/menus/[id]/comment-actions";

// `replies` holds plain (non-nested) rows -- REQ-26.2's threading is one
// level deep, matching lib/comments.ts's `nestReplies` output shape
// (`CommentNode<T> = T & { replies: T[] }`), so a reply never carries its
// own further-nested `replies` field.
type CommentBase = {
  id: string;
  parentId: string | null;
  body: string;
  authorRole: CommentActorRole;
  authorPatrolId: string | null;
  status: CommentStatus;
  assigneeRole: CommentActorRole | null;
  createdAt: Date;
};

export type CommentRecord = CommentBase & { replies: CommentBase[] };

export type CommentTarget =
  | { type: "MENU" }
  | { type: "DISH"; dishId: string }
  | { type: "INGREDIENT"; ingredientId: string }
  | { type: "MEAL"; occasion: MealOccasion };

// REQ-26.2-26.5/26.9, revised by REQ-28.3/28.4: one root comment and its
// flat replies, rendered inside components/CommentPane.tsx. Reuses
// Requirement 22's chat-bubble shape and relative-timestamp convention;
// the ASPL side keeps REQ-22's patrol-color accent, the Patrol Leader side
// uses `primary.main`.
//
// Per-thread controls are a single compact row of text buttons (Reply,
// Resolve/Reopen, Assign) rather than an always-visible reply field and
// assign <select> under every thread -- the reply composer only appears
// once "Reply" is clicked, and can be cancelled.
//
// "use client": Reply's open/closed state and Assign's menu are
// interactive, and building Chip/Menu/Tooltip trees here (not in the
// Server Component page) sidesteps CLAUDE.md's MUI + Server Components
// gotcha entirely. Server Actions are imported directly, which is safe.
export function CommentThread({
  menuId,
  patrolColor,
  patrolName,
  root,
  actor,
}: {
  menuId: string;
  patrolColor: string;
  patrolName: string;
  root: CommentRecord;
  actor: Actor | null;
}) {
  const [replying, setReplying] = useState(false);
  const [assignAnchor, setAssignAnchor] = useState<HTMLElement | null>(null);
  const [isAssigning, startAssignTransition] = useTransition();
  const avatarText = contrastText(patrolColor);
  const resolved = root.status === "RESOLVED";

  function assignTo(role: CommentActorRole) {
    setAssignAnchor(null);
    if (role === root.assigneeRole) return;
    const formData = new FormData();
    formData.set("menuId", menuId);
    formData.set("commentId", root.id);
    formData.set("assigneeRole", role);
    startAssignTransition(async () => {
      await assignComment(formData);
    });
  }

  function renderBubble(comment: CommentBase, isReply: boolean) {
    const isASPLAuthor = comment.authorRole === "ASPL";
    const canDelete = isCommentAuthor(actor, comment);

    return (
      <Stack key={comment.id} direction="row" spacing={1} sx={{ alignItems: "flex-start", ml: isReply ? 4.5 : 0 }}>
        <Avatar
          sx={{
            width: 28,
            height: 28,
            flexShrink: 0,
            bgcolor: isASPLAuthor ? patrolColor : "primary.main",
            color: isASPLAuthor ? avatarText : "primary.contrastText",
          }}
        >
          <PersonIcon fontSize="small" htmlColor={isASPLAuthor ? avatarText : undefined} />
        </Avatar>
        <Paper
          variant="outlined"
          sx={{
            p: 1.25,
            flex: 1,
            minWidth: 0,
            borderTopLeftRadius: 4,
            borderTopRightRadius: 16,
            borderBottomRightRadius: 16,
            borderBottomLeftRadius: 16,
            borderLeft: 4,
            borderLeftColor: isASPLAuthor ? patrolColor : "primary.main",
          }}
        >
          <Stack spacing={0.5}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "baseline", minWidth: 0 }}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {actorLabel(comment.authorRole, patrolName)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  <RelativeDate {...formatEventDate(comment.createdAt)} />
                </Typography>
              </Stack>
              {canDelete && (
                <RemoveIconButton
                  label={isReply ? "Delete reply" : "Delete comment"}
                  action={deleteComment}
                  hiddenFields={{ menuId, commentId: comment.id }}
                  tone="subtle"
                />
              )}
            </Stack>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
              {comment.body}
            </Typography>
          </Stack>
        </Paper>
      </Stack>
    );
  }

  return (
    <Stack spacing={1.25} sx={{ opacity: resolved ? 0.75 : 1 }}>
      {(resolved || root.assigneeRole) && (
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          {resolved && <Chip size="small" icon={<CheckIcon />} label="Resolved" />}
          {root.assigneeRole && (
            <Chip
              size="small"
              variant="outlined"
              icon={<AssignmentIndIcon />}
              label={`Assigned to ${actorLabel(root.assigneeRole, patrolName)}`}
            />
          )}
        </Stack>
      )}

      {renderBubble(root, false)}
      {root.replies.map((reply) => renderBubble(reply, true))}

      {actor && (
        <Box sx={{ ml: 4.5 }}>
          {replying ? (
            <CommentComposer
              action={replyToComment}
              hiddenFields={{ menuId, parentId: root.id }}
              label="Reply"
              submitLabel="Reply"
              onDone={() => setReplying(false)}
            />
          ) : (
            <Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap", gap: 0.5 }}>
              {!resolved && (
                <Button size="small" startIcon={<ReplyIcon />} onClick={() => setReplying(true)}>
                  Reply
                </Button>
              )}
              <Box component="form" action={resolved ? reopenComment : resolveComment}>
                <input type="hidden" name="menuId" value={menuId} />
                <input type="hidden" name="commentId" value={root.id} />
                <SubmitButton size="small" startIcon={resolved ? <RestartAltIcon /> : <CheckIcon />}>
                  {resolved ? "Reopen" : "Resolve"}
                </SubmitButton>
              </Box>
              {!resolved && (
                <>
                  <Button
                    size="small"
                    startIcon={<AssignmentIndIcon />}
                    onClick={(e) => setAssignAnchor(e.currentTarget)}
                    disabled={isAssigning}
                    aria-haspopup="menu"
                    sx={{ color: "text.secondary" }}
                  >
                    {root.assigneeRole ? "Reassign" : "Assign"}
                  </Button>
                  <Menu anchorEl={assignAnchor} open={assignAnchor !== null} onClose={() => setAssignAnchor(null)}>
                    <MenuItem selected={root.assigneeRole === "ASPL"} onClick={() => assignTo("ASPL")}>
                      the ASPL
                    </MenuItem>
                    <MenuItem selected={root.assigneeRole === "PATROL_LEADER"} onClick={() => assignTo("PATROL_LEADER")}>
                      {patrolName} Leader
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Stack>
          )}
        </Box>
      )}
    </Stack>
  );
}
