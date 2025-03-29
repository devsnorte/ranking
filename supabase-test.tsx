"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SupabaseTest() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function testConnection() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

        if (!supabaseUrl || !supabaseAnonKey) {
          setStatus("error")
          setMessage("Missing Supabase environment variables")
          return
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // Test the connection with a simple query
        const { data, error } = await supabase.from("users").select("*").limit(1)

        if (error) {
          throw error
        }

        setStatus("success")
        setMessage("Successfully connected to Supabase!")
      } catch (error: any) {
        setStatus("error")
        setMessage(`Error connecting to Supabase: ${error.message}`)
      }
    }

    testConnection()
  }, [])

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
        <CardDescription>Testing connection to your Supabase instance</CardDescription>
      </CardHeader>
      <CardContent>
        {status === "loading" && <p>Testing connection...</p>}
        {status === "success" && <div className="p-4 bg-green-100 text-green-800 rounded-md">{message}</div>}
        {status === "error" && <div className="p-4 bg-red-100 text-red-800 rounded-md">{message}</div>}

        <div className="mt-4">
          <p className="text-sm text-muted-foreground">Environment variables:</p>
          <ul className="text-sm mt-2 space-y-1">
            <li>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅" : "❌"}</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅" : "❌"}</li>
            <li>SUPABASE_URL: {process.env.SUPABASE_URL ? "✅" : "❌"}</li>
            <li>SUPABASE_ANON_KEY: {process.env.SUPABASE_ANON_KEY ? "✅" : "❌"}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

