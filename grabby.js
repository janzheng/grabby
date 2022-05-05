/*

    based on airhangar.js

    Takes a json object with configs, including:
    - JSON, CSV, Google Sheet JSON output, Notion, and Airtable
    and shoves them all into a single json object
    
    - keys are based on the "name" of the source
    - FUTURE: 'key' to be used as look up key for that object in the json
    - FUTURE: pass in [filename.json] to write everything into a file
    

    ## input:
    - `yarn grabby.js`
    - `node grabby.js config.json output.json`


    ## 



*/
require('dotenv').config()

const fetch = require("node-fetch")
const fs = require('fs')
// const { parse } = require('csv-parse/lib/sync')
const csv = require('csvtojson')
const { Client } = require('@notionhq/client');

const Cytosis = require("cytosis").default

const configFilePath = process.argv[2]
const outputFilePath = process.argv[3] || './output.json'

let config
console.log('Config file:', configFilePath)
console.log('Output file:', outputFilePath)

const notion = new Client({ auth: process.env.NOTION_API });

try {
  config = require(configFilePath)
  console.log('Config: ', config)
} catch (err) { // do nothing if file doesn't exist // _err(err)
  console.error('Error:', err)
}









// 
// GRABBERS
// 

// airtable
const loadContent = async () => {

  try {

    // get Airhangar object
    let cytosis = await getCytosis(hangarId, hangarKey, ["Bases"])
    let bases = cytosis.results['Bases']
    let data = {
      bases: {}, // each base is stored as an object, with the name as the key (NOT an array)
    }

    await Promise.all(bases.map(async (base) => {
      if (base.fields && base.fields['Active'] == true && base.fields['BaseId'] && base.fields['Tables']) {
        data.bases[base.fields['Name']] = await getCytosis(base.fields['BaseId'], hangarKey, base.fields['Tables'], base.fields['View'] || "Grid view")
        console.log('Saved: ', base.fields['Name'])
      }
    }))

    await saveJson(data)

  } catch (err) {
    throw new Error('[yotion/loader] Error', err)
  }
}





















// 
// HELPERS
// 

// save from fetch stream to file
const saveJson = async (data, path = outputFilePath) => {
  try {
    data['_date'] = new Date()
    const fileStream = await fs.writeFileSync(path, JSON.stringify(data))
    console.log('[saveJson] Saved file at:', path, fileStream)
  } catch (e) {
    console.error('[saveJson] error', e)
  }
};



const getCytosis = async (baseId, apiKey, tables = ["Content"], view = "Grid view") => {
  try {
    let json;


    let bases = [{
      tables,
      options: {
        view
      }
    }
    ]

    let _cytosis = await new Cytosis({
      apiKey,
      baseId,
      bases: bases,
    })

    return _cytosis

  } catch (e) {
    console.error('[getCytosis] error:', e)
  }
}




/* 

var url = 'https://sheets.googleapis.com/v4/spreadsheets/' +
           spreadsheet_id + '/values/' + tab_name +
           '?alt=json&key=' + api_key;
($.getJSON(url, 'callback=?')).success(function(data) {
  // ...
};

*/




