import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { login, register, googleLoginUrl, type RegisterInput } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/config";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Splitly" },
      { name: "description", content: "Log in or create your Splitly account to split expenses." },
      { property: "og:title", content: "Sign in — Splitly" },
      { property: "og:description", content: "Log in or create your Splitly account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/;

function AuthPage() {
  const [tab, setTab] = useState("login");
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/30 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-lg sm:p-8">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Splitly</h1>
            <p className="text-xs text-muted-foreground">Split expenses, stay friends</p>
          </div>
        </div>
        {DEMO_MODE && (
          <p className="mb-4 rounded-md bg-accent px-3 py-2 text-xs text-accent-foreground">
            Demo mode: backend not connected yet — any details will log you in.
          </p>
        )}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login"><LoginForm /></TabsContent>
          <TabsContent value="register"><RegisterForm onDone={() => setTab("login")} /></TabsContent>
        </Tabs>
        {!DEMO_MODE && (
          <Button variant="outline" className="mt-4 w-full" asChild>
            <a href={googleLoginUrl()}>Continue with Google</a>
          </Button>
        )}
      </div>
    </div>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username.trim(), password);
      toast.success("Welcome back!");
      navigate({ to: "/" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="lu">Username</Label>
        <Input id="lu" required value={username} onChange={(e) => setUsername(e.target.value.toUpperCase())} placeholder="RISHVA01" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lp">Password</Label>
        <Input id="lp" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState<RegisterInput>({
    firstname: "", lastname: "", username: "", gender: "male", mobile_no: "", email: "", password: "",
  });
  const [loading, setLoading] = useState(false);
  const set = (k: keyof RegisterInput, v: string) => setF((p) => ({ ...p, [k]: v }));

  function validate(): string | null {
    if (f.firstname.length < 3 || f.lastname.length < 3) return "First and last name need at least 3 letters";
    if (!/^[A-Z0-9]{5,}$/.test(f.username)) return "Username: 5+ characters, only CAPITAL letters and numbers";
    if (!/^\d{10}$/.test(f.mobile_no)) return "Mobile number must be 10 digits";
    if (!PASSWORD_RE.test(f.password)) return "Password: 8-15 chars with upper, lower, number and a symbol (@$!%*?&)";
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setLoading(true);
    try {
      await register(f);
      toast.success("Account created! Please log in.");
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label>First name</Label><Input required value={f.firstname} onChange={(e) => set("firstname", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Last name</Label><Input required value={f.lastname} onChange={(e) => set("lastname", e.target.value)} /></div>
      </div>
      <div className="space-y-1.5"><Label>Username</Label><Input required value={f.username} onChange={(e) => set("username", e.target.value.toUpperCase())} placeholder="RISHVA01" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Gender</Label>
          <Select value={f.gender} onValueChange={(v) => set("gender", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Mobile</Label><Input required inputMode="numeric" maxLength={10} value={f.mobile_no} onChange={(e) => set("mobile_no", e.target.value.replace(/\D/g, ""))} /></div>
      </div>
      <div className="space-y-1.5"><Label>Email</Label><Input type="email" required value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Password</Label><Input type="password" required value={f.password} onChange={(e) => set("password", e.target.value)} /></div>
      <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating..." : "Create account"}</Button>
    </form>
  );
}
