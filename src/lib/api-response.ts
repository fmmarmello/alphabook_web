import { NextResponse } from "next/server";

type Meta = Record<string, unknown> | undefined;

export function ok<T>(data: T, meta?: Meta) {
  return NextResponse.json({ data, meta: meta ?? null, error: null });
}

export function created<T>(data: T, meta?: Meta) {
  return NextResponse.json({ data, meta: meta ?? null, error: null }, { status: 201 });
}

export function error(status: number, message: string, details?: unknown) {
  return NextResponse.json({ data: null, error: { message, details: details ?? null } }, { status });
}

export function badRequest(message: string, details?: unknown) {
  return error(400, message, details);
}

export function unauthorized(message = "Unauthorized") {
  return error(401, message);
}

export function forbidden(message = "Forbidden") {
  return error(403, message);
}

export function notFound(message = "Not found") {
  return error(404, message);
}

export function conflict(message = "Conflict", details?: unknown) {
  return error(409, message, details);
}

export function serverError(details?: unknown) {
  return error(500, "Internal server error", details);
}

