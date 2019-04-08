const fs = require('fs');
const axios = require('axios');
const querystring = require('querystring');
const url = 'https://www.faa.gov/air_traffic/flight_info/aeronav/aero_data/Loc_ID_Search/Fixes_Waypoints/';


async function getWaypoints() {
  // Make dummy request to get the total rows
  const totalRows = await makeRequest()
    .then(rsp => {
      return rsp.totalrows;
    })
  
  // Endpoint caps at 1000 rows per request, concat each page response
  let waypoints= [];
  for(let i = 0; i <= totalRows; i = i + 1000) {
    let page = await makeRequest(i, 1000)
      .then((rsp) => {
        return rsp.data;
      });
    waypoints = waypoints.concat(page);
    console.log(`Grabbing waypoints... (${i}/${totalRows})`);
  }

  // parse of description field into a usable lat/long goes here

  // export to file
  fs.writeFileSync('./waypoints.json', JSON.stringify(waypoints));
}

async function makeRequest(start, length) {
  const data =  await axios.post('https://nfdc.faa.gov/nfdcApps/controllers/PublicDataController/getLidData',
    querystring.stringify({
      dataType: 'LIDFIXESWAYPOINTS',
      start: start || 0,
      length: length || 1,
      sortcolumn: 'fix_identifier',
      sortdir: 'asc',
    }))
    .then((result) => { return result.data; })
    .catch((err) => console.error(err));
  
  return data;
}

getWaypoints();