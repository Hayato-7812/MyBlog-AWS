import axios, { AxiosInstance, AxiosError } from 'axios';
import type { PostsResponse, Post } from '@/types/post';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('API Error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  async getPosts(params?: {
    status?: string;
    limit?: number;
    nextToken?: string;
  }): Promise<PostsResponse> {
    try {
      const response = await this.client.get<PostsResponse>('/posts', {
        params,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      return { posts: [] };
    }
  }

  async getPost(postId: string): Promise<Post | null> {
    try {
      const response = await this.client.get<Post>(`/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch post ${postId}:`, error);
      return null;
    }
  }

  async createPost(data: Partial<Post>, token: string): Promise<Post | null> {
    try {
      const response = await this.client.post<Post>('/admin/posts', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create post:', error);
      return null;
    }
  }

  async updatePost(
    postId: string,
    data: Partial<Post>,
    token: string
  ): Promise<Post | null> {
    try {
      const response = await this.client.put<Post>(
        `/admin/posts/${postId}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to update post ${postId}:`, error);
      return null;
    }
  }

  async deletePost(postId: string, token: string): Promise<boolean> {
    try {
      await this.client.delete(`/admin/posts/${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return true;
    } catch (error) {
      console.error(`Failed to delete post ${postId}:`, error);
      return false;
    }
  }

  async generatePresignedUrl(
    fileName: string,
    contentType: string,
    token: string
  ): Promise<{ uploadUrl: string; mediaUrl: string } | null> {
    try {
      const response = await this.client.post<{
        uploadUrl: string;
        mediaUrl: string;
      }>(
        '/admin/presigned-url',
        {
          fileName,
          contentType,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to generate presigned URL:', error);
      return null;
    }
  }
}

export const apiClient = new ApiClient();
