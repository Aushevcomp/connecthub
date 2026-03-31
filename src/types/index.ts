// ─── Database / Domain types ───

export type AccountType = "user" | "business";

export interface Profile {
  id: string;
  email: string;
  name: string;
  account_type: AccountType;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  role: string | null;        // "Senior Frontend Developer"
  company: string | null;     // company name for users, industry for business
  location: string | null;
  website: string | null;
  skills: string[];
  followers_count: number;
  following_count: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  tags: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
  // joined
  author?: Profile;
  poll?: Poll;
  user_liked?: boolean;
  user_saved?: boolean;
}

export interface Poll {
  id: string;
  post_id: string;
  question: string;
  ends_at: string;
  options: PollOption[];
}

export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  votes_count: number;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
}

export interface Job {
  id: string;
  company_id: string;
  title: string;
  description: string;
  location: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  employment_type: string;   // "full-time" | "part-time" | "contract" | "internship"
  experience_level: string;  // "junior" | "middle" | "senior" | "lead"
  tags: string[];
  is_hot: boolean;
  applicants_count: number;
  created_at: string;
  expires_at: string | null;
  // joined
  company?: Profile;
  user_applied?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  author?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: "like" | "comment" | "follow" | "job_match" | "mention";
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}
