import { DoctorsProvider, useDoctors } from "../context/DoctorsContext";

export function AuthProvider({ children }) {
  return <DoctorsProvider>{children}</DoctorsProvider>;
}

export function useAuth() {
  return useDoctors();
}
