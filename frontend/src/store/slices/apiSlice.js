import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const PROD_API = 'https://task-tracker-production-2671.up.railway.app/api';
const DEV_API  = 'http://localhost:5000/api';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? PROD_API : DEV_API),
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
