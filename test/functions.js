const assert = require('assert')
const request = require('supertest')
const express = require('express')
const app = require('../app')

describe('Home', () => {
  it('Should show images and return HTTP 200', done => {
    request(app).get('/')
      .expect(200, done)
  })
})