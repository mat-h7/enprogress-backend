const Pool = require('pg').Pool
const connectionString = "postgresql://mh7618:lK2WvrCrkB@db.doc.ic.ac.uk:5432/mh7618?ssl=true"
const pool = new Pool({
  connectionString: connectionString,
})

const Joi = require('joi')

// Schemas for DB
const taskSchema = {
  name: Joi.string().min(3).max(50).required(),
  percentage: Joi.number().integer().min(0).max(100).required(),
  deadline: Joi.date(),
  subtasks: Joi.array().items(Joi.string().min(3).max(50).required()),
  subtaskPercentages: Joi.array().items(Joi.number().integer().min(0).max(100).required())
}

const subtaskSchema = {
  name: Joi.string().min(3).max(100).required(),
  percentage: Joi.number().integer().min(0).max(100).required(),
  ordering: Joi.number().integer().min(0).required(),
  fk_task_id: Joi.number().integer().min(1).required(),
}

const userSchema = {
  name: Joi.string().alphanum().min(1).max(50).required(),
  email: Joi.string().email().max(256).required(),
  points: Joi.number().integer()
}

function validateUser(user, response) {
  const result = Joi.validate(user, userSchema)
  if (result.error) {
    response.status(400).send({ "error": result.error.details[0].message })
  }

  return (result.error === null);
}


// Data validation functions (return true if data valid)
function validateTask(task, response) {

  const result = Joi.validate(task, taskSchema)
  if (result.error) {
    response.status(400).send({ "error": result.error.details[0].message })
    return false;
  }

  var totalPercentage = 0
  for (var i = 0; i < task.subtaskPercentages.length; i++) {
    totalPercentage += task.subtaskPercentages[i]
  }

  if (totalPercentage != 100) {
    response.status(400).send({ "error": "Subtask percentages must sum to 100!" })
    return false;
  }

  return true;
}

function validateSubtask(task, response) {
  const result = Joi.validate(task, subtaskSchema)
  if (result.error) {
    response.status(400).send({ "error": result.error.details[0].message })
  }
  return (result.error === null);
}

// routes for GET endpoint
const getUsers = (request, response) => {

  if (request.query.email) {
    const email = request.query.email
    pool.query('SELECT * FROM users WHERE email = $1 ORDER BY id ASC', [email], (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).json(results.rows)
    })
  } else {
    pool.query('SELECT * FROM users ORDER BY id ASC', (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).json(results.rows)
    })
  }

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

const getTasksByUser = (request, respone) => {
  const id = parseInt(request.params.id)

  pool.query('SELECT * FROM tasks WHERE user_id == $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

// routes for POST endpoint
const createUser = (request, response) => {
  const { name, email } = request.body
  if (!(validateUser(request.body, response))) return;

  pool.query('INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id', [name, email], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).send({ message: 'User successfully inserted!', id: results.rows[0].id })
  })
}

// routes for PUT endpoint
const updateUser = (request, response) => {
  const id = parseInt(request.params.id)
  const { name, email, points } = request.body

  pool.query(
    'UPDATE users SET name = $1, email = $2, points = $3 WHERE id = $4',
    [name, email, points, id],
    (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).send({ message: 'User successfully modified!', id: id })
    }
  )
}

//routes for PATCH endpoint
const patchPointsUser = (request, response) => {
  const id = parseInt(request.params.id)
  const { points } = request.body
  pool.query(
    'UPDATE users SET points = points + $1 WHERE id = $2',
    [points, id],
    (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).send({
        message: 'User Points successfully'
          + ' updated!', id: id
      })
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
    response.status(200).send({ message: 'User successfully deleted!', id: id })
  })
}


// Functions for handling task-related queries

// Routes for GET reqs
const getTasks = (request, response) => {

  if (request.query.fk_user_id) {
    const fk_user_id = parseInt(request.query.fk_user_id);
    pool.query('SELECT * FROM tasks WHERE fk_user_id = $1 ORDER by id ASC', [fk_user_id], (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).json(results.rows)
    })
  } else {
    pool.query('SELECT * FROM tasks ORDER by id ASC', (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).json(results.rows)
    })
  }

}

