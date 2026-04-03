import React, { useEffect, useState } from 'react'

const API = 'https://shopii-backend-latest.onrender.com'

function UsersPage() {
  const [users, setUsers] = useState([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const loadUsers = async () => {
    const res = await fetch(API + '/users')
    const html = await res.text()

    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    const rows = doc.querySelectorAll('table tr')

    const list = []

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]

      const id = row.children[0]?.innerText.trim()

      const nameInput = row.querySelector("input[name='name']")
      const emailInput = row.querySelector("input[name='email']")

      const name = nameInput ? nameInput.value : ''
      const email = emailInput ? emailInput.value : ''

      if (id) {
        list.push({ id, name, email })
      }
    }

    setUsers(list)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // CREATE
  const createUser = async () => {
    await fetch(API + '/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `name=${name}&email=${email}`,
    })

    setName('')
    setEmail('')

    loadUsers()
  }

  // UPDATE
  const updateUser = async (id) => {
    const name = document.getElementById('name' + id).value
    const email = document.getElementById('email' + id).value

    await fetch(API + `/users/${id}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `name=${name}&email=${email}`,
    })

    loadUsers()
  }

  // DELETE
  const deleteUser = async (id) => {
    await fetch(API + `/users/${id}/delete`, {
      method: 'POST',
    })

    loadUsers()
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Users CRUD</h1>
      <p style={{ color: '#555', marginBottom: 20 }}>
        <b>Note:</b> Chỉnh sửa thông tin trên từng dòng trong table và bấm
        <b>Update</b> để lưu thay đổi.
      </p>
      {/* CREATE */}

      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={createUser}>Create</button>

      <br />
      <br />

      {/* TABLE */}

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>

              <td>
                <input defaultValue={u.name} id={'name' + u.id} />
              </td>

              <td>
                <input defaultValue={u.email} id={'email' + u.id} />
              </td>

              <td>
                <button onClick={() => updateUser(u.id)}>Update</button>

                <button onClick={() => deleteUser(u.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default UsersPage
