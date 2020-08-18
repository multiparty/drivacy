// Code that is responsible for displaying the nodes on the map and drawing
// and styling map things, including clicks and paths.

$( document ).ready(function() {
  document.getElementById('leaflet').style.cursor = 'crosshair';
});

const TOTAL_COUNT = points.features.length;
let pointCount = 0;
var path = Array();
var isPathRendered = false;

function getPointById(id) {
  for(var i = 0; i < points.features.length; i++) {
    if(points.features[i].properties.point_id == id)
      return points.features[i];
  }
  return null;
}

function randomColor() {
  var color = '', letters = '0123456'; //789ABCDEF
  for (var i=0; i<6; i++) {color += letters[Math.floor(Math.random() * letters.length)];}
  return '#' + color;
}

function drawLineBetweenPoints(start, stop) {
  //start and stop are strng arrays containng start and stop latlns respectively
  var latlngs = Array();
  latlngs.push(start);
  latlngs.push(stop);
  // latlngs.push([parseFloat(start.split(",")[0]), parseFloat(start.split(",")[1])])
  // latlngs.push([parseFloat(stop.split(",")[0]), parseFloat(stop.split(",")[1])])
  var polyline = L.polyline(latlngs, {color: 'midnightblue'});
  path.push(polyline);
  polyline.addTo(leaflet);
  //Optional, enable for zooming in on the map area with line
  //leaflet.fitBounds(polyline.getBounds());

}

var leaflet = L.map('leaflet').setView([42.3469,-71.0709], 17);
L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom:20, attribution:'', id:'mapbox.light'
}).addTo(leaflet);

L.geoJson(points, {
  filter: function (feature, layer) { return true; },
  onEachFeature: function () {},
  style: function (feature) { return {"color": randomColor()}; },
  pointToLayer:
    function (feature, latlng) {
      var circle = L.circleMarker(latlng, {radius:7, weight:0.1, fillColor:"red", color:"red", opacity:1, fillOpacity:1});
      circle.on('mouseover', function(){
        circle.setStyle({ color: 'red' });
      });
      circle.on('click', function(){
        lat = circle._latlng["lat"];
        lng = circle._latlng["lng"]

        var marker = L.marker([lat, lng])
        path.push(marker);
        leaflet.addLayer(marker);

        if (pointCount == 0) {
          window.localStorage.setItem("StartLatLng", [lat,lng]);
          window.localStorage.setItem("StartPointId", circle.feature.geometry.properties["point_id"]);
        } else if (pointCount == 1){
          window.localStorage.setItem("StopLatLng", [lat,lng]);
          window.localStorage.setItem("StopPointId", circle.feature.geometry.properties["point_id"]);

          //make ajax call to server
          //'https://hri.appliedmpc.org/calculate/'
          pointsSelected();
        }
        pointCount++;
      });
      return circle;
    }
}).addTo(leaflet);

function drawPath(points) {
  pointCount = 0;
  for (var jump = 0; jump < points.length; jump++) {
    if (jump < points.length-1) {
      source = getPointById(points[jump])["coordinates"].slice().reverse();
      dest = getPointById(points[jump+1])["coordinates"].slice().reverse();
      drawLineBetweenPoints(source,dest)
    }

    isPathRendered = true;
    //attach event
    $("#leaflet").mousedown(function() {
      if (isPathRendered) {
        // Erase everything
        for(item in path) {
          leaflet.removeLayer(path[item])
        }

        // Clear path
        path = Array();
        // Remove this event
        $("#leaflet").off("mousedown");
        // Reset variable for tracking
        // var isPathRendered = false;
      }
    });
  }
}