# Grabby the Grubby Data Grabber

This thing grabs data from a bunch of sources and combines them into a single JSON. This is useful for projects w/ read-only data coming from all kinds of sources, and you need a dashboard to display it all.





## A bunch of notes



Grabby the grubby Data Grabber

- Take SOURCES and transform them into an array of JSON objects
- Flatten the dbs into json
- { sources: [ {
    - source(url/link), 
    - name, 
    - format:[json,csv,gsheet json,notion(db only, official API?),airtable base], 
    - url/link, 
    - payload,
    - prim: primary key in each data set
- }] }
- maybe use CUE to align data of each TYPE to a custom schema?
    - https://www.npmjs.com/package/cuelang-js 

Why?
- tabular data from CSV, Gsheet, Notion, Airtable should LOOK THE SAME, regardless of where it lives
- speeds up site loads
- makes data portable between the formats
- flatten Airtable records, Notion's weirdness, etc.
- for PRE-CACHING data for static site generation
    - lots of data points and low need to be dynamic
    - easily RE-FETCH all data on build
    - GIT ACTION to re-build and redeploy as a STATIC SITE using STATIC DATA
Example
    - If we have lots of sources
        - Google sheet of bacteria, experiment data
        - Notion of Stamp data
        - Airtable of Phage data
    - we need a relational way to query/filter/search/display this info, w/o putting them ALL in Airtable

How?
- this is a Node thing run in CLI, but of course can be used in Express, it'll just be really slow
1. Load in a JSON config file or object, load in the array of sources
2. Collapse them into a single data object, either in JS or in 
3. 


Future
- w/ the data, now we need SvelteKit Static site figured out
- 









Data Format Schema Project 
- Notion blog to talk about what "data" is, and how it's stored, both on a computer and the web
- Use json-schema for definitions — https://json-schema.org/ — play with validator https://www.npmjs.com/package/jsonschema
    - Implement miuvig validator with a json schema — use AJV
    - Check with https://www.jsonschemavalidator.net/ 
- Compatibility
    - Excel (sheetjs)
    - JSON
    - JSON5 (used for annotation)
    - CSV (use csv2json)
    - Airtable
    - Notion DB
    - Complex
        - CouchDB (PouchDB and RxDB)
        - ArangoDB
        - MongoDB
        - Sqlite
        - Postgres
