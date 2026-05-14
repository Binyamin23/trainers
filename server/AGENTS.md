# Architecture Rules

## Layers

- Controllers handle HTTP only.
- Services contain business logic.
- Repositories contain SQL only.

## Database Rules

- SQL queries are allowed only inside repositories.
- Services may access db/pool only for transaction orchestration.
- Services may create transactions and pass PoolClient into repositories.
- Repositories may receive Pool or PoolClient.

## General

- Use parameterized SQL only.
- Never duplicate business logic.
- Keep functions small and composable.