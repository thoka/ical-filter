// read ical data
const NodeCache = require("node-cache") 
const cache = new NodeCache()

const fs = require('fs-extra')
const ical = require('ical.js')
const filter = require('array-filter')
const request = require('request-promise-native')

const express = require('express')
const { decorateApp } = require('@awaitjs/express')

const app = decorateApp(express())

// machbar iCAL: 
// https://calendar.google.com/calendar/ical/j68lhv614hbv3u4ttbrs6glhpg%40group.calendar.google.com/public/basic.ics

app.get('/', (req,res) => {
	res.send(`
<html><head>
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
</head><body>
<div class="hero-unit">
<form class="form-horizontal" method="get" action="/filter">
<fieldset>

<legend>iCAL Filter</legend>

<div class="form-group">
  <label class="col-md-4 control-label" for="url">URL</label>  
  <div class="col-md-8">
  <input id="url" name="url" type="text" placeholder="enter some iCAL URL" class="form-control input-md" required="">    
  </div>
</div>

<div class="form-group">
  <label class="col-md-4 control-label" for="filter">Filter</label>  
  <div class="col-md-4">
  <input id="filter" name="filter" type="text" placeholder="enter some Text to search inside events" class="form-control input-md" required="">
    
  </div>
</div>

<div class="form-group">
  <div class="col-md-4">
    <button id="go" name="go" class="btn btn-primary">go</button>
  </div>
</div>

</fieldset>
</form>
</div>
</body>
`)
})

app.getAsync('/filter', async function (req, res) {
  // console.log(req)
  // TODO: errorchecking
  // TODO: timeout 

  console.log(req.query)
  if (req.query.url==null) {throw new Error("url parameter mising")}
  if (req.query.filter==null) {throw new Error("filter parameter mising")}

  res.contentType("text/calendar")

  res.send(
	  await filter_ics(req.query.url,req.query.filter)
  )
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})

function delete_vevent( find ) {

	const rtest = new RegExp(find,"i")

	return (e) => {
		for (var prop of e.getAllProperties() ) {
			if (prop.type!=="text") continue
			const match = rtest.test(prop.jCal[3])
			if (match) { return false }
		}
		return true
	}
}

async function filter_ics(url, find) {

	var data = await request(url)
	var caldata = ical.parse(data)
	var cal = new ical.Component(caldata)

	var items_to_delete = filter(
		cal.getAllSubcomponents("vevent"),
		delete_vevent(find))
	for (var item of items_to_delete) cal.removeSubcomponent(item)


	var result =  cal.toString()
	return result

}

async function print_ics(fn) {

	var data = await fs.readFile(fn,"utf-8")
	var cal = ical.parse(data)
	var result =  ical.stringify(cal)
	return result
}



