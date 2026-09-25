import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEMO_MODE } from "@/lib/config";
import {
  PASSWORD_RE,
  changePassword,
  deleteAccount,
  getProfile,
  sendPasswordOtp,
  sendProfileOtp,
  updateProfile,
  type Gender,
  type Profile,
} from "@/lib/profile";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Splitly" },
      { name: "description", content: "View and update your Splitly profile, password and account." },
      { property: "og:title", content: "Profile — Splitly" },
      { property: "og:description", content: "View and update your Splitly profile, password and account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfile().then(setProfile).catch((e) => setError(errMsg(e)));
  }, []);

  return (
    <AppShell title="Profile" description="Your account details">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!profile && !error && <Skeleton className="h-64 max-w-2xl" />}
      {profile && (
        <div className="max-w-2xl space-y-6">
          <Overview profile={profile} />
          <DetailsForm profile={profile} onSaved={setProfile} />
          <ContactForm profile={profile} onSaved={setProfile} />
          <PasswordForm />
          <DangerZone />
          {DEMO_MODE && (
            <p className="text-sm text-muted-foreground">
              Demo mode chal raha hai — OTP ke liye koi bhi 6 digit daal sakte hain.
            </p>
          )}
        </div>
      )}
    </AppShell>
  );
}

function Overview({ profile }: { profile: Profile }) {
  const initials = `${profile.firstname[0] ?? ""}${profile.lastname[0] ?? ""}`.toUpperCase();
  return (
    <section className="surface-card flex items-center gap-4 p-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
        {initials}
      </div>
      <div className="min-w-0">
        <p className="text-lg font-semibold">
          {profile.firstname} {profile.lastname}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          @{profile.username} · {profile.email}
          {profile.mobile_no ? ` · ${profile.mobile_no}` : ""}
        </p>
      </div>
    </section>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="surface-card space-y-4 p-6">
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      {children}
    </section>
  );
}

function DetailsForm({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  const [firstname, setFirst] = useState(profile.firstname);
  const [lastname, setLast] = useState(profile.lastname);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (firstname.trim().length < 3 || lastname.trim().length < 3)
      return void toast.error("First and last name must be at least 3 characters");
    setBusy(true);
    try {
      onSaved(await updateProfile({ firstname: firstname.trim(), lastname: lastname.trim(), gender }));
      toast.success("Profile updated");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title="Personal details" desc="Name and gender">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fn">First name</Label>
          <Input id="fn" value={firstname} onChange={(e) => setFirst(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ln">Last name</Label>
          <Input id="ln" value={lastname} onChange={(e) => setLast(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={busy}>{busy ? "Saving..." : "Save changes"}</Button>
        </div>
      </form>
    </Section>
  );
}

function OtpField({
  label, type, current, purpose, onSaved,
}: {
  label: string;
  type: "email" | "tel";
  current: string;
  purpose: "update_email" | "update_phone";
  onSaved: (p: Profile) => void;
}) {
  const [value, setValue] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const valid = type === "tel" ? /^\d{10}$/.test(value) : /^\S+@\S+\.\S+$/.test(value);

  const send = async () => {
    if (!valid) return void toast.error(type === "tel" ? "Enter a 10-digit mobile number" : "Enter a valid email");
    if (value === current) return void toast.error("This is already your current " + label.toLowerCase());
    setBusy(true);
    try {
      toast.success(await sendProfileOtp(purpose, value));
      setSent(true);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!/^\d{6}$/.test(otp)) return void toast.error("OTP must be 6 digits");
    setBusy(true);
    try {
      const p = await updateProfile(
        purpose === "update_email" ? { email: value, email_otp: otp } : { mobile_no: value, mobile_otp: otp },
      );
      onSaved(p);
      toast.success(`${label} updated`);
      setValue(""); setOtp(""); setSent(false);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>New {label.toLowerCase()} <span className="text-muted-foreground">(current: {current || "—"})</span></Label>
      <div className="flex gap-2">
        <Input type={type} value={value} disabled={sent} onChange={(e) => setValue(e.target.value.trim())} />
        {!sent ? (
          <Button type="button" variant="outline" onClick={send} disabled={busy}>Send OTP</Button>
        ) : (
          <Button type="button" variant="ghost" onClick={() => { setSent(false); setOtp(""); }}>Change</Button>
        )}
      </div>
      {sent && (
        <div className="flex gap-2">
          <Input placeholder="6-digit OTP" inputMode="numeric" maxLength={6} value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
          <Button type="button" onClick={verify} disabled={busy}>Verify & save</Button>
        </div>
      )}
    </div>
  );
}

function ContactForm({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  return (
    <Section title="Email & mobile" desc="Changing these needs an OTP sent to the new email or number">
      <OtpField label="Email" type="email" current={profile.email} purpose="update_email" onSaved={onSaved} />
      <OtpField label="Mobile" type="tel" current={profile.mobile_no ?? ""} purpose="update_phone" onSaved={onSaved} />
    </Section>
  );
}

function PasswordForm() {
  const [f, setF] = useState({ old_password: "", new_password: "", confirm_password: "", otp: "" });
  const [channel, setChannel] = useState<"email" | "phone">("email");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const send = async () => {
    setBusy(true);
    try { toast.success(await sendPasswordOtp(channel)); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!PASSWORD_RE.test(f.new_password))
      return void toast.error("New password: 8-15 chars with upper, lower, number and special (@$!%*?&)");
    if (f.new_password === f.old_password) return void toast.error("New password must be different");
    if (f.new_password !== f.confirm_password) return void toast.error("Passwords do not match");
    if (!/^\d{6}$/.test(f.otp)) return void toast.error("OTP must be 6 digits");
    setBusy(true);
    try {
      await changePassword(f);
      toast.success("Password changed");
      setF({ old_password: "", new_password: "", confirm_password: "", otp: "" });
    } catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); }
  };

  return (
    <Section title="Change password" desc="Needs your current password and an OTP">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="np">New password</Label>
          <Input id="np" type="password" value={f.new_password} onChange={set("new_password")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp">Confirm new password</Label>
          <Input id="cp" type="password" value={f.confirm_password} onChange={set("confirm_password")} />
        </div>
        <div className="space-y-2">
          <Label>Send OTP to</Label>
          <div className="flex gap-2">
            <Select value={channel} onValueChange={(v) => setChannel(v as "email" | "phone")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={send} disabled={busy}>Send OTP</Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="potp">OTP</Label>
          <Input id="potp" inputMode="numeric" maxLength={6} value={f.otp}
            onChange={(e) => setF({ ...f, otp: e.target.value.replace(/\D/g, "") })} />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={busy}>Change password</Button>
        </div>
      </form>
    </Section>
  );
}

function DangerZone() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const del = async () => {
    setBusy(true);
    try {
      await deleteAccount();
      toast.success("Account deleted");
      navigate({ to: "/auth" });
    } catch (e) { toast.error(errMsg(e)); setBusy(false); }
  };
  return (
    <section className="surface-card space-y-3 border-destructive/40 p-6">
      <h2 className="font-semibold text-destructive">Delete account</h2>
      <p className="text-sm text-muted-foreground">
        This permanently deletes your account, removes you from all groups and clears your friends.
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={busy}>Delete my account</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={del}>Yes, delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
