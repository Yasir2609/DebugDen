/**
 * Global setup — runs once in the MAIN process before workers are forked.
 * Starts a MongoMemoryReplSet (replica set needed for Mongoose transactions)
 * and publishes its URI via process.env so the worker inherits it.
 */
import { MongoMemoryReplSet } from 'mongodb-memory-server'

let replSet

export async function setup() {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } })
  process.env.MONGODB_TEST_URI = replSet.getUri()
}

export async function teardown() {
  await replSet?.stop()
}
