// Links to get data for visualization
source_url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
tectonic_url = 'https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json';

d3.queue()
    .defer(d3.json, source_url)
    .defer(d3.json, tectonic_url)
    .await(analyze);

function analyze (error, earthquakeData, tectonicData) {
    if (error) throw error;
    
    function onEachFeature(feature, layer){
        layer.bindPopup("<h3>" + feature.properties.place +
      "</h3><hr><p>" + new Date(feature.properties.time) + "</p><p>" + feature.properties.mag + "</p>");
    }
//Colors to use for different level of magnitude
    function getColor(mag) {
      return mag > 8 ? "#C90D1A":
             mag > 7 ? "#DA3B18":
             mag > 6.1 ? "#D76A14":
             mag > 5.5 ? "#D49910":
             mag > 2.5 ? "#D1C80C":
                         "#CEF708";
  }
//Style options for earthquaker markers
    function styleData(feature) {
      return {
          stroke: true,
          color: "black",
          weight: .25,
          fillOpacity: .7,
          fillColor: getColor(feature.properties.mag),
          radius: feature.properties.mag * 5
      };
  }
  //Use geoJson to map the earthquake data
    var earthquakes = L.geoJSON(earthquakeData, {
        onEachFeature: onEachFeature,
        style: styleData,
        pointToLayer: function(feature, latlng){
          return L.circleMarker(latlng);
    },
    });
    //Use geoJson to map tectonic plates on the map and add new layer for time line
    var tectonic_plates = L.geoJSON(tectonicData);
    var timelineLayer = new L.layerGroup();
    
    var streetMap = L.tileLayer(
      "https://api.mapbox.com/styles/v1/mapbox/outdoors-v10/tiles/256/{z}/{x}/{y}?" +
      "access_token=pk.eyJ1IjoibmF0YWxpZWtyYW1lciIsImEiOiJjamg5cjRkZHMwZnN3MzBxdWZ1YnFpZTlrIn0.jtsCgy0anbaY7XJw6ARGaw"
    );
    
    var darkMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?" +
        "access_token=pk.eyJ1IjoibmF0YWxpZWtyYW1lciIsImEiOiJjamg5cjRkZHMwZnN3MzBxdWZ1YnFpZTlrIn0.jtsCgy0anbaY7XJw6ARGaw");
    
    var baseMaps = {
        "Street Map": streetMap,
        "Dark Map": darkMap
      };

    var overlayMaps = {
       Earthquakes: earthquakes,
       TectonicPlates: tectonic_plates
     };
    
    var myMap = L.map('map',{
        center:[40.7128, -74.0059],
        zoom: 3,
        layers: [streetMap, earthquakes, tectonic_plates]
    });
    
    L.control.layers(baseMaps, overlayMaps, {
        collapsed: false
    }).addTo(myMap);

    //Create legend for map
    var legend = L.control({position: "bottomright"});

    legend.onAdd = function(map) {

    var legendDiv = L.DomUtil.create('div', 'info legend'),
    grades = [2,3,4,5,6,7],
    labels = ["Minor","Light","Moderate","Strong","Major","Great"];
    //Colors for legend
    function legColor(mag) {
      return mag >= 8 ? "#C90D1A":
            mag >= 7 ? "#DA3B18":
            mag >= 6 ? "#D76A14":
            mag >= 5 ? "#D49910":
            mag >= 4 ? "#D1C80C":
                        "#CEF708";
      }

    for (var i = 0; i < grades.length; i++) {
        legendDiv.innerHTML += '<i style="background:' + legColor(grades[i] + 1) + '"></i> ' +
          labels[i] + '<br>' ;
    }

    return legendDiv;
};

    legend.addTo(myMap);
    //Time intervals to be used for the timeline added to the map
    var getInterval = function(earthquakeData) {
      return {
        start: earthquakeData.properties.time,
        end:   earthquakeData.properties.time + earthquakeData.properties.mag * 1800000
      };
    };
    var timelineControl = L.timelineSliderControl({
      formatOutput: function(date){
        return moment(date).format("YYYY-MM-DD HH:MM:SS");
      }
    });
    //Create timeline to add to the map
    var timeline = L.timeline(earthquakeData, {
      
      getInterval: getInterval,
      style: styleData,
     
      pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng);
        }
        }
    ).addTo(earthquakes);
    
        timelineControl.addTo(myMap);
        timelineControl.addTimelines(timeline);
        timeline.addTo(timelineLayer);
        timelineLayer.addTo(myMap);
};