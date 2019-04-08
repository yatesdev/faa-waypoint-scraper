const fs = require('fs');
const axios = require('axios');
const querystring = require('querystring');
const PAGE_SIZE = 1000; // FAA endpoint caps at this

async function makeRequest(offset) {
  const data =  await axios.post('https://nfdc.faa.gov/nfdcApps/controllers/PublicDataController/getLidData',
    querystring.stringify({
      dataType: 'LIDFIXESWAYPOINTS',
      start: offset || 0,
      length: PAGE_SIZE,
      sortcolumn: 'fix_identifier',
      sortdir: 'asc',
    }))
    .then((result) => { return result.data; })
    .catch((err) => console.error(err));
  
  return data;
}

async function getWaypoints() {
  let waypoints = [];
  let keepGoing = true;
  let offset = 0;
  while (keepGoing) {
      let response = await makeRequest(offset);
      console.log(`Grabbing waypoints... (${offset}/${response.totalrows})`);
      await waypoints.push.apply(waypoints, response.data);
      offset += PAGE_SIZE;
      if (response.data.length < PAGE_SIZE) {
          keepGoing = false;
          return waypoints;
      }
  }
}

// Start
getWaypoints()
  .then(waypoints => {
    console.log(waypoints);
    fs.writeFileSync('./waypoints.json', JSON.stringify(waypoints));
});
