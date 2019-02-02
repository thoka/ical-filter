// read ical data
const NodeCache = require("node-cache") 
const cache = new NodeCache()

const fs = require('fs-extra')
const ical = require('ical.js')
const filter = require('array-filter')
const request = require('request-promise-native')

const express = require('express')
const { decorateApp } = require('@awaitjs/express')

const sanitize = require('sanitize-filename')

const app = decorateApp(express())

// machbar iCAL: 
// https://calendar.google.com/calendar/ical/j68lhv614hbv3u4ttbrs6glhpg%40group.calendar.google.com/public/basic.ics

app.use(express.static('static'))

app.getAsync('/filter', async function (req, res) {
  // console.log(req)
  // TODO: errorchecking
  // TODO: timeout 

  console.log(req.query)
  if (req.query.url==null) {throw new Error("url parameter mising")}
  if (req.query.filter==null) {throw new Error("filter parameter mising")}

  const filter = req.query.filter
  const filter_encoded = encodeURI(filter)

  const cal = await load_ical_from_url(req.query.url)

  filter_ics(cal,filter)
  change_UIDs(cal,"+"+filter_encoded) //enable events to show up twice in google calendar

  var filename=cal.getFirstPropertyValue('x-wr-calname')+" (filtered by "+filter_encoded+")"
  cal.updatePropertyWithValue('x-wr-calname',encodeURI(filename))
  
  res.setHeader('Content-disposition', 'attachment; filename=' + sanitize(filename) + ".ics");
  res.contentType("text/calendar")
  res.send(
	  cal.toString()
  )
})

app.listen(3000, function () {
  console.log('iCAL filter proxy  on port 3000!')
})


async function load_ical_from_url(url) {
	var data = await request(url)
	var caldata = ical.parse(data)
	return new ical.Component(caldata)	
}

function filter_ics(cal, regexp) {
	var items_to_delete = filter(
		cal.getAllSubcomponents("vevent"),
		event_does_not_contain_this_regexp(regexp))
	for (var item of items_to_delete) cal.removeSubcomponent(item)
}

function event_does_not_contain_this_regexp( r ) {
	const rtest = new RegExp(r,"i")
	return (e) => {
		for (var prop of e.getAllProperties() ) {
			if (prop.type!=="text") continue
			const match = rtest.test(prop.jCal[3])
			if (match) { return false }
		}
		return true
	}
}

function change_UIDs(cal, append) {
	for (var item of cal.getAllSubcomponents("vevent")) {
		var uid = item.getFirstPropertyValue("uid")
		item.updatePropertyWithValue("uid",uid+append)
	}
}





