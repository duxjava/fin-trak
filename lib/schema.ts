import { pgTable, text, timestamp, decimal, integer, serial } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const groups = pgTable('groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdBy: text('created_by').notNull().references(() => users.id),
  isDefault: text('is_default').notNull().default('false'), // 'true' для дефолтной группы пользователя
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const groupMembers = pgTable('group_members', {
  groupId: text('group_id').notNull().references(() => groups.id),
  userId: text('user_id').notNull().references(() => users.id),
  role: text('role').notNull().default('member'),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export const currencies = pgTable('currencies', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(), // USD, EUR, RUB, etc.
  name: text('name').notNull(), // US Dollar, Euro, Russian Ruble, etc.
  symbol: text('symbol').notNull(), // $, €, ₽, etc.
  isActive: text('is_active').notNull().default('true'), // 'true' or 'false'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'cash', 'bank', 'credit', 'investment', 'other'
  balance: decimal('balance', { precision: 10, scale: 2 }).notNull().default('0.00'),
  currencyId: integer('currency_id').notNull().references(() => currencies.id),
  userId: text('user_id').notNull().references(() => users.id),
  groupId: text('group_id').notNull().references(() => groups.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  type: text('type').notNull(), // 'expense', 'income'
  date: timestamp('date').notNull(),
  userId: text('user_id').notNull().references(() => users.id),
  groupId: text('group_id').notNull().references(() => groups.id),
  accountId: integer('account_id').notNull().references(() => accounts.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const transfers = pgTable('transfers', {
  id: serial('id').primaryKey(),
  fromAmount: decimal('from_amount', { precision: 10, scale: 2 }).notNull(),
  toAmount: decimal('to_amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description').notNull(),
  date: timestamp('date').notNull(),
  userId: text('user_id').notNull().references(() => users.id),
  groupId: text('group_id').notNull().references(() => groups.id),
  fromAccountId: integer('from_account_id').notNull().references(() => accounts.id),
  toAccountId: integer('to_account_id').notNull().references(() => accounts.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Определяем связи
export const usersRelations = relations(users, ({ many }) => ({
  groups: many(groups),
  groupMembers: many(groupMembers),
  accounts: many(accounts),
  transactions: many(transactions),
  transfers: many(transfers),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [groups.createdBy],
    references: [users.id],
  }),
  members: many(groupMembers),
  accounts: many(accounts),
  transactions: many(transactions),
  transfers: many(transfers),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMembers.userId],
    references: [users.id],
  }),
}));

export const currenciesRelations = relations(currencies, ({ many }) => ({
  accounts: many(accounts),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [accounts.groupId],
    references: [groups.id],
  }),
  currency: one(currencies, {
    fields: [accounts.currencyId],
    references: [currencies.id],
  }),
  transactions: many(transactions),
  fromTransfers: many(transfers, { relationName: 'fromAccount' }),
  toTransfers: many(transfers, { relationName: 'toAccount' }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [transactions.groupId],
    references: [groups.id],
  }),
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
}));

export const transfersRelations = relations(transfers, ({ one }) => ({
  user: one(users, {
    fields: [transfers.userId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [transfers.groupId],
    references: [groups.id],
  }),
  fromAccount: one(accounts, {
    fields: [transfers.fromAccountId],
    references: [accounts.id],
    relationName: 'fromAccount',
  }),
  toAccount: one(accounts, {
    fields: [transfers.toAccountId],
    references: [accounts.id],
    relationName: 'toAccount',
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type GroupMember = typeof groupMembers.$inferSelect;
export type NewGroupMember = typeof groupMembers.$inferInsert;
export type Currency = typeof currencies.$inferSelect;
export type NewCurrency = typeof currencies.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Transfer = typeof transfers.$inferSelect;
export type NewTransfer = typeof transfers.$inferInsert;
