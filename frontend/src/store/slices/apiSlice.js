import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const PROD_URL = 'https://task-tracker-production-2671.up.railway.app/api';
const DEV_URL = 'http://localhost:5000/api';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.MODE === 'production' ? PROD_URL : DEV_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.userInfo?.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const apiSlice = createApi({
  baseQuery,
  tagTypes: ['User', 'Project', 'Task', 'Analytics'],
  endpoints: (builder) => ({}),
});
