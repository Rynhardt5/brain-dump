import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'), // Make optional for OAuth users
  passwordHash: text('password_hash'), // Make optional for OAuth users
  image: text('image'), // For profile pictures from OAuth
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// NextAuth tables
export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
)

export const sessions = pgTable('sessions', {
  sessionToken: text('sessionToken').notNull().primaryKey(),
  userId: uuid('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = pgTable(
  'verificationTokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
)

// Brain dumps table
export const brainDumps = pgTable('brain_dumps', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  isPublic: boolean('is_public').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Brain dump items table
export const brainDumpItems = pgTable('brain_dump_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  brainDumpId: uuid('brain_dump_id')
    .notNull()
    .references(() => brainDumps.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  isCompleted: boolean('is_completed').default(false).notNull(),
  createdById: uuid('created_by_id')
    .notNull()
    .references(() => users.id),
  // Denormalized fields for performance (updated by triggers)
  avgVotePriority: text('avg_vote_priority').default('2'),
  voteCount: integer('vote_count').default(0),
  commentCount: integer('comment_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Brain dump collaborators table (for sharing)
export const brainDumpCollaborators = pgTable(
  'brain_dump_collaborators',
  {
    brainDumpId: uuid('brain_dump_id')
      .notNull()
      .references(() => brainDumps.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    canEdit: boolean('can_edit').default(false).notNull(),
    canVote: boolean('can_vote').default(true).notNull(),
    invitedAt: timestamp('invited_at').defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.brainDumpId, table.userId] }),
  })
)

// Item votes table (for priority voting)
export const itemVotes = pgTable(
  'item_votes',
  {
    itemId: uuid('item_id')
      .notNull()
      .references(() => brainDumpItems.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    priority: integer('priority').notNull(), // 1=low, 2=medium, 3=high
    votedAt: timestamp('voted_at').defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.itemId, table.userId] }),
  })
)

// Comments table
export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id')
    .notNull()
    .references(() => brainDumpItems.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdById: uuid('created_by_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Checklist items table (subtasks within an item)
export const checklistItems = pgTable('checklist_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id')
    .notNull()
    .references(() => brainDumpItems.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
  position: integer('position').default(0).notNull(), // For ordering
  createdById: uuid('created_by_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedBrainDumps: many(brainDumps),
  createdItems: many(brainDumpItems),
  collaborations: many(brainDumpCollaborators),
  votes: many(itemVotes),
  comments: many(comments),
}))

export const brainDumpsRelations = relations(brainDumps, ({ one, many }) => ({
  owner: one(users, {
    fields: [brainDumps.ownerId],
    references: [users.id],
  }),
  items: many(brainDumpItems),
  collaborators: many(brainDumpCollaborators),
}))

export const brainDumpItemsRelations = relations(
  brainDumpItems,
  ({ one, many }) => ({
    brainDump: one(brainDumps, {
      fields: [brainDumpItems.brainDumpId],
      references: [brainDumps.id],
    }),
    createdBy: one(users, {
      fields: [brainDumpItems.createdById],
      references: [users.id],
    }),
    votes: many(itemVotes),
    comments: many(comments),
  })
)

export const brainDumpCollaboratorsRelations = relations(
  brainDumpCollaborators,
  ({ one }) => ({
    brainDump: one(brainDumps, {
      fields: [brainDumpCollaborators.brainDumpId],
      references: [brainDumps.id],
    }),
    user: one(users, {
      fields: [brainDumpCollaborators.userId],
      references: [users.id],
    }),
  })
)

export const itemVotesRelations = relations(itemVotes, ({ one }) => ({
  item: one(brainDumpItems, {
    fields: [itemVotes.itemId],
    references: [brainDumpItems.id],
  }),
  user: one(users, {
    fields: [itemVotes.userId],
    references: [users.id],
  }),
}))

export const commentsRelations = relations(comments, ({ one }) => ({
  item: one(brainDumpItems, {
    fields: [comments.itemId],
    references: [brainDumpItems.id],
  }),
  createdBy: one(users, {
    fields: [comments.createdById],
    references: [users.id],
  }),
}))

// Types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type BrainDump = typeof brainDumps.$inferSelect
export type NewBrainDump = typeof brainDumps.$inferInsert
export type BrainDumpItem = typeof brainDumpItems.$inferSelect
export type NewBrainDumpItem = typeof brainDumpItems.$inferInsert
export type BrainDumpCollaborator = typeof brainDumpCollaborators.$inferSelect
export type NewBrainDumpCollaborator =
  typeof brainDumpCollaborators.$inferInsert
export type ItemVote = typeof itemVotes.$inferSelect
export type NewItemVote = typeof itemVotes.$inferInsert
export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert
