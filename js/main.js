var map;
var markers = [];
var fromAddressSearch =false;
var __defaults = {
    city_name: 'Oakland',
    data_url: 'http://data.codeforamerica.org/soft-story',
    bounds: [37.85615, -122.35233, 37.719948, -122.129516],
    center: [37.80327385, -122.257575988],
    mapquest_key: "Fmjtd|luua2q6and,aa=o5-hzb59"
    };

//
// map.setView() with a check for SF bounds.
//
function boundedSetView(center, skip_alert)
{
    var bounds = __defaults.bounds;
    
    if(center.lat > bounds[0] || center.lng < bounds[1] || center.lat < bounds[2] || center.lng > bounds[3])
    {
        // found location is outside of default city, so we will not set the view.
        if(skip_alert)
        {
            return;
        }

        return alert("You were about to look outside of "+__defaults.city_name+" - try searching for an address inside the city?");
    }
    
    map.setView(center, 17);
}

//
// Callback function for browser geolocation.
// http://leafletjs.com/reference.html#map-locate
//
function onLocationFound(location)
{
    var ne = location.bounds._northEast,
        sw = location.bounds._southWest,
        center = new L.LatLng(ne.lat/2 + sw.lat/2, ne.lng/2 + sw.lng/2);
    
    if(location.accuracy > 500)
    {
        // accuracy of location in meters > 500m, which means we really
        // don't know where someone is. Do something here to flag that.
        return alert("couldn't locate you with sufficient accuracy");
    }
    
    return boundedSetView(center, true);
}

//
// Callback function for geocode results from Mapquest Open.
// http://open.mapquestapi.com/geocoding/
//
function onAddressFound(response)
{
  var center = response.results[0].locations[0].latLng;
  fromAddressSearch = true;
  boundedSetView(center);
  showNearByBuilding(map.getCenter())
}

//
//
//

function numberToRadius  (number) {
  return number * Math.PI / 180;
}

// from http://www.movable-type.co.uk/scripts/latlong.html
function distanceBetween(pt1, pt2){

  var lon1 = pt1[0],
  lat1 = pt1[1],
  lon2 = pt2[0],
  lat2 = pt2[1],
  dLat = numberToRadius(lat2 - lat1),
  dLon = numberToRadius(lon2 - lon1),
  a = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(numberToRadius(lat1))
    * Math.cos(numberToRadius(lat2)) * Math.pow(Math.sin(dLon / 2), 2),
  c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (6371 * c) * 1000; // returns meters
}

//var sizeForAllIcons = [15,20];
var sizeForAllIcons = [16,21];
var buildingIcon = L.icon({iconUrl: 'img/falcon_map_marker@1x.png',
                           iconRetinaUrl: 'img/falcon_map_marker@2x.png',
                           //iconSize: [31, 41],
                           iconSize: sizeForAllIcons});
                           //iconAnchor: [14, 41]});
var iconActive = L.icon({iconUrl: 'img/falcon_map_marker_active2@1x.png',
                                 iconRetinaUrl: 'img/falcon_map_marker_active2@2x.png',
                                 //iconSize: [31, 41],
                                 iconSize: sizeForAllIcons});
                                 //iconAnchor: [14, 41]});
var level2Icon = L.icon({iconUrl: 'img/falcon_map_marker_level2@1x.png',
                                    iconRetinaUrl: 'img/falcon_map_marker_level2@2x.png',
                                    //iconSize: [31, 41],
                                    iconSize: sizeForAllIcons});
                                    //iconAnchor: [14, 41]});
var level1Icon = L.icon({iconUrl: 'img/falcon_map_marker_level1@1x.png',
                                    iconRetinaUrl: 'img/falcon_map_marker_level1@2x.png',
                                    //iconSize: [31, 41],
                                    iconSize: sizeForAllIcons});
                                    //iconAnchor: [14, 41]});
