import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetMyTasksQuery, useUpdateTaskMutation, useSubmitTaskMutation } from '../store/slices/taskApiSlice';
import { Loader2, CheckCircle, Clock, AlertTriangle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

// Redirect to the dedicated Tasker Dashboard
import TaskerDashboard from './TaskerDashboard';

const MyTasks = () => {
  const { userInfo } = useSelector((state) => state.auth);

  // Tasker users → use the dedicated Tasker Dashboard
  if (userInfo?.role === 'Tasker') {
    return <TaskerDashboard />;
  }

  return <TaskerDashboard />;
};

export default MyTasks;
