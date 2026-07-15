import { axiosInstance } from "./axios";

export interface OptionItem {
  id: number;
  type: string;
  name: string;
  value: string;
  field_type: string;
}

export const getOptions = (params?: {type?: string;field_type?: string;}) => {
  return axiosInstance.get<{ data: OptionItem[] }>("/options", { params });
};