var incompleteIcon = L.icon({iconUrl: 'img/falcon_map_marker_incomplete@1x.png',
                                    iconRetinaUrl: 'img/falcon_map_marker_incomplete@2x.png',
                                    //iconSize: [31, 41],
                                    iconSize: sizeForAllIcons});
                                    //iconAnchor: [14, 41]});
var exemptIcon = L.icon({iconUrl: 'img/falcon_map_marker_exempt@1x.png',
                                    iconRetinaUrl: 'img/falcon_map_marker_exempt@2x.png',
                                    //iconSize: [31, 41],
                                    iconSize: sizeForAllIcons});
                                    //iconAnchor: [14, 41]});


var activeMarker = null;


function hasViolations(building){
  for(i in building.inspections){
    for(v in building.inspections[i].violations){
      return true;
    }
  }
  return false;
}


//
// 
//

function showNearByBuilding(center)
{
  if(markers.length == 0)
  {
    return;
  }

  var shortestDistanceMarker =null;
  var shortestDistance = null;

  for(m in markers){
    var marker = markers[m];
    var dis = distanceBetween([marker.getLatLng().lat, marker.getLatLng().lng], [center.lat, center.lng])
    if((shortestDistance == null )||(dis < shortestDistance)){
      shortestDistance = dis;
      shortestDistanceMarker = marker;
    }
  }
  
  $('#about').hide();

  $("div#housinginfo").html(getBuildingDetailsHTML(shortestDistanceMarker.feature.properties));
        
  location.hash = "#"+shortestDistanceMarker.feature.properties.id;
        
  if(activeMarker){
    //activeMarker.setIcon(buildingIcon);
    if(feature.properties.status_short === 'Level 2') {
      activeMarker.setIcon(level2Icon);
    }
    if(feature.properties.status_short === 'Level 1') {
      activeMarker.setIcon(level1Icon);
    }
    if(feature.properties.status_short === 'Incomplete Evaluation') {
      activeMarker.setIcon(incompleteIcon);
    }
    if(feature.properties.status_short === 'Exempt') {
      activeMarker.setIcon(exemptIcon);
    }
  }
  shortestDistanceMarker.setIcon(iconActive);
  activeMarker = shortestDistanceMarker;
 
}


//
// Set up map, but don't set the view to anything.
//
function setupMap(element)
{
    var map = L.map('map'),
        mapquestUrl = 'http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png',
        subDomains = ['otile1','otile2','otile3','otile4'],
        mapquestAttrib = 'Data by <a href="http://open.mapquest.co.uk" target="_blank">MapQuest</a>, <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors.',
        mapquest = new L.TileLayer(mapquestUrl, {maxZoom: 18, minZoom: 14, attribution: mapquestAttrib, subdomains: '1234'});
    
    map.addLayer(mapquest);
    
    return map;
}

//
// Callback function for a loaded building.
//
function onBuildingLoaded(building)
{
    boundedSetView(new L.LatLng(building.latitude, building.longitude));
}

String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};


Number.prototype.formatMoney = function(c, d, t){
var n = this, 
    c = isNaN(c = Math.abs(c)) ? 2 : c, 
    d = d == undefined ? "." : d, 
    t = t == undefined ? "," : t, 
    s = n < 0 ? "-" : "", 
    i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
    j = (j = i.length) > 3 ? j % 3 : 0;
   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
 };


/*
 * JavaScript Pretty Date
 * Copyright (c) 2011 John Resig (ejohn.org)
 * Licensed under the MIT and GPL licenses.
 */

