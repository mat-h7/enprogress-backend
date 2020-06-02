const Pool = require('pg').Pool
const connectionString = "postgresql://mh7618:lK2WvrCrkB@db.doc.ic.ac.uk:5432/mh7618?ssl=true"
const pool = new Pool({
  connectionString: connectionString,
})

// routes for GET endpoint
const getUsers = (request, response) => {
  pool.query('SELECT * FROM users ORDER BY id ASC', (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const getUserById = (request, response) => {
  const id = parseInt(request.params.id)

  pool.query('SELECT * FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

// routes for POST endpoint
const createUser = (request, response) => {
  const { name, email } = request.body

  pool.query('INSERT INTO users (name, email) VALUES ($1, $2)', [name, email], (error, results) => {
    if (error) {
      throw error
    }
    response.status(201).send(`User added with ID: ${result.insertId}`)
  })
}

// routes for PUT endpoint
const updateUser = (request, response) => {
  const id = parseInt(request.params.id)
  const { name, email } = request.body

  pool.query(
    'UPDATE users SET name = $1, email = $2 WHERE id = $3',
    [name, email, id],
    (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).send(`User modified with ID: ${id}`)
    }
  )
}

// routes for DELETE endpoint
const deleteUser = (request, response) => {
  const id = parseInt(request.params.id)

  pool.query('DELETE FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).send(`User deleted with ID: ${id}`)
  })
}


// TASKS

// Viewing tasks
const getTasks = (request, response) => {
  pool.query('SELECT * FROM tasks ORDER by id ASC', (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const getTaskById = (request, response) => {
  const id = parseInt(request.params.id)


  pool.query('SELECT * FROM tasks WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    // response.status(200).write(JSON.stringify(results.rows)
    response.status(200).json(results.rows)

  })

  // pool.query('SELECT * FROM subtasks WHERE fk_task_id = $1', [id], (error, results) => {
  //   if (error) {
  //     throw error
  //   }
  //   response.write(JSON.stringify(results.rows))
  //   response.end()
  // })
}


const getSubTaskById = (request, response) => {
  const id = parseInt(request.params.id)


  pool.query('SELECT * FROM subtasks WHERE fk_task_id = $1 ORDER BY id ASC', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)

  })
}

// Creating tasks


const createTask = (request, response) => {
  const { name, percentage, subtasks } = request.body
  pool.query('INSERT INTO tasks (name, percentage) VALUES ($1, $2) RETURNING id', [name, percentage], (error, results) => {
    if (error) {
      throw error
    }

    const insertedId = results.rows[0].id
    for (var i = 0; i < subtasks.length; i++) {
      const subtask = subtasks[i];
      pool.query('INSERT INTO subtasks (name, fk_task_id) VALUES ($1, $2)', [subtask, insertedId], (error, results) => {
        if (error) {
          throw error
        }
      })
    }

    response.status(201).send(`Task added with ID: ${insertedId}`)
  })
}

// Updating tasks


const updateTask = (request, response) => {
  const id = parseInt(request.params.id)
  const { name, percentage, subtasks } = request.body

  pool.query(
    'UPDATE tasks SET name = $1, percentage = $2 WHERE id = $3',
    [name, percentage, id],
    (error, results) => {
      if (error) {
        throw error
      }

      pool.query(
        'SELECT * FROM subtasks WHERE fk_task_id = $1', [id], (error, subTaskResults) => {
          if (error) {
            throw error
          }

          for (var i = 0; i < subtasks.length; i++) {
            const subtask = subtasks[i];
            if (i < subTaskResults.rowCount) {
              pool.query('UPDATE subtasks SET name = $1 WHERE name = $2 ', [subtask, subTaskResults.rows[i].name], (error, results) => {
                if (error) {
                  throw error
                }
              })
            } else {
              pool.query('INSERT INTO subtasks (name, fk_task_id) VALUES ($1, $2)', [subtask, id], (error, results) => {
                if (error) {
                  throw error
                }
              })
            }
          }
        }
      )

      response.status(200).send(`Task modified with ID: ${id}`)
    }
  )
}

// Deleting tasks

const deleteTask = (request, response) => {
  const id = parseInt(request.params.id)

  pool.query('DELETE FROM tasks WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).send(`Task deleted with ID: ${id}`)
  })
}


module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getTasks,
  getTaskById,
  getSubTaskById,
  createTask,
  updateTask,
  deleteTask
}