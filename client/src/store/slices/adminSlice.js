import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/api/axiosInstance';

export const adminSignup = createAsyncThunk('admin/signup', async (data) => {
  const res = await axiosInstance.post('/signup', data);
  return res.data;
});

export const adminLogin = createAsyncThunk('admin/login', async (data) => {
  const res = await axiosInstance.post('/login', data);
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', res.data.token);
  }
  return res.data;
});

export const getAdminData = createAsyncThunk('admin/get', async (id) => {
  const res = await axiosInstance.get(`/get-admin/${id}`);
  return res.data;
});
