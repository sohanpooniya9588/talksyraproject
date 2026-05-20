// Deno script to inspect all Supabase tables and their structure
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = "https://frmazzmzyychdfajnslt.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZybWF6em16eXljaGRmYWpuc2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzEwMDMsImV4cCI6MjA4NzM0NzAwM30.85x1WBkFX9bdpGw1T5-azJ03WsdzJ1r2EiiScxQnQl0"

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Get all tables and their structure
async function inspectDatabase() {
  try {
    console.log("🔍 Fetching database schema...\n")

    // Query to get all table information
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("*")
      .eq("table_schema", "public")

    if (error) {
      console.error("Error fetching tables:", error)
      return
    }

    console.log("📊 TABLES FOUND:", data?.length)
    console.log("━".repeat(80) + "\n")

    const tableStructures: any = {}

    // For each table, get its columns
    for (const table of data || []) {
      const tableName = table.table_name
      console.log(`📋 Table: ${tableName}`)
      console.log("─".repeat(80))

      // Query columns for this table
      const { data: columns, error: colError } = await supabase
        .from("information_schema.columns")
        .select("*")
        .eq("table_schema", "public")
        .eq("table_name", tableName)

      if (colError) {
        console.error(`Error fetching columns for ${tableName}:`, colError)
        continue
      }

      tableStructures[tableName] = []

      columns?.forEach((col: any) => {
        const colInfo = {
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable,
          default: col.column_default,
        }
        tableStructures[tableName].push(colInfo)

        console.log(
          `  • ${col.column_name.padEnd(25)} | ${col.data_type.padEnd(15)} | ${
            col.is_nullable === "YES" ? "nullable" : "NOT NULL"
          } ${col.column_default ? `| default: ${col.column_default}` : ""}`
        )
      })

      console.log("")
    }

    // Save to file
    const output = JSON.stringify(tableStructures, null, 2)
    await Deno.writeTextFile(
      "./docs/DATABASE_STRUCTURE.json",
      output
    )

    console.log("\n✅ Database structure saved to docs/DATABASE_STRUCTURE.json")
    
    // Also create a markdown version
    let markdownContent = "# 📊 Complete Database Structure\n\n"
    markdownContent += `Generated: ${new Date().toISOString()}\n\n`

    for (const [tableName, columns] of Object.entries(tableStructures)) {
      markdownContent += `## ${tableName}\n\n`
      markdownContent += "| Column | Type | Nullable |\n"
      markdownContent += "|--------|------|----------|\n"
      
      for (const col of columns as any[]) {
        const nullable = col.nullable === "YES" ? "✓" : "✗"
        markdownContent += `| ${col.name} | ${col.type} | ${nullable} |\n`
      }
      
      markdownContent += "\n"
    }

    await Deno.writeTextFile(
      "./docs/DATABASE_STRUCTURE.md",
      markdownContent
    )

    console.log("✅ Markdown version saved to docs/DATABASE_STRUCTURE.md")

  } catch (err) {
    console.error("Error:", err)
  }
}

inspectDatabase()
