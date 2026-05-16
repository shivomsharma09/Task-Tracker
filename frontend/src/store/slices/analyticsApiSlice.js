import { apiSlice } from './apiSlice';

export const analyticsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardAnalytics: builder.query({
      query: () => '/analytics',
      providesTags: ['Analytics'],
    }),
  }),
});

export const { useGetDashboardAnalyticsQuery } = analyticsApiSlice;
