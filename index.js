const fs = require('fs');
const axios = require('axios');
const querystring = require('querystring');
const PAGE_SIZE = 1000; // FAA endpoint caps at this
const LATITUDE_REGEX = /(\d+)-(\d+)-([\d.]+)[NS]/g;
const LONGITUDE_REGEX = /(\d+)-(\d+)-([\d.]+)[EW]/g;

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

function parse(waypoints) {
  return waypoints.map(waypoint => {
    waypoint.latitude = waypoint.description.match(LATITUDE_REGEX)[0];
    waypoint.longitude = waypoint.description.match(LONGITUDE_REGEX)[0];
    return waypoint;
  })
}
async function start() {
  let waypoints = await getWaypoints();
  let parsedWaypoints = parse(waypoints);
  fs.writeFileSync('./waypoints.json', JSON.stringify(parsedWaypoints));
}

start();
