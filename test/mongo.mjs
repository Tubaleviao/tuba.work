import { describe, it, before, after } from 'node:test'
import assert from 'assert'
import { ObjectId } from 'mongodb'

import {
    setPassword, findOneRecord, saveRecordCallback,
    saveRecord, updateRecord, findRecords, auth,
    addUser, getUserInfo, del, existId, existUser,
    setEmail, saveNote, saveNoteSize, takeNotes,
    deleteNote, saveChat, getChat, saveVisit, getPermission,
    // money
    deleteMove, saveMove, getFirstRpMove, getRpMoves, getFirstNrpMove,
    getNrpMoves, getMoves
} from "../mongo.mjs"

let db, mdb
let collection = 'test'

before(async (t) => {
    db = { records: [] }
    db.test = {
        aggregate: t.mock.fn(),
        findOne: t.mock.fn(query => {
            if (query.message)
                return Promise.resolve(db.records.filter(x => x.message == query.message)[0])
        }),
        insertOne: t.mock.fn(rec => {
            db.records.push({ _id: new ObjectId(), ...rec })
        }),
        updateOne: t.mock.fn(),
        deleteOne: t.mock.fn((query) => {
            let recordIndex
            for (let i = 0; i < db.records.length; i++)
                if (db.records[i]._id == query._id)
                    recordIndex = i
            if (typeof recordIndex == 'number')
                db.records.splice(recordIndex, 1)
            return Promise.resolve()
        }),
        find: t.mock.fn(query => ({
            toArray: t.mock.fn(() => Promise.resolve(db.records.filter(x => x._id == query._id))),
        }))
    }
    db.collection = col => db[col]
})

describe('Database Functions', function () {

    let test_id
    it('save database record', async function () {
        await saveRecord.bind(db)(collection, { "message": "testing" })
    })
    it('find database record', async function () {
        await new Promise((resolve, rej) => {
            findOneRecord.bind(db)(collection, { "message": "testing" }, res => {
                assert(typeof res._id == "object", "should return _id")
                test_id = res._id
                resolve()
            })

        })
        await new Promise((res, rej) => {
            findRecords.bind(db)(collection, { _id: test_id }, (err, docs) => {
                assert(typeof docs == "object", 'shoud return an array')
                assert(docs[0]._id = test_id, "should have same _id")
                assert(!err, 'should not retrieve an error')
                res()
            })
        })
    })
    it('remove database record', async function () {
        await del.bind(db)(collection, { _id: test_id })
        await new Promise((resolve, rej) => {
            findOneRecord.bind(db)(collection, { "message": "testing" }, res => {
                assert(!res, "should not return a record")
                resolve()
            })
        })
    })
})
