# Queue API

## Development

Install dependencies:

```bash
npm install
```

Run the API:

```bash
npm run dev
```

By default the server listens on `PORT` from `.env`, or `3000` if unset.

## Migrations

This project currently uses plain SQL migration files in `migrations/`.

Run them in order against your PostgreSQL database:

```bash
psql "$DATABASE" -f migrations/001_create_appointments_table.sql
psql "$DATABASE" -f migrations/002_create_trainers_and_working_hours.sql
psql "$DATABASE" -f migrations/003_create_trainees_table.sql
psql "$DATABASE" -f migrations/004_normalize_appointments_to_trainees.sql
```

If you do not use `DATABASE`, pass your normal `psql` connection flags instead.

## Seed Demo Data

Insert deterministic demo data:

```bash
npm run seed
```

The seed uses the existing PostgreSQL connection setup and clears only its own demo rows before inserting new ones.

Demo values:

- Trainer 1: `11111111-1111-4111-8111-111111111111`
- Trainer 2: `22222222-2222-4222-8222-222222222222`
- Demo phone: `0501234567`
- Demo availability date: `2026-05-15`

The seed creates two trainers, weekly working hours for both trainers, scheduled appointments, and cancelled appointments.

## Postman

Import this collection into Postman:

```text
postman/queue-api.postman_collection.json
```

Collection variables:

- `baseUrl`: defaults to `http://localhost:4000`
- `trainerId`: seeded trainer id
- `appointmentId`: seeded appointment id
- `phone`: `0501234567`
- `date`: `2026-05-15`

If your server runs on another port, update `baseUrl` in the collection variables.

## Suggested Test Flow

1. Run migrations.
2. Run `npm run seed`.
3. Start the server with `npm run dev`.
4. In Postman, run `GET /trainers`.
5. Run `GET /appointments/availability`.
6. Run `POST /ai/chat - availability`.
7. Run `POST /ai/chat - booking`.
8. Run `POST /ai/chat - cancellation`.

Swagger UI is available at:

```text
http://localhost:3000/api-docs
```
