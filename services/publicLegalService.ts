import axios from "axios";

const API_URL = `${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api`;

export type PublicLegalContent = {
  title: string;
  popup_content: string;
  html: string;
  terms_title?: string;
};

export async function getPublicLegalContent(): Promise<PublicLegalContent> {
  const res = await axios.get(`${API_URL}/public/legal/privacy`);
  return res.data?.data ?? res.data;
}
