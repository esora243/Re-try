export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export const ok = <T,>(data: T, init?: ResponseInit) =>
  Response.json(data, {
    status: 200,
    ...init
  });

export const fail = (message: string, status = 500) => Response.json({ error: message }, { status });
