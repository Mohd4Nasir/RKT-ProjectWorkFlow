import axiosInstance from '@/services/axiosInstance';



export interface Task {
    id: string;
    title: string;
    status: 'todo' | 'in-progress' | 'done';
    assigneeId: string;
}

// API Calls
export const apiService = {

  getHello: async () => {
    const response = await axiosInstance.get('/hello').then(res => res.data).catch(err => {
      console.error('API Error:', err);
      // throw err;
    });
   
    return response.data;
  },

};