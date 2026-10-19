import type { ReactElement } from "react";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RateReviewIcon from "@mui/icons-material/RateReview";
import type { ReviewDecision } from "@prisma/client";
import { formatEventDate } from "@/lib/dates";
import { menuStatusColor } from "@/lib/progress";
import { contrastText } from "@/lib/colors";
import { RelativeDate } from "@/components/RelativeDate";

export type ReviewThreadItem = {
  id: string;
  decision: ReviewDecision;
  comment: string | null;
  createdAt: Date;
};

// REQ-22.3/18.x: same already-built-element-table convention as
// components/MenuStatusChip.tsx's STATUS_ICONS, reusing the exact icons
// that chip already uses for these two decisions so the thread reads as
// the same visual vocabulary as the rest of the page.
const DECISION_ICONS: Record<ReviewDecision, ReactElement> = {
  APPROVED: <CheckCircleIcon fontSize="small" />,
  CHANGES_REQUESTED: <RateReviewIcon fontSize="small" />,
};

// REQ-22: restyles `menu.reviews` as a two-sided chat thread (the ASPL's
// decisions, distinct from the Patrol Leader's menu content elsewhere on
// the same page) instead of a flat list of form-like cards. Read-only --
// no new authoring/reply/reaction capability per REQ-22.6.
export function ReviewThread({ reviews, patrolColor }: { reviews: ReviewThreadItem[]; patrolColor: string }) {
  const avatarText = contrastText(patrolColor);

  return (
    <Stack spacing={1.5} component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
      {reviews.map((review) => {
        const approved = review.decision === "APPROVED";
        const decisionColor = menuStatusColor(review.decision);

        return (
          <Stack
            key={review.id}
            component="li"
            direction="row"
            spacing={1}
            sx={{ alignItems: "flex-end", maxWidth: { xs: "100%", sm: "80%" } }}
          >
            {/* REQ-22.5: the ASPL side of the thread is tagged with the
                patrol's own color/contrast pairing (same tokens
                PatrolBadge uses) rather than a new, unrelated accent. */}
            <Avatar
              sx={{ bgcolor: patrolColor, color: avatarText, width: 32, height: 32, flexShrink: 0 }}
              aria-label="ASPL of Camping"
            >
              {DECISION_ICONS[review.decision]}
            </Avatar>
            <Paper
              variant={approved ? "elevation" : "outlined"}
              elevation={approved ? 0 : 0}
              sx={{
                p: approved ? 1 : 1.5,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 16,
                borderBottomRightRadius: 16,
                borderBottomLeftRadius: 16,
                bgcolor: approved ? decisionColor.bg : "background.paper",
                color: approved ? decisionColor.text : "text.primary",
                borderLeft: approved ? "none" : 4,
                borderLeftColor: decisionColor.bg,
                minWidth: 0,
              }}
            >
              <Stack spacing={0.5}>
                {approved ? (
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Approved!
                  </Typography>
                ) : (
                  <>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: decisionColor.bg }}>
                      Changes requested
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {review.comment}
                    </Typography>
                  </>
                )}
                <Typography
                  variant="caption"
                  sx={{ color: approved ? "inherit" : "text.secondary", opacity: approved ? 0.85 : 1 }}
                >
                  <RelativeDate {...formatEventDate(review.createdAt)} />
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        );
      })}
    </Stack>
  );
}
