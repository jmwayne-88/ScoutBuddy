import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import PersonIcon from "@mui/icons-material/Person";
import type { CommentActorRole, CommentStatus } from "@prisma/client";
import { formatEventDate } from "@/lib/dates";
import { actorLabel } from "@/lib/comments";
import { contrastText } from "@/lib/colors";
import { isCommentAuthor } from "@/lib/permissions";
import type { Actor } from "@/lib/session";
import { RelativeDate } from "@/components/RelativeDate";
import { SubmitButton } from "@/components/SubmitButton";
import { RemoveIconButton } from "@/components/RemoveIconButton";
import { ResolvedThreadsToggle } from "@/components/ResolvedThreadsToggle";
import {
  addComment,
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
  | { type: "INGREDIENT"; ingredientId: string };

// REQ-26.1-26.5/26.9: one target's whole thread -- root comments (each
// with its flat replies, an assign control, a resolve/reopen toggle, and
// an author-only delete) plus a composer to start a new thread here.
// Reuses Requirement 22's chat-bubble shape and relative-timestamp
// convention; the ASPL side keeps REQ-22's patrol-color accent, the
// Patrol Leader side uses `primary.main` -- both already-established
// tokens, not a new color.
export function CommentThread({
  menuId,
  patrolColor,
  patrolName,
  target,
  comments,
  actor,
}: {
  menuId: string;
  patrolColor: string;
  patrolName: string;
  target: CommentTarget;
  comments: CommentRecord[];
  actor: Actor | null;
}) {
  const avatarText = contrastText(patrolColor);
  const openThreads = comments.filter((c) => c.status === "OPEN");
  const resolvedThreads = comments.filter((c) => c.status === "RESOLVED");

  const hiddenTargetFields: Record<string, string> =
    target.type === "DISH"
      ? { dishId: target.dishId }
      : target.type === "INGREDIENT"
        ? { ingredientId: target.ingredientId }
        : {};

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
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                {actorLabel(comment.authorRole, patrolName)}
              </Typography>
              {canDelete && (
                <RemoveIconButton
                  label="Delete comment"
                  action={deleteComment}
                  hiddenFields={{ menuId, commentId: comment.id }}
                  tone="subtle"
                />
              )}
            </Stack>
            <Typography variant="body2">{comment.body}</Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <Typography variant="caption" color="text.secondary">
                <RelativeDate {...formatEventDate(comment.createdAt)} />
              </Typography>
              {!isReply && comment.assigneeRole && (
                <Typography variant="caption" color="text.secondary">
                  · Assigned to {actorLabel(comment.assigneeRole, patrolName)}
                </Typography>
              )}
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    );
  }

  function renderThread(root: CommentRecord) {
    const resolved = root.status === "RESOLVED";

    return (
      <Stack key={root.id} spacing={1.25} sx={{ pb: 2, mb: 2, borderBottom: 1, borderColor: "divider" }}>
        {renderBubble(root, false)}
        {root.replies.map((reply) => renderBubble(reply, true))}

        {actor && (
          <Stack component="form" action={replyToComment} direction="row" spacing={1} sx={{ ml: 4.5, alignItems: "flex-end" }}>
            <input type="hidden" name="menuId" value={menuId} />
            <input type="hidden" name="parentId" value={root.id} />
            <TextField name="body" label="Reply" size="small" fullWidth multiline maxRows={4} required />
            <SubmitButton variant="text" size="small">
              Reply
            </SubmitButton>
          </Stack>
        )}

        {actor && (
          <Stack direction="row" spacing={1} sx={{ ml: 4.5, alignItems: "center", flexWrap: "wrap" }}>
            <Stack component="form" action={assignComment} direction="row" spacing={1} sx={{ alignItems: "flex-end" }}>
              <input type="hidden" name="menuId" value={menuId} />
              <input type="hidden" name="commentId" value={root.id} />
              <TextField
                select
                name="assigneeRole"
                label="Assign to"
                size="small"
                defaultValue={root.assigneeRole ?? ""}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="ASPL">the ASPL</MenuItem>
                <MenuItem value="PATROL_LEADER">{patrolName} Leader</MenuItem>
              </TextField>
              <SubmitButton variant="text" size="small">
                Assign
              </SubmitButton>
            </Stack>

            <Box component="form" action={resolved ? reopenComment : resolveComment}>
              <input type="hidden" name="menuId" value={menuId} />
              <input type="hidden" name="commentId" value={root.id} />
              <SubmitButton variant={resolved ? "outlined" : "contained"} size="small" color={resolved ? "inherit" : "primary"}>
                {resolved ? "Reopen" : "Mark resolved"}
              </SubmitButton>
            </Box>
          </Stack>
        )}
      </Stack>
    );
  }

  return (
    <Stack spacing={1}>
      {openThreads.length === 0 && resolvedThreads.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No comments yet.
        </Typography>
      )}

      {openThreads.map(renderThread)}

      {resolvedThreads.length > 0 && (
        <ResolvedThreadsToggle count={resolvedThreads.length}>
          <Stack spacing={0}>{resolvedThreads.map(renderThread)}</Stack>
        </ResolvedThreadsToggle>
      )}

      {actor && (
        <Stack component="form" action={addComment} spacing={1} sx={{ alignItems: "flex-start" }}>
          <input type="hidden" name="menuId" value={menuId} />
          <input type="hidden" name="target" value={target.type} />
          {Object.entries(hiddenTargetFields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
          <TextField name="body" label="Add a comment" size="small" fullWidth multiline rows={2} required />
          <SubmitButton variant="contained" size="small">
            Comment
          </SubmitButton>
        </Stack>
      )}
    </Stack>
  );
}
