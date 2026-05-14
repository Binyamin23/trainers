CREATE SCHEMA IF NOT EXISTS todoList

CREATE TYPE StatusEnum AS ENUM ('ACTIVE', 'INACTIVE', 'ALL'); 

CREATE TABLE IF NOT EXISTS todoList.todo_list (
    id UUID PRIMARY KEY,
    description VARCHAR(50) NOT NULL,
    status StatusEnum NOT NULL,
    parentId UUID,
    CONSTRAINT fk_parent
        FOREIGN KEY(parentId) 
        REFERENCES todoList.todo_list(id)
);

INSERT INTO todoList.todo_list (id, description, status, parentId) 
VALUES (uuid_generate_v4(), 'First todo', 'ACTIVE', NULL);

SELECT * FROM todoList.todo_list;