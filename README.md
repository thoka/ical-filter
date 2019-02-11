# ical-filter

Express microservice to filter events out of public calendars containing some search text.

## Usage

- `http://localhost:3000/filter?url=URL&filter=FILTER`  
  Replace `URL` with the URL-escaped url of your original iCAL (use [encodeURIComponent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent) and FILTER with the URL-escaped regular expression you would like to filter the entries with.

- `http://localhost:3000` your convenient URL-Generator frontend 


## Presets

You may define presets for all parameters inside `config.yml`. 


## Related Work

- [Discussion](https://forum.wilap.de/t/eigener-cccp-kalender/140)
- [calender_merger](https://github.com/niccokunzmann/calender_merger) for merging ICAL calenders into one

## Installation

```bash
git clone https://github.com/thoka/ical-filter.git
cd ical-filter
npm install
echo "start with 'npm start'"
```

## ToDo 

check if URL points to an ical calendar

convert some known url calendar patterns to ical urls

example:

convert
`https://calendar.google.com/calendar/embed?src=([^&]*)&(.*)`
to
`https://calendar.google.com/calendar/ical/{$1}/public/basic.ics`


