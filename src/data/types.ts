export type ContentType = 'post' | 'comment';
export type ReviewStatus = 'unreviewed' | 'approved' | 'removed';
export type Label = 'clean' | 'toxicity' | 'out_of_topics';

export type ContentDoc = {
  _id: string;
  parent_id: string | null;
  post_id: string | null;
  type: ContentType;
  author: string | null;
  title: string | null;
  body: string | null;
  created_utc: number;
  subreddit_id: string | null;
  subreddit_name: string | null;
  permalink: string | null;
  initial_sentiment: Label;
  label: Label;
  confidence_score: number | null;
  review_status: ReviewStatus;
  violation_rule: string | null;
  reviewed_at: number | null;
  reviewed_by: string | null;
  updated_at: number;
};

export type ModActionDoc = {
  action: string | null;
  actioned_at: string | null;
  moderator: string | null;
  target_id: string | null;
  target_type: ContentType | null;
  subreddit_id: string | null;
  created_at: number;
};
