# 📊 Supabase Database Schema

Generated: 2026-05-20T12:32:28.119Z

## Table Summary

**Total Tables Found**: 40
**Total Columns**: 49

## Detailed Schema

### users

| Column | Type |
|--------|------|
| id | string |
| username | string |
| full_name | string |
| email | string |
| profile_pic | string |
| cover_pic | object |
| bio | object |
| website | object |
| location | object |
| birth_date | object |
| is_verified | boolean |
| is_pro_member | boolean |
| red_coins | number |
| green_coins | number |
| follower_count | number |
| following_count | number |
| post_count | number |
| status | string |
| last_seen | string |
| created_at | string |
| is_private | boolean |
| password | object |

### posts

| Column | Type |
|--------|------|
| id | string |
| user_id | string |
| type | string |
| caption | string |
| media_url | string |
| thumbnail_url | string |
| audio_name | object |
| audio_url | object |
| aspect_ratio | number |
| duration | number |
| visibility | string |
| is_monetized | boolean |
| like_count | number |
| comment_count | number |
| share_count | number |
| view_count | number |
| location_name | string |
| created_at | string |

### likes

| Column | Type |
|--------|------|
| user_id | string |
| post_id | string |
| created_at | string |

### comments

| Column | Type |
|--------|------|
| id | string |
| post_id | string |
| user_id | string |
| parent_id | object |
| content | string |
| created_at | string |

### followers

| Column | Type |
|--------|------|
| (empty table) | - |

### saves

| Column | Type |
|--------|------|
| (empty table) | - |

### hashtags

| Column | Type |
|--------|------|
| (empty table) | - |

### stories

| Column | Type |
|--------|------|
| (empty table) | - |

### story_views

| Column | Type |
|--------|------|
| (empty table) | - |

### notifications

| Column | Type |
|--------|------|
| (empty table) | - |

### messages

| Column | Type |
|--------|------|
| (empty table) | - |

### conversations

| Column | Type |
|--------|------|
| (empty table) | - |

### conversation_members

| Column | Type |
|--------|------|
| (empty table) | - |

### blocks

| Column | Type |
|--------|------|
| (empty table) | - |

### reports

| Column | Type |
|--------|------|
| (empty table) | - |

### transactions

| Column | Type |
|--------|------|
| (empty table) | - |

### coins_transaction_log

| Column | Type |
|--------|------|
| (empty table) | - |

### content_moderation_queue

| Column | Type |
|--------|------|
| (empty table) | - |

### post_hashtags

| Column | Type |
|--------|------|
| (empty table) | - |

### post_views_timeline

| Column | Type |
|--------|------|
| (empty table) | - |

### user_activity_log

| Column | Type |
|--------|------|
| (empty table) | - |

### user_analytics

| Column | Type |
|--------|------|
| (empty table) | - |

### user_interests

| Column | Type |
|--------|------|
| (empty table) | - |

### user_preferences

| Column | Type |
|--------|------|
| (empty table) | - |

### trending_posts

| Column | Type |
|--------|------|
| (empty table) | - |

### recommendations

| Column | Type |
|--------|------|
| (empty table) | - |

### search_history

| Column | Type |
|--------|------|
| (empty table) | - |

### device_info

| Column | Type |
|--------|------|
| (empty table) | - |

### engagement_analytics

| Column | Type |
|--------|------|
| (empty table) | - |

### feed_cache

| Column | Type |
|--------|------|
| (empty table) | - |

### feed_ranking_scores

| Column | Type |
|--------|------|
| (empty table) | - |

### reposts

| Column | Type |
|--------|------|
| (empty table) | - |

### poll_options

| Column | Type |
|--------|------|
| (empty table) | - |

### poll_votes

| Column | Type |
|--------|------|
| (empty table) | - |

### polls

| Column | Type |
|--------|------|
| (empty table) | - |

### ads

| Column | Type |
|--------|------|
| (empty table) | - |

### calls

| Column | Type |
|--------|------|
| (empty table) | - |

### group_members

| Column | Type |
|--------|------|
| (empty table) | - |

### groups

| Column | Type |
|--------|------|
| (empty table) | - |

### story_highlights

| Column | Type |
|--------|------|
| (empty table) | - |

