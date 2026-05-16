import { apiSlice } from './apiSlice';

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (data) => ({
        url: '/auth/login',
        method: 'POST',
        body: data,
      }),
    }),
    register: builder.mutation({
      query: (data) => ({
        url: '/auth/register',
        method: 'POST',
        body: data,
      }),
    }),
    getProfile: builder.query({
      query: () => '/auth/profile',
      keepUnusedDataFor: 5,
    }),
    getUsers: builder.query({
      query: () => '/auth/users',
      providesTags: ['User'],
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useGetProfileQuery, useGetUsersQuery } = authApiSlice;
