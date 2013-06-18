var map;


var falcon = {

  showBuildingDetails:function(building){
    console.log("details", building);
    var address = "";

    if(building.from_street_num === building.to_street_num)
      address += building.from_street_num;
    else
      address += building.from_street_num + "-"+ building.to_street_num

    address += " "+building.street +" "+ building.st_type+". "+ building.city+", "+ building.state + " "+  building.postal_code;

    
    var totalViolations = 0,
        recentInspectionDate = null;

    if(!building.inspections)
      building.inspections = [];

    for(i in building.inspections){
      var insp = building.inspections[i];
      if(!insp.violations)
        insp.violations =[];
      console.log(insp);
      totalViolations += insp.violations.length;
    }
    

    var detailHTML = "<div class='address'>"+address+"</div>";
    detailHTML += "<div class='ownername'>"+building.owner_name+"</div>";
    detailHTML += "<div class='propertyid'>Property Id: "+building.id+"</div>";
    detailHTML += "<div class='inspections'> This building has been inspected "+building.inspections.length+" times, most recently June 2012</div>";
    detailHTML += "<div class='violations'>There have been "+totalViolations+" violations: <ul>"
    for(i in building.inspections){
      var insp = building.inspections[i];
      if(insp.violations.length === 0)
        continue;
      var violationString = "";
      for(v in insp.violations){
        var vio = insp.violations[v];
        violationString += vio.category + " (" + vio.type + ") violation was found, ";
        if(vio.date_closed)
          violationString += " and was closed "+ vio.date_closed;
        else
          violationString+= " and was never resolved."
      }

      detailHTML += "<li> During a routine inspection in "+insp.date+", "+violationString+"</li>"
      
    }

    detailHTML += "</ul></div>"
    
    detailHTML += "<div class='details'>The building is a "+building.sqft+" sqft "+ building.type+" with "+
      building.dwelling_units+" units built in "+ building.built_year+", currently assessed at $"+building.value+".</div>"; 
    
    detailHTML += "<div class='ownercontact'>Contact the owner at "+building.owner_mailing_address+"</div>";
    detailHTML += "<div class='contactinfo'>SFDPH Contact Info</div>"
    
    $("div#housinginfo").html(detailHTML);

  }

};


$(function(){
  
   map = L.map('map').setView([37.7749295, -122.4494155], 17);
  var mapquestUrl = 'http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png',
  subDomains = ['otile1','otile2','otile3','otile4'],
  mapquestAttrib = 'Data by <a href="http://open.mapquest.co.uk" target="_blank">MapQuest</a>, <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors.'
  var mapquest = new L.TileLayer(mapquestUrl, {maxZoom: 19, attribution: mapquestAttrib, subdomains: '1234'});

  map.addLayer(mapquest);
  map.locate({setView:true, maxZoom:19})


  var geojsonURL = 'http://data.codeforamerica.org/OHHS/SF/1.2/tiles/{z}/{x}/{y}.json';
  var geojsonTileLayer = new L.TileLayer.GeoJSON(geojsonURL, {
    unique: function (feature) { return feature.properties.id; },
    maxZoom:20
  }, {
    onEachFeature: function (feature, layer) {

      layer.on("click", function(){
        
        map.panTo(layer._latlng)
        
        falcon.showBuildingDetails(feature.properties);

        
        console.log(feature, layer)

      });
    }
  });
  map.addLayer(geojsonTileLayer);


  $("#addressentry").on("submit", function(e){
    e.preventDefault();

    var url = "http://open.mapquestapi.com/geocoding/v1/address";

    var data = {outFormat:"json",
                inFormat:"kvp",
                key:"Fmjtd|luua2q6and,aa=o5-hzb59",
                boundingBox:"37.816,-122.536,37.693,-122.340",
                location:$("#address").val() + ', San Francisco'};

    $.ajax(url, {data:data, dataType:"jsonp", success:function(data){
      console.log(data)
      //TODO: check for errors
      map.panTo([data.results[0].locations[0].latLng.lat, data.results[0].locations[0].latLng.lng]);

    }});

  });


});
