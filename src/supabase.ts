import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rxjassnmemmkraywcdbv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4amFzc25tZW1ta3JheXdjZGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MzcxNzAsImV4cCI6MjA5MDAxMzE3MH0.EM6hqKWqJYK902Zc4yqn45ZS1qgED9o6xxjEP8aPgBQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
