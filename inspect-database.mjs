// Node.js script to inspect all Supabase tables
import fetch from 'node-fetch'

const SUPABASE_URL = "https://frmazzmzyychdfajnslt.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZybWF6em16eXljaGRmYWpuc2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzEwMDMsImV4cCI6MjA4NzM0NzAwM30.85x1WBkFX9bdpGw1T5-azJ03WsdzJ1r2EiiScxQnQl0"

const headers = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
}

async function inspectDatabase() {
  try {
    console.log("🔍 Fetching database schema...\n")

    // Get list of all tables
    const tablesUrl = `${SUPABASE_URL}/rest/v1/?apiversion=12`
    const tablesRes = await fetch(tablesUrl, { headers })
    const tables = await tablesRes.json()

    console.log("📊 Querying Supabase information_schema...\n")

    // Query the information schema to get table structure
    const schemaUrl = `${SUPABASE_URL}/rest/v1/information_schema.tables?table_schema=eq.public&select=*`
    const schemaRes = await fetch(schemaUrl, { headers })
    
    if (!schemaRes.ok) {
      console.log("Using alternative method to get table info...")
      
      // Alternative: Query each table that we know exists
      const knownTables = [
        'users', 'posts', 'likes', 'comments', 'followers', 'saves', 
        'hashtags', 'story_views', 'stories', 'notifications', 'messages',
        'conversations', 'conversation_members', 'blocks', 'reports',
        'transactions', 'coins_transaction_log', 'content_moderation_queue',
        'post_hashtags', 'post_views_timeline', 'user_activity_log',
        'user_analytics', 'user_interests', 'user_preferences',
        'trending_posts', 'recommendations', 'search_history',
        'device_info', 'engagement_analytics', 'feed_cache',
        'feed_ranking_scores', 'reposts', 'poll_options', 'poll_votes', 'polls'
      ]

      const tableStructures = {}

      for (const tableName of knownTables) {
        try {
          // Try to get 0 rows to understand the schema
          const url = `${SUPABASE_URL}/rest/v1/${tableName}?limit=0`
          const res = await fetch(url, { headers })

          if (res.ok) {
            console.log(`✓ Table: ${tableName}`)
            tableStructures[tableName] = {
              exists: true,
              columns: extractColumnsFromResponse(res)
            }
          }
        } catch (e) {
          console.log(`✗ Table: ${tableName} (not accessible)`)
          tableStructures[tableName] = { exists: false }
        }
      }

      // Save results
      const fs = await import('fs')
      fs.writeFileSync(
        './docs/DATABASE_STRUCTURE.json',
        JSON.stringify(tableStructures, null, 2)
      )
      console.log("\n✅ Database structure saved to docs/DATABASE_STRUCTURE.json")

    } else {
      const schemaData = await schemaRes.json()
      console.log(`Found ${schemaData.length} tables`)
      console.log("━".repeat(80) + "\n")

      const tableStructures = {}

      for (const table of schemaData) {
        const tableName = table.table_name
        console.log(`📋 Table: ${tableName}`)
        console.log("─".repeat(80))

        tableStructures[tableName] = []

        // Get columns for this table
        const colUrl = `${SUPABASE_URL}/rest/v1/information_schema.columns?table_schema=eq.public&table_name=eq.${tableName}&select=*`
        const colRes = await fetch(colUrl, { headers })
        const columns = await colRes.json()

        columns.forEach((col) => {
          tableStructures[tableName].push({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable,
            default: col.column_default,
          })

          console.log(
            `  • ${col.column_name.padEnd(25)} | ${col.data_type.padEnd(15)} | ${
              col.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'
            } ${col.column_default ? `| default: ${col.column_default}` : ''}`
          )
        })

        console.log("")
      }

      // Save to file
      const fs = await import('fs')
      fs.writeFileSync(
        './docs/DATABASE_STRUCTURE.json',
        JSON.stringify(tableStructures, null, 2)
      )
      console.log("\n✅ Database structure saved to docs/DATABASE_STRUCTURE.json")
    }

  } catch (err) {
    console.error("Error:", err)
  }
}

function extractColumnsFromResponse(response) {
  const headers = response.headers
  const contentRange = headers.get('content-range')
  // Parse header to get column info - this is a simplified approach
  return []
}

inspectDatabase()
