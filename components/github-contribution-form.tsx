"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createBrowserClient } from "@/lib/supabase-browser"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  url: z.string().url({
    message: "Please enter a valid GitHub URL.",
  }),
  repo_name: z.string().min(3, {
    message: "Repository name must be at least 3 characters.",
  }),
  type: z.enum(["pull_request", "issue", "code_review"], {
    required_error: "Please select a contribution type.",
  }),
})

interface GithubContributionFormProps {
  userId: string
}

export default function GithubContributionForm({ userId }: GithubContributionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      url: "",
      repo_name: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!userId) return

    setIsLoading(true)

    try {
      // First, ensure the user exists in the users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .single()

      if (userError || !userData) {
        // If user doesn't exist, create them
        const { data: authUser } = await supabase.auth.getUser()
        if (!authUser.user) throw new Error("User not authenticated")

        const { error: createUserError } = await supabase.from("users").insert({
          id: userId,
          name: authUser.user.user_metadata.full_name || authUser.user.email,
          email: authUser.user.email,
          avatar_url: authUser.user.user_metadata.avatar_url,
        })

        if (createUserError) throw createUserError
      }

      // Determine points based on contribution type
      let points = 0
      switch (values.type) {
        case "pull_request":
          points = 10
          break
        case "issue":
          points = 5
          break
        case "code_review":
          points = 3
          break
      }

      // Add contribution record
      const { error: contributionError } = await supabase
        .from("github_contributions")
        .insert({
          user_id: userId,
          title: values.title,
          url: values.url,
          repo_name: values.repo_name,
          type: values.type,
          points: points,
          created_at: new Date().toISOString(),
        })

      if (contributionError) throw contributionError

      // Add activity record
      const { error: activityError } = await supabase.from("activities").insert({
        user_id: userId,
        type: "github",
        title: `GitHub Contribution: ${values.title}`,
        description: `Contributed to ${values.repo_name} with a ${values.type.replace("_", " ")}`,
        points: points,
        timestamp: new Date().toISOString(),
      })

      if (activityError) throw activityError

      toast({
        title: "Contribution added!",
        description: `You earned ${points} points for your ${values.type.replace("_", " ")}.`,
      })

      form.reset()
      router.refresh()
    } catch (error: any) {
      console.error("Error submitting contribution:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add contribution. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contribution Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Added new feature X" {...field} />
              </FormControl>
              <FormDescription>A brief description of your contribution</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>GitHub URL</FormLabel>
              <FormControl>
                <Input placeholder="https://github.com/org/repo/pull/123" {...field} />
              </FormControl>
              <FormDescription>The URL to your contribution on GitHub</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="repo_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Repository Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., devnorte/website" {...field} />
              </FormControl>
              <FormDescription>The name of the repository you contributed to</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contribution Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select contribution type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pull_request">Pull Request (10 points)</SelectItem>
                  <SelectItem value="issue">Issue (5 points)</SelectItem>
                  <SelectItem value="code_review">Code Review (3 points)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Type of contribution you made</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Submitting..." : "Submit Contribution"}
        </Button>
      </form>
    </Form>
  )
}

