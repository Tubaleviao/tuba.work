const assert = require('assert')
const request = require('supertest')
const express = require('express')
const app = require('../app')

describe('Home', () => {
  it('Should return HTTP 302', done => {
    request(app).get('/')
      .expect(302, done)
  })
  it('Should return HTTP 200', done => {
    request(app).get('/home')
      .expect(200, done)
  })
})

describe('Authentication', () => {
  it('Login: should return 200', done => {
    request(app).post('/login')
      .send({username: "test", password: "test"})
      .set('Accept', 'application/json')
      .expect(302) // text, body, headers
      .end((err,res)=> {
        if(err) return done(err)
        assert(res.text == '', "texto differente do esperado")
        return done()
      })
  })
  it('Signup: should return 200', done => {
    const user = Math.floor(Math.random()*10000000000).toString()
    request(app).post('/signup')
      .send({username:user, password:user})
      .expect(302, done)
  })
})