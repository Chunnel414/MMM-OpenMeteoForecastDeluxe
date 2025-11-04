/*********************************

  Node Helper for MMM-OpenMeteoForecastDeluxe.

  This helper is responsible for the DarkSky-compatible data pull from OpenMeteo.
  At a minimum the API key, Latitude and Longitude parameters
  must be provided.  If any of these are missing, the request
  to OpenMeteo will not be executed, and instead an error
  will be output the the MagicMirror log.

  Since AccuWeather has a very limited API quota on their free plan, there is an option to specify a second apiKey to double the quota.

  The OpenMeteo-compatible API request looks like this:

    http://dataservice.accuweather.com/forecasts/v1/daily/5day/{locationKey}?apikey={apiKey}&details=true&metric={units=metric}

*********************************/

var NodeHelper = require("node_helper");
var needle = require("needle");
var moment = require("moment");

module.exports = NodeHelper.create({

    start: function() {
        console.log("Starting node_helper for module [" + this.name + "]");
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "OpenMeteo_ONE_CALL_FORECAST_GET") {
            console.log("[MMM-OpenMeteoForecastDeluxe] " + notification );
            var self = this;

            if (payload.apikey == null || payload.apikey == "") {
                console.log("[MMM-OpenMeteoForecastDeluxe] " + moment().format("D-MMM-YY HH:mm") + " ** ERROR ** No API key configured. Get an API key at http://open-meteo.com");
            } else if (payload.locationKey == null || payload.locationKey == "" ) {
                console.log("[MMM-OpenMeteoForecastDeluxe] " + moment().format("D-MMM-YY HH:mm") + " ** ERROR ** LocationKey not provided.");
            } else {

                var forecastUrl = payload.endpoint +
                    "/" + payload.locationKey +
                    "?apikey=" + payload.apikey +
                    "&lang=" + payload.language + 
                    "&metric=" +  ((payload.units == "imperial") ? "false" : "true")  +
                    "&details=true";

                var currentUrl = payload.endpointNow +
                    "/" + payload.locationKey +
                    "?apikey=" + ((payload.apikey2 == null || payload.apikey2 == "") ? payload.apikey : payload.apikey2)  +
                    "&lang=" + payload.language + 
                    "&metric=" +  ((payload.units == "imperial") ? "false" : "true")  +
                    "&details=true";
                    
                var hourlyUrl = payload.endpointHourly +
                    "/" + payload.locationKey +
                    "?apikey=" + ((payload.apikey2 == null || payload.apikey2 == "") ? payload.apikey : payload.apikey2)  +
                    "&lang=" + payload.language + 
                    "&metric=" +  ((payload.units == "imperial") ? "false" : "true")  +
                    "&details=true";
                    
                (async () => {
                    var f = {};
                    var fh = {};
                    console.log("[MMM-OpenMeteoForecastDeluxe] Getting data: " + forecastUrl);
                    const resp1 = await fetch(forecastUrl);
                    const json1 = await resp1.json();
                    //console.log("[MMM-OpenMeteoForecastDeluxe] url data: " + JSON.stringify(json1) );
                    f = json1;
                    f.instanceId = payload.instanceId;
                    console.log("BB After Daily");
                    
                    console.log("[MMM-OpenMeteoForecastDeluxe] Getting data: " + currentUrl);
                    const resp2 = await fetch(currentUrl);
                    const json2 = await resp2.json();
                    //console.log("[MMM-OpenMeteoForecastDeluxe] url2 data: " + JSON.stringify(json2) );
                    f.Current = json2[0];    
                    console.log("BB After Current");  
                    
                    console.log("[MMM-OpenMeteoForecastDeluxe] Getting data: " + hourlyUrl);
                    const resp3 = await fetch(hourlyUrl);
                    const json3 = await resp3.json();
                    //console.log("[MMM-OpenMeteoForecastDeluxe] url3data: " + JSON.stringify(json2) );
                    f.Hourly = json3; 
                    console.log ("BB After Hourly");
                    
                    self.sendSocketNotification("OpenMeteo_ONE_CALL_FORECAST_DATA", f);
                    console.log("[MMM-OpenMeteoForecastDeluxe] " + " after sendSocketNotification");
                  })().catch(function (error) {
                    // if there's an error, log it
                    console.error("[MMM-OpenMeteoForecastDeluxe] " + " ** ERROR ** " + error);
                });
             
                console.log("[MMM-OpenMeteoForecastDeluxe] after API calls");
            }
        }
    },


});
