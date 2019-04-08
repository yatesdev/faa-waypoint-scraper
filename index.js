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

function parse(waypoints) {
  const LATITUDE_REGEX = /(\d+)-(\d+)-([\d.]+)[N|S]/g;
  const LONGITUDE_REGEX = /(\d+)-(\d+)-([\d.]+)[E|W]/g;
  
  return waypoints.map(waypoint => {
    waypoint.latitude = waypoint.description.match(LATITUDE_REGEX)[0];
    waypoint.longitude = waypoint.description.match(LONGITUDE_REGEX)[0];
    waypoint.latitudeDecimal = calculateDecimalLatLong(waypoint.latitude);
    waypoint.longitudeDecimal = calculateDecimalLatLong(waypoint.longitude);
    return waypoint;
  })
}

// This still needs work and shouldn't be trusted
function calculateDecimalLatLong(input) {
  const NUMERIC_REGEX = /([\d.]+)/g;
  const HEMISPHERE_REGEX = /[N|S|E|W]/g
  
  const degree = parseFloat(input.match(NUMERIC_REGEX)[0]);
  const minute = parseFloat(input.match(NUMERIC_REGEX)[1]/60);
  const second = parseFloat(input.match(NUMERIC_REGEX)[2]/3600);
  return (degree + minute + second) + input.match(HEMISPHERE_REGEX)[0];
}

async function start() {
  let waypoints = await getWaypoints();
  let parsedWaypoints = parse(waypoints);
  fs.writeFileSync('./waypoints.json', JSON.stringify(parsedWaypoints));
}

start();
