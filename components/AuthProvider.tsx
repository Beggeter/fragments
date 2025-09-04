import { useLaunchParams, initData } from "@telegram-apps/sdk-react";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  console.log(initData);
  console.log(useLaunchParams());

  return <>{children}</>;
};
