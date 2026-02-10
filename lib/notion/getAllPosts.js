import { config as BLOG } from '@/lib/server/config'

import { idToUuid } from 'notion-utils'
import dayjs from 'dayjs'
import api from '@/lib/server/notion-api'
import getAllPageIds from './getAllPageIds'
import getPageProperties from './getPageProperties'
import filterPublishedPosts from './filterPublishedPosts'
import normalizeRecordMap from './normalizeRecordMap'

/**
 * @param {{ includePages: boolean }} - false: posts only / true: include pages
 */
export async function getAllPosts ({ includePages = false }) {
  const rawPageId = process.env.NOTION_PAGE_ID?.replaceAll('-', '')
  if (!rawPageId) {
    console.log('NOTION_PAGE_ID is missing.')
    return []
  }

  const id = idToUuid(rawPageId)

  let response
  try {
    response = normalizeRecordMap(await api.getPage(id))
  } catch (error) {
    console.log(`Failed to fetch Notion page "${id}".`)
    return []
  }

  const collection = Object.values(response.collection)[0]?.value
  const collectionQuery = response.collection_query
  const block = response.block
  const schema = collection?.schema

  // Some setups use a page which contains a database instead of the database page id itself.
  // If we cannot resolve a collection/query pair, fail gracefully so static build does not crash.
  if (!collection || !collectionQuery || !block || !schema) {
    console.log(
      `NOTION_PAGE_ID "${id}" is not a database (or a page containing an accessible database).`
    )
    return []
  }

  // Construct Data
  const pageIds = getAllPageIds(collectionQuery)
  const data = []
  for (let i = 0; i < pageIds.length; i++) {
    const id = pageIds[i]
    const properties = (await getPageProperties(id, block, schema)) || {}

    // Add fullwidth to properties
    properties.fullWidth = block[id].value?.format?.page_full_width ?? false
    // Convert date (with timezone) to unix milliseconds timestamp
    properties.date = (
      properties.date?.start_date
        ? dayjs.tz(properties.date?.start_date)
        : dayjs(block[id].value?.created_time)
    ).valueOf()

    data.push(properties)
  }

  // remove all the the items doesn't meet requirements
  const posts = filterPublishedPosts({ posts: data, includePages })

  // Sort by date
  if (BLOG.sortByDate) {
    posts.sort((a, b) => b.date - a.date)
  }
  return posts
}
