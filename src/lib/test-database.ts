import { createClient, type Client, type InValue } from '@libsql/client';
import type { Database, Statement } from '@/lib/database';

class TestLibSqlDatabase implements Database {
  constructor(private readonly client: Client) {}

  prepare(query: string): Statement {
    let boundValues: unknown[] = [];
    const args = () => boundValues as InValue[];
    const statement: Statement = {
      bind: (...values: unknown[]) => {
        boundValues = values;
        return statement;
      },
      first: async <T = Record<string, unknown>>() => {
        const result = await this.client.execute({ sql: query, args: args() });
        return result.rows[0] ? ({ ...result.rows[0] } as T) : null;
      },
      all: async <T = Record<string, unknown>>() => {
        const result = await this.client.execute({ sql: query, args: args() });
        return { results: result.rows.map((row) => ({ ...row })) as T[] };
      },
      run: () => this.client.execute({ sql: query, args: args() }),
    };
    return statement;
  }
}

export function createTestDatabase() {
  const client = createClient({ url: ':memory:' });
  return {
    client,
    db: new TestLibSqlDatabase(client),
  };
}