async function grab() {
  let data = {}

  console.log('[grab] Starting the grabbing!')
  await Promise.all(config.sources.map(async src => {
    console.log('[grab] >> grab-ing:', src.name, src.type, src.key, src.inputs)

    // get json file
    if(src.type == 'json') {
      data[src.name] = require(src.inputs.path)
      console.log('[grab] json 👍 >>>> ', data[src.name])
    }

    // get csv file
    if (src.type == 'csv') {
      data[src.name] = await csv().fromFile(src.inputs.path);
      console.log('[grab] csv 👍 >>>> ', data[src.name])
    }
    
    // get google sheet using API
    if (src.type == 'gsheet') {
      const response = await fetch(src.inputs.csv_url);
      const csv_text = await response.text();
      data[src.name] = await csv().fromString(csv_text);
      console.log('[grab] gsheet 👍 >>>> ', data[src.name])
    }
    
    // get airtable using Cytosis
    if (src.type == 'airtable') {
      let _cytosis = await new Cytosis({
        apiKey: process.env[src.inputs.apiKey],
        baseId: process.env[src.inputs.baseId],
        bases: src.inputs.bases,
        flat: true,
      })
      data[src.name] = _cytosis.results
      console.log('[grab] 👍 >>>> ', data[src.name])
    }

    // get notion using official API
    if (src.type == 'notion') {
      // const response = await notion.databases.retrieve({ database_id: databaseId });
      const response = await notion.databases.query({
        database_id: src.inputs.dbid,
        filter: src.inputs.filter,
        sorts: src.inputs.sorts,
        // filter: {
        //   or: [
        //     {
        //       property: 'In stock',
        //       checkbox: {
        //         equals: true,
        //       },
        //     },
        //     {
        //       property: 'Cost of next trip',
        //       number: {
        //         greater_than_or_equal_to: 2,
        //       },
        //     },
        //   ],
        // },
        // sorts: [
        //   {
        //     property: 'Name',
        //     // direction: 'ascending',
        //     direction: 'descending',
        //   },
        // ],
      });

      // console.log('NOTION:::::', response.results);
      let resarr = []
      response.results.map(res => {
        let _data = {}
        Object.keys(res.properties).map(key => {
          let keydata = res.properties[key][res.properties[key]['type']]
          // _data[key] = res.properties[key][res.properties[key]['type']]

          if (keydata && Array.isArray(keydata)) {
            let aggr
            keydata.map(item => {
              if(item.type == 'text') {
                // text
                if (!aggr) aggr = ''

                // plaintext
                // aggr.push(item[item.type].plain_textl)
                // aggr += (item.plain_text)
                
                // start
                if (item.annotations.bold)
                  aggr += '*'
                if (item.annotations.italic)
                  aggr += '**'
                if (item.annotations.strikethrough)
                  aggr += '--'
                if (item.annotations.underline)
                  aggr += '_'
                if (item.annotations.code)
                  aggr += '`'

                  if(item.text && item.text.link) {
                    aggr += `[${item.plain_text}](${item.text.link.url})`
                  }
                  else
                    aggr += (item.plain_text)

                // end
                if (item.annotations.code)
                  aggr += '`'
                if (item.annotations.underline)
                  aggr += '_'
                if (item.annotations.strikethrough)
                  aggr += '--'
                if (item.annotations.italic)
                  aggr += '**'
                if (item.annotations.bold)
                  aggr += '*'


              } else if (item.type == 'external') {
                // external attachments
                if(!aggr) aggr = []
                aggr.push(item[item.type].url)
              } else if (item.type == 'file') {
                // external attachments
                if (!aggr) aggr = []
                aggr.push(item[item.type].url)

              } else if (item.type == 'name') {
                // multi-sel
                if (!aggr) aggr = []
                aggr.push(item[item.name])
              }

            })
            // relation (won't work, only returns id)

            if(aggr)
              _data[key] = aggr
          } else if (keydata) {
            // single date
            if (keydata.start && !keydata.end) {
              _data[key] = keydata.start

            } else if (keydata.name) {
              // single sel
              _data[key] = keydata.name
            } else if (keydata.type == 'array') {
              // relation rollup
              // _data[key] = keydata.name
              // needs to call this resolver fn iteratively
            } 
            else {
              // catch the rest
              _data[key] = keydata
            }
          }
        })
        // console.log('----> ', res.properties)
        // console.log('----> ', _data,)
        // console.log('----> ', '---oooo', _data['Long Notes'])
        resarr.push(_data)
      })

      data[src.name] = resarr
      console.log('[grab] 👍 >>>> ', data[src.name])
    }

  }))

  console.log('[grab] Done! Saving data ------')
  await saveJson(data)
}









// start grabbing!
grab()
















