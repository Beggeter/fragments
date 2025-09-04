import axios from "axios";
import { initData } from "@telegram-apps/sdk";

const api = axios.create({
  baseURL: "",
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
    const initData = (window as any).Telegram.WebApp.initData;
    if (initData) {
      config.headers["X-Telegram-InitData"] = initData;
    }
  }

  return config;
});
