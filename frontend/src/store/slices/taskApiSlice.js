import { apiSlice } from './apiSlice';

export const taskApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTasks: builder.query({
      query: (projectId) => `/projects/${projectId}/tasks`,
      providesTags: (result, error, projectId) => [{ type: 'Task', id: `PROJECT_${projectId}` }],
    }),
    createTask: builder.mutation({
      query: ({ projectId, data }) => ({
        url: `/projects/${projectId}/tasks`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'Task', id: `PROJECT_${projectId}` },
        'Analytics',
        'AdminTask',
        'MyTasks',
      ],
    }),
    updateTask: builder.mutation({
      query: ({ id, projectId, data }) => ({
        url: `/tasks/task/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'Task', id: `PROJECT_${projectId}` },
        'Analytics'
      ],
    }),
    deleteTask: builder.mutation({
      query: ({ id, projectId }) => ({
        url: `/tasks/task/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'Task', id: `PROJECT_${projectId}` },
        'Analytics'
      ],
    }),
    submitTask: builder.mutation({
      query: ({ id, projectId, data }) => ({
        url: `/tasks/task/${id}/submit`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'Task', id: `PROJECT_${projectId}` },
        'Analytics',
        'AdminTask'
      ],
    }),
    getMyTasks: builder.query({
      query: () => '/tasks/my-tasks',
      providesTags: ['MyTasks'],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useSubmitTaskMutation,
  useGetMyTasksQuery,
} = taskApiSlice;