const getTaskById = (request, response) => {
  const id = parseInt(request.params.id)


  pool.query('SELECT * FROM tasks WHERE id = $1 ORDER BY id ASC', [id], (error, results) => {
    if (error) {
      throw error
    }
    // response.status(200).write(JSON.stringify(results.rows))
    response.status(200).json(results.rows)

  })

  // pool.query('SELECT * FROM subtasks WHERE fk_task_id = $1 ORDER BY id ASC', [id], (error, results) => {
  //   if (error) {
  //     throw error
  //   }
  //   response.write(JSON.stringify(results.rows))
  //   response.end()
  // })
}


const getSubTaskById = (request, response) => {
  const id = parseInt(request.params.id)


  pool.query('SELECT * FROM subtasks WHERE fk_task_id = $1 ORDER BY ordering ASC', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)

  })
}

// Routes for POST reqs

const createTask = (request, response) => {

  // Extract data and validate
  const { name, percentage, deadline, fk_user_id, subtasks, subtaskPercentages } = request.body
  if (!(validateTask(request.body, response))) return;


  pool.query('INSERT INTO tasks (name, percentage, deadline, fk_user_id) VALUES ($1, $2, $3, $4) RETURNING id', [name, percentage, deadline, fk_user_id], (error, results) => {
    if (error) {
      throw error
    }

    // Get insertedId and insert subtasks iff successful
    const insertedId = results.rows[0].id
    for (var i = 0; i < subtasks.length; i++) {

      // Extract data and validate
      const subtask = subtasks[i]
      const subtaskPercentage = subtaskPercentages[i]
      if (!(validateSubtask({ name: subtask, percentage: subtaskPercentage, ordering: i, fk_task_id: insertedId }, response))) return;

      pool.query(
        'INSERT INTO subtasks (name, percentage, ordering, fk_task_id) VALUES ($1, $2, $3, $4)',
        [subtask, subtaskPercentage, i, insertedId],
        (error, results) => {
          if (error) {
            throw error
          }
        })
    }

    response.status(200).send({ message: 'Task successfully created!', id: insertedId })
  })
}

// Routes for PUT reqs

const updateTask = (request, response) => {

  // Extract data and validate
  const id = parseInt(request.params.id)
  const { name, percentage, subtasks, subtaskPercentages, deadline } = request.body
  if (!(validateTask(request.body, response))) return;


  // Update main task
  pool.query(
    'UPDATE tasks SET name = $1, percentage = $2, deadline = $3 WHERE id = $4',
    [name, percentage, deadline, id],
    (error, results) => {
      if (error) {
        throw error
      }

      // Get old subtasks
      pool.query(
        'SELECT * FROM subtasks WHERE fk_task_id = $1 ORDER BY ordering ASC',
        [id],
        (error, subTaskResults) => {
          if (error) {
            throw error
          }

          for (var i = 0; i < subtasks.length; i++) {

            // Extract subtask data and validate
            const subtask = subtasks[i];
            const subtaskPercentage = subtaskPercentages[i]
            if (!(validateSubtask({ name: subtask, percentage: subtaskPercentage, ordering: i, fk_task_id: id }, response))) return;

            if (i < subTaskResults.rowCount) {

              // Update old subtasks
              pool.query(
                'UPDATE subtasks SET percentage = $1 WHERE name = $2 ',
                [subtaskPercentage, subTaskResults.rows[i].name],
                (error, results) => {
                  if (error) {
                    throw error
                  }
                })

              pool.query(
                'UPDATE subtasks SET name = $1 WHERE name = $2',
                [subtask, subTaskResults.rows[i].name],
                (error) => {
                  if (error) {
                    throw error
                  }
                }
              )
            } else {

              // Insert new subtasks
              pool.query(
                'INSERT INTO subtasks (name, percentage, ordering, fk_task_id) VALUES ($1, $2, $3, $4)',
                [subtask, subtaskPercentage, i, id],
                (error, results) => {
                  if (error) {
                    throw error
                  }
                })
            }
          }
        }
      )

      response.status(200).send({ message: 'Task successfully modified!', id: id })
    }
  )
}

// Routes for DELETE reqs

const deleteTask = (request, response) => {
  const id = parseInt(request.params.id)

  pool.query('DELETE FROM tasks WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).send({ message: 'Task successfully deleted!', id: id })
  })
}


module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  patchPointsUser,
  deleteUser,
  getTasks,
  getTaskById,
  getTasksByUser,
  getSubTaskById,
  createTask,
  updateTask,
  deleteTask,
  pool
}
