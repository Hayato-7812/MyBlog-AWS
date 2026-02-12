// Post related types
export interface Post {
  postId: string;
  title: string;
  summary: string;
  status: 'draft' | 'published';
  content: ContentBlock[];
  tags: string[];
  category?: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  author?: Author;
}

export interface ContentBlock {
  order: number;
  type: 'text' | 'image' | 'code' | 'quote';
  content: string;
  layout: 'full' | 'half';
  metadata?: {
    language?: string;
    caption?: string;
    alt?: string;
  };
}

export interface Author {
  sub: string;
  email: string;
  username: string;
}

export interface PostListItem {
  postId: string;
  title: string;
  summary: string;
  status: 'draft' | 'published';
  tags: string[];
  category?: string;
  thumbnailUrl?: string;
  createdAt?: string;
  publishedAt?: string;
  readTime?: string;
}

export interface PostsResponse {
  posts: PostListItem[];
  nextToken?: string;
}
