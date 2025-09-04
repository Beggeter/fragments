import { LaunchParams, initData } from "@telegram-apps/sdk";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  console.log(initData);
  // console.log(LaunchParams);

  return <>{children}</>;
};
