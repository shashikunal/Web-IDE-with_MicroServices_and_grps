import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Template {
  id: string;
  name: string;
  language: string;
  description: string;
  icon: string;
  color: string;
  hasPreview: boolean;
  port?: number;
  startCommand?: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  roles: ('student' | 'publisher' | 'admin')[];
  isActive: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
  };
  permissions?: {
    canAccessAdminPanel?: boolean;
  };
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  data?: {
    message?: string;
    error?: string;
  };
  status?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SystemStats {
  users: {
    total: number;
    active: number;
    admins: number;
    publishers: number;
    students: number;
  };
  workspaces: {
    total: number;
    active: number;
  };
}

export interface RecentUser {
  _id: string;
  username: string;
  email: string;
  roles: string[];
  createdAt: string;
}

export interface RecentWorkspace {
  _id: string;
  userId: {
    _id: string;
    username: string;
  };
  templateId: string;
  templateName: string;
  language: string;
  status: string;
  createdAt: string;
}

export interface SystemStatsResponse {
  success: boolean;
  stats: SystemStats;
  recent: {
    users: RecentUser[];
    workspaces: RecentWorkspace[];
  };
}

export interface Workspace {
  _id: string; // Mongo ID
  userId: string;
  workspaceId: string; // UUID
  templateId: string;
  templateName: string;
  title: string;
  description: string;
  cpu: number;
  memory: string;
  language: string;
  containerId: string;
  publicPort: number;
  status: string;
  createdAt: string;
  lastAccessedAt: string;
}