function prettyDate(time)
{
    if(time.substr) {
        var date = new Date(time.substr(0, 4), time.substr(5, 2), time.substr(8, 2));

    } else {
        var date = time;
    }
    
	var diff = (((new Date()).getTime() - date.getTime()) / 1000),
		day_diff = Math.floor(diff / 86400);
			
	if ( isNaN(day_diff) || day_diff < 0 )
		return;
			
	return day_diff == 0 && (
			diff < 60 && "just now" ||
			diff < 120 && "1 minute ago" ||
			diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
			diff < 7200 && "1 hour ago" ||
			diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
		day_diff == 1 && "Yesterday" ||
		day_diff < 7 && day_diff + " days ago" ||
		day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago" ||
		day_diff < 730 && Math.ceil( day_diff / 30 ) + " months ago" ||
		day_diff > 730 && Math.floor( day_diff / 365 ) + " years ago";
}

//
//  Munges an object with building details, into a string of HTML
//

function getBuildingDetailsHTML(building){
  //var address = building.street_number + " " + building.street_name;

  var detailHTML = "<div class='address'><span>"+building.address+"</span></div>";
  detailHTML += "<div class='infoboxes'><div class='inspectbox'><p>status</p><div class='boxnumber'>" + building.status_short + "</div>"+building.status_long+"</div></div>"

/*
  detailHTML += "<div class='ownername'><span>Building Owner: </span>"+"</div>";
  detailHTML += "<div class='propertyid'><span>Property ID: </span>"+"</div>";
  detailHTML += "<div class='inspections'> This building has been <span> inspected "+" times</span></div>";

  if(building.inspections.length > 0)
    detailHTML += "<div class='violations'>There "+ (totalViolations == 1 ? "has" : "have")+" been <span>"+totalViolations+" violation"+(totalViolations > 1 ? "s" : "")+
    (totalViolations > 0 ? ":" : "s.")+" </span>";

  if(totalViolations > 0){
    detailHTML += "<ul>"
    for(i in building.inspections){
      var insp = building.inspections[i];
      if(insp.violations.length === 0)
        continue;
      var violationString = "";
      for(v in insp.groupedViolations){
        var vio = insp.groupedViolations[v];
        violationString += " <em>"+ vio.count+" "+vio.category + "</em> (" + vio.type + ") violation"+(vio.count > 1 ? "s were" : " was")+" found, ";
        if(vio.date_closed)
          violationString += " and "+(vio.count > 1 ? "were": "was")+" closed "+ 
          prettyDate(vio.date_closed);
        
        else
          violationString+= " and "+(vio.count > 1 ? "were": "was")+" never resolved."
      }

      detailHTML += "<li>";

      if(insp.type === "Complaint")
        detailHTML += "During an inspection due to a complaint ";
      else if(insp.type === "Routine")
        detailHTML += "During a routine inspection";
      else if(insp.type === "Followup")
        detailHTML += "During a followup inspection ";
      detailHTML += prettyDate(insp.parsedDate)+ " "+ violationString+".</li>"
      
    }
    detailHTML += "</ul>";
  }
  detailHTML +="</div>";
  
  detailHTML += "<div class='details'><h4>Building Details</h4> <ul> "+
    "<li>"+building.sqft+" sqft </li>"+ 
    "<li>"+building.type.toLowerCase()+" </li> "+
    "<li>"+building.dwelling_units+" unit"+(building.dwelling_units == 1 ? "" : "s")+"</li>"+ 
    "<li>"+building.built_year+"</li>"+
    "<li>Assessed Value: $"+parseInt(building.value).formatMoney()+"</li></ul></div>"; 
  
  detailHTML += "<div class='ownercontact'><span>Contact the Owner:</span><br />"+building.owner_mailing_address.toProperCase()+"</div>";
  detailHTML += "<div class='contactinfo'><span>SFDPH Contact Info:</span><br />25 Van Ness Ave #500<br /> San Francisco, CA 94102<br />(415) 554-2500</div>"
*/

  return detailHTML;
/*
  if(building.from_street_num === building.to_street_num)
    address += building.from_street_num;
  else
    address += building.from_street_num + "-"+ building.to_street_num

  address += " "+building.street.toProperCase() +" "+ building.st_type.toProperCase()+". <br />"+ building.city+", "+ building.state + " "+  building.postal_code;
  
  var totalViolations = 0,
  recentInspectionDate = null;

  if(!building.inspections)
    building.inspections = [];

  for(i in building.inspections){
    var insp = building.inspections[i];
    if(!insp.violations)
      insp.violations =[];
    insp.parsedDate = new Date(insp.date.substr(0,4), insp.date.substr(5,2), insp.date.substr(8,2));

    if((recentInspectionDate === null) ||( insp.parsedDate > recentInspectionDate))
      recentInspectionDate = insp.parsedDate
    

    totalViolations += insp.violations.length;
    insp.groupedViolations = {};
    for(v in insp.violations){
      var vio = insp.violations[v];
      if(vio.category+":"+vio.type in insp.groupedViolations)
        insp.groupedViolations[vio.category+":"+vio.type].count +=1;
      else
        insp.groupedViolations[vio.category+":"+vio.type] = {count:1, type:vio.type, category:vio.category, date_closed:vio.date_closed};
    }
  }
  

  var detailHTML = "<div class='address'><span>"+address+"</span></div>";
  detailHTML += "<div class='infoboxes'><div class='inspectbox'><div class='boxnumber'>"+building.inspections.length+"</div><p>inspections</p></div><div class='violationbox'><div class='boxnumber'>"+totalViolations+"</div><p>violations</p></div></div>"
  detailHTML += "<div class='ownername'><span>Building Owner: </span>"+building.owner_name.toProperCase()+"</div>";
  detailHTML += "<div class='propertyid'><span>Property ID: </span>"+building.id+"</div>";
  detailHTML += "<div class='inspections'> This building has been <span> inspected "+building.inspections.length+" times</span>"+
    (building.inspections.length > 0 ? ", most recently "+prettyDate(recentInspectionDate)+".</div>" : ".");

  if(building.inspections.length > 0)
    detailHTML += "<div class='violations'>There "+ (totalViolations == 1 ? "has" : "have")+" been <span>"+totalViolations+" violation"+(totalViolations > 1 ? "s" : "")+
    (totalViolations > 0 ? ":" : "s.")+" </span>";

  if(totalViolations > 0){
    detailHTML += "<ul>"
    for(i in building.inspections){
      var insp = building.inspections[i];
      if(insp.violations.length === 0)
        continue;
      var violationString = "";
      for(v in insp.groupedViolations){
        var vio = insp.groupedViolations[v];
        violationString += " <em>"+ vio.count+" "+vio.category + "</em> (" + vio.type + ") violation"+(vio.count > 1 ? "s were" : " was")+" found, ";
        if(vio.date_closed)
          violationString += " and "+(vio.count > 1 ? "were": "was")+" closed "+ 
          prettyDate(vio.date_closed);
        
        else
          violationString+= " and "+(vio.count > 1 ? "were": "was")+" never resolved."
      }

      detailHTML += "<li>";

      if(insp.type === "Complaint")
        detailHTML += "During an inspection due to a complaint ";
      else if(insp.type === "Routine")
        detailHTML += "During a routine inspection";
      else if(insp.type === "Followup")
        detailHTML += "During a followup inspection ";
      detailHTML += prettyDate(insp.parsedDate)+ " "+ violationString+".</li>"
      
    }

    detailHTML += "</ul>";
  }
  detailHTML +="</div>";
  
  detailHTML += "<div class='details'><h4>Building Details</h4> <ul> "+
    "<li>"+building.sqft+" sqft </li>"+ 
    "<li>"+building.type.toLowerCase()+" </li> "+
    "<li>"+building.dwelling_units+" unit"+(building.dwelling_units == 1 ? "" : "s")+"</li>"+ 
    "<li>"+building.built_year+"</li>"+
    "<li>Assessed Value: $"+parseInt(building.value).formatMoney()+"</li></ul></div>"; 
  
  detailHTML += "<div class='ownercontact'><span>Contact the Owner:</span><br />"+building.owner_mailing_address.toProperCase()+"</div>";
  detailHTML += "<div class='contactinfo'><span>SFDPH Contact Info:</span><br />25 Van Ness Ave #500<br /> San Francisco, CA 94102<br />(415) 554-2500</div>"

  return detailHTML;
  */
}




$(function(){

  map = setupMap('map');
  
  if(location.hash.match(/^#.+$/)) {
    //
    // Found what looks like a building ID in the URL, so use it.
    //
    var building_id = location.hash.replace(/^#(.+)$/, '$1'),
        building_url = __defaults.data_url+'/parcels/'+building_id+'.json';
    
    $.ajax(building_url, {success: onBuildingLoaded})

  } else {
    //
    // Otherwise, just pick out the center of the city and then try geolocating.
    //
    map.setView(__defaults.center, 14);
    map.on('locationfound', onLocationFound);
    map.locate({setView: false, maxZoom: 18});
  }

  var geojsonURL = __defaults.data_url+'/tiles/{z}/{x}/{y}.json';

  function selectBuilding(feature, layer){
    $('#about').hide();

    $("div#housinginfo").html(getBuildingDetailsHTML(feature.properties));
        
    location.hash = "#"+feature.id;

    if(activeMarker){
      //activeMarker.setIcon(buildingIcon);
      if(activeMarker.feature.properties.status_short === 'Level 2') {
        activeMarker.setIcon(level2Icon);
      }
      else if(activeMarker.feature.properties.status_short === 'Level 1') {
        activeMarker.setIcon(level1Icon);
      }
      else if(activeMarker.feature.properties.status_short === 'Incomplete Evaluation') {
        activeMarker.setIcon(incompleteIcon);
      }
      else if(activeMarker.feature.properties.status_short === 'Exempt') {
        activeMarker.setIcon(exemptIcon);
      }
    }
    layer.setIcon(iconActive);
    activeMarker = layer;
  }

  var geojsonTileLayer = new L.TileLayer.GeoJSON(geojsonURL, {
    unique: function (feature) { return feature.id; },
    maxZoom:18
  }, {
    pointToLayer: function(feature, latlng){
      return L.marker(latlng, {icon:buildingIcon});
    },
    onEachFeature: function (feature, layer) {

      if(activeMarker == layer)
        layer.setIcon(iconActive);

      if(feature.properties.status_short === 'Level 2') {
        layer.setIcon(level2Icon);
      }
      else if(feature.properties.status_short === 'Level 1') {
        layer.setIcon(level1Icon);
      }
      else if(feature.properties.status_short === 'Incomplete Evaluation') {
        layer.setIcon(incompleteIcon);
      }
      else if(feature.properties.status_short === 'Exempt') {
        layer.setIcon(exemptIcon);
      }

      if(location.hash.replace(/^#(\w+)$/, '$1') !== ""){
        if(location.hash.replace(/^#(\w+)$/, '$1') == feature.properties.id){
          selectBuilding(feature, layer);
        }
      }
  
      markers.push(layer);

      layer.on("click", function(){
        selectBuilding(feature, layer);
      });
    }
  });

  geojsonTileLayer.on("load", function(a){

    // if the loading of these tiles was triggered by an address search, 
    // then we show the building nearest to the address (or at this point map center)

    if(fromAddressSearch)
      showNearByBuilding(map.getCenter())
    fromAddressSearch = false;
  });

  map.addLayer(geojsonTileLayer);


  $("#addressentry").on("submit", function(e){
    e.preventDefault();

    var url = "http://open.mapquestapi.com/geocoding/v1/address";

    var data = {outFormat:"json",
                inFormat:"kvp",
                key:__defaults.mapquest_key,
                boundingBox:"37.85615,-122.35233,37.719948,-122.129516",
                location:$("#address").val() + ', ' + __defaults.city_name};
    
    $.ajax(url, {data: data, dataType: 'jsonp', success: onAddressFound});

  });


});
