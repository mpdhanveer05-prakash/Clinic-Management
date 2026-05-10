import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Clinic configuration and preferences</p>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 rounded-2xl bg-primary/10 mb-4">
          <Settings className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
        <p className="text-muted-foreground max-w-md">
          Clinic settings, message templates, knowledge base management, user management, and notification preferences.
        </p>
      </div>
    </div>
  );
}
