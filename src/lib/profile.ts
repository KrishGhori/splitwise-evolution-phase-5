import { DEMO_MODE } from "./config";
import { api } from "./api-client";
import { logout } from "./auth";

export type Gender = "male" | "female" | "other";

export type Profile = {
  firstname: string;
  lastname: string;
  username: string;
  gender: Gender;
  email: string;
  mobile_no?: string | null;
};

let demoProfile: Profile = {
  firstname: "Rishva",
  lastname: "Davariya",
  username: "RISHVA01",
  gender: "female",
  email: "rishva@gmail.com",
  mobile_no: "9876543210",
};

const wait = () => new Promise((r) => setTimeout(r, 300));

export async function getProfile(): Promise<Profile> {
  if (DEMO_MODE) {
    await wait();
    return { ...demoProfile };
  }
  return api.get<Profile>("/me");
}

export type ProfileUpdateInput = {
  firstname?: string;
  lastname?: string;
  gender?: Gender;
  email?: string;
  email_otp?: string;
  mobile_no?: string;
  mobile_otp?: string;
};

export async function updateProfile(input: ProfileUpdateInput): Promise<Profile> {
  const body: Record<string, string> = Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined && v !== ""),
  );
  if (DEMO_MODE) {
    await wait();
    if ((body["email"] && !body["email_otp"]) || (body["mobile_no"] && !body["mobile_otp"]))
      throw new Error("OTP is required.");
    delete body["email_otp"];
    delete body["mobile_otp"];
    demoProfile = { ...demoProfile, ...body };
    return { ...demoProfile };
  }
  const res = await api.put<{ data: Profile }>("/update_profile/", body);
  return res.data;
}

export async function sendProfileOtp(purpose: "update_email" | "update_phone", target: string) {
  if (DEMO_MODE) {
    await wait();
    return "Demo mode: use any 6-digit OTP (e.g. 123456).";
  }
  const res = await api.post<{ msg: string }>("/send_profile_otp/", { purpose, target });
  return res.msg;
}

export async function sendPasswordOtp(channel: "email" | "phone") {
  if (DEMO_MODE) {
    await wait();
    return "Demo mode: use any 6-digit OTP (e.g. 123456).";
  }
  const res = await api.post<{ msg: string }>("/send_password_otp/", { channel });
  return res.msg;
}

export async function changePassword(input: {
  old_password: string;
  new_password: string;
  confirm_password: string;
  otp: string;
}) {
  if (DEMO_MODE) {
    await wait();
    return;
  }
  await api.put("/change_password/", input);
}

export async function deleteAccount() {
  if (!DEMO_MODE) await api.delete("/delete_account/");
  await logout();
}

export const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/;
