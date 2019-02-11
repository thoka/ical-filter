# ical-filter

Express microservice to filter events out of public calendars containing some search text.

## Usage

- `http://localhost:3000/filter?url=URL&filter=FILTER`  
  Replace `URL` with the URL-escaped url of your original iCAL (use [encodeURIComponent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent) and FILTER with the URL-escaped regular expression you would like to filter the entries with.

- `http://localhost:3000` your convenient URL-Generator frontend 

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

[ ] Add some [filter language](https://memlab.thomaskalka.de/t/js-parsable-filter-languages/136)
[ ] Cache results

