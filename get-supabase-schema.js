#!/usr/bin/env node

const SUPABASE_URL = "https://frmazzmzyychdfajnslt.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZybWF6em16eXljaGRmYWpuc2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzEwMDMsImV4cCI6MjA4NzM0NzAwM30.85x1WBkFX9bdpGw1T5-azJ03WsdzJ1r2EiiScxQnQl0"

const headers = {
  'apikey': SUPABASE_KEY,
  'Content-Type': 'application/json',
}

// Known tables from your project
const knownTables = [
  'users', 'posts', 'likes', 'comments', 'followers', 'saves',
  'hashtags', 'stories', 'story_views', 'notifications', 'messages',
  'conversations', 'conversation_members', 'blocks', 'reports',
  'transactions', 'coins_transaction_log', 'content_moderation_queue',
  'post_hashtags', 'post_views_timeline', 'user_activity_log',
  'user_analytics', 'user_interests', 'user_preferences',
  'trending_posts', 'recommendations', 'search_history',
  'device_info', 'engagement_analytics', 'feed_cache',
  'feed_ranking_scores', 'reposts', 'poll_options', 'poll_votes', 'polls',
  'ads', 'blocks', 'calls', 'group_members', 'groups', 'story_highlights'
]

async function getTableSchema(tableName) {
  try {
    // Fetch with select=* to get all columns info in response
    const url = `${SUPABASE_URL}/rest/v1/${tableName}?limit=1`
    const response = await fetch(url, { 
      headers,
      method: 'GET'
    })

    if (response.status === 404 || response.status === 401) {
      return null
    }

    // Get content-range header which shows column info
    const contentRange = response.headers.get('content-range')
    
    // Try to get data to see structure
    const data = await response.json()
    
    if (Array.isArray(data) && data.length > 0) {
      // Extract column names from first row
      const columns = Object.keys(data[0]).map(key => ({
        name: key,
        type: typeof data[0][key]
      }))
      return {
        tableName,
        status: 'ok',
        columns,
        sampleData: data[0]
      }
    } else if (Array.isArray(data)) {
      // Empty table - try with select count
      return {
        tableName,
        status: 'empty',
        columns: [],
        count: 0
      }
    } else if (data.code) {
      return {
        tableName,
        status: 'error',
        error: data.message
      }
    }

    return {
      tableName,
      status: 'unknown',
      data
    }
  } catch (error) {
    return {
      tableName,
      status: 'error',
      error: error.message
    }
  }
}

async function getAllTableSchemas() {
  console.log('🔍 Fetching database schema from Supabase...\n')
  console.log('━'.repeat(100))

  const results = {}
  
  for (const tableName of knownTables) {
    process.stdout.write(`  Checking ${tableName.padEnd(30)}... `)
    
    const schema = await getTableSchema(tableName)
    
    if (schema) {
      results[tableName] = schema
      if (schema.status === 'ok') {
        console.log(`✓ Found (${schema.columns.length} columns)`)
      } else if (schema.status === 'empty') {
        console.log(`✓ Empty table`)
      } else {
        console.log(`✗ ${schema.status}`)
      }
    } else {
      console.log('✗ Not accessible')
    }
  }

  console.log('\n' + '━'.repeat(100) + '\n')

  // Display results
  let markdown = '# 📊 Supabase Database Schema\n\n'
  markdown += `Generated: ${new Date().toISOString()}\n\n`
  markdown += '## Table Summary\n\n'

  let existingTables = 0
  let totalColumns = 0

  for (const [tableName, schema] of Object.entries(results)) {
    if (schema.status === 'ok' || schema.status === 'empty') {
      existingTables++
      if (schema.columns) {
        totalColumns += schema.columns.length
      }
    }
  }

  markdown += `**Total Tables Found**: ${existingTables}\n`
  markdown += `**Total Columns**: ${totalColumns}\n\n`

  // Detailed schema
  markdown += '## Detailed Schema\n\n'

  for (const [tableName, schema] of Object.entries(results)) {
    if (schema.status === 'ok' || schema.status === 'empty') {
      markdown += `### ${tableName}\n\n`
      markdown += '| Column | Type |\n'
      markdown += '|--------|------|\n'
      
      if (schema.columns && schema.columns.length > 0) {
        schema.columns.forEach(col => {
          markdown += `| ${col.name} | ${col.type} |\n`
        })
      } else {
        markdown += '| (empty table) | - |\n'
      }
      
      markdown += '\n'
    }
  }

  // Save files
  const fs = require('fs')
  
  fs.writeFileSync('./docs/SUPABASE_DATABASE_SCHEMA.md', markdown)
  fs.writeFileSync('./docs/SUPABASE_TABLES.json', JSON.stringify(results, null, 2))

  console.log('✅ Schema saved to:')
  console.log('   • docs/SUPABASE_DATABASE_SCHEMA.md')
  console.log('   • docs/SUPABASE_TABLES.json\n')

  // Print summary
  console.log('📋 Table Summary:')
  console.log(`   Existing tables: ${existingTables}`)
  console.log(`   Total columns: ${totalColumns}`)
}

getAllTableSchemas().catch(console.error)
