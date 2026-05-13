import { Hono } from 'hono';
import type {
  OnAppInstallRequest,
  OnCommentSubmitRequest,
  OnModActionRequest,
  OnPostSubmitRequest,
  TriggerResponse,
} from '@devvit/shared/';
import { addModAction, upsertContent } from '../data/store';
import type { ContentDoc, Label } from '../data/types';

export const triggers = new Hono();

const DEFAULT_LABEL: Label = 'clean';

const buildPostDoc = (input: OnPostSubmitRequest): ContentDoc | null => {
  const post = input.post;
  if (!post) return null;

  return {
    _id: post.id,
    parent_id: null,
    post_id: null,
    type: 'post',
    author: input.author?.name ?? null,
    title: post.title ?? null,
    body: post.selftext ?? null,
    created_utc: post.createdAt ?? Math.floor(Date.now() / 1000),
    subreddit_id: input.subreddit?.id ?? null,
    subreddit_name: input.subreddit?.name ?? null,
    permalink: post.permalink ?? null,
    initial_sentiment: DEFAULT_LABEL,
    label: DEFAULT_LABEL,
    confidence_score: null,
    review_status: 'unreviewed',
    violation_rule: null,
    reviewed_at: null,
    reviewed_by: null,
    updated_at: Date.now(),
  };
};

const buildCommentDoc = (input: OnCommentSubmitRequest): ContentDoc | null => {
  const comment = input.comment;
  if (!comment) return null;

  return {
    _id: comment.id,
    parent_id: comment.parentId ?? null,
    post_id: comment.postId ?? null,
    type: 'comment',
    author: comment.author ?? input.author?.name ?? null,
    title: null,
    body: comment.body ?? null,
    created_utc: comment.createdAt ?? Math.floor(Date.now() / 1000),
    subreddit_id: input.subreddit?.id ?? null,
    subreddit_name: input.subreddit?.name ?? null,
    permalink: comment.permalink ?? null,
    initial_sentiment: DEFAULT_LABEL,
    label: DEFAULT_LABEL,
    confidence_score: null,
    review_status: 'unreviewed',
    violation_rule: null,
    reviewed_at: null,
    reviewed_by: null,
    updated_at: Date.now(),
  };
};

const getReviewStatus = (action?: string | null) => {
  if (!action) return null;
  const normalized = action.toLowerCase();
  if (normalized.includes('approve')) return 'approved' as const;
  if (normalized.includes('remove') || normalized.includes('spam')) return 'removed' as const;
  return null;
};

const toReviewedAt = (actionedAt?: string | null) => {
  if (!actionedAt) return Date.now();
  const parsed = Date.parse(actionedAt);
  return Number.isNaN(parsed) ? Date.now() : parsed;
};

triggers.post('/on-app-install', async (c) => {
  const input = await c.req.json<OnAppInstallRequest>();
  console.log('App installed to subreddit: r/' + input.subreddit?.name);
  return c.json<TriggerResponse>({}, 200);
});

triggers.post('/on-post-submit', async (c) => {
  try {
    const input = await c.req.json<OnPostSubmitRequest>();
    const doc = buildPostDoc(input);
    if (doc) {
      await upsertContent(doc._id, doc);
    }
  } catch (error: unknown) {
    console.error('PostSubmit ingestion failed', error);
  }
  return c.json<TriggerResponse>({}, 200);
});

triggers.post('/on-comment-submit', async (c) => {
  try {
    const input = await c.req.json<OnCommentSubmitRequest>();
    const doc = buildCommentDoc(input);
    if (doc) {
      await upsertContent(doc._id, doc);
    }
  } catch (error: unknown) {
    console.error('CommentSubmit ingestion failed', error);
  }
  return c.json<TriggerResponse>({}, 200);
});

triggers.post('/on-mod-action', async (c) => {
  try {
    const input = await c.req.json<OnModActionRequest>();
    const targetComment = input.targetComment;
    const targetPost = input.targetPost;
    const targetId = targetComment?.id ?? targetPost?.id ?? null;
    const targetType = targetComment ? 'comment' : targetPost ? 'post' : null;
    const reviewStatus = getReviewStatus(input.action ?? null);
    const reviewedAt = toReviewedAt(input.actionedAt ?? null);

    await addModAction({
      action: input.action ?? null,
      actioned_at: input.actionedAt ?? null,
      moderator: input.moderator?.name ?? null,
      target_id: targetId,
      target_type: targetType,
      subreddit_id: input.subreddit?.id ?? null,
      created_at: Date.now(),
    });

    if (targetId && reviewStatus) {
      await upsertContent(targetId, {
        review_status: reviewStatus,
        reviewed_at: reviewedAt,
        reviewed_by: input.moderator?.name ?? null,
      });
    }
  } catch (error: unknown) {
    console.error('ModAction ingestion failed', error);
  }
  return c.json<TriggerResponse>({}, 200);
});
