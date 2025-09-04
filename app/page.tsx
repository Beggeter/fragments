"use client";

import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";

export default function Home() {
  const [test, setTest] = useState("");
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    console.log(isAuthenticated, user);
  }, [isAuthenticated, user]);

  return <div className=""></div>;
}
