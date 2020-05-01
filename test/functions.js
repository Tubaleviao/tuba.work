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