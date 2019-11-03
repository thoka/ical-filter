// const fs = require('fs-extra')
const ical = require('ical.js')
const filter = require('array-filter')
const request = require('request-promise-native')

const express = require('express')
const { decorateApp } = require('@awaitjs/express')
const woodlot = require('woodlot').middlewareLogger

const sanitize = require('sanitize-filename')

const jexl = require('jexl')

jexl.addBinaryOp('like', 50, (left, right) => {
  if (right === undefined) {
    // ToDo: I would like to throw an error, but this gets catched somewhere in the promise chain
    return new Error('try to add " around your search term')
  }
  const r = new RegExp(right, 'i')
  return r.test(left)
})

const config = require('./config')

const app = decorateApp(express())

const NodeCache = require('node-cache')
const cache = new NodeCache({ stdTTL: 1000, checkperiod: 120 })

// logging
// docs: https://github.com/adpushup/woodlot
app.use(woodlot({
  streams: ['./app.log'],
  stdout: true,
  userAnalytics: {
    platform: true,
    country: true
  },
  format: {
    type: 'json',
    options: {
      cookies: true,
      headers: true,
      compact: true,
      spacing: 0,
      separator: '\n'
    }
  }
}))

app.use(express.static('static'))

app.getAsync('/filter', getFilteredICAL)

app.getAsync('/c/:config', (req,res) => {
  const c = req.params.config
  if (! c in config.calendars) throw new Error(`missing configuration for "${c}"`)
  req.query.url = req.params.config
  return getFilteredICAL(req, res)
})


const port = process.env.PORT || 3000
app.listen(port, function () {
  console.log(`iCAL filter proxy started on http://localhost:${port}`)
})

async function getFilteredICAL (req, res) {
  // TODO: errorchecking
  // TODO: timeout

  const q = req.query
  if (q.url == null) {
    throw new Error('url parameter mising')
  }

  if (q.url in config.calendars) {
    const preset = config.calendars[q.url]
    q.id = q.id || preset.id || q.url
    q.url = preset.url
    q.name = q.name || preset.name 
    q.description = q.description || preset.description
    q.color = q.color || preset.color
    q.jexl = q.jexl || preset.jexl
    q.filter = q.filter || preset.filter
  }

  const feedID = encodeURIComponent(q.filter || q.name || q.id || "filtered")
  const cal = await loadICALfromURL(q.url)

  console.log('cal:', cal)

  filterICS(cal, q)
  changeUIDs(cal, '+' + feedID) // enable events to show up twice in google calendar

  if ('color' in q) addColorToDescription(cal)

  var filename = q.name || cal.getFirstPropertyValue('x-wr-calname') + ' (filtered by ' + feedID + ')'
  cal.updatePropertyWithValue('x-wr-calname', encodeURI(filename))

  res.setHeader('Content-disposition', 'attachment; filename=' + sanitize(filename.replace(':', ' -- ')) + '.ics')
  res.contentType('text/calendar')
  res.send(
    cal.toString()
  )
}

async function loadICALfromURL (url) {
  var data = cache.get(url)
  if (data === undefined) {
    data = await request(url)
    if (data == null) throw new Error('url not found')
    try {
      var caldata = ical.parse(data)
      data = new ical.Component(caldata)
      cache.set(url, data)
    } catch (e) {
      throw new Error('data not parsable as iCAL')
    }
  }
  return data
}

function filterICS (cal, args) {
  var itemsToDelete = filter(
    cal.getAllSubcomponents('vevent'),
    filterFactory(args))
  for (var item of itemsToDelete) cal.removeSubcomponent(item)
}

function filterFactory (args) {
  console.log('filter factory args', args)

  const matchFunctions = []

  if (args.filter) {
    const rtest = new RegExp(args.filter, 'i')
    matchFunctions.push(
      (d) => rtest.test(d._text)
    )
  }

  if (args.jexl) {
    matchFunctions.push(
      (d) => {
        console.log(`evaluating ${args.jexl} on ${JSON.stringify(d)}`)
        return jexl.evalSync(args.jexl, d)
      }
    )
  }

  return (e) => {
    console.log('-')
    const properties = e.getAllProperties()
    const data = { _text: '' }

    for (var prop of properties) {
      // console.log(prop.type,prop.name,prop.jCal[3])
      if (prop.type === 'text') {
        data._text += prop.jCal[3] + '\n'
        data[prop.name] = prop.jCal[3]
      } else if (prop.type === 'date-time') {
        data[prop.name] = new Date(prop.jCal[3])
      } else {
        data[prop.name] = prop.jCal[3]
      }
    }
    for (var mf of matchFunctions) {
      const result = mf(data)
      if (result instanceof Error) throw result
      if (!result) return true
    }
    return false
  }
}

function changeUIDs (cal, append) {
  for (var item of cal.getAllSubcomponents('vevent')) {
    var uid = item.getFirstPropertyValue('uid')
    item.updatePropertyWithValue('uid', uid + append)
  }
}

function addColorToDescription (cal) {
  for (var item of cal.getAllSubcomponents('vevent')) {
    const d = item.getFirstPropertyValue('description')
    const color = 'yellow'
    item.updatePropertyWithValue('uid', `<div style="background-color:${color}>${d}</div>`)
  }
}
