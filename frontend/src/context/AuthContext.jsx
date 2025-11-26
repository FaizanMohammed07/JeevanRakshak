import { DoctorsProvider, useDoctors } from "./DoctorsContext";

export function AuthProvider({ children }) {
  return <DoctorsProvider>{children}</DoctorsProvider>;
}

export function useAuth() {
  return useDoctors();
}
