function normalizeRecord (record) {
  if (!record) return record

  const nestedValue = record?.value?.value
  if (!nestedValue) return record

  return {
    ...record,
    role: record.role ?? record.value?.role,
    value: nestedValue
  }
}

function normalizeTable (table = {}) {
  const normalized = {}
  for (const [id, record] of Object.entries(table)) {
    normalized[id] = normalizeRecord(record)
  }
  return normalized
}

export default function normalizeRecordMap (recordMap = {}) {
  return {
    ...recordMap,
    block: normalizeTable(recordMap.block),
    collection: normalizeTable(recordMap.collection),
    collection_view: normalizeTable(recordMap.collection_view),
    notion_user: normalizeTable(recordMap.notion_user),
    space: normalizeTable(recordMap.space)
  }
}
