import assert from 'assert'
import { describe, it, before, after } from 'node:test'
import request from 'supertest'
import app, { server, io, mdb } from '../app.mjs'

after(() => {
  server.close()
  io.close()
  mdb.close()
})

describe('Free endpoints', () => {

  it('/ HTTP 302', async () => {
    await request(app).get('/')
      .expect(302)
  })

  it('/hibo HTTP 200', async () => {
    await request(app).get('/hibo')
      .expect(200)
  })

  it('/webcam_face_detection HTTP 200', async () => {
    await request(app).get('/webcam_face_detection')
      .expect(200)
  })

  it('/chat HTTP 200', async () => {
    await request(app).get('/chat')
      .expect(200)
  })

  it('/shooter HTTP 200', async () => {
    await request(app).get('/shooter')
      .expect(200)
  })

  it('/talking HTTP 200', async () => {
    await request(app).get('/talking')
      .expect(200)
  })

  it('/cookie HTTP 200', async () => {
    await request(app).get('/cookies')
      .expect(200)
  })

  it('/privacy HTTP 200', async () => {
    await request(app).get('/privacy')
      .expect(200)
  })

  it('/rag HTTP 200', async () => {
    await request(app).get('/rag')
      .expect(200)
  })
  it('/clock HTTP 200', async () => {
    await request(app).get('/clock')
      .expect(200)
  })
})

describe('Authentication', () => {
  const user = Math.floor(Math.random() * 10000000000).toString()

  it('/signup HTTP 302', async () => {
    await request(app).post('/signup')
      .send({ username: user, password: user, email: `${user}@user.com` })
      .expect(302)
  })

  it('/login HTTP 302', async () => {
    let response = await request(app).post('/login')
      .send({ username: user, password: user })
      .set('Accept', 'application/json')
      .expect(302)
    assert(response.headers['set-cookie'], "cookies not present in headers")
  })

  let jwt

  it('/jwt HTTP 200', async () => {
    let response = await request(app).post('/jwt')
      .send({ username: user, password: user })
      .set('Accept', 'application/json').expect(200)
    assert(response.body.ok == true, "Response needs to be ok")
    assert(response.body.token != '', "Token should not be empty")
    jwt = response.body.token
  })

  it('/new_pass HTTP 200', async () => {
    let response = await request(app).post('/new_pass')
      .send({ user: user, password: 'user', token: jwt })
      .set('Accept', 'application/json')
      .expect(200)
    assert(response.body.success, "Password needs to be set successfully")
  })

  it('/logout HTTP 200', async () => {
    let response = await request(app).get('/logout')
      .expect(302)
    assert(!response.headers['set-cookie'], "cookies not present in headers")
  })

})