import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import { context } from '@devvit/web/server';
import { isT1, isT3 } from '@devvit/shared-types/tid.js';
import { handleNuke, handleNukePost } from '../core/nuke';
import { upsertContent } from '../data/store';
import type { Label } from '../data/types';

export const forms = new Hono();

const VALID_LABELS = new Set<Label>(['clean', 'toxicity', 'out_of_topics']);

type LabelFormValues = {
  targetId?: string;
  label?: string[];
  violation_rule?: string;
};

type NukeFormValues = {
  remove?: boolean;
  lock?: boolean;
  skipDistinguished?: boolean;
  targetId?: string;
};

const normalizeValues = (values: NukeFormValues) => ({
  remove: Boolean(values.remove),
  lock: Boolean(values.lock),
  skipDistinguished: Boolean(values.skipDistinguished),
});

const getTargetId = (values: NukeFormValues) => {
  if (typeof values.targetId === 'string' && values.targetId.trim()) {
    return values.targetId.trim();
  }

  return context.postId;
};

forms.post('/label-content-submit', async (c) => {
  const values = await c.req.json<LabelFormValues>();
  const targetId = values.targetId?.trim() || context.commentId || context.postId;
  const label = values.label?.[0] as Label | undefined;

  if (!targetId) {
    return c.json<UiResponse>({ showToast: 'Could not determine target content.' }, 200);
  }

  if (!label || !VALID_LABELS.has(label)) {
    return c.json<UiResponse>({ showToast: 'Please select a valid label.' }, 200);
  }

  try {
    await upsertContent(targetId, {
      label,
      violation_rule: values.violation_rule?.trim() || null,
    });
  } catch (error: unknown) {
    console.error('Label update failed', error);
    return c.json<UiResponse>({ showToast: 'Failed to update label. Please try again.' }, 200);
  }

  return c.json<UiResponse>({ showToast: `Label set to "${label}".` }, 200);
});

forms.post('/mop-comment-submit', async (c) => {
  const values = await c.req.json<NukeFormValues>();
  console.log('values', values);
  const normalized = normalizeValues(values);

  if (!normalized.lock && !normalized.remove) {
    return c.json<UiResponse>(
      {
        showToast: 'You must select either lock or remove.',
      },
      200
    );
  }

  const targetId = getTargetId(values);
  if (!isT1(targetId)) {
    console.error('targetId is not a T1', targetId);
    return c.json<UiResponse>(
      {
        showToast: 'Mop failed! Please try again later.',
      },
      200
    );
  }

  const result = await handleNuke({
    ...normalized,
    commentId: targetId,
    subredditId: context.subredditId,
  });

  console.log(
    `Mop result - ${result.success ? 'success' : 'fail'} - ${result.message}`
  );

  return c.json<UiResponse>(
    {
      showToast: `${result.success ? 'Success' : 'Failed'} : ${result.message}`,
    },
    200
  );
});

forms.post('/mop-post-submit', async (c) => {
  const values = await c.req.json<NukeFormValues>();
  console.log('values', values);
  const normalized = normalizeValues(values);

  if (!normalized.lock && !normalized.remove) {
    return c.json<UiResponse>(
      {
        showToast: 'You must select either lock or remove.',
      },
      200
    );
  }

  const targetId = getTargetId(values);
  if (!isT3(targetId)) {
    console.error('targetId is not a T3', targetId);
    return c.json<UiResponse>(
      {
        showToast: 'Mop failed! Please try again later.',
      },
      200
    );
  }

  const result = await handleNukePost({
    ...normalized,
    postId: targetId,
    subredditId: context.subredditId,
  });

  console.log(
    `Mop result - ${result.success ? 'success' : 'fail'} - ${result.message}`
  );

  return c.json<UiResponse>(
    {
      showToast: `${result.success ? 'Success' : 'Failed'} : ${result.message}`,
    },
    200
  );
});
