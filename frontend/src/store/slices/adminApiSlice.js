import { apiSlice } from './apiSlice';

export const adminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Users
    getAdminUsers: builder.query({
      query: () => '/admin/users',
      providesTags: ['AdminUser'],
    }),
    updateUserRole: builder.mutation({
      query: ({ id, role }) => ({
        url: `/admin/users/${id}/role`,
        method: 'PUT',
        body: { role },
      }),
      invalidatesTags: ['AdminUser', 'User'],
    }),
    deleteAdminUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminUser', 'User'],
    }),
    // Projects
    getAdminProjects: builder.query({
      query: () => '/admin/projects',
      providesTags: ['AdminProject'],
    }),
    // Tasks
    getAdminTasks: builder.query({
      query: () => '/admin/tasks',
      providesTags: ['AdminTask'],
    }),
    getOverdueTasks: builder.query({
      query: () => '/admin/tasks/overdue',
      providesTags: ['AdminTask'],
    }),
    // Analytics
    getAdminAnalytics: builder.query({
      query: () => '/admin/analytics',
      providesTags: ['AdminAnalytics'],
    }),
  }),
});

export const {
  useGetAdminUsersQuery,
  useUpdateUserRoleMutation,
  useDeleteAdminUserMutation,
  useGetAdminProjectsQuery,
  useGetAdminTasksQuery,
  useGetOverdueTasksQuery,
  useGetAdminAnalyticsQuery,
} = adminApiSlice;
