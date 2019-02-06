# ical-filter

Express microservice to filter events out of public calendars containing some search text.

## Urls

- `http://localhost:3000/filter?url=URL&filter=FILTER`  
  Replace `URL` with the URL-escaped url and
  FILTER with the word you would like to filter the entries with.

## Related Work

- [Discussion](https://forum.wilap.de/t/eigener-cccp-kalender/140)
- [calender_merger](https://github.com/niccokunzmann/calender_merger) for merging ICAL calenders into one
