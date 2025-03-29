"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Copy, ExternalLink, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SqlScriptPage() {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const sqlScript = `-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time VARCHAR(50),
  location VARCHAR(255),
  points INTEGER NOT NULL DEFAULT 5
);

-- Create user_events table
CREATE TABLE IF NOT EXISTS public.user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Create github_contributions table
CREATE TABLE IF NOT EXISTS public.github_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  repo_name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create discord_activities table
CREATE TABLE IF NOT EXISTS public.discord_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  channel VARCHAR(255),
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample events if they don't exist
INSERT INTO public.events (name, description, date, time, location, points)
SELECT 'Community Meetup', 'Monthly community meetup to discuss projects and ideas', '2023-12-15', '18:00', 'Tech Hub', 10
WHERE NOT EXISTS (SELECT 1 FROM public.events LIMIT 1);

INSERT INTO public.events (name, description, date, time, location, points)
SELECT 'Hackathon', 'Weekend hackathon to build innovative projects', '2023-12-20', '09:00', 'Innovation Center', 20
WHERE NOT EXISTS (SELECT 1 FROM public.events WHERE name = 'Hackathon');

INSERT INTO public.events (name, description, date, time, location, points)
SELECT 'Workshop: Intro to React', 'Learn the basics of React.js', '2023-12-10', '14:00', 'Online', 5
WHERE NOT EXISTS (SELECT 1 FROM public.events WHERE name = 'Workshop: Intro to React');

-- Grant permissions to authenticated users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discord_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all users"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "Users can view all events"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Users can view their own event check-ins"
  ON public.user_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own event check-ins"
  ON public.user_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own github contributions"
  ON public.github_contributions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own github contributions"
  ON public.github_contributions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own discord activities"
  ON public.discord_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own activities"
  ON public.activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activities"
  ON public.activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON public.users TO anon, authenticated;
GRANT SELECT ON public.events TO anon, authenticated;
GRANT SELECT, INSERT ON public.user_events TO authenticated;
GRANT SELECT, INSERT ON public.github_contributions TO authenticated;
GRANT SELECT, INSERT ON public.discord_activities TO authenticated;
GRANT SELECT, INSERT ON public.activities TO authenticated;`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript)
    setCopied(true)
    toast({
      title: "SQL script copied to clipboard",
      description: "You can now paste it into the Supabase SQL Editor",
    })

    setTimeout(() => setCopied(false), 2000)
  }

  const goBack = () => {
    window.history.back()
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Setup - SQL Script
          </CardTitle>
          <CardDescription>
            Run this SQL script in the Supabase SQL Editor to create all required tables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Manual Setup Required</AlertTitle>
            <AlertDescription>
              The automatic setup couldn't run because the <code>execute_sql</code> function is not available. Please
              follow the manual steps below.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Instructions:</h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm">
                <li>Copy the SQL script below</li>
                <li>
                  Open the Supabase SQL Editor
                  <Button
                    variant="link"
                    className="px-2 h-auto"
                    onClick={() => window.open("https://supabase.com/dashboard/project/_/sql", "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open SQL Editor
                  </Button>
                </li>
                <li>Paste the script into the editor</li>
                <li>Click "Run" to execute the script</li>
                <li>Return to this app and try using the GitHub contribution scanner again</li>
              </ol>
            </div>

            <div className="relative">
              <div className="absolute right-2 top-2">
                <Button size="sm" variant="ghost" onClick={copyToClipboard} className="h-8 px-2">
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span className="ml-1">{copied ? "Copied!" : "Copy"}</span>
                </Button>
              </div>
              <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-xs">{sqlScript}</pre>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={goBack}>
            Back
          </Button>
          <Button onClick={copyToClipboard}>{copied ? "Copied!" : "Copy SQL Script"}</Button>
        </CardFooter>
      </Card>
    </div>
  )
}