export interface FileItem {
  id?: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileItem[];
  content?: string;
  isFolder?: boolean;
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Workspaces', 'Files'],
  endpoints: (builder) => ({
    // Workspaces
    getWorkspaces: builder.query<Workspace[], void>({
      query: () => '/workspaces',
      transformResponse: (response: { workspaces: Workspace[] }) => response.workspaces,
      providesTags: ['Workspaces'],
    }),

    deleteWorkspace: builder.mutation<void, { workspaceId: string; userId: string }>({
      query: ({ workspaceId, userId }) => ({
        url: `/workspaces/${workspaceId}`,
        method: 'DELETE',
        body: { userId }
      }),
      invalidatesTags: ['Workspaces'],
    }),

    stopWorkspace: builder.mutation<void, { workspaceId: string }>({
      query: ({ workspaceId }) => ({
        url: `/workspaces/${workspaceId}/stop`,
        method: 'POST',
      }),
      invalidatesTags: ['Workspaces'],
    }),

    startWorkspace: builder.mutation<void, { workspaceId: string }>({
      query: ({ workspaceId }) => ({
        url: `/workspaces/${workspaceId}/start`,
        method: 'POST',
      }),
      invalidatesTags: ['Workspaces'],
    }),

    // Container operations
    createContainer: builder.mutation<{
      userId: string;
      publicPort: number;
      workspaceId: string;
      containerId: string;
    }, {
      language: string;
      templateId: string;
      templateName: string;
      title?: string;
      description?: string;
      cpu?: number;
      memory?: string;
      port?: number;
    }>({
      query: (body) => ({
        url: '/workspaces',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { success: boolean, workspace: Workspace & { containerId: string } }) => ({
        userId: response.workspace.userId,
        publicPort: response.workspace.publicPort,
        workspaceId: response.workspace.workspaceId,
        containerId: response.workspace.containerId
      }),
      invalidatesTags: ['Workspaces'],
    }),

    // Files
    getFiles: builder.query<FileItem[], { userId: string; workspaceId: string; path?: string }>({
      query: ({ workspaceId, path = '.' }) => `/workspaces/${workspaceId}/files?path=${encodeURIComponent(path)}`,
      transformResponse: (response: { files: FileItem[] }) => response.files,
      providesTags: (_result, _error, { workspaceId }) => [
        { type: 'Files', id: workspaceId },
      ],
    }),

    getFileTree: builder.query<FileItem, { userId: string; workspaceId: string }>({
      query: ({ workspaceId }) => `/workspaces/${workspaceId}/tree`,
      transformResponse: (response: { root: FileItem }) => response.root,
      providesTags: (_result, _error, { workspaceId }) => [
        { type: 'Files', id: workspaceId },
      ],
    }),

    getFolderContents: builder.query<{ items: FileItem[] }, { userId: string; workspaceId: string; path: string }>({
      query: ({ workspaceId, path }) => `/workspaces/${workspaceId}/files?path=${encodeURIComponent(path)}`,
      transformResponse: (response: { files: FileItem[] }) => ({ items: response.files }),
      providesTags: (_result, _error, { workspaceId }) => [
        { type: 'Files', id: workspaceId },
      ],
    }),

    getFileContent: builder.query<{ content: string }, { userId: string; workspaceId: string; path: string }>({
      query: ({ workspaceId, path }) => `/workspaces/${workspaceId}/file?path=${encodeURIComponent(path)}`,
    }),

    saveFile: builder.mutation<void, { userId: string; workspaceId: string; path: string; content: string }>({
      query: ({ workspaceId, path, content }) => ({
        url: `/workspaces/${workspaceId}/file`,
        method: 'POST',
        body: { path, content },
      }),
      onQueryStarted: async (_arg, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch { }
      },
    }),

    createFile: builder.mutation<void, { userId: string; workspaceId: string; path: string; content?: string }>({
      query: ({ workspaceId, path, content = '' }) => ({
        url: `/workspaces/${workspaceId}/file`,
        method: 'POST',
        body: { path, content },
      }),
      onQueryStarted: async (_arg, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch { }
      },
    }),

    createDirectory: builder.mutation<void, { userId: string; workspaceId: string; path: string }>({
      query: ({ workspaceId, path }) => ({
        url: `/workspaces/${workspaceId}/directory`,
        method: 'POST',
        body: { path },
      }),
      onQueryStarted: async (_arg, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch { }
      },
    }),

    deleteFile: builder.mutation<void, { userId: string; workspaceId: string; path: string }>({
      query: ({ workspaceId, path }) => ({
        url: `/workspaces/${workspaceId}/file`,
        method: 'DELETE',
        body: { path }
      }),
      onQueryStarted: async (_arg, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch { }
      },
    }),

    moveFile: builder.mutation<void, { userId: string; workspaceId: string; sourcePath: string; destinationPath: string }>({
      query: ({ userId, workspaceId, sourcePath, destinationPath }) => ({
        url: '/container/move',
        method: 'POST',
        body: { userId, workspaceId, sourcePath, destinationPath },
      }),
      onQueryStarted: async (_arg, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch { }
      },
    }),

    copyFile: builder.mutation<void, { userId: string; workspaceId: string; sourcePath: string; destinationPath: string }>({
      query: ({ userId, workspaceId, sourcePath, destinationPath }) => ({
        url: '/container/copy',
        method: 'POST',
        body: { userId, workspaceId, sourcePath, destinationPath },
      }),
      onQueryStarted: async (_arg, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch { }
      },
    }),

    // Authentication endpoints
    login: builder.mutation<AuthResponse, { identifier: string; password: string }>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    register: builder.mutation<{
      success: boolean;
      message: string;
      user: User;
      accessToken: string;
      refreshToken: string;
    }, {
      username: string;
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    }>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),

    refreshToken: builder.mutation<{
      success: boolean;
      accessToken: string;
      refreshToken: string;
    }, { refreshToken: string }>({
      query: (data) => ({
        url: '/auth/refresh',
        method: 'POST',
        body: data,
      }),
    }),

    logout: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),

    getProfile: builder.query<{
      success: boolean;
      user: User;
    }, void>({
      query: () => '/auth/me',
    }),

    updateProfile: builder.mutation<{
      success: boolean;
      message: string;
      user: User;
    }, { firstName?: string; lastName?: string; bio?: string }>({
      query: (profileData) => ({
        url: '/auth/profile',
        method: 'PUT',
        body: profileData,
      }),
    }),

    changePassword: builder.mutation<{
      success: boolean;
      message: string;
    }, { currentPassword: string; newPassword: string }>({
      query: (passwordData) => ({
        url: '/auth/password',
        method: 'PUT',
        body: passwordData,
      }),
    }),

    // Admin endpoints
    getAllUsers: builder.query<{
      success: boolean;
      users: User[];
      pagination: Pagination;
    }, {
      page?: number;
      limit?: number;
      role?: string;
      isActive?: boolean;
      search?: string;
    }>({
      query: (params) => ({
        url: '/admin/users',
        params,
      }),
    }),

    updateUserRoles: builder.mutation<{
      success: boolean;
      message: string;
      user: User;
    }, { userId: string; roles: ('student' | 'publisher' | 'admin')[] }>({
      query: ({ userId, roles }) => ({
        url: `/admin/users/${userId}/roles`,
        method: 'PUT',
        body: { roles },
      }),
    }),

    deactivateUser: builder.mutation<{
      success: boolean;
      message: string;
    }, string>({
      query: (userId) => ({
        url: `/admin/users/${userId}/deactivate`,
        method: 'PUT',
      }),
    }),

    activateUser: builder.mutation<{
      success: boolean;
      message: string;
    }, string>({
      query: (userId) => ({
        url: `/admin/users/${userId}/activate`,
        method: 'PUT',
      }),
    }),

    getSystemStats: builder.query<SystemStatsResponse, void>({
      query: () => '/admin/stats',
    }),
  }),
});

// Export hooks
export const {
  useGetWorkspacesQuery,
  useDeleteWorkspaceMutation,
  useStopWorkspaceMutation,
  useStartWorkspaceMutation,
  useCreateContainerMutation,
  useGetFilesQuery,
  useGetFileTreeQuery,
  useGetFolderContentsQuery,
  useGetFileContentQuery,
  useSaveFileMutation,
  useCreateFileMutation,
  useCreateDirectoryMutation,
  useDeleteFileMutation,
  useMoveFileMutation,
  useCopyFileMutation,
  useLoginMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useGetAllUsersQuery,
  useUpdateUserRolesMutation,
  useDeactivateUserMutation,
  useActivateUserMutation,
  useGetSystemStatsQuery,
} = apiSlice;