import { Area } from '@/types/area';
import axios from '@/lib/axios';

export const fetchAreas = async (): Promise<Area[]> => {
  const response = await axios.get('/areas');
  return response.data;
};

export const searchAreas = async (query: string): Promise<Area[]> => {
  const response = await axios.get(`/areas/search?q=${encodeURIComponent(query)}`);
  return response.data;
};

export const getAreaById = async (id: number): Promise<Area> => {
  const response = await axios.get(`/areas/${id}`);
  return response.data;
};

export const createArea = async (data: Partial<Area>): Promise<Area> => {
  const response = await axios.post('/areas', data);
  return response.data;
};

export const updateArea = async (id: number, data: Partial<Area>): Promise<Area> => {
  const response = await axios.put(`/areas/${id}`, data);
  return response.data;
};

export const deleteArea = async (id: number): Promise<void> => {
  await axios.delete(`/areas/${id}`);
};
