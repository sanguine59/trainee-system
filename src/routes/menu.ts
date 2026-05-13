import { Hono } from 'hono';
import type { MenuItemRequest, UiResponse } from '@devvit/web/shared';
import type { FormField, SelectField } from '@devvit/shared-types/shared/form.js';

export const menu = new Hono();

const buildNukeFields = (targetId: string): FormField[] => [
  {
    name: 'targetId',
    label: 'Target ID',
    type: 'string',
    helpText: 'Auto-filled from the selected item.',
    required: true,
    defaultValue: targetId,
  },
  {
    name: 'remove',
    label: 'Remove comments',
    type: 'boolean',
    defaultValue: true,
  },
  {
    name: 'lock',
    label: 'Lock comments',
    type: 'boolean',
    defaultValue: false,
  },
  {
    name: 'skipDistinguished',
    label: 'Skip distinguished comments',
    type: 'boolean',
    defaultValue: false,
  },
];

const buildNukeForm = (title: string, targetId: string) => ({
  fields: buildNukeFields(targetId),
  title,
  acceptLabel: 'Mop',
  cancelLabel: 'Cancel',
});

menu.post('/mop-comment', async (c) => {
  const request = await c.req.json<MenuItemRequest>();
  console.log('request', request.targetId);
  return c.json<UiResponse>(
    {
      showForm: {
        name: 'mopComment',
        form: buildNukeForm('Mop Comments', request.targetId),
      },
    },
    200
  );
});

const LABEL_OPTIONS: SelectField['options'] = [
  { label: 'Clean', value: 'clean' },
  { label: 'Toxicity', value: 'toxicity' },
  { label: 'Out of Topics', value: 'out_of_topics' },
];

const buildLabelFields = (targetId: string): FormField[] => [
  {
    name: 'targetId',
    label: 'Target ID',
    type: 'string',
    required: true,
    defaultValue: targetId,
    disabled: true,
    helpText: 'Auto-filled from the selected item.',
  },
  {
    name: 'label',
    label: 'Label',
    type: 'select',
    required: true,
    options: LABEL_OPTIONS,
    helpText: 'Classification label for this content.',
  },
  {
    name: 'violation_rule',
    label: 'Violation Rule',
    type: 'string',
    required: false,
    helpText: 'Optional: specify which rule was violated.',
  },
];

menu.post('/label-content', async (c) => {
  const request = await c.req.json<MenuItemRequest>();
  return c.json<UiResponse>(
    {
      showForm: {
        name: 'labelContent',
        form: {
          title: 'Label Content',
          fields: buildLabelFields(request.targetId),
          acceptLabel: 'Apply Label',
          cancelLabel: 'Cancel',
        },
      },
    },
    200
  );
});

menu.post('/mop-post', async (c) => {
  const request = await c.req.json<MenuItemRequest>();
  return c.json<UiResponse>(
    {
      showForm: {
        name: 'mopPost',
        form: buildNukeForm('Mop Post Comments', request.targetId),
      },
    },
    200
  );
});
