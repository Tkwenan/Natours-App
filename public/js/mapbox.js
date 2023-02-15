/* eslint-disable */
export const displayMap = locations => {
    mapboxgl.accessToken =
    'pk.eyJ1IjoidGt3ZW5hIiwiYSI6ImNsYzg0bWNycDRocHIzdXBua3VydDFmejcifQ.Up7sf-WYLgPGfVxtLu5PsQ';
    
    var map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/tkwena/clc84qpp8004o14myhge7v0o3',
      scrollZoom: false
      // center: [-118.113491, 34.111745],
      // zoom: 10,
      // interactive: false
    });
  
    //we have access to the mapboxfl object bc we included the mapbox library
    //in our app (in tour.pug)
    const bounds = new mapboxgl.LngLatBounds();
  
    locations.forEach(loc => {
      // Create marker
      const el = document.createElement('div');
      el.className = 'marker';
  
      // Add marker
      new mapboxgl.Marker({
        element: el,
        anchor: 'bottom'
      })
        .setLngLat(loc.coordinates)
        .addTo(map);
  
      // Add popup
      new mapboxgl.Popup({
        offset: 30
      })
        .setLngLat(loc.coordinates)
        .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
        .addTo(map);
  
      // Extend map bounds to include current location
      bounds.extend(loc.coordinates);
    });
  
    map.fitBounds(bounds, {
      padding: {
        top: 200,
        bottom: 150,
        left: 100,
        right: 100
      }
    });
  };
  