import type { SceneModel } from '../../../src'

// psql (0.8): a REAL transcript, captured from psql 16 through an 80-column pseudo-terminal (no
// readline, so the rows are exactly what the terminal drew). It walks every prompt state: `=>` a new
// statement, `(>` inside brackets, `-*>` a continued line inside a transaction, `=*>` a transaction
// open, `=!>` a failed one (its COMMIT rolls back), `'>` inside a quoted string that crosses a line,
// and `=#` a superuser. String.raw keeps psql's `\q`.
const PSQL = String.raw`
  dbteam@syndica:~$ psql -n -d syndica
  psql (16.15 (Ubuntu 16.15-0ubuntu0.24.04.1))
  Type "help" for help.

  syndica=> CREATE TABLE branches (
  syndica(>   branch_id int PRIMARY KEY,
  syndica(>   city text NOT NULL
  syndica(> );
  CREATE TABLE
  syndica=> INSERT INTO branches VALUES (1, 'Leeds'), (2, 'Bristol');
  INSERT 0 2
  syndica=> BEGIN;
  BEGIN
  syndica=*> SELECT city
  syndica-*>   FROM branches WHERE branch_id = 1;
   city  
  -------
   Leeds
  (1 row)

  syndica=*> SELECT citee FROM branches;
  ERROR:  column "citee" does not exist
  LINE 1: SELECT citee FROM branches;
                 ^
  HINT:  Perhaps you meant to reference the column "branches.city".
  syndica=!> COMMIT;
  ROLLBACK
  syndica=> SELECT 'Syndica''s
  syndica'> first branch' AS note;
       note     
  --------------
   Syndica's   +
   first branch
  (1 row)

  syndica=> \q
  dbteam@syndica:~$ psql -n -U postgres -d syndica
  psql (16.15 (Ubuntu 16.15-0ubuntu0.24.04.1))
  Type "help" for help.

  syndica=# DROP TABLE branches;
  DROP TABLE
  syndica=# \q
  dbteam@syndica:~$
`

export const PSQL_FIXTURES: Record<string, SceneModel> = {
  'code-console-psql': {
    title: 'console: psql — every prompt state, a statement over several lines, a failed transaction',
    nodes: [{ type: 'code', id: 'con', console: true, filename: 'dbteam@syndica: ~', code: PSQL, highlight: [22, 23, 24, 25] }],
  },
}
