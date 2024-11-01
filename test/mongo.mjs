import { describe, it } from 'node:test'
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

beforeEach(async function () {

})

before(async (t) => {

    collectionStub = {
        aggregate: t.mock.fn(),
        findOne: t.mock.fn(),
        insertOne: t.mock.fn(),
        updateOne: t.mock.fn(),
        deleteOne: t.mock.fn(),
        find: t.mock.fn().returns({
            toArray: t.mock.fn().returns(Promise.resolve([])),
        }),
    }

})

describe('Database Functions', function () {

    let test_id
    it('save database record', async function (done) {
        saveRecord.bind(db)(collection, { "message": "testing" })
        console.log("sadfasdfsadf")
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
                console.log('finished findRecords')
                res()
            })
        })
    })
    it('remove database record', async function () {
        del.bind(db)(collection, { _id: test_id })
        await new Promise((resolve, rej) => {
            findOneRecord.bind(db)(collection, { "message": "testing" }, res => {
                assert(!res, "should not return a record")
                resolve()
            })
        })
    })
})